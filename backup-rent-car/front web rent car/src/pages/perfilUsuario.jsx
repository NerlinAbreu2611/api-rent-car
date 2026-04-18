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
export function PerfilUsuario() {
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

  const [bitacora, setBitacora] = useState([]);

  // 🔥 FILTRO
  const bitacoraFiltrada = bitacora.filter(
    (item) =>
      item.accion.toLowerCase().includes(filtroTexto.toLowerCase()) ||
      item.descripcion.toLowerCase().includes(filtroTexto.toLowerCase()),
  );

  useEffect(() => {
    const usuario = JSON.parse(localStorage.getItem("usuario"));
    if (usuario) setUser(usuario);

    const carga = async () => {
      const data = await getBitacora(1);
      setBitacora(
        data.map(({ accion, descripcion, createdAt, bitacora_id }) => ({
          bitacora_id,
          accion,
          descripcion,
          fecha: new Date(createdAt).toLocaleString("es-DO", {
            dateStyle: "short",
            timeStyle: "short",
          }),
        })),
      );
    };

    carga();
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
      <Grid size={8}>
        <Card sx={{ borderRadius: 3, boxShadow: 4 }}>
          <CardContent>
            <Typography variant="h5" gutterBottom color="primary">
              Bitácora de Actividad
            </Typography>

            {/* 🔥 FILTRO */}
            <TextField
              label="Buscar en bitácora"
              variant="outlined"
              size="small"
              fullWidth
              value={filtroTexto}
              onChange={(e) => setFiltroTexto(e.target.value)}
              sx={{ mb: 2 }}
            />

            {/* SCROLL */}
            <Box
              sx={{
                maxHeight: "63vh",
                overflowY: "auto",
                pr: 1,
              }}
            >
              {bitacoraFiltrada.length === 0 && (
                <Typography textAlign="center" color="text.secondary">
                  No hay resultados
                </Typography>
              )}

              {bitacoraFiltrada.map((item, index) => (
                <Box
                  key={item.bitacora_id}
                  sx={{
                    mb: 2,
                    p: 1,
                    borderRadius: 2,
                    transition: "0.2s",
                    "&:hover": {
                      backgroundColor: "#f5f5f5",
                    },
                  }}
                >
                  <Box display="flex" gap={2} alignItems="center">
                    <Avatar sx={{ bgcolor: "primary.main" }}>
                      <HistoryIcon />
                    </Avatar>

                    <Box>
                      <Typography fontWeight="bold">{item.accion}</Typography>

                      <Typography variant="body2" color="text.secondary">
                        {item.descripcion}
                      </Typography>

                      <Typography
                        variant="caption"
                        sx={{ display: "block", mt: 0.5 }}
                        color="text.secondary"
                      >
                        {item.fecha}
                      </Typography>
                    </Box>
                  </Box>

                  {index !== bitacoraFiltrada.length - 1 && (
                    <Divider sx={{ mt: 2 }} />
                  )}
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}
