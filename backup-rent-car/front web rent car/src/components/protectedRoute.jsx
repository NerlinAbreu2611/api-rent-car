import React from "react";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const usuario = JSON.parse(localStorage.getItem("usuario"));

  // Si no hay usuario, redirige a /login
  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  // Si hay usuario, renderiza el componente hijo
  return children;
}
