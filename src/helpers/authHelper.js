// Decodifica el payload del JWT almacenado en localStorage (sin verificar firma)
export const getUsuarioActual = () => {
  try {
    const token = localStorage.getItem("adminToken");
    if (!token) return null;
    const payload = JSON.parse(atob(token.split(".")[1]));
    // Verificar que el token no haya expirado
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminNombre");
      return null;
    }
    return payload; // { id, email, nombre, rol }
  } catch {
    return null;
  }
};

export const esSuperadmin = () => getUsuarioActual()?.rol === "superadmin";
