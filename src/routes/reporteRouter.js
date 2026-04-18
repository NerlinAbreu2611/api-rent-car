import { Router } from "express";
import prisma from "../lib/prisma.js";
import PDFDocument from "pdfkit";
import dayjs from "dayjs";

const reporteRouter = Router();

// ============================================
// MODULO 1: CONSULTAS
// ============================================

// 1. Consulta de vehículos disponibles
reporteRouter.get("/consultas/disponibles", async (req, res) => {
  try {
    const vehiculos = await prisma.vehiculo.findMany({
      where: {
        disponible: true,
        estado: 'activo'
      },
      include: { precios: true }
    });
    res.json(vehiculos);
  } catch (error) {
    console.error("Error en consultas/disponibles:", error);
    res.status(500).json({ error: "Error obteniendo vehículos " });
  }
});

// 2. Consulta de alquileres activos
reporteRouter.get("/consultas/activos", async (req, res) => {
  try {
    const activas = await prisma.reserva.findMany({
      where: { estado: 'activa' },
      include: {
        cliente: true,
        vehiculos: { include: { vehiculo: true } }
      }
    });
    res.json(activas);
  } catch (error) {
    console.error("Error en consultas/activos:", error);
    res.status(500).json({ error: "Error" });
  }
});

// 3. Consulta de historial de alquileres por cliente
reporteRouter.get("/consultas/historial-cliente/:id", async (req, res) => {
  try {
    const historial = await prisma.reserva.findMany({
      where: { cliente_id: parseInt(req.params.id) },
      include: {
        vehiculos: { include: { vehiculo: true } },
        pagos: true,
        penalidades: true
      },
      orderBy: { fecha_reserva: 'desc' }
    });
    res.json(historial);
  } catch (error) {
    console.error("Error en consultas/historial-cliente:", error);
    res.status(500).json({ error: "Error" });
  }
});

// Buscar todos los clientes para selector de historial
reporteRouter.get("/consultas/clientes", async (req, res) => {
    try {
      const g = await prisma.cliente.findMany();
      res.json(g);
    } catch(e) {
      console.error("Error en consultas/clientes:", e);
      res.status(500).json({});
    }
});

// 4. Consulta de estado de cuenta por alquiler (usando reserva o global)
reporteRouter.get("/consultas/estado-cuenta", async (req, res) => {
  try {
    const todas_reservas = await prisma.reserva.findMany({
      include: {
        cliente: true,
        vehiculos: true,
        pagos: true,
        penalidades: true
      }
    });
    
    // Calcular balance adeudado
    const cuentas = todas_reservas.map(r => {
        const tAlq = r.vehiculos.reduce((acc, v) => acc + Number(v.subtotal), 0);
        const tPen = r.penalidades.reduce((acc, p) => acc + Number(p.monto), 0);
        const tPagos = r.pagos.reduce((acc, pg) => acc + Number(pg.total), 0);
        const deuda = tAlq + tPen - tPagos;
        return {
           reserva: r,
           total_cargos: tAlq + tPen,
           total_pagado: tPagos,
           balance: deuda
        };
    });
    res.json(cuentas);
  } catch (error) {
    console.error("Error en consultas/estado-cuenta:", error);
    res.status(500).json({ error: "Error" });
  }
});

