import { Router } from "express";
import { body, validationResult } from "express-validator";
import dayjs from "dayjs";
import prisma from "../lib/prisma.js";

const pagoRouter = Router();

// GET /api/pago/deudas - Devuelve una lista de reservas (y cliente adjunto) cruzadas con el saldo = (Base + Multas) - Pagos.
pagoRouter.get("/deudas", async (req, res) => {
  try {
    const reservas = await prisma.reserva.findMany({
      include: {
        cliente: true,
        vehiculos: true,
        penalidades: { where: { estado: 'activo' } },
        pagos: { where: { estado: 'activo' } }
      },
      orderBy: { reserva_id: 'desc' }
    });

    const estadoCuentas = reservas.map(r => {
      // 1. Total Base Alquiler
      const totalAlquiler = r.vehiculos.reduce((acc, curr) => acc + Number(curr.subtotal), 0);
      
      // 2. Total Penalidades (Retrasos, Daños, etc)
      const totalPenalidades = r.penalidades.reduce((acc, curr) => acc + Number(curr.monto), 0);
      
      // 3. Pagos procesados hasta la fecha
      const pagado = r.pagos.reduce((acc, curr) => acc + Number(curr.total), 0);
      
      // 4. Saldo = Total + Penalidades - Sum(Pagos)
      const balanceAdeudado = (totalAlquiler + totalPenalidades) - pagado;

      return {
        reserva_id: r.reserva_id,
        cliente: r.cliente,
        fecha_reserva: r.fecha_reserva,
        estado: r.estado,
        detalles_finanzas: {
          total_alquiler: totalAlquiler,
          total_penalidades: totalPenalidades,
          total_bruto_factura: totalAlquiler + totalPenalidades,
          total_pagado: pagado,
          balance_adeudado: balanceAdeudado
        }
      };
    }).filter(ec => ec.detalles_finanzas.balance_adeudado > 0); 
    // Filtramos para solo mostrar quien debe dinero.

    res.status(200).json(estadoCuentas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error consultando estado de cuenta" });
  }
});

// POST /api/pago - Procesar un abono / pago completo para un contrato.
pagoRouter.post(
  "/",
  [
    body("reserva_id").isInt(),
    body("monto").isFloat({ gt: 0 }).withMessage("El monto a pagar debe ser estrictamente mayor a 0."),
    body("metodo").isString().notEmpty()
  ],
  async (req, res) => {
    const { reserva_id, monto, metodo } = req.body;
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      // Regla: No pagar mas de lo adeudado. Traemos la info en tiempo real.
      const reserva = await prisma.reserva.findUnique({
        where: { reserva_id },
        include: {
          vehiculos: true,
          penalidades: { where: { estado: 'activo' } },
          pagos: { where: { estado: 'activo' } }
        }
      });

      if (!reserva) return res.status(404).json({ error: "Reserva no existe" });

      const totalAlquiler = reserva.vehiculos.reduce((acc, curr) => acc + Number(curr.subtotal), 0);
      const totalPenalidades = reserva.penalidades.reduce((acc, curr) => acc + Number(curr.monto), 0);
      const pagado = reserva.pagos.reduce((acc, curr) => acc + Number(curr.total), 0);
      
      const balanceAdeudado = (totalAlquiler + totalPenalidades) - pagado;

      if (balanceAdeudado <= 0) {
        return res.status(400).json({ error: "El contrato tiene balance saldado, no se requieren más pagos." });
      }

      // Validamos redondeo o flotantes muy justos
      const montoInput = Number(monto);
      if (montoInput > (balanceAdeudado + 0.05)) { // colchón ínfimo de .05 cs para epsilon.
        return res.status(400).json({ error: `El monto a pagar excedería el saldo deudor actual de $${balanceAdeudado.toFixed(2)}.` });
      }

      // Generar el Pago (Prisma transaction no es vital aqui pero lo haremos limpio)
      const nuevoPago = await prisma.pago.create({
         data: {
             reserva_id,
             fecha_pago: new Date(),
             metodo: metodo,
             total: montoInput,
             estado: 'activo'
         }
      });

      res.status(201).json({ mensaje: "Pago registrado exitosamente", pago: nuevoPago, nuevo_balance: balanceAdeudado - montoInput });
    } catch(err) {
      console.error(err);
      res.status(500).json({ error: "Error en el servidor procesando el pago" });
    }
});

export default pagoRouter;
