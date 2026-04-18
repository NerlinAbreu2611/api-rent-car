import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function check() {
  const c = await prisma.cliente.findMany();
  if (c.length === 0) {
    await prisma.cliente.create({ data: { nombre: "Test", apellido: "QA", cedula: "12345678901", estado: "activo" } });
  }
  const v = await prisma.vehiculo.findMany();
  if (v.length === 0) {
    await prisma.vehiculo.create({
      data: {
        marca: "Toyota", modelo: "Corolla", anio: 2024, placa: "TEST-QA-1", disponible: true,
        precios: {
          create: [
            { tipo_dia: 'normal', precio: 50 },
            { tipo_dia: 'fin_de_semana', precio: 60 },
            { tipo_dia: 'feriado', precio: 70 }
          ]
        }
      }
    });
  }
  console.log("DB Prep OK");
}
check().finally(()=>prisma.$disconnect());
