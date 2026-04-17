import { Router } from "express";
import { body, param, validationResult } from "express-validator";

import prisma from "../lib/prisma.js";

const bitacoraRouter = Router();

// 🔹 Helper para obtener IP
const getClientIp = (req) => {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.socket.remoteAddress ||
    null
  );
};

//
// 📌 GET - Listar bitácoras
//
bitacoraRouter.get("/", async (req, res) => {
  try {
    const data = await prisma.bitacora_usuario.findMany({
      include: {
        usuario: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener bitácoras" });
  }
});

//
// 📌 GET por ID
//
bitacoraRouter.get(
  "/:usuario_id",
  [
    param("usuario_id")
      .notEmpty()
      .withMessage("El usuario_id es obligatorio")
      .isInt()
      .withMessage("usuario_id debe ser un número"),
  ],
  async (req, res) => {
    const errores = validationResult(req);

    if (!errores.isEmpty()) {
      return res.status(400).json({ errores: errores.array() });
    }

    try {
      const { usuario_id } = req.params;

      const data = await prisma.bitacora_usuario.findMany({
        where: {
          usuario_id: parseInt(usuario_id),
          estado: "activo", // 👈 opcional pero recomendado
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      res.json(data);
    } catch (error) {
      res.status(500).json({
        error: "Error al obtener la bitácora del usuario",
        message: error.message,
      });
    }
  },
);

//
// 📌 POST - Crear registro
//
bitacoraRouter.post(
  "/",
  [
    body("accion").notEmpty().withMessage("Acción requerida"),
    body("descripcion").optional().isString(),
    body("usuario_id").notEmpty().isInt().withMessage("usuario_id inválido"),
  ],
  async (req, res) => {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({ errores: errores.array() });
    }

    const { bitacora_id, ip_origen, createdAt, ...data } = req.body;

    try {
      const nueva = await prisma.bitacora_usuario.create({
        data: {
          ...data,
          ip_origen: getClientIp(req), // 👈 IP automática
        },
      });

      res.status(201).json(nueva);
    } catch (error) {
      res.status(500).json({
        error: "Error al crear bitácora",
        message: error.message,
      });
    }
  },
);

//
// 📌 PATCH - Editar
//
bitacoraRouter.patch(
  "/:id",
  [
    param("id").isInt(),
    body("accion").optional().isString(),
    body("descripcion").optional().isString(),
    body("estado").optional().isIn(["activo", "inactivo"]),
  ],
  async (req, res) => {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({ errores: errores.array() });
    }

    const { bitacora_id, usuario_id, createdAt, ...data } = req.body;

    try {
      const updated = await prisma.bitacora_usuario.update({
        where: {
          bitacora_id: parseInt(req.params.id),
        },
        data,
      });

      res.json(updated);
    } catch (error) {
      res.status(500).json({
        error: "Error al actualizar",
        message: error.message,
      });
    }
  },
);

//
// 📌 DELETE lógico (cambiar estado)
//
bitacoraRouter.delete("/:id", [param("id").isInt()], async (req, res) => {
  try {
    const eliminado = await prisma.bitacora_usuario.update({
      where: {
        bitacora_id: parseInt(req.params.id),
      },
      data: {
        estado: "inactivo",
      },
    });

    res.json(eliminado);
  } catch (error) {
    res.status(500).json({
      error: "Error al eliminar",
    });
  }
});

export default bitacoraRouter;
