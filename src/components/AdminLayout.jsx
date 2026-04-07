import { NavLink, Outlet, useLocation, useNavigate, Navigate } from "react-router-dom";
import { useState } from "react";
import { getUsuarioActual, esSuperadmin } from "../helpers/authHelper";
import ModalCierreCaja from "./ModalCierreCaja";
import clientAxios from "../helpers/clientAxios";
import "../css/hotel-system.css";

const breadcrumbMap = {
  "/admin/habitaciones": "Gestión de Habitaciones",
  "/admin/reservas":     "Gestión de Reservas",
  "/admin/dashboard":    "Dashboard",
  "/admin/clientes":     "Pasajeros",
  "/admin/cupones":      "Cupones",
  "/admin/tarifas":      "Tarifas",
  "/admin/reportes":     "Reportes",
  "/admin/caja":         "Caja por Turno",
  "/admin/usuarios":     "Gestión de Usuarios",
  "/admin/checkin":      "Check-In",
};

const AdminLayout = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const currentPage = breadcrumbMap[pathname] || "Admin";
  const usuario = getUsuarioActual();

  const [turnoAbierto, setTurnoAbierto] = useState(null);
  const [showCierreCaja, setShowCierreCaja] = useState(false);

  // Protección de ruta — redirige a /login si no hay token
  const token = localStorage.getItem("adminToken");
  if (!token) return <Navigate to="/login" replace />;

  const cerrarSesion = () => {
    localStorage.removeItem("adminToken");
    navigate("/login");
  };

  const handleLogout = async () => {
    try {
      const { data } = await clientAxios.get("/turnos/actual");
      if (data.turno) {
        setTurnoAbierto(data.turno);
        setShowCierreCaja(true);
        return;
      }
    } catch {
      // Si falla la consulta, cierra sesión directamente
    }
    cerrarSesion();
  };

  return (
    <div className="hs-root">
      {/* TOPBAR */}
      <header className="topbar">
        <div className="topbar-left">
          <NavLink to="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div className="logo-gem"><span className="logo-initial">H</span></div>
            <span className="logo-name">Hotel <span>Catalina</span></span>
          </NavLink>
          <div className="topbar-sep" />
          <nav className="breadcrumb" aria-label="Navegación">
            <NavLink to="/admin/dashboard">Admin</NavLink>
            <span className="breadcrumb-sep">›</span>
            <span className="breadcrumb-current">{currentPage}</span>
          </nav>
        </div>
        <div className="topbar-right">
          <button
            onClick={handleLogout}
            style={{ background:"none", border:"1px solid var(--border)", borderRadius:8, padding:"5px 12px", cursor:"pointer", fontSize:12, color:"var(--text-2)", transition:"all var(--transition)" }}
            title="Cerrar sesión"
          >
            Salir
          </button>
          <div className="topbar-avatar" title={usuario?.nombre || "Mi cuenta"} style={{ fontSize: 11 }}>
            {usuario?.nombre ? usuario.nombre.split(' ').map(p => p[0]).join('').slice(0,2).toUpperCase() : 'HC'}
          </div>
        </div>
      </header>

      {/* LAYOUT: sidenav + main */}
      <div className="layout">
        <aside className="sidenav" aria-label="Menú de navegación">
          <div className="nav-section-label">Principal</div>
          <NavLink
            className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
            to="/admin/dashboard"
          >
            <span className="nav-icon">🏠</span> Dashboard
          </NavLink>
          <NavLink
            className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
            to="/admin/reservas"
          >
            <span className="nav-icon">📅</span> Reservas
          </NavLink>
          <NavLink
            className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
            to="/admin/clientes"
          >
            <span className="nav-icon">👥</span> Pasajeros
          </NavLink>
          <NavLink
            className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
            to="/admin/caja"
          >
            <span className="nav-icon">💵</span> Caja / Turno
          </NavLink>

          <div className="nav-section-label">Configuración</div>
          <NavLink
            className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
            to="/admin/habitaciones"
          >
            <span className="nav-icon">🛏</span> Habitaciones
          </NavLink>
          <NavLink
            className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
            to="/admin/tarifas"
          >
            <span className="nav-icon">💰</span> Tarifas
          </NavLink>
          <NavLink
            className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
            to="/admin/cupones"
          >
            <span className="nav-icon">🎁</span> Cupones
          </NavLink>
          {esSuperadmin() && (
            <NavLink
              className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
              to="/admin/usuarios"
            >
              <span className="nav-icon">🔑</span> Usuarios
            </NavLink>
          )}

          <div className="nav-section-label">Reportes</div>
          <NavLink
            className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
            to="/admin/reportes"
          >
            <span className="nav-icon">📊</span> Reportes
          </NavLink>

          <div className="nav-section-label">Sistema</div>
          <NavLink className="nav-item" to="/">
            <span className="nav-icon">🌐</span> Sitio web
          </NavLink>
          <button className="nav-item" onClick={handleLogout} style={{ width:"100%", textAlign:"left", background:"none", border:"none", cursor:"pointer", fontFamily:"inherit" }}>
            <span className="nav-icon">🚪</span> Cerrar sesión
          </button>
        </aside>

        <main className="main">
          <Outlet />
        </main>
      </div>

      <ModalCierreCaja
        show={showCierreCaja}
        onHide={() => setShowCierreCaja(false)}
        turno={turnoAbierto}
        onCierreCaja={cerrarSesion}
      />
    </div>
  );
};

export default AdminLayout;
