export async function crearBitacora(
  usuario_id,
  accion,
  descripcion,
  method,
  entidad,
) {
  try {
    const response = await fetch("http://localhost:3001/api/bitacora", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        usuario_id,
        accion: `${method} ${entidad}`, // ej: POST USUARIO
        descripcion,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Error en bitácora:", error);
    }
  } catch (err) {
    console.error("Error de red al crear bitácora:", err);
  }
}

export async function getBitacora(id) {
  try {
    const response = await fetch(`http://localhost:3001/api/bitacora/${id}`);

    if (!response.ok) {
      throw new Error("Error al obtener la bitácora");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error en cargarBitacoraUsuario:", error);
    return null;
  }
}
