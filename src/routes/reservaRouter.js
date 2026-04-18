import { Router } from "express";
import { body, validationResult } from "express-validator";
import PDFDocument from "pdfkit";

import prisma from "../lib/prisma.js";

const reservaRouter = Router();

// GET /api/reserva/disponibles
reservaRouter.get("/disponibles", async (req, res) => {
  try {
    const vehiculos = await prisma.vehiculo.findMany({
      where: { estado: 'activo', disponible: true },
      include: {
        reserva_vehiculo: {
          where: {
            estado: 'activo',
            reserva: { estado: { in: ['pendiente', 'activa'] } }
          },
          include: { reserva: { include: { recepciones: { include: { detalles: true } } } } }
        },
        precios: true,
      }
    });

    const disponibles = vehiculos.filter(v => {
      if (v.reserva_vehiculo.length === 0) return true;
      
      const hasActiveWithoutReturn = v.reserva_vehiculo.some(rv => {
        const isReturned = rv.reserva.recepciones.some(recep => 
          recep.detalles.some(det => det.vehiculo_id === v.vehiculo_id && det.estado === 'activo')
        );
        return !isReturned; 
      });

      return !hasActiveWithoutReturn;
    });

    res.status(200).json(disponibles);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno al consultar disponibilidad." });
  }
});

// GET /api/reserva
reservaRouter.get("/", async (req, res) => {
  try {
    const reservas = await prisma.reserva.findMany({
      include: {
        cliente: true,
        vehiculos: { include: { vehiculo: true } }
      },
      orderBy: { reserva_id: 'desc' }
    });
    res.status(200).json(reservas);
  } catch (error) {
    res.status(500).json({ error: "Error interno" });
  }
});

// POST /api/reserva
reservaRouter.post(
  "/",
  [
    body("cliente_id").isInt().withMessage("cliente_id debe ser un entero"),
    body("fecha_inicio").isISO8601().withMessage("fecha_inicio inválida"),
    body("fecha_fin").isISO8601().withMessage("fecha_fin inválida"),
    body("carrito").isArray({ min: 1 }).withMessage("Debe incluir al menos un vehículo en el carrito"),
    body("carrito.*.vehiculo_id").isInt().withMessage("vehiculo_id debe ser entero"),
  ],
  async (req, res) => {
    const { cliente_id, fecha_inicio, fecha_fin, carrito } = req.body;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const fInicio = new Date(fecha_inicio);
      const fFin = new Date(fecha_fin);
      
      if (fFin <= fInicio) {
        return res.status(400).json({ error: "La fecha de fin debe ser estrictamente mayor a la fecha de inicio" });
      }

      // Validar Cliente
      const clienteOk = await prisma.cliente.findUnique({ where: { cliente_id } });
      if (!clienteOk || clienteOk.estado !== 'activo') {
         return res.status(404).json({ error: "Cliente no existe o inactivo" });
      }

      // Traer feriados para cálculo
      const feriadosDb = await prisma.feriado.findMany({ where: { estado: 'activo' } });
      const feriadosStrings = feriadosDb.map(f => f.fecha.toISOString().split('T')[0]);

      // Calculos mas validacion de disponibilidad
      const detallesCreacion = [];
      const penalidadesLocales = [];
      
      // Consultamos los vehículos activos
      const vehiculosPrecios = await prisma.vehiculo.findMany({
         where: { 
            vehiculo_id: { in: carrito.map(c => c.vehiculo_id) },
         },
         include: {
            precios: true,
            reserva_vehiculo: {
               where: {
                  estado: 'activo',
                  reserva: { estado: { in: ['pendiente', 'activa'] } }
               },
               include: { reserva: { include: { recepciones: { include: { detalles: true } } } } }
            }
         }
      });

      for (const item of carrito) {
         const v = vehiculosPrecios.find(vp => vp.vehiculo_id === item.vehiculo_id);
         if (!v) return res.status(400).json({ error: `Vehículo ${item.vehiculo_id} no encontrado` });

         // Validar disponibilidad
         const hasActiveWithoutReturn = v.reserva_vehiculo.some(rv => {
            const isReturned = rv.reserva.recepciones.some(recep => 
               recep.detalles.some(det => det.vehiculo_id === v.vehiculo_id && det.estado === 'activo')
            );
            return !isReturned; 
         });

         if (hasActiveWithoutReturn) {
            return res.status(400).json({ error: `Conflicto: El vehículo ${v.marca} ${v.modelo} (Placa ${v.placa}) se encuentra ocupado.` });
         }

         // Calculando Precio Base + 30% Recargo por Feriado
         let subtotal = 0;
         let montoFeriadoVehiculo = 0;
         let daysCount = 0;
         let date = new Date(fInicio);
         
         while(date <= fFin) {
            const dateStr = date.toISOString().split('T')[0];
            const dayOfWeek = date.getDay(); // 0 is Sunday, 6 is Saturday
            let tipoDiaBase = (dayOfWeek === 0 || dayOfWeek === 6) ? 'fin_de_semana' : 'normal';
            
            const precioObj = v.precios.find(p => p.tipo_dia === tipoDiaBase);
            const diaPrecio = precioObj ? Number(precioObj.precio) : 0;
            subtotal += diaPrecio;
            
            // Regla: 30% adicional al costo del alquiler del día si cae en Feriado
            if (feriadosStrings.includes(dateStr)) {
               montoFeriadoVehiculo += (diaPrecio * 0.30);
            }
            
            date.setDate(date.getDate() + 1);
            daysCount++;
         }
         
         if (daysCount === 0 || subtotal === 0) {
             return res.status(400).json({ error: `Error calculando costos para vehículo ${v.marca}. Revise los precios base.` });
         }

         detallesCreacion.push({
             vehiculo_id: v.vehiculo_id,
             precio_unitario: subtotal / daysCount,
             dias: daysCount,
             subtotal: subtotal
         });

         // Inyectar multa directamente si generó tarifa feriado
         if (montoFeriadoVehiculo > 0) {
            penalidadesLocales.push({
               vehiculo_id: v.vehiculo_id,
               tipo: 'Recargo Feriado',
               descripcion: '30% recargo por estadía en día feriado',
               monto: montoFeriadoVehiculo,
               dias_retraso: 0,
               estado: 'activo'
            });
         }
      }

      // Guardar todo como una transacción implícita
      const nuevaReserva = await prisma.reserva.create({
         data: {
            cliente_id: cliente_id,
            fecha_reserva: new Date(),
            fecha_inicio: fInicio,
            fecha_fin: fFin,
            estado: 'activa',
            vehiculos: {
               create: detallesCreacion
            },
            penalidades: penalidadesLocales.length > 0 ? { create: penalidadesLocales } : undefined
         },
         include: {
            vehiculos: true,
            penalidades: true
         }
      });

      res.status(201).json(nuevaReserva);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error interno al crear reserva", mensaje: error.message });
    }
  }
);

