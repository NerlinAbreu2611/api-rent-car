-- CreateEnum
CREATE TYPE "estado" AS ENUM ('activo', 'inactivo');

-- CreateTable
CREATE TABLE "cliente" (
    "cliente_id" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "apellido" VARCHAR(100) NOT NULL,
    "cedula" VARCHAR(11) NOT NULL,
    "telefono" VARCHAR(15) NOT NULL,
    "email" VARCHAR(50) NOT NULL,
    "direccion" VARCHAR(50),
    "estado" "estado" NOT NULL DEFAULT 'activo',

    CONSTRAINT "cliente_pkey" PRIMARY KEY ("cliente_id")
);
