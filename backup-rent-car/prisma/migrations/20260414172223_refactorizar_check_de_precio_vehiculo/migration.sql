/*
  Warnings:

  - A unique constraint covering the columns `[vehiculo_id,tipo_dia]` on the table `precio_vehiculo` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "precio_vehiculo_vehiculo_id_precio_key";

-- CreateIndex
CREATE UNIQUE INDEX "precio_vehiculo_vehiculo_id_tipo_dia_key" ON "precio_vehiculo"("vehiculo_id", "tipo_dia");
