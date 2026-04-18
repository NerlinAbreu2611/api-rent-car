import React, { useState, useEffect } from "react";
import {
  Box,
  InputAdornment,
  TextField,
  Select,
  InputLabel,
  MenuItem,
  FormControl,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  TablePagination,
  TableSortLabel,
  Typography,
  Snackbar,
  Alert,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CircularProgress from "@mui/material/CircularProgress";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { crearBitacora } from "../utils/bitacora";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import AddIcon from "@mui/icons-material/Add";
import { UsuarioModal } from "../modal/usuarioModal";

export function Usuario() {
  const [usuario, setUsuario] = useState([]);
  const [columna, setColumna] = useState("nombre");
  const [carga, setCarga] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [usuarioModal, setUsuarioModal] = useState(null);

  const [loading, setLoading] = useState(null);

  // ESTADOS PARA PAGINACIÓN
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // ESTADOS PARA ORDENAMIENTO
  const [orderBy, setOrderBy] = useState("nombre");
  const [order, setOrder] = useState("asc");

  const [alignment, setAlignment] = React.useState("activo");

  const [estadoFiltro, setEstadoFiltro] = useState("activo");
  //MODAL

  // En el componente PADRE
  const [snack, setSnack] = useState({
    open: false,
    mensaje: "",
    severity: "success",
  });

  const showSnack = (mensaje, severity = "success") => {
    setSnack({ open: true, mensaje, severity });
  };

  const handleCloseSnack = () => setSnack({ ...snack, open: false });

  const header = [
    { id: "nombre", label: "Nombre" },
    { id: "apellido", label: "Apellido" },
    { id: "username", label: "Username" },
    { id: "password", label: "Password" },
    { id: "rol", label: "Rol" },
    { id: "estado", label: "Estado" },
    { id: "acciones", label: "Acciones", sortable: false },
  ];

  const cargarusuario = async () => {
    try {
      const res = await fetch("http://localhost:3001/api/usuario");
      if (!res.ok) throw new Error("Error en el servidor");
      const datos = await res.json();
      setUsuario(datos);
    } catch (error) {
      console.error(error.message);
    }
  };

  useEffect(() => {
    cargarusuario();
  }, []);

  // LÓGICA DE FILTRADO Y ORDENAMIENTO
  useEffect(() => {
    let datosFiltrados = usuario.filter(
      (v) =>
        String(v[columna] || "")
          .toLowerCase()
          .startsWith(busqueda.toLowerCase()) && v.estado === estadoFiltro,
    );
    // Aplicar Ordenamiento
    datosFiltrados.sort((a, b) => {
      const valA = String(a[orderBy] || "").toLowerCase();
      const valB = String(b[orderBy] || "").toLowerCase();
      if (order === "asc") return valA < valB ? -1 : 1;
      return valA > valB ? -1 : 1;
    });

    setCarga(datosFiltrados);
    setPage(0); // Reiniciar a la página 1 al filtrar
  }, [busqueda, columna, usuario, order, orderBy, estadoFiltro]);

  // MANEJADORES DE EVENTOS
  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const [modalOpen, setModalOpen] = useState(false);
  const [tipoAccion, setTipoAccion] = useState("Agregar"); // Estado para el título

  // Función para abrir como Agregar
  const abrirAgregar = () => {
    setTipoAccion("Agregar");
    setUsuarioModal(null);
    setModalOpen(true);
  };

  //Función para deshabilitar
  const deshabilitar = (usuario) => {
    fetch(`http://localhost:3001/api/usuario/${usuario.usuario_id}`, {
      method: "DELETE",
      headers: {
        "Content-type": "application/json",
      },
      body: JSON.stringify(usuario),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Error en la petición");
        return res.json();
      })
      .then((data) => {
        setCarga((prev) => {
          return prev.filter((u) => u.usuario_id !== data.usuario.usuario_id);
        });

        const usuario = JSON.parse(localStorage.getItem("usuario"));

        crearBitacora(
          usuario.usuario_id,
          "DESHABILITAR",
          `Se deshabilito el usuario ${data.usuario.usuario_id} con nombre ${data.usuario.nombre}`,
          "DELETE",
          "USUARIO",
        );

        setUsuario((preu) =>
          preu.map((u) =>
            u.usuario_id === data.usuario.usuario_id
              ? { ...u, estado: data.usuario.estado }
              : u,
          ),
        );
      })
      .then(() =>
        setSnack({ ...snack, open: true, mensaje: "Modificación exitosa" }),
      )
      .catch((error) =>
        setSnack(...snack, {
          open: true,
          mensaje: "Ocurrió un error",
          severity: "error",
        }),
      );
  };

  //Funcion para habilitar

  const habilitar = (usuario) => {
    setLoading(usuario.usuario_id);
    fetch(`http://localhost:3001/api/usuario/${usuario.usuario_id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        estado: "activo",
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Error en la petición");
        return res.json();
      })
      .then((data) => {
        setCarga((prev) => {
          return prev.filter((v) => v.usuario_id !== data.usuario_id);
        });

        const usuario = JSON.parse(localStorage.getItem("usuario"));

        crearBitacora(
          usuario.usuario_id,
          "HABILITAR",
          `Se habilito el usuario ${data.usuario_id} con nombre ${data.nombre}`,
          "PATCH",
          "USUARIO",
        );

        setUsuario((prev) =>
          prev.map((v) =>
            v.usuario_id === data.usuario_id
              ? { ...v, estado: data.estado }
              : v,
          ),
        );
      })
      .then(() => {
        setLoading(null);
        setSnack({ ...snack, open: true, mensaje: "Modificación exitosa" });
      })
      .catch((error) =>
        setSnack(...snack, {
          open: true,
          mensaje: "Ocurrió un error",
          severity: "error",
        }),
      );
  };

  const handleChange = (event, newAlignment) => {
    setAlignment(newAlignment);
    if (newAlignment !== null) {
      setEstadoFiltro(newAlignment);
    }
  };

  // Función para abrir como Editar
  const abrirEditar = (usuario) => {
    setTipoAccion("Editar");
    // Aquí podrías cargar los datos del usuario en otro estado si quisieras
    setUsuarioModal(usuario);
    setModalOpen(true);
  };
  return (
    <>
      <Box sx={{ p: 3 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center", // Alinea verticalmente el texto con los inputs
            gap: 2,
            mb: 3,
          }}
        >
          <Typography
            variant="h4"
            sx={{ flexGrow: 1 }} // <--- ESTA ES LA CLAVE: ocupa todo el espacio sobrante a la izquierda
          >
            Mantenimiento de Usuarios
          </Typography>

          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Filtrar por columna</InputLabel>
            <Select
              value={columna}
              label="Filtrar por columna"
              onChange={(e) => setColumna(e.target.value)}
            >
              {header
                .filter((h) => h.id !== "acciones")
                .map(
                  (h) =>
                    h.id !== "estado" && (
                      <MenuItem key={h.id} value={h.id}>
                        {h.id}
                      </MenuItem>
                    ),
                )}
            </Select>
          </FormControl>

          <TextField
            placeholder={`Buscar...`}
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <Tooltip title="Añadir">
            <IconButton
              onClick={abrirAgregar}
              sx={{
                bgcolor: "primary.main",
                color: "white",
                "&:hover": {
                  bgcolor: "primary.dark", // Azul más oscuro
                  opacity: 0.9, // Opcional: para que no brille tanto
                },
              }}
            >
              <AddIcon />
            </IconButton>
          </Tooltip>
        </Box>

        <TableContainer component={Paper} sx={{ boxShadow: 4 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                {header.map((headCell) => (
                  <TableCell
                    key={headCell.id}
                    align={
                      headCell.id === "estado" || headCell.id === "acciones"
                        ? "center"
                        : "left"
                    }
                    sx={{
                      backgroundColor: "#1976d2",
                      color: "white",
                      fontWeight: "bold",
                    }}
                  >
                    {headCell.sortable !== false ? (
                      <TableSortLabel
                        active={orderBy === headCell.id}
                        direction={orderBy === headCell.id ? order : "asc"}
                        onClick={() => handleRequestSort(headCell.id)}
                        sx={{
                          color: "white !important",
                          "& .MuiTableSortLabel-icon": {
                            color: "white !important",
                          },
                        }}
                      >
                        {headCell.label}
                      </TableSortLabel>
                    ) : (
                      headCell.label
                    )}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {carga
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((usuario) => (
                  <TableRow key={usuario.usuario_id} hover>
                    <TableCell>{usuario.nombre}</TableCell>
                    <TableCell>{usuario.apellido}</TableCell>
                    <TableCell>{usuario.username}</TableCell>
                    <TableCell>{usuario.password}</TableCell>
                    <TableCell>{usuario.rol}</TableCell>
                    <TableCell align="center">
                      <Chip
                        icon={
                          <FiberManualRecordIcon
                            style={{ fontSize: "12px", color: "inherit" }}
                          />
                        }
                        label={usuario.estado}
                        variant="outlined"
                        color={
                          usuario.estado === "activo" ? "success" : "error"
                        }
                        sx={{ fontWeight: "bold", textTransform: "capitalize" }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      {estadoFiltro === "activo" ? (
                        <>
                          <IconButton
                            color="primary"
                            onClick={() => abrirEditar(usuario)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            color="error"
                            onClick={() => deshabilitar(usuario)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </>
                      ) : (
                        <IconButton
                          onClick={() => habilitar(usuario)}
                          color="success"
                        >
                          {loading === usuario.usuario_id ? (
                            <CircularProgress size={20} />
                          ) : (
                            <RestartAltIcon />
                          )}
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={carga.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Filas por página:"
            showFirstButton={true}
            showLastButton={true}
          />
        </TableContainer>
        {/* El Modal recibe el estado dinámico */}
        <UsuarioModal
          accion={tipoAccion}
          open={modalOpen}
          usuario={usuarioModal}
          setCargaModal={setUsuario}
          handleClose={() => setModalOpen(false)}
          showSnack={showSnack} // <--- Nueva prop
        />

        <ToggleButtonGroup
          color="primary"
          value={alignment}
          exclusive
          onChange={handleChange}
          aria-label="Platform"
          sx={{
            mt: 2, // 👈 margin-top pequeño
            height: 32, // 👈 altura más pequeña
            "& .MuiToggleButton-root": {
              padding: "4px 10px", // 👈 más compacto
              fontSize: "0.75rem", // 👈 texto más pequeño
            },
          }}
        >
          <ToggleButton value="activo">Activos</ToggleButton>
          <ToggleButton value="inactivo">Inactivos</ToggleButton>
        </ToggleButtonGroup>
      </Box>
      {/* El Snackbar se queda aquí, en el PADRE */}
      <Snackbar
        key={snack.mensaje} // <--- ESTO ES VITAL
        open={snack.open}
        autoHideDuration={4000}
        onClose={handleCloseSnack}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          severity={snack.severity}
          variant="filled"
          onClose={handleCloseSnack}
        >
          {snack.mensaje}
        </Alert>
      </Snackbar>
    </>
  );
}
