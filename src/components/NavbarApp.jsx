import { NavLink } from "react-router-dom";

const NavBarApp = () => {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container-fluid">
        <NavLink className="navbar-brand" to="/">
          <i className="bi bi-building me-2"></i>
          Hotel
        </NavLink>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto">
            <li className="nav-item">
              <NavLink
                className={({ isActive }) =>
                  isActive ? "nav-link fw-bold" : "nav-link"
                }
                to="/"
              >
                <i className="bi bi-house-door me-1"></i>
                Inicio
              </NavLink>
            </li>
            <li className="nav-item dropdown">
              <a
                className="nav-link dropdown-toggle"
                href="#"
                role="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <i className="bi bi-shield-lock me-1"></i>
                Administrador
              </a>
              <ul className="dropdown-menu">
                <li>
                  <NavLink className="dropdown-item" to="/admin/habitaciones">
                    <i className="bi bi-door-open me-2"></i>
                    Gestión de Habitaciones
                  </NavLink>
                </li>
                <li>
                  <NavLink className="dropdown-item" to="/admin/reservas">
                    <i className="bi bi-calendar-check me-2"></i>
                    Gestión de Reservas
                  </NavLink>
                </li>
                <li>
                  <NavLink className="dropdown-item" to="/registro-pasajeros">
                    <i className="bi bi-person-plus me-2"></i>
                    Registro de Pasajeros
                  </NavLink>
                </li>
              </ul>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default NavBarApp;