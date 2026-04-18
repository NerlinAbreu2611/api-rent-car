import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./logginComponent";
import { Dashboard } from "./dashboardComponent";
import ProtectedRoute from "./protectedRoute";

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />}></Route>

      {/*Ruta protegida*/}

      <Route
        path="/dashboard/*"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/*Ruta por defecto */}

      <Route path="*" element={<Navigate to="/dashboard" replace />}></Route>
    </Routes>
  );
}
