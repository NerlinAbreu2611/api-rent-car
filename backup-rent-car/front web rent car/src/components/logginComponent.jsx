import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  CardMedia,
  Snackbar,
  Alert,
} from "@mui/material";

import { Navigate, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Logo from "../assets/userlogo.png";
import { crearBitacora } from "../utils/bitacora";

export function Login() {
  const [usuario, setUsuario] = useState("");
  const [clave, setClave] = useState("");
  const [errors, setErrors] = useState({
    usuario: "Campo requerido*",
    clave: "Campo requerido*",
  });
  const [loading, setLoading] = useState(false);

  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [severity, setSeverity] = useState("success"); // success, error, warning, info
  const navigate = useNavigate();
  const isDisabled = Object.values(errors).some((e) => e.length > 0) || loading;

  // Abrir el SnackBar funcion
  const handleOpen = (msg, sev = "success") => {
    setMessage(msg);
    setSeverity(sev);
    setOpen(true);
  };

  const handleClose = (event, reason) => {
    if (reason === "clickaway") return; // opcional: evita cerrar al hacer click fuera
    setOpen(false);
  };

  // Manejador de errores del usuario
  const handleUsernameChange = (e) => {
    const value = e.target.value;
    setUsuario(value);

    if (value.length <= 2) {
      setErrors((prev) => ({
        ...prev,
        usuario: "Usuario requerido*",
      }));
    } else {
      setErrors((prev) => ({ ...prev, usuario: "" }));
    }
  };

  //Manejador de errores de la clave
  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setClave(value);

    if (value.length <= 2 || value === "") {
      setErrors((prev) => ({
        ...prev,
        clave: "Clave requerida*",
      }));
    } else {
      setErrors((prev) => ({ ...prev, clave: "" }));
    }
  };

  const obtenerUsuarios = async () => {
    setLoading(true);

    try {
      const res = await fetch("http://localhost:3001/api/usuario");
      const data = await res.json();

      const autenticado = Object.values(data).find(
        (e) =>
          e.username === usuario &&
          e.password === clave &&
          e.estado === "activo",
      );

      if (autenticado !== undefined) {
        localStorage.setItem("usuario", JSON.stringify(autenticado));

        handleOpen("Autenticación exitosa");

        crearBitacora(
          autenticado.usuario_id,
          "INICIAR SESION",
          `El usuario ${autenticado.username} inicio sesión.`,
          `GET`,
          "USUARIO",
        );

        navigate("/dashboard");
      } else {
        localStorage.setItem("usuario", null);
        handleOpen("Usuario o contraseña incorrectos", "error");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center", // horizontal
        alignItems: "center", // vertical
        minHeight: "100vh", // altura completa
        backgroundColor: "#f4f6f8",
      }}
    >
      <Card sx={{ width: 350, p: 2 }}>
        <CardContent>
          <Typography variant="h4" align="center" mb={2}>
            Iniciar Sesión
          </Typography>

          <CardMedia
            component="img"
            height="150" // alto de la imagen
            image={Logo} // la importación de tu imagen
            alt="Logo"
            sx={{ objectFit: "contain", mb: 2 }} // mantiene proporción y margen inferior
          />

          <TextField
            label="Usuario"
            fullWidth
            margin="normal"
            value={usuario}
            onChange={handleUsernameChange}
            error={!!errors.usuario}
            helperText={errors.usuario}
          />
          <TextField
            label="Contraseña"
            type="password"
            value={clave}
            fullWidth
            margin="normal"
            onChange={handlePasswordChange}
            error={!!errors.clave}
            helperText={errors.clave}
          />

          <Button
            variant="contained"
            fullWidth
            sx={{ mt: 2 }}
            onClick={obtenerUsuarios}
            disabled={isDisabled}
          >
            Ingresar
          </Button>

          <Snackbar
            open={open}
            autoHideDuration={3000} // se cierra automáticamente después de 3 segundos
            onClose={handleClose}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          >
            <Alert
              onClose={handleClose}
              severity={severity}
              sx={{ width: "100%" }}
              variant="filled"
            >
              {message}
            </Alert>
          </Snackbar>
        </CardContent>
      </Card>
    </Box>
  );
}

export default Login;
