-- CreateEnum
CREATE TYPE "estado_reserva" AS ENUM ('pendiente', 'activa', 'completada', 'cancelada');

-- CreateTable
CREATE TABLE "feriado" (
    "feriado_id" SERIAL NOT NULL,
    "fecha" DATE NOT NULL,
    "descripcion" VARCHAR(100),
    "estado" "estado" NOT NULL DEFAULT 'activo',

    CONSTRAINT "feriado_pkey" PRIMARY KEY ("feriado_id")
);

-- CreateTable
CREATE TABLE "reserva" (
    "reserva_id" SERIAL NOT NULL,
    "cliente_id" INTEGER NOT NULL,
    "fecha_reserva" DATE NOT NULL,
    "fecha_inicio" DATE NOT NULL,
    "fecha_fin" DATE NOT NULL,
    "estado" "estado_reserva" NOT NULL DEFAULT 'pendiente',

    CONSTRAINT "reserva_pkey" PRIMARY KEY ("reserva_id")
);

-- CreateTable
CREATE TABLE "reserva_vehiculo" (
    "detalle_id" SERIAL NOT NULL,
    "reserva_id" INTEGER NOT NULL,
    "vehiculo_id" INTEGER NOT NULL,
    "precio_unitario" DECIMAL(10,2) NOT NULL,
    "dias" INTEGER NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "estado" "estado" NOT NULL DEFAULT 'activo',

    CONSTRAINT "reserva_vehiculo_pkey" PRIMARY KEY ("detalle_id")
);

-- CreateTable
CREATE TABLE "pago" (
    "pago_id" SERIAL NOT NULL,
    "reserva_id" INTEGER NOT NULL,
    "fecha_pago" DATE NOT NULL,
    "metodo" VARCHAR(50),
    "total" DECIMAL(10,2) NOT NULL,
    "estado" "estado" NOT NULL DEFAULT 'activo',

    CONSTRAINT "pago_pkey" PRIMARY KEY ("pago_id")
);

-- CreateTable
CREATE TABLE "pago_detalle" (
    "detalle_pago_id" SERIAL NOT NULL,
    "pago_id" INTEGER NOT NULL,
    "vehiculo_id" INTEGER NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "estado" "estado" NOT NULL DEFAULT 'activo',

    CONSTRAINT "pago_detalle_pkey" PRIMARY KEY ("detalle_pago_id")
);

-- CreateTable
CREATE TABLE "recepcion" (
    "recepcion_id" SERIAL NOT NULL,
    "reserva_id" INTEGER NOT NULL,
    "fecha_recepcion" DATE NOT NULL,
    "empleado_id" INTEGER NOT NULL,
    "observaciones" VARCHAR(100),
    "estado" "estado" NOT NULL DEFAULT 'activo',

    CONSTRAINT "recepcion_pkey" PRIMARY KEY ("recepcion_id")
);

-- CreateTable
CREATE TABLE "recepcion_detalle" (
    "detalle_recepcion_id" SERIAL NOT NULL,
    "recepcion_id" INTEGER NOT NULL,
    "vehiculo_id" INTEGER NOT NULL,
    "combustible_devuelto" DECIMAL(5,2) NOT NULL,
    "kilometraje_devuelto" INTEGER NOT NULL,
    "danos" VARCHAR(100),
    "cargo_extra" DECIMAL(10,2),
    "estado" "estado" NOT NULL DEFAULT 'activo',

    CONSTRAINT "recepcion_detalle_pkey" PRIMARY KEY ("detalle_recepcion_id")
);

-- CreateTable
CREATE TABLE "penalidad" (
    "penalidad_id" SERIAL NOT NULL,
    "reserva_id" INTEGER NOT NULL,
    "vehiculo_id" INTEGER NOT NULL,
    "tipo" VARCHAR(50) NOT NULL,
    "descripcion" VARCHAR(200),
    "dias_retraso" INTEGER NOT NULL DEFAULT 0,
    "monto" DECIMAL(10,2) NOT NULL,
    "fecha_registro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estado" "estado" NOT NULL DEFAULT 'activo',

    CONSTRAINT "penalidad_pkey" PRIMARY KEY ("penalidad_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "feriado_fecha_key" ON "feriado"("fecha");

-- AddForeignKey
ALTER TABLE "reserva" ADD CONSTRAINT "reserva_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "cliente"("cliente_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reserva_vehiculo" ADD CONSTRAINT "reserva_vehiculo_reserva_id_fkey" FOREIGN KEY ("reserva_id") REFERENCES "reserva"("reserva_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reserva_vehiculo" ADD CONSTRAINT "reserva_vehiculo_vehiculo_id_fkey" FOREIGN KEY ("vehiculo_id") REFERENCES "vehiculo"("vehiculo_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pago" ADD CONSTRAINT "pago_reserva_id_fkey" FOREIGN KEY ("reserva_id") REFERENCES "reserva"("reserva_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pago_detalle" ADD CONSTRAINT "pago_detalle_pago_id_fkey" FOREIGN KEY ("pago_id") REFERENCES "pago"("pago_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pago_detalle" ADD CONSTRAINT "pago_detalle_vehiculo_id_fkey" FOREIGN KEY ("vehiculo_id") REFERENCES "vehiculo"("vehiculo_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recepcion" ADD CONSTRAINT "recepcion_reserva_id_fkey" FOREIGN KEY ("reserva_id") REFERENCES "reserva"("reserva_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recepcion_detalle" ADD CONSTRAINT "recepcion_detalle_recepcion_id_fkey" FOREIGN KEY ("recepcion_id") REFERENCES "recepcion"("recepcion_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recepcion_detalle" ADD CONSTRAINT "recepcion_detalle_vehiculo_id_fkey" FOREIGN KEY ("vehiculo_id") REFERENCES "vehiculo"("vehiculo_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "penalidad" ADD CONSTRAINT "penalidad_reserva_id_fkey" FOREIGN KEY ("reserva_id") REFERENCES "reserva"("reserva_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "penalidad" ADD CONSTRAINT "penalidad_vehiculo_id_fkey" FOREIGN KEY ("vehiculo_id") REFERENCES "vehiculo"("vehiculo_id") ON DELETE RESTRICT ON UPDATE CASCADE;
