import React, { useState, useEffect } from "react";
import {
  Modal,
  Box,
  Typography,
  Button,
  IconButton,
  TextField,
  Snackbar,
  Alert,
} from "@mui/material";

import { crearBitacora } from "../utils/bitacora";

import CircularProgress from "@mui/material/CircularProgress";
// ...
import CloseIcon from "@mui/icons-material/Close";
// Estilo para el contenedor del modal (obligatorio para que se vea bien)
const styleModal = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "background.paper",
  border: "2px solid #000",
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
};
// Solo recibe props, no maneja su propia apertura
export function ClienteModal({
  accion,
  open,
  handleClose,
  cliente,
  setCargaModal,
  showSnack,
}) {
  const [loading, setLoading] = useState(false);

  const initialsErrors = {
    nombre: accion === "Agregar" ? " requerido*" : "",
    apellido: accion === "Agregar" ? "requerido*" : "",
    cedula: accion === "Agregar" ? "requerido*" : "",
    telefono: "",
    email: "",
  };

  const [errors, setErrors] = useState(initialsErrors);
  const initialState = {
    cliente_id: 0,
    nombre: "",
    apellido: "",
    cedula: "",
    telefono: "",
    email: "",
    direccion: "",
  };

  const [form, setForm] = useState(initialState);

  const soloLetrasRegex = /^[a-zA-ZñÑáéíóúÁÉÍÓÚ\s]*$/;

  const action = async () => {
    const metodo = accion === "Agregar" ? "POST" : "PATCH";
    const dataAEnviar = { ...form };

    Object.keys(dataAEnviar).forEach((key) => {
      if (dataAEnviar[key] === "") {
        dataAEnviar[key] = null;
      }
    });

    setLoading(true);

    try {
      const response = await fetch("http://localhost:3001/api/cliente", {
        method: metodo,
        headers: {
          "Content-type": "application/json",
        },
        body: JSON.stringify(dataAEnviar),
      });

      if (response.ok) {
        const msg =
          metodo === "POST" ? "Inserción exitosa" : "Actualización exitosa";

        handleClose(); // 1. Cierras el modal
        showSnack(msg); // 2. Avisas al padre que muestre el mensaje (se mantendrá visible)

        const data = await response.json();

        // ACTUALIZACIÓN LOCAL DEL ESTADO
        setCargaModal((prevCarga) => {
          if (metodo === "PATCH") {
            // MODIFICAR: Buscamos el cliente por ID y lo reemplazamos
            return prevCarga.map((item) =>
              item.cliente_id === data.cliente_id ? data : item,
            );
          } else {
            // AGREGAR: Simplemente lo añadimos al final (o al principio con [clienteServidor, ...prevCarga])
            return [...prevCarga, data];
          }
        });

        const usuario = JSON.parse(localStorage.getItem("usuario"));

        crearBitacora(
          usuario.usuario_id,
          metodo === "PATCH" ? "EDITAR" : "CREAR",
          `Se ${metodo === "PATCH" ? "edito" : "creo"} el cliente con nombre ${data.nombre} y cedula ${data.cedula}`,
          metodo,
          "CLIENTE",
        );
      } else {
        const errorData = await response.json();
        showSnack(`Error, campo: "${errorData.campo}" duplicado`, "error");
      }
    } catch (error) {
      console.error("Error de red:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setErrors(initialsErrors);
  }, [handleClose]);

  useEffect(() => {
    if (cliente && accion !== "Agregar") {
      setForm({
        cliente_id: cliente.cliente_id || 0,
        nombre: cliente.nombre || "",
        apellido: cliente.apellido || "",
        cedula: cliente.cedula || "",
        telefono: cliente.telefono || "",
        email: cliente.email || "",
        direccion: cliente.direccion || "", // <-- Agregamos dirección
      });

      // Opcional: Limpiar errores si estás editando
      setErrors({
        nombre: "",
        apellido: "",
        cedula: "",
        telefono: "",
        email: "",
      });
    } else {
      // Si es "Agregar", reseteamos al estado inicial
      setForm(initialState);
    }
  }, [cliente, accion, open]); // Se ejecuta al abrir o cambiar de cliente

  // --- PASO 1: Calcular el disabled aquí (esto es instantáneo) ---
  const hayErrores = Object.values(errors).some((e) => e !== "");

  // También validamos que los campos obligatorios no estén vacíos por si acaso
  const camposVacios = !form.nombre || !form.apellido || !form.cedula;
  const isButtonDisabled = hayErrores || camposVacios;

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Bloqueo de letras/números (Lógica que ya tenías)
    if (name === "nombre" || name === "apellido") {
      if (!soloLetrasRegex.test(value)) return;
    }

    // Actualizamos el Form primero
    const newValue =
      name === "cedula" || name === "telefono"
        ? value.replace(/[^0-9]/g, "")
        : value;

    setForm((prev) => ({ ...prev, [name]: newValue }));

    // --- PASO 2: Validar errores ---
    let errorMensaje = "";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (name === "nombre") {
      errorMensaje = newValue.length <= 2 ? "Mínimo 3 caracteres*" : "";
    } else if (name === "apellido") {
      errorMensaje = newValue.length <= 2 ? "Mínimo 3 caracteres*" : "";
    } else if (name === "cedula") {
      errorMensaje =
        newValue.length !== 11 ? "Cédula debe tener 11 dígitos*" : "";
    } else if (name === "telefono") {
      errorMensaje =
        newValue.length !== 10 && newValue.length !== 0
          ? "Teléfono inválido*"
          : "";
    } else if (name === "email") {
      errorMensaje =
        !emailRegex.test(newValue) && newValue.length > 0
          ? "Formato invalido"
          : "";
    }

    // Actualizamos el estado de errores
    setErrors((prev) => ({ ...prev, [name]: errorMensaje }));
  };

  return (
    <>
      <Modal open={open} onClose={handleClose}>
        <Box sx={styleModal}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography variant="h5">{accion} cliente</Typography>
            <IconButton onClick={handleClose}>
              <CloseIcon />
            </IconButton>
          </Box>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <TextField
              name="nombre"
              label="Nombre"
              variant="filled"
              fullWidth
              value={form.nombre}
              onChange={handleChange}
              inputProps={{ maxLength: 20 }}
              error={!!errors.nombre}
              helperText={errors.nombre}
            />
            <TextField
              name="apellido"
              label="Apellido"
              variant="filled"
              fullWidth
              value={form.apellido}
              onChange={handleChange}
              inputProps={{ maxLength: 20 }}
              error={!!errors.apellido}
              helperText={errors.apellido}
            />
            <TextField
              name="cedula"
              label="Cédula"
              variant="filled"
              fullWidth
              value={form.cedula}
              onChange={handleChange}
              inputProps={{ maxLength: 11 }}
              error={!!errors.cedula}
              helperText={errors.cedula}
            />
            <TextField
              name="telefono"
              label="Teléfono"
              variant="filled"
              fullWidth
              value={form.telefono}
              onChange={handleChange}
              inputProps={{ maxLength: 10 }}
              error={!!errors.telefono}
              helperText={errors.telefono}
            />
            <TextField
              name="email"
              label="Email"
              variant="filled"
              fullWidth
              value={form.email}
              onChange={handleChange}
              inputProps={{ maxLength: 40 }}
              error={!!errors.email}
              helperText={errors.email}
            />
            <TextField
              name="direccion"
              label="Dirección"
              variant="filled"
              fullWidth
              multiline
              rows={2}
              value={form.direccion}
              onChange={handleChange}
              inputProps={{ maxLength: 100 }}
            />
          </Box>

          <Button
            onClick={action}
            sx={{ mt: 2 }}
            variant="contained"
            fullWidth
            disabled={loading || isButtonDisabled}
            // Si está cargando muestra el giro, si no, no muestra ícono (o pones uno de guardado)
            startIcon={
              loading ? <CircularProgress size={20} color="inherit" /> : null
            }
          >
            {loading ? "Enviando..." : accion}
          </Button>

          <Button
            onClick={() => {
              handleClose();
            }}
            sx={{ mt: 1 }}
            variant="contained"
            fullWidth
            color="error"
          >
            Cerrar
          </Button>
        </Box>
      </Modal>
    </>
  );
}