// PUT para cambiar estados u otra info
// GET /api/reserva/:id/ticket - API de generación gráfica para imprimir PDF de un Alquiler
reservaRouter.get("/:id/ticket", async (req, res) => {
   try {
      const { id } = req.params;
      const reserva = await prisma.reserva.findUnique({
         where: { reserva_id: parseInt(id) },
         include: {
            cliente: true,
            vehiculos: { include: { vehiculo: true } },
            penalidades: true
         }
      });

      if(!reserva) return res.status(404).json({error: "No encontrada"});

      // Init PDF doc
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=Ticket_Reserva_${id}.pdf`);
      doc.pipe(res);

      // Header
      doc.fontSize(24).fillColor('#1976d2').text('RENT CAR INC.', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(12).fillColor('#444').text('Ticket Oficial de Reserva', { align: 'center' });
      doc.text(`Reservación #${reserva.reserva_id}`, { align: 'center' });
      doc.text(`Generado el: ${new Date().toLocaleDateString()}`, { align: 'center' });
      
      // Separator
      doc.moveDown().moveTo(50, doc.y).lineTo(550, doc.y).strokeColor('#aaa').stroke();

      // Client Data
      doc.moveDown().fontSize(14).fillColor('#000').text('Datos del Cliente', { underline: true });
      doc.fontSize(11).text(`Nombre: ${reserva.cliente.nombre} ${reserva.cliente.apellido}`);
      doc.text(`Cédula: ${reserva.cliente.cedula}`);
      doc.text(`Teléfono: ${reserva.cliente.telefono || 'N/A'}`);
      
      // Rental Data
      doc.moveDown().fontSize(14).text('Detalles del Alquiler', { underline: true });
      doc.fontSize(11).text(`Inicio: ${reserva.fecha_inicio.toLocaleDateString()}`);
      doc.text(`Fin: ${reserva.fecha_fin.toLocaleDateString()}`);

      // Vehicles
      doc.moveDown();
      let subtotalAutos = 0;
      reserva.vehiculos.forEach(v => {
         subtotalAutos += Number(v.subtotal);
         doc.text(
            `- Vehículo: ${v.vehiculo.marca} ${v.vehiculo.modelo} [${v.vehiculo.placa}] | Días: ${v.dias} | Costo Base: $${Number(v.subtotal).toFixed(2)}`
         );
      });

      // Extra Surcharges
      let recargosFeriados = 0;
      const tienePenalidades = reserva.penalidades && reserva.penalidades.length > 0;
      
      if (tienePenalidades) {
         doc.moveDown().fontSize(14).text('Recargos y Feriados (+30%)', { underline: true });
         reserva.penalidades.forEach(p => {
             recargosFeriados += Number(p.monto);
             doc.fontSize(11).text(`- ${p.descripcion}: $${Number(p.monto).toFixed(2)}`);
         });
      }

      // Total Math
      doc.moveDown(2).moveTo(50, doc.y).lineTo(550, doc.y).strokeColor('#000').stroke().moveDown();
      doc.fontSize(14).text(`SUBTOTAL ALQUILER: $${subtotalAutos.toFixed(2)}`, { align: 'right' });
      
      if(recargosFeriados > 0) {
         doc.text(`TOTAL RECARGOS (Feriados): $${recargosFeriados.toFixed(2)}`, { align: 'right', color: '#d32f2f' });
      }

      doc.fontSize(18).fillColor('#2e7d32').text(`BALANCE DEUDOR NETO: $${(subtotalAutos + recargosFeriados).toFixed(2)}`, { align: 'right' });

      doc.moveDown(4).fontSize(10).fillColor('#888').text('Gracias por preferir nuestro sistema de transacciones seguras.', { align: 'center' });

      doc.end();
   } catch(e) {
      console.error(e);
      if(!res.headersSent) res.status(500).json({error: "Failed to generate PDF"});
   }
});

export default reservaRouter;
