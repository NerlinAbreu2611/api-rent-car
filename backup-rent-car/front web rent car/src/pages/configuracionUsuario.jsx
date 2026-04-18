import React, { useState, useEffect } from "react";
import {
  Grid,
  Typography,
  Card,
  CardContent,
  Avatar,
  Box,
  Divider,
  Chip,
  TextField,
} from "@mui/material";

import HistoryIcon from "@mui/icons-material/History";
import { getBitacora } from "../utils/bitacora";
export function ConfiguracionUsuarion() {
  const [user, setUser] = useState({
    usuario_id: 4,
    nombre: "John",
    apellido: "Doe",
    username: "john.doe",
    password: "********",
    rol: "empleado",
    estado: "activo",
  });

  const [filtroTexto, setFiltroTexto] = useState("");

  useEffect(() => {
    const usuario = JSON.parse(localStorage.getItem("usuario"));
    if (usuario) setUser(usuario);
  }, []);

  return (
    <Grid container spacing={2} sx={{ p: 2, alignItems: "flex-start" }}>
      {/* IZQUIERDA */}
      <Grid size={4}>
        <Box sx={{ position: "sticky", top: 20 }}>
          <Card sx={{ p: 2, borderRadius: 3, boxShadow: 4 }}>
            <CardContent>
              <Typography
                variant="h5"
                textAlign="center"
                gutterBottom
                sx={{ color: "primary.main", fontWeight: "bold" }}
              >
                Perfil de Usuario
              </Typography>

              <Box display="flex" justifyContent="center" my={2}>
                <Avatar
                  sx={{
                    width: 90,
                    height: 90,
                    bgcolor: "primary.main",
                    fontSize: 32,
                    fontWeight: "bold",
                    boxShadow: 3,
                  }}
                >
                  {user.nombre?.[0]}
                  {user.apellido?.[0]}
                </Avatar>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                gap={2}
              >
                <Box textAlign="center">
                  <Typography fontWeight="bold" color="text.secondary">
                    Nombre
                  </Typography>
                  <Typography variant="h6">{user.nombre}</Typography>
                </Box>

                <Box textAlign="center">
                  <Typography fontWeight="bold" color="text.secondary">
                    Apellido
                  </Typography>
                  <Typography variant="h6">{user.apellido}</Typography>
                </Box>

                <Box textAlign="center">
                  <Typography fontWeight="bold" color="text.secondary">
                    Username
                  </Typography>
                  <Typography variant="h6">{user.username}</Typography>
                </Box>

                <Box textAlign="center">
                  <Typography fontWeight="bold" color="text.secondary">
                    Rol
                  </Typography>
                  <Chip label={user.rol} color="primary" sx={{ mt: 1 }} />
                </Box>

                <Box textAlign="center">
                  <Typography fontWeight="bold" color="text.secondary">
                    Estado
                  </Typography>
                  <Chip
                    label={user.estado}
                    color={user.estado === "activo" ? "success" : "error"}
                    sx={{ mt: 1 }}
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Grid>

      {/* DERECHA */}
      <Grid size={8}></Grid>
    </Grid>
  );
}
