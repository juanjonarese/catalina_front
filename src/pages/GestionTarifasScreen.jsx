import { useState, useEffect, useCallback } from "react";
import clientAxios from "../helpers/clientAxios";

/* ── Constantes de color / multiplicador ────────────────────────── */
const COLOR_META = {
  high:    { hex: "#C0392B", label: "Alta",     mult: 1.4  },
  mid:     { hex: "#8B5C2A", label: "Media",    mult: 1.15 },
  low:     { hex: "#2D6DA4", label: "Baja",     mult: 0.85 },
  special: { hex: "#6B4FA0", label: "Especial", mult: 1.25 },
  green:   { hex: "#4A7C59", label: "Promo",    mult: 0.9  },
};

const COLORS_ORDER = ["high", "mid", "low", "special", "green"];

const MONTHS_ES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const DOW_ES    = ["Lu","Ma","Mi","Ju","Vi","Sá","Do"];

/* ── Helpers ────────────────────────────────────────────────────── */
const money = (n) =>
  "$" + Number(n || 0).toLocaleString("es-AR", { maximumFractionDigits: 0 });

const fmtDate = (iso) => {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${+d} ${MONTHS_ES[+m - 1]?.slice(0, 3)} ${y}`;
};

const todayISO = () => new Date().toISOString().split("T")[0];

const isActive   = (s) => { const t = todayISO(); return s.fechaDesde <= t && s.fechaHasta >= t; };
const isPast     = (s) => s.fechaHasta < todayISO();
const isUpcoming = (s) => s.fechaDesde > todayISO();

/* Dado una temporada, obtener el precio de una habitación
   (override explícito o precio_base * multiplicador) */
const getSeasonPrice = (temporada, habitacion) => {
  const override = temporada.precios?.find(
    (p) => String(p.habitacionId?._id || p.habitacionId) === String(habitacion._id)
  );
  if (override) return override.precio;
  return Math.round(habitacion.precio * (COLOR_META[temporada.color]?.mult || 1));
};

/* Dado una fecha ISO, devuelve la temporada vigente (última en orden) */
const getSeasonForDate = (temporadas, iso) => {
  const matches = temporadas.filter((s) => s.fechaDesde <= iso && s.fechaHasta >= iso);
  return matches.length > 0 ? matches[matches.length - 1] : null;
};

/* ── Empty form ─────────────────────────────────────────────────── */
const emptyForm = () => ({ nombre: "", color: "high", fechaDesde: "", fechaHasta: "", descripcion: "" });

/* ══ Component ══════════════════════════════════════════════════ */
export default function GestionTarifasScreen() {
  const [temporadas, setTemporadas]   = useState([]);
  const [habitaciones, setHabitaciones] = useState([]);
  const [loading, setLoading]         = useState(true);

  /* Calendario mini */
  const [calYear, setCalYear]   = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());

  /* Modal add/edit */
  const [showModal, setShowModal]     = useState(false);
  const [editingId, setEditingId]     = useState(null);
  const [form, setForm]               = useState(emptyForm());
  const [roomPrices, setRoomPrices]   = useState({}); // { habitacionId: precio }
  const [formErr, setFormErr]         = useState({});
  const [saving, setSaving]           = useState(false);

  /* Modal delete */
  const [showDelModal, setShowDelModal] = useState(false);
  const [delTarget, setDelTarget]       = useState(null);
  const [deleting, setDeleting]         = useState(false);

  /* ── Carga ─────────────────────────────────────────────────── */
  const cargar = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await clientAxios.get("/temporadas");
      setTemporadas(data.temporadas);
      setHabitaciones(data.habitaciones);
    } catch (err) {
      console.error("Error al cargar tarifas:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key !== "Escape") return;
      setShowModal(false);
      setShowDelModal(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  /* ── Stats ─────────────────────────────────────────────────── */
  const mults  = temporadas.map((s) => COLOR_META[s.color]?.mult || 1);
  const stats  = {
    total:  temporadas.length,
    active: temporadas.filter(isActive).length,
    max:    mults.length ? Math.max(...mults) : 1,
    min:    mults.length ? Math.min(...mults) : 1,
  };

  /* ── Modal add/edit ─────────────────────────────────────────── */
  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm());
    setRoomPrices({});
    setFormErr({});
    setShowModal(true);
  };

  const openEdit = (t) => {
    setEditingId(t._id);
    setForm({
      nombre: t.nombre, color: t.color,
      fechaDesde: t.fechaDesde, fechaHasta: t.fechaHasta,
      descripcion: t.descripcion || "",
    });
    // Build roomPrices map from the saved precios
    const map = {};
    (t.precios || []).forEach((p) => {
      const id = String(p.habitacionId?._id || p.habitacionId);
      map[id] = p.precio;
    });
    setRoomPrices(map);
    setFormErr({});
    setShowModal(true);
  };

  /* When color changes, update suggested price placeholders (not values) */
  const setColor = (c) => setForm((p) => ({ ...p, color: c }));

  const handleRoomPrice = (habId, val) => {
    setRoomPrices((p) => ({ ...p, [habId]: val }));
  };

  const buildPreciosPayload = () =>
    habitaciones
      .map((h) => {
        const val = parseFloat(roomPrices[String(h._id)]);
        return isNaN(val) || val <= 0 ? null : { habitacionId: h._id, precio: val };
      })
      .filter(Boolean);

  const validate = () => {
    const err = {};
    if (!form.nombre.trim())  err.nombre     = "Requerido";
    if (!form.fechaDesde)     err.fechaDesde = "Requerido";
    if (!form.fechaHasta)     err.fechaHasta = "Requerido";
    if (form.fechaHasta && form.fechaDesde && form.fechaHasta < form.fechaDesde)
      err.fechaHasta = "Debe ser posterior al inicio";
    return err;
  };

  const saveTemporada = async () => {
    const err = validate();
    if (Object.keys(err).length) { setFormErr(err); return; }
    setSaving(true);
    try {
      const payload = { ...form, precios: buildPreciosPayload() };
      if (editingId) {
        await clientAxios.put(`/temporadas/${editingId}`, payload);
      } else {
        await clientAxios.post("/temporadas", payload);
      }
      setShowModal(false);
      cargar();
    } catch (err) {
      setFormErr({ nombre: err.response?.data?.msg || "Error al guardar" });
    } finally {
      setSaving(false);
    }
  };

  /* ── Delete ─────────────────────────────────────────────────── */
  const confirmDelete = (t) => { setDelTarget(t); setShowDelModal(true); };

  const doDelete = async () => {
    if (!delTarget) return;
    setDeleting(true);
    try {
      await clientAxios.delete(`/temporadas/${delTarget._id}`);
      setShowDelModal(false);
      setDelTarget(null);
      cargar();
    } catch {
      // ignore
    } finally {
      setDeleting(false);
    }
  };

  /* ── Mini calendar ──────────────────────────────────────────── */
  const calPrev = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear((y) => y - 1); }
    else setCalMonth((m) => m - 1);
  };
  const calNext = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear((y) => y + 1); }
    else setCalMonth((m) => m + 1);
  };
  const calToday = () => { setCalYear(new Date().getFullYear()); setCalMonth(new Date().getMonth()); };

  const renderCalendar = () => {
    const firstDay    = new Date(calYear, calMonth, 1).getDay();
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const offset      = (firstDay + 6) % 7; // lunes = 0
    const today       = todayISO();
    const cells       = [];

    for (let i = 0; i < offset; i++)
      cells.push(<div key={`e${i}`} className="mini-cal-cell other-month" />);

    for (let d = 1; d <= daysInMonth; d++) {
      const iso = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const sea = getSeasonForDate(temporadas, iso);
      const isToday = iso === today;
      const seasonClass = sea ? ` season-${sea.color}` : "";
      cells.push(
        <div
          key={d}
          className={`mini-cal-cell${isToday ? " today" : ""}${seasonClass}`}
          title={sea ? sea.nombre : ""}
        >{d}</div>
      );
    }
    return cells;
  };

  /* Temporadas que solapan el mes del calendario */
  const calLegend = temporadas.filter((s) => {
    const ms = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-01`;
    const me = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(new Date(calYear, calMonth + 1, 0).getDate()).padStart(2, "0")}`;
    return s.fechaDesde <= me && s.fechaHasta >= ms;
  });

  /* ── "Tarifa vigente hoy" ───────────────────────────────────── */
  const today = todayISO();
  const seasonHoy = getSeasonForDate(temporadas, today);

  /* ── Render ──────────────────────────────────────────────────── */
  return (
    <>
      {/* PAGE HEADER */}
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-eyebrow">Configuración</div>
          <h1 className="page-title">Tarifas por Temporada</h1>
          <p className="page-subtitle">Definí precios diferenciados por período. Los precios base se toman de cada habitación.</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={cargar} disabled={loading}>↻ Actualizar</button>
          <button className="btn btn-primary"   onClick={openAdd}>＋ Nueva temporada</button>
        </div>
      </div>

      {/* STATS */}
      <div className="stats-strip">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#BEB4A8", color: "white" }}>📅</div>
          <div className="stat-info"><div className="stat-num">{stats.total}</div><div className="stat-label">Temporadas</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "rgba(192,57,43,.12)", color: "#C0392B" }}>🔥</div>
          <div className="stat-info"><div className="stat-num">{stats.active}</div><div className="stat-label">Activas ahora</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "rgba(200,136,42,.12)", color: "var(--amber,#C8882A)" }}>📈</div>
          <div className="stat-info"><div className="stat-num">×{stats.max.toFixed(2)}</div><div className="stat-label">Multiplicador máx.</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "rgba(45,109,164,.12)", color: "#2D6DA4" }}>📉</div>
          <div className="stat-info"><div className="stat-num">×{stats.min.toFixed(2)}</div><div className="stat-label">Multiplicador mín.</div></div>
        </div>
      </div>

      {/* BODY */}
      <div className="rates-layout">

        {/* LEFT: lista de temporadas */}
        <div className="rates-main">
          {loading ? (
            <div className="empty-state"><div className="empty-icon">⏳</div><div className="empty-title">Cargando tarifas…</div></div>
          ) : temporadas.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📅</div>
              <div className="empty-title">Sin temporadas definidas</div>
              <div className="empty-text">Creá tu primera temporada para gestionar tarifas diferenciadas.</div>
              <button className="btn btn-primary" onClick={openAdd}>＋ Nueva temporada</button>
            </div>
          ) : temporadas.map((s, idx) => {
            const meta    = COLOR_META[s.color] || COLOR_META.mid;
            const active  = isActive(s);
            const past    = isPast(s);
            const upcoming = isUpcoming(s);

            return (
              <div key={s._id} className="season-card" style={{ animationDelay: `${idx * 0.07}s` }}>
                <div className="season-header" onClick={(e) => {
                  const body = document.getElementById(`rtBody_${s._id}`);
                  const chev = e.currentTarget.querySelector(".season-chevron");
                  if (!body) return;
                  const open = body.style.display !== "none";
                  body.style.display = open ? "none" : "";
                  if (chev) chev.style.transform = open ? "rotate(-90deg)" : "";
                }}>
                  <div className="season-header-left">
                    <div className="season-color-bar" style={{ background: meta.hex }} />
                    <div>
                      <div className="season-name">{s.nombre}</div>
                      <div className="season-dates">
                        {fmtDate(s.fechaDesde)} → {fmtDate(s.fechaHasta)}
                        <span style={{ marginLeft: 6, fontSize: 10, color: meta.hex, fontWeight: 700 }}>
                          {meta.label}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="season-header-right">
                    {active   && <span className="badge badge-confirmed">Activa ahora</span>}
                    {past     && <span className="badge badge-cancelled">Finalizada</span>}
                    {upcoming && <span className="badge badge-pending">Próxima</span>}
                    <div className="season-actions" onClick={(e) => e.stopPropagation()}>
                      <button className="btn btn-secondary" style={{ fontSize: 12, padding: "6px 12px" }} onClick={() => openEdit(s)}>✏ Editar</button>
                      <button className="btn btn-danger"    style={{ fontSize: 12, padding: "6px 12px" }} onClick={() => confirmDelete(s)}>🗑</button>
                    </div>
                    <span className="season-chevron">▾</span>
                  </div>
                </div>

                {/* Body: tabla de habitaciones */}
                <div id={`rtBody_${s._id}`}>
                  {s.descripcion && (
                    <div style={{ padding: "12px 20px", fontSize: 12, color: "var(--text-2)", background: "var(--bg-elevated,var(--bg-2))", borderBottom: "1px solid var(--border)" }}>
                      {s.descripcion}
                    </div>
                  )}
                  <table className="rates-table">
                    <thead>
                      <tr>
                        <th>Habitación</th>
                        <th>Precio / noche</th>
                        <th>Variación</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {habitaciones.map((h) => {
                        const price   = getSeasonPrice(s, h);
                        const base    = h.precio;
                        const pct     = Math.round((price - base) / base * 100);
                        const changed = Math.abs(pct) > 0;
                        const multCls = pct > 5 ? "high" : pct < -5 ? "low" : "normal";
                        const multLbl = pct > 0 ? `+${pct}%` : pct < 0 ? `${pct}%` : "=base";
                        return (
                          <tr key={h._id}>
                            <td>
                              <div className="rt-room-name">{h.titulo}</div>
                              <div className="rt-room-type">Hab. {h.numero}</div>
                            </td>
                            <td>
                              <div className="rt-price-base">{money(price)}</div>
                              {changed && <div className="rt-price-default">{money(base)}</div>}
                            </td>
                            <td><span className={`rt-multiplier ${multCls}`}>{multLbl}</span></td>
                            <td>
                              <button className="rt-edit-btn" onClick={() => { openEdit(s); }}>Editar</button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>

        {/* RIGHT: calendario + tarifa hoy */}
        <div className="rates-side">

          {/* Mini calendario */}
          <div className="mini-cal">
            <div className="mini-cal-header">
              <div className="mini-cal-title">{MONTHS_ES[calMonth]} {calYear}</div>
              <div className="mini-cal-nav">
                <button className="mini-cal-btn" onClick={calPrev}>‹</button>
                <button className="mini-cal-btn" onClick={calToday} style={{ width: "auto", padding: "0 8px" }}>Hoy</button>
                <button className="mini-cal-btn" onClick={calNext}>›</button>
              </div>
            </div>
            <div className="mini-cal-body">
              <div className="mini-cal-grid" style={{ marginBottom: 6 }}>
                {DOW_ES.map((d) => <div key={d} className="mini-cal-dow">{d}</div>)}
              </div>
              <div className="mini-cal-grid">{renderCalendar()}</div>
            </div>
            <div className="mini-cal-legend">
              {calLegend.length === 0
                ? <div className="legend-item">Sin temporadas este mes</div>
                : calLegend.map((s) => (
                    <div key={s._id} className="legend-item">
                      <div className="legend-dot" style={{ background: COLOR_META[s.color]?.hex }} />
                      {s.nombre}
                    </div>
                  ))}
            </div>
          </div>

          {/* Tarifa vigente hoy */}
          <div className="mini-cal" style={{ padding: "16px 20px" }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-1)", marginBottom: 4 }}>
              Tarifa vigente hoy
            </div>
            {seasonHoy && (
              <div style={{ fontSize: 11, color: COLOR_META[seasonHoy.color]?.hex, fontWeight: 600, marginBottom: 12 }}>
                {seasonHoy.nombre}
              </div>
            )}
            {!seasonHoy && (
              <div style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 12 }}>Precios base (sin temporada activa)</div>
            )}
            <div style={{ display: "flex", flexDirection: "column" }}>
              {habitaciones.map((h, i) => {
                const price   = seasonHoy ? getSeasonPrice(seasonHoy, h) : h.precio;
                const pct     = Math.round((price - h.precio) / h.precio * 100);
                const color   = pct > 0 ? "#C0392B" : pct < 0 ? "#2D6DA4" : "var(--text-3)";
                return (
                  <div key={h._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < habitaciones.length - 1 ? "1px solid var(--border)" : "none" }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-1)" }}>{h.titulo}</div>
                      <div style={{ fontSize: 10, color: "var(--text-3)" }}>Hab. {h.numero}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)" }}>{money(price)}</div>
                      {pct !== 0
                        ? <div style={{ fontSize: 10, color, fontWeight: 600 }}>{pct > 0 ? "+" : ""}{pct}% vs base</div>
                        : <div style={{ fontSize: 10, color: "var(--text-3)" }}>precio base</div>}
                    </div>
                  </div>
                );
              })}
              {habitaciones.length === 0 && (
                <div style={{ fontSize: 12, color: "var(--text-3)", textAlign: "center", padding: "12px 0" }}>
                  Sin habitaciones registradas
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* ══ MODAL: ADD / EDIT ═══════════════════════════════════ */}
      {showModal && (
        <div className="modal-overlay open" onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="modal" style={{ maxWidth: 640 }}>
            <div className="modal-header">
              <div className="modal-title-group">
                <div className="modal-eyebrow">{editingId ? "Editar temporada" : "Nueva temporada"}</div>
                <div className="modal-title">{editingId ? form.nombre : "Crear Temporada"}</div>
              </div>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <div className="modal-body" style={{ gap: 20 }}>
              {/* Info básica */}
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Nombre <span className="required">*</span></label>
                  <input
                    type="text" className={`form-input${formErr.nombre ? " error" : ""}`}
                    placeholder="Ej: Temporada Alta Verano"
                    value={form.nombre}
                    onChange={(e) => { setForm((p) => ({ ...p, nombre: e.target.value })); setFormErr((p) => ({ ...p, nombre: "" })); }}
                    autoFocus
                  />
                  {formErr.nombre && <div style={{ color: "#C0392B", fontSize: 11, marginTop: 3 }}>{formErr.nombre}</div>}
                </div>

                <div className="form-group">
                  <label className="form-label">Color identificador</label>
                  <div className="color-picker">
                    {COLORS_ORDER.map((c) => (
                      <div
                        key={c}
                        className={`color-opt${form.color === c ? " selected" : ""}`}
                        style={{ background: COLOR_META[c].hex }}
                        title={COLOR_META[c].label}
                        onClick={() => setColor(c)}
                      />
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Desde <span className="required">*</span></label>
                  <input
                    type="date" className={`form-input${formErr.fechaDesde ? " error" : ""}`}
                    value={form.fechaDesde}
                    onChange={(e) => { setForm((p) => ({ ...p, fechaDesde: e.target.value })); setFormErr((p) => ({ ...p, fechaDesde: "" })); }}
                  />
                  {formErr.fechaDesde && <div style={{ color: "#C0392B", fontSize: 11, marginTop: 3 }}>{formErr.fechaDesde}</div>}
                </div>

                <div className="form-group">
                  <label className="form-label">Hasta <span className="required">*</span></label>
                  <input
                    type="date" className={`form-input${formErr.fechaHasta ? " error" : ""}`}
                    value={form.fechaHasta}
                    onChange={(e) => { setForm((p) => ({ ...p, fechaHasta: e.target.value })); setFormErr((p) => ({ ...p, fechaHasta: "" })); }}
                  />
                  {formErr.fechaHasta && <div style={{ color: "#C0392B", fontSize: 11, marginTop: 3 }}>{formErr.fechaHasta}</div>}
                </div>

                <div className="form-group full">
                  <label className="form-label">Descripción (opcional)</label>
                  <textarea
                    className="form-textarea" rows={2}
                    placeholder="Ej: Período de vacaciones de verano. Aplica a todas las habitaciones."
                    value={form.descripcion}
                    onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value }))}
                  />
                </div>
              </div>

              {/* Precios por habitación */}
              <div>
                <div style={{ fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--text-3)", fontWeight: 600, marginBottom: 12 }}>
                  Precios por habitación
                  <span style={{ fontWeight: 400, fontSize: 10, marginLeft: 6 }}>(dejar vacío = usa precio base × multiplicador)</span>
                </div>

                {habitaciones.length === 0 ? (
                  <div style={{ fontSize: 13, color: "var(--text-3)", textAlign: "center", padding: "12px 0" }}>
                    No hay habitaciones registradas
                  </div>
                ) : habitaciones.map((h) => {
                  const meta      = COLOR_META[form.color] || COLOR_META.mid;
                  const suggested = Math.round(h.precio * meta.mult);
                  const habId     = String(h._id);
                  return (
                    <div key={h._id} className="rate-room-row">
                      <div className="rate-room-info">
                        <div className="rate-room-label">{h.titulo}</div>
                        <div className="rate-room-type">Hab. {h.numero}</div>
                      </div>
                      <div>
                        <div className="rate-room-input">
                          <div className="rate-prefix">$</div>
                          <input
                            type="number" className="rate-input" min="0"
                            value={roomPrices[habId] ?? ""}
                            placeholder={suggested.toLocaleString("es-AR")}
                            onChange={(e) => handleRoomPrice(habId, e.target.value === "" ? "" : parseFloat(e.target.value))}
                          />
                        </div>
                        <div className="rate-default">
                          Base: {money(h.precio)} · Sugerido: {money(suggested)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={saveTemporada} disabled={saving}>
                {saving ? "Guardando…" : "Guardar temporada"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL: DELETE ═══════════════════════════════════════ */}
      {showDelModal && (
        <div className="modal-overlay open" onClick={(e) => { if (e.target === e.currentTarget) setShowDelModal(false); }}>
          <div className="modal modal-sm">
            <div style={{ padding: "28px 24px", textAlign: "center" }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🗑</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-1)", marginBottom: 8 }}>¿Eliminar temporada?</div>
              <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.5 }}>
                La temporada <strong>{delTarget?.nombre}</strong> será eliminada permanentemente.
              </p>
            </div>
            <div className="modal-footer" style={{ justifyContent: "center", gap: 12 }}>
              <button className="btn btn-secondary" style={{ minWidth: 100 }} onClick={() => setShowDelModal(false)}>Cancelar</button>
              <button className="btn btn-danger"    style={{ minWidth: 100 }} onClick={doDelete} disabled={deleting}>
                {deleting ? "Eliminando…" : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
