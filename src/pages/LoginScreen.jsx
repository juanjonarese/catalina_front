import { useState } from "react";
import { useNavigate } from "react-router-dom";
import clientAxios from "../helpers/clientAxios";
import "../css/hotel-system.css";

export default function LoginScreen() {
  const navigate = useNavigate();
  const [theme, setTheme] = useState("light");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Completá email y contraseña.");
      return;
    }

    setLoading(true);
    try {
      const { data } = await clientAxios.post("/auth/login", { email, password });
      localStorage.setItem("adminToken", data.token);
      navigate("/admin/dashboard");
    } catch (err) {
      setError(err.response?.data?.msg || "Error al iniciar sesión. Verificá tus datos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page" data-theme={theme}>

      {/* ── PANEL VISUAL (izquierda) ────────────────────────── */}
      <div className="panel-visual" aria-hidden="true">
        <div className="panel-visual-bg" />

        <div className="visual-badge">
          <div className="badge-dot" />
          <div className="badge-text">
            <strong>Sistema activo</strong>
            Hotel Catalina
          </div>
        </div>

        <div className="panel-visual-content">
          <div className="visual-logo">
            <div className="logo-gem"><span className="logo-initial">H</span></div>
            <span className="logo-name">Hotel <span>Catalina</span></span>
          </div>

          <div className="visual-quote">
            <span className="quote-mark">"</span>
            <p className="quote-text">
              Cada reserva es el inicio de una experiencia que nuestros huéspedes recordarán siempre.
            </p>
            <div className="quote-author">
              <span className="quote-line" />
              <span className="quote-name">Sistema de Gestión Hotelera</span>
            </div>
          </div>

          <div className="visual-dots">
            <div className="vdot active" />
            <div className="vdot" />
            <div className="vdot" />
          </div>
        </div>
      </div>

      {/* ── PANEL FORM (derecha) ────────────────────────────── */}
      <div className="panel-form">

        {/* Theme toggle */}
        <div className="theme-toggle" role="group" aria-label="Cambiar tema">
          <button
            className={`theme-btn${theme === "light" ? " active" : ""}`}
            onClick={() => setTheme("light")}
            title="Modo claro"
          >☀️</button>
          <button
            className={`theme-btn${theme === "dark" ? " active" : ""}`}
            onClick={() => setTheme("dark")}
            title="Modo oscuro"
          >🌙</button>
        </div>

        <div className="form-card">

          {/* Heading */}
          <div className="form-heading">
            <div className="form-eyebrow">Portal de administración</div>
            <h1 className="form-title">Bienvenido <em>de nuevo</em></h1>
            <p className="form-subtitle">Ingresá tus datos para acceder al panel de gestión.</p>
          </div>

          {/* Alert de error */}
          {error && (
            <div className="alert error show" role="alert">
              <span className="alert-icon">⚠️</span>
              {error}
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit} noValidate autoComplete="on">
            <div className="fields">

              {/* Email */}
              <div className="field">
                <label className="field-label" htmlFor="email">Correo electrónico</label>
                <div className="input-wrap">
                  <span className="input-icon" aria-hidden="true">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="20" height="16" x="2" y="4" rx="2"/>
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                    </svg>
                  </span>
                  <input
                    type="email"
                    id="email"
                    className="field-input"
                    placeholder="admin@hotel.com"
                    autoComplete="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              {/* Contraseña */}
              <div className="field">
                <label className="field-label" htmlFor="password">Contraseña</label>
                <div className="input-wrap">
                  <span className="input-icon" aria-hidden="true">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </span>
                  <input
                    type={showPwd ? "text" : "password"}
                    id="password"
                    className="field-input"
                    placeholder="Tu contraseña"
                    autoComplete="current-password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    disabled={loading}
                    required
                  />
                  <button
                    type="button"
                    className="input-action"
                    onClick={() => setShowPwd(v => !v)}
                    aria-label={showPwd ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showPwd ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

            </div>

            <button
              type="submit"
              className={`btn-submit${loading ? " loading" : ""}`}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner" style={{ display: "block" }} />
                  <span className="btn-text">Ingresando...</span>
                </>
              ) : (
                <span className="btn-text">Ingresar al sistema</span>
              )}
            </button>
          </form>

          <p className="form-footer">
            ¿Problemas para ingresar? <a href="/">Volver al sitio</a>
          </p>
        </div>
      </div>

    </div>
  );
}
