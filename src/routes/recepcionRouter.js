import { Router } from "express";
import { body, validationResult } from "express-validator";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
dayjs.extend(utc);

import prisma from "../lib/prisma.js";

const recepcionRouter = Router();

// GET /api/recepcion/pendientes - Extrae todas las reservas activas y sus vehículos sin devolver.
recepcionRouter.get("/pendientes", async (req, res) => {
  try {
    const reservas = await prisma.reserva.findMany({
      where: { estado: { in: ['activa', 'pendiente'] } },
      include: {
        cliente: true,
        vehiculos: {
          include: { vehiculo: true }
        },
        recepciones: {
          include: { detalles: true }
        }
      },
      orderBy: { fecha_reserva: 'desc' }
    });

    const pendientes = reservas.map(r => {
      // Filtrar vehículos que NO tienen una recepción asociada a esta reserva
      const vehiculosPendientes = r.vehiculos.filter(v_reserva => {
        const fueDevuelto = r.recepciones.some(recep =>
          recep.detalles.some(d => d.vehiculo_id === v_reserva.vehiculo_id)
        );
        return !fueDevuelto;
      });
      return { ...r, vehiculos_pendientes: vehiculosPendientes };
    }).filter(r => r.vehiculos_pendientes.length > 0);

    res.status(200).json(pendientes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error consultando reservas pendientes." });
  }
});

// POST /api/recepcion - Procesa la devolución de uno o varios vehículos de una reserva.
recepcionRouter.post(
  "/",
  [
    body("reserva_id").isInt(),
    body("fecha_recepcion").isISO8601(),
    body("empleado_id").isInt(),
    body("detalles").isArray({ min: 1 }),
  ],
  async (req, res) => {
    const { reserva_id, fecha_recepcion, empleado_id, observaciones, detalles } = req.body;
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      // 1. Validar reserva
      const reserva = await prisma.reserva.findUnique({
        where: { reserva_id },
        include: {
          vehiculos: true,
          recepciones: { include: { detalles: true } }
        }
      });

      if (!reserva || (reserva.estado !== 'activa' && reserva.estado !== 'pendiente')) {
        return res.status(400).json({ error: "El alquiler no existe o no se encuentra activo." });
      }

      const fDevolucion = dayjs.utc(fecha_recepcion).startOf('day');
      const fFin = dayjs.utc(reserva.fecha_fin).startOf('day');
      const diasRetraso = fDevolucion.diff(fFin, 'day'); // Puede ser negativo si lo devuelve antes

      let detallesCreacion = [];
      let penalidadesCreacion = [];

      for (const item of detalles) {
         // Validar que el vehiculo existió en la reserva
         const v_linea = reserva.vehiculos.find(v => v.vehiculo_id === item.vehiculo_id);
         if (!v_linea) {
             return res.status(400).json({ error: `El vehículo ID ${item.vehiculo_id} no pertenece a esta reserva.` });
         }

         // Validar que no tenga devolución previa
         const devolucionPrevia = reserva.recepciones.some(r => 
             r.detalles.some(d => d.vehiculo_id === item.vehiculo_id)
         );
         if (devolucionPrevia) {
             return res.status(400).json({ error: `El vehículo ID ${item.vehiculo_id} ya fue devuelto para esta reserva.` });
         }

         detallesCreacion.push({
             vehiculo_id: item.vehiculo_id,
             combustible_devuelto: item.combustible_devuelto || 0,
             kilometraje_devuelto: item.kilometraje_devuelto || 0,
             danos: item.danos || null,
             cargo_extra: item.cargo_extra || 0
         });

         // Regla de Negocio 3.3: Penalidad por retraso automático
         // Monto = DiasRetraso * PrecioPorDia * 1.5 (Aplica solo si FechaDevolucion > FechaFin)
         if (diasRetraso > 0) {
             const precioCotizado = Number(v_linea.precio_unitario);
             const montoPenalidad = diasRetraso * precioCotizado * 1.5;
             penalidadesCreacion.push({
                 reserva_id: reserva_id,
                 vehiculo_id: item.vehiculo_id,
                 tipo: 'Retraso',
                 descripcion: `Retraso de ${diasRetraso} día(s).`,
                 dias_retraso: diasRetraso,
                 monto: montoPenalidad
             });
         }
         
         // Si insertamos o detectamos daños o cargo extra explícito en el front end, creamos penalidad de Daño Manual
         if (Number(item.cargo_extra) > 0) {
             penalidadesCreacion.push({
                 reserva_id: reserva_id,
                 vehiculo_id: item.vehiculo_id,
                 tipo: 'Daño o Restitución',
                 descripcion: item.danos || 'Cargos varios (Combustible/daño)',
                 dias_retraso: 0,
                 monto: Number(item.cargo_extra)
             });
         }
      }

      // Transacción en BD: Crear Recepción, Detalles y Panel de Penalidades
      const nuevaRecepcion = await prisma.$transaction(async (tx) => {
         // 1. Guardar Recepción
         const rec = await tx.recepcion.create({
            data: {
               reserva_id,
               fecha_recepcion: new Date(fecha_recepcion),
               empleado_id,
               observaciones,
               detalles: { create: detallesCreacion }
            }
         });

         // 2. Insertar penalidades automáticas y manuales si hubo
         if (penalidadesCreacion.length > 0) {
            await tx.penalidad.createMany({ data: penalidadesCreacion });
         }

         // 3. Evaluar si con esta recepción se devolvieron YA todos los vehículos de la reserva
         // Consultamos la cuenta total en la tabla
         const reservaRefresh = await tx.reserva.findUnique({
             where: { reserva_id },
             include: { vehiculos: true, recepciones: { include: { detalles: true } } }
         });

         const totalAlquilados = reservaRefresh.vehiculos.length;
         
         // Recolectar todos los detalles devueltos únicos de todas sus recepciones
         const devueltosIds = new Set();
         reservaRefresh.recepciones.forEach(rcp => {
             rcp.detalles.forEach(d => devueltosIds.add(d.vehiculo_id));
         });

         // Si completados == alquilados -> Marcar reserva Completada
         if (devueltosIds.size >= totalAlquilados) {
             await tx.reserva.update({
                 where: { reserva_id },
                 data: { estado: 'completada' }
             });
         }

         return rec;
      });

      res.status(201).json({ mensaje: "Recepción procesada exitosamente", data: nuevaRecepcion });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error interno al procesar recepción", detalle: error.message });
    }
  }
);

export default recepcionRouter;
