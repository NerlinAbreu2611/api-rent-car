import { Router } from "express";
import { body, validationResult } from "express-validator";

import prisma from "../lib/prisma.js";
import { Prisma, tipo_dia } from "@prisma/client";

const vehiculoRouter = Router();

vehiculoRouter.get("/", async (req, res) => {
  const vehiculos = await prisma.vehiculo.findMany({
    include: {
      precios: true,
    },
  });

  res.status(200).json(vehiculos);
});

vehiculoRouter.post(
  "/",
  [
    body("marca")
      .notEmpty()
      .withMessage("la marca es obligatoria")
      .isString()
      .withMessage("la marca debe ser un string")
      .isLength({ min: 1, max: 50 })
      .withMessage("La marca debe tener entre 1 y 50 caracteres"),
    body("modelo")
      .notEmpty()
      .withMessage("El modelo es obligatorio")
      .isString()
      .withMessage("El modelo debe ser un string")
      .isLength({ min: 1, max: 50 })
      .withMessage("El modelo debe tener entre 1 y 50 caracteres"),
    body("anio")
      .notEmpty()
      .withMessage("El año es obligatorio")
      .toInt()
      .isInt({ gt: 1885 })
      .withMessage("El año debe ser un entero mayor a 1885"),
    body("placa")
      .notEmpty()
      .withMessage("La placa es obligatoria")
      .isString()
      .withMessage("La placa debe ser un string")
      .isLength({ min: 11, max: 11 })
      .withMessage("La placa debe tener 11 caracteres"),
    body("precios")
      .isArray({ min: 1 })
      .withMessage("Debe enviar al menos un precio"),
    body("precios.*")
      .isObject()
      .withMessage("Cada elemento debe ser un objeto"),
    body("precios.*.precio")
      .isFloat({ gt: 0 })
      .withMessage("Cada precio deber ser mayor que 0"),
    body("precios.*.tipo_dia")
      .isIn(["normal", "fin_de_semana", "feriado"])
      .withMessage("No existe ese tipo"),
  ],
  async (req, res) => {
    const { marca, modelo, anio, placa, precios } = req.body;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const vehiculos = await prisma.vehiculo.create({
        data: {
          marca,
          modelo,
          anio,
          placa,
          precios: {
            create: precios.map((p) => ({
              tipo_dia: p.tipo_dia,
              precio: new Prisma.Decimal(p.precio), //importante,
            })),
          },
        },
        include: {
          precios: true,
        },
      });

      res.status(201).json(vehiculos);
    } catch (error) {
      if (error.code === "P2002") {
        // Código de Prisma para "Unique constraint failed"
        const campos = error.meta.target.join(", "); // Prisma te dice exactamente qué campo falló
        return res.status(400).json({
          error: "Valor duplicado",
          campo: campos,
          mensaje: `El ${campos} ya está en uso.`,
        });
      }
      res.status(500).json({ error: "Error interno" });
    }
  },
);

vehiculoRouter.patch(
  "/:id",
  [
    body("marca")
      .optional()
      .isString()
      .withMessage("La marca debe ser un string")
      .isLength({ min: 1, max: 50 })
      .withMessage("La marca debe tener entre 1 y 50 caracteres"),

    body("modelo")
      .optional()
      .isString()
      .withMessage("El modelo debe ser un string")
      .isLength({ min: 1, max: 50 })
      .withMessage("El modelo debe tener entre 1 y 50 caracteres"),

    body("anio")
      .optional()
      .toInt()
      .isInt({ gt: 1885 })
      .withMessage("El año debe ser un entero mayor a 1885"),

    body("placa")
      .optional()
      .isString()
      .withMessage("La placa debe ser un string")
      .isLength({ min: 11, max: 11 })
      .withMessage("La placa debe tener 11 caracteres"),

    // ✅ ARRAY PRINCIPAL
    body("precios")
      .optional()
      .isArray({ min: 1 })
      .withMessage("Debe enviar al menos un precio"),

    // ✅ VALIDACIÓN DE ELEMENTOS
    body("precios.*.precio")
      .optional()
      .isFloat({ gt: 0 })
      .withMessage("Cada precio debe ser mayor que 0"),

    body("precios.*.tipo_dia")
      .optional()
      .isIn(["normal", "fin_de_semana", "feriado"])
      .withMessage("Tipo de día inválido"),

    body("precios.*.estado")
      .optional()
      .isIn(["activo", "inactivo"])
      .withMessage("Estado inválido"),

    // ✅ VALIDACIÓN DE DUPLICADOS
    body("precios")
      .optional()
      .custom((precios) => {
        if (!Array.isArray(precios)) return true;

        const tipos = precios.map((p) => p.tipo_dia);
        const duplicados = tipos.filter((t, i) => tipos.indexOf(t) !== i);

        if (duplicados.length > 0) {
          throw new Error("No puede haber tipos de día repetidos");
        }

        return true;
      }),

    body("disponible")
      .optional()
      .isBoolean()
      .withMessage("La disponibilidad debe ser booleana"),
    body("estado")
      .optional()
      .isIn(["activo", "inactivo"])
      .withMessage("Estado inválido"),
  ],

  async (req, res) => {
    const { id } = req.params;
    const { precios, ...resto } = req.body;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const data = {
        ...resto,
        ...(precios && {
          precios: {
            upsert: precios.map((p) => ({
              where: {
                vehiculo_id_tipo_dia: {
                  vehiculo_id: parseInt(id),
                  tipo_dia: p.tipo_dia,
                },
              },
              update: {
                precio: new Prisma.Decimal(p.precio),
                ...(p.estado !== undefined && { estado: p.estado }),
              },
              create: {
                tipo_dia: p.tipo_dia,
                precio: new Prisma.Decimal(p.precio),
                estado: p.estado || "activo",
              },
            })),
          },
        }),
      };

      const vehiculo = await prisma.vehiculo.update({
        where: { vehiculo_id: parseInt(id) },
        data,
        include: { precios: true },
      });

      return res.status(200).json(vehiculo);
    } catch (error) {
      if (error.code === "P2002") {
        const campos = error.meta.target.join(", ");

        return res.status(400).json({
          error: "Valor duplicado",
          campo: campos,
          mensaje: `El campo(s) ${campos} ya está(n) en uso.`,
        });
      }

      return res.status(500).json({ error: "Error interno" });
    }
  },
);

vehiculoRouter.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const vehiculo = await prisma.vehiculo.update({
      where: {
        vehiculo_id: parseInt(id),
      },
      data: {
        estado: "inactivo",
      },
    });

    return res.status(200).json({
      message: "Vehículo deshabilitado correctamente",
      vehiculo,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Error interno",
    });
  }
});

export default vehiculoRouter;
