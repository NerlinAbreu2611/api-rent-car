-- CreateEnum
CREATE TYPE "tipo_dia" AS ENUM ('normal', 'fin_de_semana', 'feriado');

-- CreateTable
CREATE TABLE "vehiculo" (
    "vehiculo_id" SERIAL NOT NULL,
    "marca" VARCHAR(50) NOT NULL,
    "modelo" VARCHAR(50) NOT NULL,
    "anio" INTEGER NOT NULL,
    "placa" VARCHAR(20) NOT NULL,
    "disponible" BOOLEAN NOT NULL DEFAULT true,
    "estado" "estado" NOT NULL DEFAULT 'activo',

    CONSTRAINT "vehiculo_pkey" PRIMARY KEY ("vehiculo_id")
);

-- CreateTable
CREATE TABLE "precio_vehiculo" (
    "id" SERIAL NOT NULL,
    "vehiculo_id" INTEGER NOT NULL,
    "tipo_dia" "tipo_dia" NOT NULL,
    "precio" DECIMAL(65,30) NOT NULL,
    "estado" "estado" NOT NULL DEFAULT 'activo'
);

-- CreateIndex
CREATE UNIQUE INDEX "vehiculo_placa_key" ON "vehiculo"("placa");

-- CreateIndex
CREATE UNIQUE INDEX "precio_vehiculo_vehiculo_id_precio_key" ON "precio_vehiculo"("vehiculo_id", "precio");

-- AddForeignKey
ALTER TABLE "precio_vehiculo" ADD CONSTRAINT "precio_vehiculo_vehiculo_id_fkey" FOREIGN KEY ("vehiculo_id") REFERENCES "vehiculo"("vehiculo_id") ON DELETE RESTRICT ON UPDATE CASCADE;
