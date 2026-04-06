import { useState, useEffect, useCallback } from "react";
import clientAxios from "../helpers/clientAxios";
import { getUsuarioActual } from "../helpers/authHelper";

/* ── Helpers ───────────────────────────────────────────────────── */
const initials = (nombre) =>
  nombre
    ? nombre.trim().split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()
    : "?";

const fmtDate = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-AR", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
};

/* ── Subcomponent: field wrapper ───────────────────────────────── */
const Field = ({ label, required, error, children, full }) => (
  <div className={`form-group${full ? " full" : ""}`}>
    <label className="form-label">
      {label} {required && <span style={{ color: "var(--red,#C0392B)" }}>*</span>}
    </label>
    {children}
    {error && <div style={{ color: "var(--red,#C0392B)", fontSize: 11, marginTop: 3 }}>{error}</div>}
  </div>
);

/* ── Empty form ────────────────────────────────────────────────── */
const EMPTY_FORM = { nombre: "", email: "", password: "", rol: "personal", activo: true };

/* ══ Component ══════════════════════════════════════════════════ */
export default function GestionUsuariosScreen() {
  const [usuarios, setUsuarios]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [busqueda, setBusqueda]   = useState("");
  const [filtro, setFiltro]       = useState("all");

  /* Modal */
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [formErr, setFormErr]     = useState({});
  const [saving, setSaving]       = useState(false);

  /* Modal confirmar eliminar */
  const [showDel, setShowDel]     = useState(false);
  const [delTarget, setDelTarget] = useState(null);
  const [deleting, setDeleting]   = useState(false);

  const yo = getUsuarioActual();

  /* ── Carga ──────────────────────────────────────────────────── */
  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await clientAxios.get("/usuarios");
      setUsuarios(data);
    } catch (err) {
      console.error("Error al cargar usuarios:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key !== "Escape") return;
      setShowModal(false);
      setShowDel(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  /* ── Stats ──────────────────────────────────────────────────── */
  const stats = {
    total:      usuarios.length,
    superadmin: usuarios.filter((u) => u.rol === "superadmin").length,
    activos:    usuarios.filter((u) => u.activo).length,
    inactivos:  usuarios.filter((u) => !u.activo).length,
  };

  /* ── Filtro + búsqueda ──────────────────────────────────────── */
  const lista = usuarios.filter((u) => {
    const q = busqueda.toLowerCase().trim();
    if (q && !`${u.nombre} ${u.email}`.toLowerCase().includes(q)) return false;
    if (filtro === "superadmin") return u.rol === "superadmin";
    if (filtro === "personal")   return u.rol === "personal";
    if (filtro === "inactivo")   return !u.activo;
    return true;
  });

  /* ── Modal add/edit ─────────────────────────────────────────── */
  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormErr({});
    setShowModal(true);
  };

  const openEdit = (u) => {
    setEditingId(u._id);
    setForm({ nombre: u.nombre, email: u.email, password: "", rol: u.rol, activo: u.activo });
    setFormErr({});
    setShowModal(true);
  };

  const validate = () => {
    const err = {};
    if (!form.nombre.trim()) err.nombre = "Requerido";
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      err.email = "Email inválido";
    if (!editingId && !form.password) err.password = "Requerido para nuevos usuarios";
    return err;
  };

  const guardar = async () => {
    const err = validate();
    if (Object.keys(err).length) { setFormErr(err); return; }
    setSaving(true);
    try {
      if (editingId) {
        const payload = { nombre: form.nombre, email: form.email, rol: form.rol, activo: form.activo };
        if (form.password) payload.password = form.password;
        await clientAxios.put(`/usuarios/${editingId}`, payload);
      } else {
        await clientAxios.post("/usuarios", form);
      }
      setShowModal(false);
      cargar();
    } catch (err) {
      setFormErr({ email: err.response?.data?.msg || "Error al guardar" });
    } finally {
      setSaving(false);
    }
  };

  /* ── Toggle activo ──────────────────────────────────────────── */
  const toggleActivo = async (u) => {
    if (u._id === yo?.id) return;
    try {
      await clientAxios.put(`/usuarios/${u._id}`, { activo: !u.activo });
      cargar();
    } catch (err) {
      console.error(err);
    }
  };

  /* ── Eliminar ───────────────────────────────────────────────── */
  const confirmarEliminar = (u) => { setDelTarget(u); setShowDel(true); };

  const eliminar = async () => {
    if (!delTarget) return;
    setDeleting(true);
    try {
      await clientAxios.delete(`/usuarios/${delTarget._id}`);
      setShowDel(false);
      setDelTarget(null);
      cargar();
    } catch (err) {
      setFormErr({ _global: err.response?.data?.msg || "Error al eliminar" });
    } finally {
      setDeleting(false);
    }
  };

  /* ── Render ──────────────────────────────────────────────────── */
  return (
    <>
      {/* PAGE HEADER */}
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-eyebrow">Administración</div>
          <h1 className="page-title">Usuarios del sistema</h1>
          <p className="page-subtitle">Alta, modificación y baja de usuarios con acceso al panel</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={cargar} disabled={loading}>↻ Actualizar</button>
          <button className="btn btn-primary"   onClick={openAdd}>＋ Nuevo usuario</button>
        </div>
      </div>

      {/* STATS */}
      <div className="stats-strip">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "var(--brand-light,#4A7C59)", color: "#fff" }}>🔑</div>
          <div className="stat-info">
            <div className="stat-num">{stats.total}</div>
            <div className="stat-label">Total usuarios</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "rgba(192,57,43,.12)", color: "var(--red,#C0392B)" }}>👑</div>
          <div className="stat-info">
            <div className="stat-num">{stats.superadmin}</div>
            <div className="stat-label">Superadmins</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "rgba(74,124,89,.12)", color: "var(--green,#4A7C59)" }}>✅</div>
          <div className="stat-info">
            <div className="stat-num">{stats.activos}</div>
            <div className="stat-label">Activos</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "rgba(100,100,100,.1)", color: "var(--text-2,#888)" }}>⛔</div>
          <div className="stat-info">
            <div className="stat-num">{stats.inactivos}</div>
            <div className="stat-label">Inactivos</div>
          </div>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="cl-toolbar">
        <div className="cl-search-wrap">
          <span className="cl-search-icon">🔍</span>
          <input
            type="text" className="cl-search"
            placeholder="Buscar por nombre o email…"
            value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        <div className="cl-filter-chips">
          {[
            ["all",        "Todos"],
            ["superadmin", "Superadmin"],
            ["personal",   "Personal"],
            ["inactivo",   "Inactivos"],
          ].map(([k, lbl]) => (
            <button
              key={k}
              className={`cl-chip${filtro === k ? " active" : ""}`}
              onClick={() => setFiltro(k)}
            >{lbl}</button>
          ))}
        </div>
        <div className="cl-count">{lista.length} usuario{lista.length !== 1 ? "s" : ""}</div>
      </div>

      {/* LISTA */}
      {loading ? (
        <div className="empty-state">
          <div className="empty-icon">⏳</div>
          <div className="empty-title">Cargando usuarios…</div>
        </div>
      ) : lista.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔑</div>
          <div className="empty-title">Sin usuarios</div>
          <div className="empty-text">No hay usuarios que coincidan con el filtro.</div>
          <button className="btn btn-primary" onClick={openAdd}>＋ Nuevo usuario</button>
        </div>
      ) : lista.map((u, idx) => (
        <div
          key={u._id}
          className="cl-card"
          style={{ animationDelay: `${idx * 0.04}s`, opacity: u.activo ? 1 : 0.55 }}
        >
          <div className="cl-card-header" style={{ cursor: "default" }}>
            {/* Avatar */}
            <div
              className="cl-avatar"
              style={{
                background: u.rol === "superadmin"
                  ? "linear-gradient(135deg,#C0392B,#922B21)"
                  : "linear-gradient(135deg,#4A7C59,#2e7d4f)",
              }}
            >
              {initials(u.nombre)}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="cl-name">
                {u.nombre}
                {u._id === yo?.id && (
                  <span className="badge badge-confirmed" style={{ fontSize: 10, marginLeft: 6 }}>
                    Vos
                  </span>
                )}
                <span
                  className={`badge ${u.rol === "superadmin" ? "badge-cancelled" : "badge-pending"}`}
                  style={{ fontSize: 10, marginLeft: 6 }}
                >
                  {u.rol === "superadmin" ? "👑 Superadmin" : "Personal"}
                </span>
                {!u.activo && (
                  <span className="badge" style={{ fontSize: 10, marginLeft: 6, background: "var(--text-3,#bbb)", color: "#fff" }}>
                    Inactivo
                  </span>
                )}
              </div>
              <div className="cl-meta">
                <span className="cl-meta-item">✉ {u.email}</span>
                <span className="cl-meta-item">📅 Alta: {fmtDate(u.fechaCreacion)}</span>
              </div>
            </div>

            {/* Acciones */}
            <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
              {u._id !== yo?.id && (
                <button
                  className="btn btn-secondary"
                  style={{ fontSize: 11, padding: "5px 10px" }}
                  onClick={() => toggleActivo(u)}
                  title={u.activo ? "Desactivar usuario" : "Activar usuario"}
                >
                  {u.activo ? "⛔ Desactivar" : "✅ Activar"}
                </button>
              )}
              <button
                className="btn btn-secondary"
                style={{ fontSize: 11, padding: "5px 10px" }}
                onClick={() => openEdit(u)}
              >
                ✏ Editar
              </button>
              {u._id !== yo?.id && (
                <button
                  className="btn btn-danger"
                  style={{ fontSize: 11, padding: "5px 10px" }}
                  onClick={() => confirmarEliminar(u)}
                >
                  🗑 Eliminar
                </button>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* ══ MODAL: ADD / EDIT ═══════════════════════════════════ */}
      {showModal && (
        <div
          className="modal-overlay open"
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div className="modal" style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <div className="modal-title-group">
                <div className="modal-eyebrow">{editingId ? "Editar usuario" : "Nuevo usuario"}</div>
                <div className="modal-title">{editingId ? form.nombre : "Crear cuenta de acceso"}</div>
              </div>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <div className="modal-body" style={{ gap: 16 }}>
              <div className="form-grid">

                <div className="cl-section-title">Datos del usuario</div>

                <Field label="Nombre completo" required error={formErr.nombre}>
                  <input
                    type="text" className={`form-input${formErr.nombre ? " error" : ""}`}
                    placeholder="Ej: María González"
                    value={form.nombre}
                    onChange={(e) => { setForm((p) => ({ ...p, nombre: e.target.value })); setFormErr((p) => ({ ...p, nombre: "" })); }}
                    autoFocus
                  />
                </Field>

                <Field label="Email" required error={formErr.email}>
                  <input
                    type="email" className={`form-input${formErr.email ? " error" : ""}`}
                    placeholder="correo@ejemplo.com"
                    autoComplete="off"
                    value={form.email}
                    onChange={(e) => { setForm((p) => ({ ...p, email: e.target.value })); setFormErr((p) => ({ ...p, email: "" })); }}
                  />
                  {formErr.email && <div style={{ color: "var(--red,#C0392B)", fontSize: 11, marginTop: 3 }}>{formErr.email}</div>}
                </Field>

                <Field label="Rol">
                  <select
                    className="form-select-modal"
                    value={form.rol}
                    onChange={(e) => setForm((p) => ({ ...p, rol: e.target.value }))}
                    disabled={editingId === yo?.id}
                  >
                    <option value="personal">Personal</option>
                    <option value="superadmin">👑 Superadmin</option>
                  </select>
                  {editingId === yo?.id && (
                    <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 3 }}>
                      No podés cambiar tu propio rol
                    </div>
                  )}
                </Field>

                {editingId && (
                  <Field label="Estado">
                    <select
                      className="form-select-modal"
                      value={form.activo ? "activo" : "inactivo"}
                      onChange={(e) => setForm((p) => ({ ...p, activo: e.target.value === "activo" }))}
                      disabled={editingId === yo?.id}
                    >
                      <option value="activo">✅ Activo</option>
                      <option value="inactivo">⛔ Inactivo</option>
                    </select>
                  </Field>
                )}

                <div className="cl-section-title">Contraseña</div>

                <Field
                  label={editingId ? "Nueva contraseña" : "Contraseña"}
                  required={!editingId}
                  error={formErr.password}
                  full
                >
                  <input
                    type="password"
                    className={`form-input${formErr.password ? " error" : ""}`}
                    placeholder={editingId ? "Dejá vacío para no cambiar" : "Mínimo 6 caracteres"}
                    autoComplete="new-password"
                    value={form.password}
                    onChange={(e) => { setForm((p) => ({ ...p, password: e.target.value })); setFormErr((p) => ({ ...p, password: "" })); }}
                  />
                </Field>

              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={guardar} disabled={saving}>
                {saving ? "Guardando…" : editingId ? "Guardar cambios" : "Crear usuario"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL: CONFIRMAR ELIMINAR ════════════════════════════ */}
      {showDel && delTarget && (
        <div
          className="modal-overlay open"
          onClick={(e) => { if (e.target === e.currentTarget) setShowDel(false); }}
        >
          <div className="modal" style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <div className="modal-title-group">
                <div className="modal-eyebrow">Confirmar acción</div>
                <div className="modal-title">Eliminar usuario</div>
              </div>
              <button className="modal-close" onClick={() => setShowDel(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ margin: 0, color: "var(--text-2)" }}>
                ¿Estás seguro de que querés eliminar a{" "}
                <strong>{delTarget.nombre}</strong>?<br />
                <span style={{ fontSize: 13, color: "var(--text-3)" }}>
                  Esta acción no se puede deshacer.
                </span>
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowDel(false)}>Cancelar</button>
              <button className="btn btn-danger" onClick={eliminar} disabled={deleting}>
                {deleting ? "Eliminando…" : "Sí, eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
