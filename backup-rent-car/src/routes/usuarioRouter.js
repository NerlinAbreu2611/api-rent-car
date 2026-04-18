import { Router } from "express";
import { body, validationResult } from "express-validator";

import { matchedData } from "express-validator";

import prisma from "../lib/prisma.js";

const usuarioRouter = Router();

usuarioRouter.get("/", async (req, res) => {
  const usuarios = await prisma.usuario.findMany();

  res.status(200).json(usuarios);
});

usuarioRouter.post(
  "/",
  [
    body("nombre")
      .notEmpty()
      .withMessage("El nombre es obligatorio")
      .isString()
      .withMessage("El nombre debe ser un string")
      .isLength({ min: 2, max: 100 })
      .withMessage("El nombre debe tener entre 2 y 100 caracteres"),
    body("apellido")
      .notEmpty()
      .withMessage("El apellido es obligatorio")
      .isString()
      .withMessage("El apellido debe ser un string")
      .isLength({ min: 2, max: 100 })
      .withMessage("El apellido debe tener entre 2 y 100 caracteres"),
    body("username")
      .notEmpty()
      .withMessage("El username es obligatorio")
      .isString()
      .withMessage("El username debe ser un string")
      .isLength({ min: 2, max: 50 })
      .withMessage("El username debe tener entre 2 y 50 caracteres"),
    body("password")
      .notEmpty()
      .withMessage("El password es obligatorio")
      .isString()
      .withMessage("El password debe ser un string")
      .isLength({ min: 6, max: 255 })
      .withMessage("El password debe tener entre 6 y 255 caracteres"),
    body("rol")
      .notEmpty()
      .withMessage("El rol es obligatorio")
      .isIn(["admin", "empleado", "supervisor"])
      .withMessage("Rol inválido"),
  ],

  async (req, res) => {
    const errores = validationResult(req);

    if (!errores.isEmpty()) {
      return res.status(400).json({ errores: errores.array() });
    }

    const { usuario_id, ...data } = req.body;

    try {
      const usuario = await prisma.usuario.create({
        data,
      });

      res.status(201).json(usuario);
    } catch (error) {
      res.status(500).json({
        error: "Error al crear el usuario",
        errorMessage: error.message,
      });
    }
  },
);

usuarioRouter.patch(
  "/:id",
  [
    body("nombre")
      .optional()
      .isString()
      .withMessage("El nombre debe ser un string")
      .isLength({ min: 2, max: 100 })
      .withMessage("El nombre debe tener entre 2 y 100 caracteres"),

    body("apellido")
      .optional()
      .isString()
      .withMessage("El apellido debe ser un string")
      .isLength({ min: 2, max: 100 })
      .withMessage("El apellido debe tener entre 2 y 100 caracteres"),

    body("username")
      .optional()
      .isString()
      .withMessage("El username debe ser un string")
      .isLength({ min: 2, max: 50 })
      .withMessage("El username debe tener entre 2 y 50 caracteres"),

    body("password")
      .optional()
      .isString()
      .withMessage("El password debe ser un string")
      .isLength({ min: 6, max: 255 })
      .withMessage("El password debe tener entre 6 y 255 caracteres"),

    body("rol")
      .optional()
      .isIn(["admin", "empleado", "supervisor"])
      .withMessage("Rol inválido"),

    body("estado")
      .optional()
      .isIn(["activo", "inactivo"])
      .withMessage("Estado inválido"),
  ],
  async (req, res) => {
    const errores = validationResult(req);

    if (!errores.isEmpty()) {
      return res.status(400).json({ errores: errores.array() });
    }

    const { id } = req.params;

    if (isNaN(id)) {
      return res.status(400).json({ error: "ID inválido" });
    }

    try {
      const updateData = matchedData(req);

      const usuario = await prisma.usuario.update({
        where: { usuario_id: Number(id) },
        data: updateData,
      });

      res.json(usuario);
    } catch (error) {
      if (error.code === "P2025") {
        return res.status(404).json({
          error: "Usuario no encontrado",
        });
      }

      res.status(500).json({
        error: "Error al actualizar el usuario",
        errorMessage: error.message,
      });
    }
  },
);

usuarioRouter.delete("/:id", async (req, res) => {
  const { id } = req.params;

  if (isNaN(id)) {
    return res.status(400).json({ error: "ID inválido" });
  }

  try {
    const usuario = await prisma.usuario.update({
      where: { usuario_id: Number(id) },
      data: { estado: "inactivo" },
    });

    res.status(200).json({
      message: "Usuario desactivado correctamente",
      usuario,
    });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({
        error: "Usuario no encontrado",
      });
    }

    res.status(500).json({
      error: "Error al desactivar el usuario",
      errorMessage: error.message,
    });
  }
});

export default usuarioRouter;
