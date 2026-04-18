/*
  Warnings:

  - You are about to alter the column `precio` on the `precio_vehiculo` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.

*/
-- AlterTable
ALTER TABLE "precio_vehiculo" ALTER COLUMN "precio" SET DATA TYPE DECIMAL(10,2);