// 5. Consulta vehículos alquilados días feriados o no
reporteRouter.get("/consultas/dias-alquiler", async (req, res) => {
  try {
    // Para simplificar, buscamos los reservas y verificamos si chocan con algun feriado existente
    const reservas = await prisma.reserva.findMany({
      include: { vehiculos: { include: { vehiculo: true } }, cliente: true }
    });
    const feriadosDB = await prisma.feriado.findMany();
    const fechasFeriados = feriadosDB.map(f => dayjs(f.fecha).format("YYYY-MM-DD"));

    const result = reservas.map(r => {
        let cruzaFeriado = false;
        let d = dayjs(r.fecha_inicio);
        const end = dayjs(r.fecha_fin);
        while (d.isBefore(end) || d.isSame(end)) {
            if (fechasFeriados.includes(d.format("YYYY-MM-DD"))) {
                cruzaFeriado = true;
                break;
            }
            d = d.add(1, 'day');
        }
        return {
           contrato: r.reserva_id,
           cliente: `${r.cliente.nombre} ${r.cliente.apellido}`,
           inicio: r.fecha_inicio,
           fin: r.fecha_fin,
           coches: r.vehiculos.map(x => x.vehiculo.marca + " " + x.vehiculo.modelo).join(", "),
           tipo: cruzaFeriado ? "En Feriado" : "Días Normales"
        };
    });
    res.json(result);
  } catch (error) {
    console.error("Error en consultas/dias-alquiler:", error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// MODULO 2: REPORTES GERENCIALES (JSON + PDF)
// ============================================

// Helper para Generar Tablas en PDF
const generatePDFTable = (doc, title, headers, rows) => {
    doc.fontSize(20).fillColor('#1976D2').text(title, { align: 'center' });
    doc.moveDown(2);
    
    // Header
    let y = doc.y;
    doc.fontSize(12).fillColor('#000');
    doc.font('Helvetica-Bold');
    
    let xOffset = 50;
    const colWidth = 500 / headers.length;
    
    headers.forEach(h => {
        doc.text(h, xOffset, y, { width: colWidth, align: 'left' });
        xOffset += colWidth;
    });

    doc.moveTo(50, y + 15).lineTo(550, y + 15).strokeColor('#ccc').stroke();
    doc.moveDown(1);
    
    // Rows
    doc.font('Helvetica');
    y = doc.y + 10;
    
    rows.forEach(row => {
        let rxOffset = 50;
        
        // Si no cabe, creamos nueva pagina
        if (y > 700) {
            doc.addPage();
            y = 50;
        }

        row.forEach(cell => {
            doc.text(String(cell), rxOffset, y, { width: colWidth, align: 'left' });
            rxOffset += colWidth;
        });
        
        doc.moveTo(50, y + 15).lineTo(550, y + 15).strokeColor('#eeeeee').stroke();
        y += 25;
    });
};

// 1. Reporte de ingresos por fecha
reporteRouter.get("/gerencial/ingresos", async (req, res) => {
    try {
        const { start, end, exportPdf } = req.query;
        
        let queryParams = {};
        if (start && end) {
            queryParams.fecha_pago = { gte: new Date(start), lte: new Date(end) };
        }

        const pagos = await prisma.pago.findMany({
            where: queryParams,
            orderBy: { fecha_pago: 'asc' }
        });

        // agrupar
        const ingresos = [];
        let totalGeneral = 0;
        pagos.forEach(p => {
           ingresos.push({
              fecha: dayjs(p.fecha_pago).format("DD/MM/YYYY"),
              contrato: p.reserva_id,
              monto: Number(p.total)
           });
           totalGeneral += Number(p.total);
        });

        if (exportPdf === 'true') {
            const doc = new PDFDocument({ margin: 50 });
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename=reporte_ingresos.pdf');
            doc.pipe(res);
            
            generatePDFTable(
                doc, 
                "Reporte de Ingresos por Fecha", 
                ["Fecha Pago", "Contrato #", "Monto USD"], 
                ingresos.map(i => [i.fecha, i.contrato, `$${i.monto.toFixed(2)}`])
             );
             doc.moveDown(2);
             doc.font('Helvetica-Bold').fontSize(14).fillColor('green').text(`Total Ingresado: $${totalGeneral.toFixed(2)}`, {align: 'right'});
            doc.end();
            return;
        }

        res.json({ data: ingresos, sumatoria: totalGeneral });
    } catch(e) {
        console.error("Error en gerencial/ingresos:", e);
        res.status(500).json({ error: e.message });
    }
});

// 2. Reporte de vehículos más rentados
reporteRouter.get("/gerencial/top-vehiculos", async (req, res) => {
    try {
        const { exportPdf } = req.query;
        
        // Agrupar
        const counts = await prisma.reserva_vehiculo.groupBy({
            by: ['vehiculo_id'],
            _count: { vehiculo_id: true },
            orderBy: { _count: { vehiculo_id: 'desc'} }
        });

        const list = await prisma.vehiculo.findMany();
        
        let data = counts.map(c => {
             const v = list.find(x => x.vehiculo_id === c.vehiculo_id);
             return {
                 vehiculo: `${v.marca} ${v.modelo} [${v.placa}]`,
                 veces_rentado: c._count.vehiculo_id
             };
        });

        if (exportPdf === 'true') {
            const doc = new PDFDocument({ margin: 50 });
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename=top_vehiculos.pdf');
            doc.pipe(res);
            
            generatePDFTable(
                doc, 
                "Top Vehículos Más Rentados", 
                ["Vehículo / Placa", "Total Alquileres Históricos"], 
                data.map(i => [i.vehiculo, i.veces_rentado])
             );
            doc.end();
            return;
        }
        res.json(data);
    } catch(e) { 
        console.error("Error en gerencial/top-vehiculos:", e);
        res.status(500).json({error: e.message}); 
    }
});

// 3. Reporte de clientes frecuentes
reporteRouter.get("/gerencial/top-clientes", async (req, res) => {
    try {
        const { exportPdf } = req.query;
        
        const counts = await prisma.reserva.groupBy({
            by: ['cliente_id'],
            _count: { cliente_id: true },
            orderBy: { _count: { cliente_id: 'desc'} },
            take: 10
        });

        const list = await prisma.cliente.findMany();
        let data = counts.map(c => {
             const v = list.find(x => x.cliente_id === c.cliente_id);
             return {
                 cedula: v.cedula,
                 cliente: `${v.nombre} ${v.apellido}`,
                 contratos: c._count.cliente_id
             };
        });

        if (exportPdf === 'true') {
            const doc = new PDFDocument({ margin: 50 });
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename=clientes_top.pdf');
            doc.pipe(res);
            
            generatePDFTable(
                doc, 
                "Ranking Clientes Más Frecuentes", 
                ["Documento", "Nombre Cliente", "Alquileres"], 
                data.map(i => [i.cedula, i.cliente, i.contratos])
             );
            doc.end();
            return;
        }
        res.json(data);
    } catch(e) {}
});

// 4. Reporte de penalidades generadas
reporteRouter.get("/gerencial/penalidades", async (req, res) => {
    try {
        const { exportPdf } = req.query;
        const pens = await prisma.penalidad.findMany({
             include: { reserva: { include: { cliente: true} }, vehiculo: true },
             orderBy: { fecha_registro: 'desc'}
        });
        
        const data = pens.map(p => ({
             tipo: p.tipo,
             monto: Number(p.monto),
             cliente: `${p.reserva.cliente.nombre} ${p.reserva.cliente.apellido}`,
             vehiculo: p.vehiculo ? p.vehiculo.placa : 'Global',
             fecha: dayjs(p.fecha_registro).format("DD/MM/YYYY")
        }));
        
        if (exportPdf === 'true') {
            const doc = new PDFDocument({ margin: 50 });
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename=penalidades.pdf');
            doc.pipe(res);
            
            generatePDFTable(
                doc, 
                "Penalidades Emitidas", 
                ["Fecha", "Concepto", "Cliente", "Auto", "Monto USD"], 
                data.map(i => [i.fecha, i.tipo, i.cliente, i.vehiculo, `$${i.monto.toFixed(2)}`])
             );
            doc.end();
            return;
        }

        res.json({data});
    } catch(e) {
        console.error("Error en gerencial/penalidades:", e);
        res.status(500).json({error: e.message});
    }
});

// 5. Estadísticas Consolidadas para el Dashboard
reporteRouter.get("/gerencial/stats", async (req, res) => {
    try {
        // 1. KPIs Básicos
        const totalVehiculos = await prisma.vehiculo.count({ where: { estado: 'activo' } });
        const disponibles = await prisma.vehiculo.count({ where: { disponible: true, estado: 'activo' } });
        const activos = await prisma.reserva.count({ where: { estado: 'activa' } });
        const pagos = await prisma.pago.findMany();
        const totalRecaudado = pagos.reduce((acc, p) => acc + Number(p.total), 0);

        // 2. Datos para Gráfico de Ingresos (Últimos 7 días)
        const ingresosSemana = [];
        for (let i = 6; i >= 0; i--) {
            const date = dayjs().subtract(i, 'day').format("YYYY-MM-DD");
            const totalDia = pagos
                .filter(p => dayjs(p.fecha_pago).format("YYYY-MM-DD") === date)
                .reduce((acc, p) => acc + Number(p.total), 0);
            ingresosSemana.push({ 
                name: dayjs(date).format("DD/MM"), 
                monto: totalDia 
            });
        }

        // 3. Datos para Gráfico de Flota (Pie Chart)
        const estadoFlota = [
            { name: 'Disponibles', value: disponibles },
            { name: 'En Alquiler', value: totalVehiculos - disponibles }
        ];

        // 4. Top Vehículos (Bar Chart)
        const counts = await prisma.reserva_vehiculo.groupBy({
            by: ['vehiculo_id'],
            _count: { vehiculo_id: true },
            orderBy: { _count: { vehiculo_id: 'desc'} },
            take: 5
        });
        const vList = await prisma.vehiculo.findMany();
        const topVehiculos = counts.map(c => {
             const v = vList.find(x => x.vehiculo_id === c.vehiculo_id);
             return {
                 name: v ? v.modelo : "Desconocido",
                 count: c._count.vehiculo_id
             };
        });

        res.json({
            kpis: {
                totalVehiculos,
                disponibles,
                alquileresActivos: activos,
                totalRecaudado
            },
            ingresosSemana,
            estadoFlota,
            topVehiculos
        });
    } catch(e) {
        console.error("Error en dashboard stats:", e);
        res.status(500).json({error: e.message});
    }
});

export default reporteRouter;
