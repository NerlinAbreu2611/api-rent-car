import { Router } from "express";
import { body, validationResult } from "express-validator";

import prisma from "../lib/prisma.js";

const clienteRouter = Router();

clienteRouter.get("/", async (req, res) => {
  const clientes = await prisma.cliente.findMany();

  res.status(200).json(clientes);
});

// POST /api/cliente

clienteRouter.post(
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
    body("cedula")
      .notEmpty()
      .withMessage("La cédula es obligatoria")
      .isString()
      .withMessage("La cédula debe ser un string")
      .isLength({ min: 11, max: 11 })
      .withMessage("Debe tener 11 caracteres")
      .isNumeric()
      .withMessage("Solo debe contener números"),
    body("telefono")
      .optional({ nullable: true })
      .isString()
      .withMessage("El teléfono debe ser un string")
      .isLength({ min: 10, max: 10 })
      .withMessage("El teléfono debe tener entre 10 y 11 caracteres")
      .isNumeric()
      .withMessage("Solo debe contener números"),
    body("email")
      .optional({ nullable: true })
      .isEmail()
      .withMessage("El email debe ser válido")
      .isLength({ max: 50 })
      .withMessage("El email debe tener máximo 50 caracteres"),
    body("direccion")
      .optional({ nullable: true })
      .isString()
      .withMessage("La dirección debe ser un string")
      .isLength({ max: 40 })
      .withMessage("La dirección debe tener máximo 40 caracteres"),
  ],
  async (req, res) => {
    const { nombre, apellido, cedula, telefono, email, direccion } = req.body;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const cliente = await prisma.cliente.create({
        data: {
          nombre: nombre,
          apellido: apellido,
          cedula: cedula,
          telefono: telefono || null,
          email: email || null,
          direccion: direccion || null,
        },
      });

      res.status(201).json(cliente);
    } catch (error) {
      if (error.code === "P2002") {
        // Código de Prisma para "Unique constraint failed"
        const campo = error.meta.target[0]; // Prisma te dice exactamente qué campo falló
        return res.status(400).json({
          error: "Valor duplicado",
          campo: campo,
          mensaje: `El ${campo} ya está en uso.`,
        });
      }
      res.status(500).json({ error: "Error interno" });
    }
  },
);

// patch /api/cliente/:id

clienteRouter.patch(
  "/",
  [
    body("nombre")
      .optional({ nullable: true })
      .isString()
      .withMessage("El nombre debe ser un string")
      .isLength({ min: 2, max: 100 })
      .withMessage("El nombre debe tener entre 2 y 100 caracteres"),
    body("apellido")
      .optional({ nullable: true })
      .isString()
      .withMessage("El apellido debe ser un string")
      .isLength({ min: 2, max: 100 })
      .withMessage("El apellido debe tener entre 2 y 100 caracteres"),
    body("cedula")
      .optional({ nullable: true })
      .isString()
      .withMessage("La cédula debe ser un string")
      .isLength({ min: 11, max: 11 })
      .withMessage("Debe tener 11 caracteres")
      .isNumeric()
      .withMessage("Solo debe contener números"),
    body("telefono")
      .optional({ nullable: true })
      .isString()
      .withMessage("El teléfono debe ser un string")
      .isLength({ min: 10, max: 10 })
      .withMessage("El teléfono debe tener entre 10 y 11 caracteres")
      .isNumeric()
      .withMessage("Solo debe contener números"),
    body("email")
      .optional({ nullable: true })
      .isEmail()
      .withMessage("El email debe ser válido")
      .isLength({ max: 50 })
      .withMessage("El email debe tener máximo 50 caracteres"),
    body("direccion")
      .optional({ nullable: true })
      .isString()
      .withMessage("La dirección debe ser un string")
      .isLength({ max: 40 })
      .withMessage("La dirección debe tener máximo 40 caracteres"),
    body("estado")
      .optional()
      .isIn(["activo", "inactivo"])
      .withMessage("Estado invalido"),
  ],
  async (req, res) => {
    const {
      cliente_id,
      nombre,
      apellido,
      cedula,
      telefono,
      email,
      direccion,
      estado,
    } = req.body;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const existingCliente = await prisma.cliente.findUnique({
        where: { cliente_id: cliente_id },
      });

      if (!existingCliente) {
        return res.status(404).json({ error: "Cliente no encontrado" });
      }

      existingCliente.nombre = nombre || existingCliente.nombre;
      existingCliente.apellido = apellido || existingCliente.apellido;
      existingCliente.cedula = cedula || existingCliente.cedula;
      existingCliente.telefono = telefono || existingCliente.telefono;
      existingCliente.email = email || existingCliente.email;
      existingCliente.direccion = direccion || existingCliente.direccion;
      existingCliente.estado = estado || existingCliente.estado;

      const cliente = await prisma.cliente.update({
        where: { cliente_id: cliente_id },
        data: {
          nombre: existingCliente.nombre,
          apellido: existingCliente.apellido,
          cedula: existingCliente.cedula,
          telefono: existingCliente.telefono,
          email: existingCliente.email,
          direccion: existingCliente.direccion,
          estado: existingCliente.estado,
        },
      });

      res.status(200).json(cliente);
    } catch (error) {
      if (error.code === "P2002") {
        // Código de Prisma para "Unique constraint failed"
        const campo = error.meta.target[0]; // Prisma te dice exactamente qué campo falló
        return res.status(400).json({
          error: "Valor duplicado",
          campo: campo,
          mensaje: `El valor:${campo} ya está en uso.`,
        });
      }
      res.status(500).json({ error: "Error interno", mensaje: error.message });
    }
  },
);

clienteRouter.delete("/", async (req, res) => {
  try {
    const { cliente_id } = req.body;

    const cliente = await prisma.cliente.update({
      where: { cliente_id: cliente_id },
      data: {
        cliente_id: cliente_id,
        estado: "inactivo",
      },
    });

    res.status(200).json(cliente);
  } catch (error) {
    if (error.code === "P2002") {
      // Código de Prisma para "Unique constraint failed"
      const campo = error.meta.target[0]; // Prisma te dice exactamente qué campo falló
      return res.status(400).json({
        error: "Valor duplicado",
        campo: campo,
        mensaje: `El valor:${campo} ya está en uso.`,
      });
    }
    res.status(500).json({ error: "Error interno", mensaje: error.message });
  }
});

export default clienteRouter;
