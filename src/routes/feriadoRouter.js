import { Router } from "express";
import { body, validationResult } from "express-validator";

import prisma from "../lib/prisma.js";

const feriadoRouter = Router();

// GET /api/feriados
feriadoRouter.get("/", async (req, res) => {
  try {
    const feriados = await prisma.feriado.findMany({
      orderBy: { fecha: 'asc' }
    });
    res.status(200).json(feriados);
  } catch (error) {
    res.status(500).json({ error: "Error interno" });
  }
});

// POST /api/feriados
feriadoRouter.post(
  "/",
  [
    body("fecha")
      .notEmpty()
      .withMessage("La fecha es obligatoria")
      .isISO8601()
      .withMessage("Debe ser una fecha válida (YYYY-MM-DD or ISO)"),
    body("descripcion")
      .optional({ nullable: true })
      .isString()
      .withMessage("La descripción debe ser un string")
      .isLength({ max: 100 })
      .withMessage("La descripción debe tener máximo 100 caracteres"),
  ],
  async (req, res) => {
    const { fecha, descripcion } = req.body;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const feriadoDate = new Date(fecha);
      
      const feriado = await prisma.feriado.create({
        data: {
          fecha: feriadoDate,
          descripcion: descripcion || null,
        },
      });

      res.status(201).json(feriado);
    } catch (error) {
      if (error.code === "P2002") {
        return res.status(400).json({
          error: "Valor duplicado",
          campo: "fecha",
          mensaje: `Este día ya está registrado como feriado.`,
        });
      }
      res.status(500).json({ error: "Error interno", mensaje: error.message });
    }
  }
);

// DELETE /api/feriados/:id
feriadoRouter.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.feriado.delete({
      where: { feriado_id: parseInt(id) },
    });

    res.status(200).json({ mensaje: "Feriado eliminado exitosamente" });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Feriado no encontrado" });
    }
    res.status(500).json({ error: "Error interno", mensaje: error.message });
  }
});

export default feriadoRouter;
