import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import { Cliente } from "../pages/cliente";
import { Tablero } from "../pages/tablero";

import { Vehiculo } from "../pages/vehiculo";
import { Usuario } from "../pages/usuario";
import { PerfilUsuario } from "../pages/perfilUsuario";

export function PageRoutes() {
  return (
    <Routes>
      <Route path="cliente" element={<Cliente />} />
      <Route path="tablero" element={<Tablero />} />
      <Route path="vehiculo" element={<Vehiculo />} />
      <Route path="perfil" element={<PerfilUsuario />}></Route>
      <Route path="usuario" element={<Usuario />}></Route>
      <Route path="*" element={<Navigate to="tablero" replace />} />
    </Routes>
  );
}
