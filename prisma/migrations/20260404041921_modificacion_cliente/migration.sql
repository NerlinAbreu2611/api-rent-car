/*
  Warnings:

  - A unique constraint covering the columns `[cedula]` on the table `cliente` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[telefono]` on the table `cliente` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email]` on the table `cliente` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "cliente" ALTER COLUMN "telefono" DROP NOT NULL,
ALTER COLUMN "email" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "cliente_cedula_key" ON "cliente"("cedula");

-- CreateIndex
CREATE UNIQUE INDEX "cliente_telefono_key" ON "cliente"("telefono");

-- CreateIndex
CREATE UNIQUE INDEX "cliente_email_key" ON "cliente"("email");
