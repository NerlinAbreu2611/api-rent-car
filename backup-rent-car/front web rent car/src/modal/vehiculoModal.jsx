import React, { useState, useEffect, act } from "react";
import {
  Modal,
  Box,
  Typography,
  Button,
  IconButton,
  TextField,
  Grid,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
} from "@mui/material";

import CircularProgress from "@mui/material/CircularProgress";
import CloseIcon from "@mui/icons-material/Close";

import { crearBitacora } from "../utils/bitacora";

const styleModal = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 700,
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
};

export function VehiculoModal({
  accion,
  open,
  handleClose,
  vehiculo,
  setCargaModal,
  showSnack,
}) {
  useEffect(() => {
    if (accion === "Editar" && vehiculo) {
      setForm({
        vehiculo_id: vehiculo.vehiculo_id || 0,
        marca: vehiculo.marca || "",
        modelo: vehiculo.modelo || "",
        anio: vehiculo.anio?.toString() || "",
        placa: vehiculo.placa || "",
        disponible: vehiculo.disponible ?? true,
        estado: vehiculo.estado || "activo",

        // 🔥 IMPORTANTE: mapear precios correctamente
        precios: [
          {
            tipo_dia: "normal",
            precio:
              vehiculo.precios?.find((p) => p.tipo_dia === "normal")?.precio ||
              "",
          },
          {
            tipo_dia: "fin_de_semana",
            precio:
              vehiculo.precios?.find((p) => p.tipo_dia === "fin_de_semana")
                ?.precio || "",
          },
          {
            tipo_dia: "feriado",
            precio:
              vehiculo.precios?.find((p) => p.tipo_dia === "feriado")?.precio ||
              "",
          },
        ],
      });

      setErrors({
        marca: "",
        modelo: "",
        anio: "",
        placa: "",
        precios: ["", "", ""],
      });
    } else if (accion === "Agregar") {
      setForm(initialState);
      setErrors(initialsErrors);
    }
  }, [vehiculo, accion, open]);

  const [loading, setLoading] = useState(false);

  const initialState = {
    vehiculo_id: 0,
    marca: "",
    modelo: "",
    anio: "",
    placa: "",
    disponible: true,
    estado: "activo",
    precios: [
      { tipo_dia: "normal", precio: "" },
      { tipo_dia: "fin_de_semana", precio: "" },
      { tipo_dia: "feriado", precio: "" },
    ],
  };

  const initialsErrors = {
    marca: "requerido*",
    modelo: "requerido*",
    anio: "requerido*",
    placa: "requerido*",
    precios: ["requerido*", "requerido*", "requerido*"],
  };

  const [form, setForm] = useState(initialState);
  const [errors, setErrors] = useState(initialsErrors);

  const placaRegex = /^[A-Za-z0-9]{11,}$/;
  const marcaRegex = /^[a-zA-ZñÑáéíóúÁÉÍÓÚ\s]*$/;
  const modeloRegex = /^[a-zA-Z0-9\s]*$/;

  const handleCloseModal = () => {
    setForm(initialState);
    setErrors(initialsErrors);
    handleClose();
  };
  // ---------------- INPUTS ----------------
  const handleChange = (e) => {
    const { name, value } = e.target;

    // VALIDACIÓN EN TIEMPO REAL (bloqueo)
    if (name === "marca" && !marcaRegex.test(value)) return;
    if (name === "modelo" && !modeloRegex.test(value)) return;

    const newValue = name === "anio" ? value.replace(/[^0-9]/g, "") : value;

    setForm((prev) => ({ ...prev, [name]: newValue }));

    let error = "";

    if (!newValue) {
      error = "Requerido*";
    } else if (name === "marca") {
      error = newValue.length < 2 ? "Mínimo 2 caracteres*" : "";
    } else if (name === "modelo") {
      error = newValue.length < 2 ? "Mínimo 2 caracteres*" : "";
    } else if (name === "anio") {
      if (!/^\d{4}$/.test(newValue)) {
        error = "Año inválido (4 dígitos)*";
      }
    } else if (name === "placa") {
      if (!placaRegex.test(newValue)) {
        error = "Mínimo 11 caracteres (letras y números)*";
      }
    }

    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  // ---------------- PRECIOS ----------------
  const handlePrecioChange = (index, value) => {
    if (!/^\d*\.?\d*$/.test(value)) return;

    const newPrecios = [...form.precios];
    newPrecios[index].precio = value;

    setForm((prev) => ({ ...prev, precios: newPrecios }));

    let error = "";

    if (!value) error = "Requerido*";
    else if (parseFloat(value) <= 0) error = "Mayor a 0*";

    const newErrors = [...errors.precios];
    newErrors[index] = error;

    setErrors((prev) => ({ ...prev, precios: newErrors }));
  };

  const cambiarDisponibilidad = (event) => {
    setForm((prev) => ({
      ...prev,
      disponible: event.target.value === "disponible",
    }));
  };

  const action = async () => {
    const isAgregar = accion === "Agregar";
    const metodo = isAgregar ? "POST" : "PATCH";

    // 🔥 URL dinámica
    const url = isAgregar
      ? "http://localhost:3001/api/vehiculo"
      : `http://localhost:3001/api/vehiculo/${form.vehiculo_id}`;

    // 🔥 TRANSFORMAR DATA (CLAVE)
    const dataAEnviar = {
      ...form,
      anio: parseInt(form.anio),

      precios: form.precios.map((p) => ({
        tipo_dia: p.tipo_dia,
        precio: parseFloat(p.precio),
      })),
    };

    setLoading(true);

    try {
      const response = await fetch(url, {
        method: metodo,
        headers: {
          "Content-type": "application/json",
        },
        body: JSON.stringify(dataAEnviar),
      });

      if (response.ok) {
        const data = await response.json();

        const msg = isAgregar
          ? "Vehículo agregado correctamente"
          : "Vehículo actualizado correctamente";

        handleCloseModal(); // 🔥 usa tu función con reset
        showSnack(msg);

        // 🔥 ACTUALIZACIÓN LOCAL
        setCargaModal((prev) => {
          if (!isAgregar) {
            return prev.map((item) =>
              item.vehiculo_id === data.vehiculo_id ? data : item,
            );
          } else {
            return [...prev, data];
          }
        });

        const usuario = JSON.parse(localStorage.getItem("usuario"));

        crearBitacora(
          usuario.usuario_id,
          metodo === "PATCH" ? "EDITAR" : "CREAR",
          `Se ${metodo === "PATCH" ? "edito" : "creo"} el veihiculo con marca ${data.marca} y placa ${data.placa}`,
          metodo,
          "VEHICULO",
        );
      } else {
        const errorData = await response.json();

        // 🔥 Manejo de errores del backend (express-validator / prisma)
        if (errorData.errors) {
          showSnack(errorData.errors[0].msg, "error");
        } else if (errorData.campo) {
          showSnack(`Campo duplicado: ${errorData.campo}`, "error");
        } else {
          showSnack("Error al procesar la solicitud", "error");
        }
      }
    } catch (error) {
      console.error("Error de red:", error);
      showSnack("Error de conexión con el servidor", "error");
    } finally {
      setLoading(false);
    }
  };

  const hayErrores =
    Object.values(errors).some((e) => typeof e === "string" && e !== "") ||
    errors.precios.some((e) => e !== "");

  const camposVacios =
    !form.marca ||
    !form.modelo ||
    !form.anio ||
    !form.placa ||
    form.precios.some((p) => !p.precio);

  const isButtonDisabled = hayErrores || camposVacios;

  return (
    <Modal open={open} onClose={handleCloseModal}>
      <Box sx={styleModal}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
          <Typography variant="h5">{accion} Vehículo</Typography>
          <IconButton onClick={handleCloseModal}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Grid container spacing={2}>
          <Grid size={6}>
            <TextField
              name="marca"
              label="Marca"
              fullWidth
              variant="filled"
              value={form.marca}
              onChange={handleChange}
              error={!!errors.marca}
              inputProps={{ maxLength: 20 }}
              helperText={errors.marca}
            />

            <TextField
              name="modelo"
              label="Modelo"
              fullWidth
              variant="filled"
              value={form.modelo}
              onChange={handleChange}
              error={!!errors.modelo}
              helperText={errors.modelo}
              inputProps={{ maxLength: 20 }}
              sx={{ mt: 2 }}
            />

            <TextField
              name="anio"
              label="Año"
              fullWidth
              variant="filled"
              value={form.anio}
              onChange={handleChange}
              error={!!errors.anio}
              helperText={errors.anio}
              inputProps={{ maxLength: 4 }}
              sx={{ mt: 2 }}
            />

            <TextField
              name="placa"
              label="Placa"
              fullWidth
              variant="filled"
              value={form.placa}
              onChange={handleChange}
              error={!!errors.placa}
              helperText={errors.placa}
              inputProps={{ maxLength: 11 }}
              sx={{ mt: 2 }}
            />
          </Grid>

          <Grid size={6}>
            <TextField
              label="Precio normal"
              fullWidth
              variant="filled"
              value={form.precios[0].precio}
              onChange={(e) => handlePrecioChange(0, e.target.value)}
              error={!!errors.precios[0]}
              helperText={errors.precios[0]}
            />

            <TextField
              label="Precio fin de semana"
              fullWidth
              variant="filled"
              value={form.precios[1].precio}
              onChange={(e) => handlePrecioChange(1, e.target.value)}
              error={!!errors.precios[1]}
              helperText={errors.precios[1]}
              sx={{ mt: 2 }}
            />

            <TextField
              label="Precio feriado"
              fullWidth
              variant="filled"
              value={form.precios[2].precio}
              onChange={(e) => handlePrecioChange(2, e.target.value)}
              error={!!errors.precios[2]}
              helperText={errors.precios[2]}
              sx={{ mt: 2 }}
            />

            {accion === "Editar" && (
              <FormControl sx={{ mt: 2 }}>
                <FormLabel>Disponibilidad</FormLabel>
                <RadioGroup
                  row
                  value={form.disponible ? "disponible" : "no_disponible"}
                  onChange={cambiarDisponibilidad}
                >
                  <FormControlLabel
                    value="disponible"
                    control={<Radio />}
                    label="Disponible"
                  />
                  <FormControlLabel
                    value="no_disponible"
                    control={<Radio />}
                    label="No disponible"
                  />
                </RadioGroup>
              </FormControl>
            )}
          </Grid>
        </Grid>

        <Button
          onClick={action}
          sx={{ mt: 3 }}
          variant="contained"
          fullWidth
          disabled={loading || isButtonDisabled}
          startIcon={
            loading ? <CircularProgress size={20} color="inherit" /> : null
          }
        >
          {loading ? "Enviando..." : accion}
        </Button>

        <Button
          onClick={handleCloseModal}
          sx={{ mt: 1 }}
          variant="contained"
          fullWidth
          color="error"
        >
          Cerrar
        </Button>
      </Box>
    </Modal>
  );
}
