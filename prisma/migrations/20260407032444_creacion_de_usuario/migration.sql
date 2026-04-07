-- CreateEnum
CREATE TYPE "rol" AS ENUM ('admin', 'empleado', 'supervisor');

-- CreateTable
CREATE TABLE "usuario" (
    "usuario_id" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "apellido" VARCHAR(100) NOT NULL,
    "username" VARCHAR(100) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "rol" "rol" NOT NULL,
    "estado" "estado" NOT NULL DEFAULT 'activo',

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("usuario_id")
);

-- CreateTable
CREATE TABLE "bitacora_usuario" (
    "bitacora_id" SERIAL NOT NULL,
    "accion" VARCHAR(100) NOT NULL,
    "descripcion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip_origen" VARCHAR(50),
    "estado" "estado" NOT NULL DEFAULT 'activo',
    "usuario_id" INTEGER NOT NULL,

    CONSTRAINT "bitacora_usuario_pkey" PRIMARY KEY ("bitacora_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuario_username_key" ON "usuario"("username");

-- AddForeignKey
ALTER TABLE "bitacora_usuario" ADD CONSTRAINT "bitacora_usuario_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("usuario_id") ON DELETE RESTRICT ON UPDATE CASCADE;
