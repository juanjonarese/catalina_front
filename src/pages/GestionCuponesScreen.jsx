import { useState, useEffect, useCallback } from "react";
import clientAxios from "../helpers/clientAxios";

/* ── Helpers ────────────────────────────────────────────────────── */
const todayISO = () => new Date().toISOString().split("T")[0];

const fmtDate = (iso) => {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

const fmtMoney = (n) => {
  if (!n) return "$0";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}k`;
  return `$${n}`;
};

const getCuponStatus = (c) => {
  if (c.state === "inactive")                            return "inactive";
  if (c.dateTo < todayISO())                            return "expired";
  if (c.maxUses !== null && c.usedCount >= c.maxUses)   return "expired";
  return "active";
};

const daysLeft = (dateTo) => Math.ceil((new Date(dateTo) - new Date()) / 86_400_000);

const validityPct = (dateFrom, dateTo) => {
  const total   = new Date(dateTo)   - new Date(dateFrom);
  const elapsed = new Date()         - new Date(dateFrom);
  return Math.max(0, Math.min(100, Math.round((1 - elapsed / total) * 100)));
};

const valueDisplay = (c) => {
  if (c.type === "pct")  return { num: c.value,  unit: "% OFF" };
  if (c.type === "flat") return { num: `$${(c.value / 1000).toFixed(0)}k`, unit: "OFF" };
  return { num: "1", unit: "NOCHE" };
};

const STATUS_BADGE = { active: "badge-confirmed", expired: "badge-cancelled", inactive: "badge-pending" };
const STATUS_LABEL = { active: "Activo", expired: "Vencido", inactive: "Inactivo" };

const SCOPE_OPTIONS = ["Estándar", "Suite", "Premium", "Apartamento", "Familiar"];

/* ── Empty form ─────────────────────────────────────────────────── */
const defaultDates = () => {
  const from = todayISO();
  const to   = new Date(); to.setDate(to.getDate() + 30);
  return { from, to: to.toISOString().split("T")[0] };
};

const emptyForm = () => {
  const d = defaultDates();
  return {
    code: "", name: "", desc: "", type: "pct", value: "",
    dateFrom: d.from, dateTo: d.to,
    scope: ["all"], minNights: 1, maxUses: "", state: "active",
  };
};

/* ── Filter configs ─────────────────────────────────────────────── */
const FILTERS = [
  { key: "all",      label: "Todos" },
  { key: "active",   label: "✅ Activos" },
  { key: "expired",  label: "⏰ Vencidos" },
  { key: "inactive", label: "⏸ Inactivos" },
  { key: "pct",      label: "% Porcentaje" },
  { key: "flat",     label: "$ Monto fijo" },
  { key: "free",     label: "🎁 Noche gratis" },
];

/* ── Prefixes for code generator ───────────────────────────────── */
const CODE_PREFIXES = ["HOTEL", "PROMO", "ENJOY", "STAY", "DEAL", "VIP", "LUCKY", "BONUS"];

/* ══ Component ══════════════════════════════════════════════════ */
export default function GestionCuponesScreen() {
  const [cupones, setCupones]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filtro, setFiltro]     = useState("all");
  const [busqueda, setBusqueda] = useState("");

  /* Modal add/edit */
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm]           = useState(emptyForm());
  const [formErr, setFormErr]     = useState({});
  const [saving, setSaving]       = useState(false);

  /* Modal delete */
  const [showDelModal, setShowDelModal] = useState(false);
  const [delTarget, setDelTarget]       = useState(null);
  const [deleting, setDeleting]         = useState(false);

  /* ── Carga ──────────────────────────────────────────────────── */
  const cargar = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await clientAxios.get("/cupones");
      setCupones(data.cupones);
    } catch (err) {
      console.error("Error al cargar cupones:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  useEffect(() => {
    const h = (e) => {
      if (e.key !== "Escape") return;
      setShowModal(false);
      setShowDelModal(false);
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, []);

  /* ── Stats ──────────────────────────────────────────────────── */
  const stats = {
    active:  cupones.filter(c => getCuponStatus(c) === "active").length,
    used:    cupones.reduce((a, c) => a + (c.usedCount || 0), 0),
    expired: cupones.filter(c => getCuponStatus(c) !== "active").length,
    saved:   cupones.reduce((a, c) => a + (c.savedAmount || 0), 0),
  };

  /* ── Filtrado ───────────────────────────────────────────────── */
  const lista = cupones.filter(c => {
    const s = getCuponStatus(c);
    if (filtro === "active"   && s !== "active")   return false;
    if (filtro === "expired"  && s !== "expired")  return false;
    if (filtro === "inactive" && s !== "inactive") return false;
    if (filtro === "pct"      && c.type !== "pct")  return false;
    if (filtro === "flat"     && c.type !== "flat") return false;
    if (filtro === "free"     && c.type !== "free") return false;
    if (busqueda) {
      const q = busqueda.toLowerCase();
      if (!c.code.toLowerCase().includes(q) && !c.name.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  /* ── Toggle estado ──────────────────────────────────────────── */
  const toggleEstado = async (c, e) => {
    e.stopPropagation();
    try {
      await clientAxios.patch(`/cupones/${c._id}/estado`);
      cargar();
    } catch (err) {
      console.error(err);
    }
  };

  /* ── Copiar código ──────────────────────────────────────────── */
  const copyCode = (code, e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code).catch(() => {});
  };

  /* ── Modal add/edit ─────────────────────────────────────────── */
  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm());
    setFormErr({});
    setShowModal(true);
  };

  const openEdit = (c) => {
    setEditingId(c._id);
    setForm({
      code: c.code, name: c.name, desc: c.desc || "",
      type: c.type, value: c.type === "free" ? "" : String(c.value),
      dateFrom: c.dateFrom, dateTo: c.dateTo,
      scope: c.scope || ["all"],
      minNights: c.minNights || 1,
      maxUses: c.maxUses ? String(c.maxUses) : "",
      state: c.state,
    });
    setFormErr({});
    setShowModal(true);
  };

  const genCode = () => {
    const prefix = CODE_PREFIXES[Math.floor(Math.random() * CODE_PREFIXES.length)];
    const num    = Math.floor(10 + Math.random() * 90);
    setForm(p => ({ ...p, code: `${prefix}${num}` }));
  };

  const toggleScope = (val) => {
    setForm(p => {
      if (val === "all") return { ...p, scope: ["all"] };
      const cur = p.scope.filter(s => s !== "all");
      return {
        ...p,
        scope: cur.includes(val)
          ? cur.filter(s => s !== val).length ? cur.filter(s => s !== val) : ["all"]
          : [...cur, val],
      };
    });
  };

  const validate = () => {
    const err = {};
    if (!form.code.trim())    err.code = "Requerido";
    if (!form.name.trim())    err.name = "Requerido";
    if (!form.dateFrom)       err.dateFrom = "Requerido";
    if (!form.dateTo)         err.dateTo = "Requerido";
    if (form.dateTo && form.dateFrom && form.dateTo < form.dateFrom)
      err.dateTo = "Debe ser posterior al inicio";
    if (form.type !== "free" && (!form.value || Number(form.value) <= 0))
      err.value = "Ingresá el valor";
    return err;
  };

  const saveCupon = async () => {
    const err = validate();
    if (Object.keys(err).length) { setFormErr(err); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        code:      form.code.toUpperCase().trim(),
        value:     form.type === "free" ? 1 : Number(form.value),
        minNights: Number(form.minNights) || 1,
        maxUses:   form.maxUses ? Number(form.maxUses) : null,
      };
      if (editingId) {
        await clientAxios.put(`/cupones/${editingId}`, payload);
      } else {
        await clientAxios.post("/cupones", payload);
      }
      setShowModal(false);
      cargar();
    } catch (err) {
      setFormErr({ code: err.response?.data?.msg || "Error al guardar" });
    } finally {
      setSaving(false);
    }
  };

  /* ── Delete ─────────────────────────────────────────────────── */
  const confirmDelete = (c, e) => { e.stopPropagation(); setDelTarget(c); setShowDelModal(true); };

  const doDelete = async () => {
    if (!delTarget) return;
    setDeleting(true);
    try {
      await clientAxios.delete(`/cupones/${delTarget._id}`);
      setShowDelModal(false);
      setDelTarget(null);
      cargar();
    } catch {
      // ignore
    } finally {
      setDeleting(false);
    }
  };

  /* ── Preview live ───────────────────────────────────────────── */
  const prevCode = form.code.toUpperCase() || "CODIGO";
  const prevName = form.name || "Nombre del cupón";
  const prevNum  = form.type === "free" ? "1" : (form.value || "0");
  const prevUnit = form.type === "pct" ? "% OFF" : form.type === "flat" ? "OFF" : "NOCHE";

  /* ── Render ──────────────────────────────────────────────────── */
  return (
    <>
      {/* PAGE HEADER */}
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-eyebrow">Promociones</div>
          <h1 className="page-title">Cupones y Descuentos</h1>
          <p className="page-subtitle">Creá y gestioná cupones de descuento con vigencia, tipo y alcance configurables.</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={cargar} disabled={loading}>↻ Actualizar</button>
          <button className="btn btn-primary"   onClick={openAdd}>＋ Nuevo Cupón</button>
        </div>
      </div>

      {/* STATS */}
      <div className="stats-strip">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "rgba(74,124,89,.12)", color: "#4A7C59" }}>🎫</div>
          <div className="stat-info"><div className="stat-num">{stats.active}</div><div className="stat-label">Activos</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "rgba(45,109,164,.12)", color: "#2D6DA4" }}>📊</div>
          <div className="stat-info"><div className="stat-num">{stats.used}</div><div className="stat-label">Usos totales</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "rgba(192,57,43,.12)", color: "#C0392B" }}>⏰</div>
          <div className="stat-info"><div className="stat-num">{stats.expired}</div><div className="stat-label">Vencidos / inactivos</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "rgba(107,79,160,.12)", color: "#6B4FA0" }}>💸</div>
          <div className="stat-info"><div className="stat-num">{fmtMoney(stats.saved)}</div><div className="stat-label">Descuento otorgado</div></div>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="toolbar" style={{ flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
        <div className="search-wrap">
          <span className="search-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
          </span>
          <input
            type="search" className="search-input"
            placeholder="Buscar por código o nombre…"
            value={busqueda} onChange={e => setBusqueda(e.target.value)}
          />
        </div>
        <div className="cpn-filter-chips">
          {FILTERS.map(f => (
            <button
              key={f.key}
              className={`cpn-chip${filtro === f.key ? " active" : ""}`}
              onClick={() => setFiltro(f.key)}
            >{f.label}</button>
          ))}
        </div>
        <div style={{ marginLeft: "auto", fontSize: 12, color: "var(--text-3)" }}>
          {lista.length} de {cupones.length} cupones
        </div>
      </div>

      {/* GRID */}
      {loading ? (
        <div className="empty-state"><div className="empty-icon">⏳</div><div className="empty-title">Cargando cupones…</div></div>
      ) : (
        <div className="coupons-grid">
          {lista.length === 0 ? (
            <div style={{ gridColumn: "1/-1", display: "flex", flexDirection: "column", alignItems: "center", padding: "64px 32px", gap: 12, textAlign: "center" }}>
              <div style={{ fontSize: 48, opacity: .3 }}>🎫</div>
              <div style={{ fontSize: 18, fontWeight: 600, color: "var(--text-2)" }}>Sin resultados</div>
              <div style={{ fontSize: 13, color: "var(--text-3)" }}>No hay cupones que coincidan con los filtros.</div>
            </div>
          ) : lista.map((c, i) => {
            const s      = getCuponStatus(c);
            const vd     = valueDisplay(c);
            const dl     = daysLeft(c.dateTo);
            const vpct   = validityPct(c.dateFrom, c.dateTo);
            const barCls = vpct > 40 ? "ok" : vpct > 15 ? "warning" : "danger";
            const cardCls = s === "expired" ? "expired-card" : s === "inactive" ? "inactive-card" : "";
            const scopeTxt = (c.scope || []).includes("all") ? "Todas las habitaciones" : c.scope.join(", ");
            const usePct   = c.maxUses ? Math.round(c.usedCount / c.maxUses * 100) : null;

            let dlLabel;
            if (s === "active") {
              if (dl <= 0)      dlLabel = <span style={{ color: "#C0392B" }}>Vence hoy</span>;
              else if (dl <= 7) dlLabel = <span style={{ color: "#C8882A" }}>Vence en {dl}d</span>;
              else              dlLabel = <span style={{ color: "var(--text-3)" }}>Vence {fmtDate(c.dateTo)}</span>;
            } else if (s === "expired") {
              dlLabel = <span style={{ color: "#C0392B" }}>Venció {fmtDate(c.dateTo)}</span>;
            } else {
              dlLabel = <span style={{ color: "var(--text-3)" }}>Inactivo</span>;
            }

            return (
              <div
                key={c._id}
                className={`coupon-card ${cardCls}`}
                style={{ animationDelay: `${i * 0.05}s` }}
                onClick={() => openEdit(c)}
              >
                {/* Ticket */}
                <div className="coupon-ticket">
                  <div className={`coupon-stripe ${c.type}`} />
                  <div className="coupon-main">
                    <div className={`coupon-discount-badge ${c.type}`}>
                      <div className="coupon-discount-num">{vd.num}</div>
                      <div className="coupon-discount-unit">{vd.unit}</div>
                    </div>
                    <div className="coupon-info">
                      <div className="coupon-code-row">
                        <span className="coupon-code" onClick={e => copyCode(c.code, e)}>{c.code}</span>
                        <button className="coupon-copy-btn" onClick={e => copyCode(c.code, e)} title="Copiar código">⎘</button>
                      </div>
                      <div className="coupon-name">{c.name}</div>
                      {c.desc && <div className="coupon-desc">{c.desc}</div>}
                    </div>
                  </div>
                </div>

                {/* Tear */}
                <div className="coupon-tear" />

                {/* Validity bar */}
                <div className="coupon-validity">
                  <div className="coupon-validity-label">
                    <span>Vigencia</span>
                    <span>{dlLabel}</span>
                  </div>
                  <div className="coupon-progress-track">
                    <div
                      className={`coupon-progress-fill ${barCls}`}
                      style={{ width: `${s === "active" ? vpct : 0}%` }}
                    />
                  </div>
                </div>

                {/* Meta */}
                <div className="coupon-footer" style={{ paddingTop: 0 }}>
                  <div className="coupon-meta">
                    <div className="coupon-meta-row">
                      <span className="coupon-meta-item">
                        📅 <strong>{fmtDate(c.dateFrom)}</strong> → <strong>{fmtDate(c.dateTo)}</strong>
                      </span>
                    </div>
                    <div className="coupon-meta-row">
                      <span className="coupon-meta-item">🛏 {scopeTxt}</span>
                      {c.minNights > 1 && (
                        <span className="coupon-meta-item">🌙 Mín. <strong>{c.minNights}</strong>n</span>
                      )}
                    </div>
                    <div className="coupon-meta-row">
                      <span className="coupon-meta-item">
                        📊 <strong>{c.usedCount}</strong>{c.maxUses ? `/${c.maxUses}` : ""} usos
                        {usePct !== null && <span style={{ fontSize: 10, color: "var(--text-3)", marginLeft: 4 }}>({usePct}%)</span>}
                      </span>
                      {c.savedAmount > 0 && (
                        <span className="coupon-meta-item">💸 <strong>{fmtMoney(c.savedAmount)}</strong></span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status + actions */}
                <div className="coupon-status-row" onClick={e => e.stopPropagation()}>
                  <span className={`badge ${STATUS_BADGE[s]}`}>{STATUS_LABEL[s]}</span>
                  <div className="coupon-actions">
                    {s === "active"   && <button className="coupon-action-btn" onClick={e => toggleEstado(c, e)}>⏸ Pausar</button>}
                    {s === "inactive" && <button className="coupon-action-btn" onClick={e => toggleEstado(c, e)}>▶ Activar</button>}
                    <button className="coupon-action-btn" onClick={e => { e.stopPropagation(); openEdit(c); }}>✏️</button>
                    <button className="coupon-action-btn danger" onClick={e => confirmDelete(c, e)}>🗑</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ══ MODAL: ADD / EDIT ═══════════════════════════════════ */}
      {showModal && (
        <div className="modal-overlay open" onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="modal" style={{ maxWidth: 580 }}>
            <div className="modal-header">
              <div className="modal-title-group">
                <div className="modal-eyebrow">{editingId ? "Editar cupón" : "Nuevo cupón"}</div>
                <div className="modal-title">{editingId ? "Editar Cupón" : "Crear Cupón"}</div>
              </div>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <div className="modal-body" style={{ gap: 20 }}>

              {/* Preview live */}
              <div className="coupon-preview">
                <div className={`preview-badge ${form.type}`}>
                  <div className="preview-num">{prevNum}</div>
                  <div className="preview-unit">{prevUnit}</div>
                </div>
                <div className="preview-text">
                  <div className="preview-code">{prevCode}</div>
                  <div className="preview-name">{prevName}</div>
                </div>
              </div>

              <div className="form-grid">

                {/* Tipo */}
                <div className="form-group full">
                  <label className="form-label">Tipo de descuento <span className="required">*</span></label>
                  <div className="type-selector">
                    {[
                      { val: "pct",  icon: "%",  label: "Porcentaje", sub: "Ej: 15% OFF" },
                      { val: "flat", icon: "$",  label: "Monto fijo", sub: "Ej: $5.000 OFF" },
                      { val: "free", icon: "🎁", label: "Noche gratis", sub: "1 noche sin cargo" },
                    ].map(t => (
                      <div
                        key={t.val}
                        className={`type-option${form.type === t.val ? " selected" : ""}`}
                        onClick={() => setForm(p => ({ ...p, type: t.val, value: t.val === "free" ? "" : p.value }))}
                      >
                        <span className="type-option-icon">{t.icon}</span>
                        <span className="type-option-label">{t.label}</span>
                        <span className="type-option-sub">{t.sub}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Código */}
                <div className="form-group">
                  <label className="form-label">Código <span className="required">*</span></label>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      type="text"
                      className={`form-input${formErr.code ? " error" : ""}`}
                      placeholder="Ej: VERANO25"
                      style={{ textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, flex: 1 }}
                      value={form.code}
                      onChange={e => { setForm(p => ({ ...p, code: e.target.value.toUpperCase() })); setFormErr(p => ({ ...p, code: "" })); }}
                    />
                    <button type="button" className="btn btn-secondary" onClick={genCode} style={{ whiteSpace: "nowrap", fontSize: 12 }}>
                      ✦ Generar
                    </button>
                  </div>
                  {formErr.code && <div style={{ color: "#C0392B", fontSize: 11, marginTop: 3 }}>{formErr.code}</div>}
                </div>

                {/* Valor */}
                {form.type !== "free" && (
                  <div className="form-group">
                    <label className="form-label">
                      {form.type === "pct" ? "Descuento (%)" : "Monto de descuento ($)"} <span className="required">*</span>
                    </label>
                    <input
                      type="number"
                      className={`form-input${formErr.value ? " error" : ""}`}
                      min="1" max={form.type === "pct" ? 100 : undefined}
                      placeholder={form.type === "pct" ? "Ej: 15" : "Ej: 5000"}
                      value={form.value}
                      onChange={e => { setForm(p => ({ ...p, value: e.target.value })); setFormErr(p => ({ ...p, value: "" })); }}
                    />
                    {formErr.value && <div style={{ color: "#C0392B", fontSize: 11, marginTop: 3 }}>{formErr.value}</div>}
                  </div>
                )}

                {/* Nombre */}
                <div className="form-group">
                  <label className="form-label">Nombre del cupón <span className="required">*</span></label>
                  <input
                    type="text" className={`form-input${formErr.name ? " error" : ""}`}
                    placeholder="Ej: Descuento Verano"
                    value={form.name}
                    onChange={e => { setForm(p => ({ ...p, name: e.target.value })); setFormErr(p => ({ ...p, name: "" })); }}
                  />
                  {formErr.name && <div style={{ color: "#C0392B", fontSize: 11, marginTop: 3 }}>{formErr.name}</div>}
                </div>

                {/* Descripción */}
                <div className="form-group full">
                  <label className="form-label">Descripción (opcional)</label>
                  <textarea
                    className="form-textarea" rows={2}
                    placeholder="Condiciones de uso, restricciones o información adicional…"
                    value={form.desc}
                    onChange={e => setForm(p => ({ ...p, desc: e.target.value }))}
                  />
                </div>

                {/* Fechas */}
                <div className="form-group">
                  <label className="form-label">Válido desde <span className="required">*</span></label>
                  <input
                    type="date" className={`form-input${formErr.dateFrom ? " error" : ""}`}
                    value={form.dateFrom}
                    onChange={e => { setForm(p => ({ ...p, dateFrom: e.target.value })); setFormErr(p => ({ ...p, dateFrom: "" })); }}
                  />
                  {formErr.dateFrom && <div style={{ color: "#C0392B", fontSize: 11, marginTop: 3 }}>{formErr.dateFrom}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">Válido hasta <span className="required">*</span></label>
                  <input
                    type="date" className={`form-input${formErr.dateTo ? " error" : ""}`}
                    value={form.dateTo}
                    onChange={e => { setForm(p => ({ ...p, dateTo: e.target.value })); setFormErr(p => ({ ...p, dateTo: "" })); }}
                  />
                  {formErr.dateTo && <div style={{ color: "#C0392B", fontSize: 11, marginTop: 3 }}>{formErr.dateTo}</div>}
                </div>

                {/* Alcance */}
                <div className="form-group full">
                  <label className="form-label">Aplica a</label>
                  <div className="scope-pills">
                    <div
                      className={`scope-pill${form.scope.includes("all") ? " checked" : ""}`}
                      onClick={() => toggleScope("all")}
                    >🛏 Todas las habitaciones</div>
                    {SCOPE_OPTIONS.map(s => (
                      <div
                        key={s}
                        className={`scope-pill${form.scope.includes(s) ? " checked" : ""}`}
                        onClick={() => toggleScope(s)}
                      >{s}</div>
                    ))}
                  </div>
                </div>

                {/* Noches mínimas + límite usos */}
                <div className="form-group">
                  <label className="form-label">Noches mínimas</label>
                  <input
                    type="number" className="form-input" min="1"
                    value={form.minNights}
                    onChange={e => setForm(p => ({ ...p, minNights: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Límite de usos</label>
                  <input
                    type="number" className="form-input" min="1" placeholder="Sin límite"
                    value={form.maxUses}
                    onChange={e => setForm(p => ({ ...p, maxUses: e.target.value }))}
                  />
                </div>

                {/* Estado */}
                <div className="form-group full">
                  <label className="form-label">Estado</label>
                  <div style={{ display: "flex", gap: 10 }}>
                    {[
                      { val: "active",   icon: "✅", label: "Activo" },
                      { val: "inactive", icon: "⏸",  label: "Inactivo" },
                    ].map(s => (
                      <div
                        key={s.val}
                        className={`type-option${form.state === s.val ? " selected" : ""}`}
                        style={{ flex: 1, flexDirection: "row", gap: 10, padding: "10px 16px" }}
                        onClick={() => setForm(p => ({ ...p, state: s.val }))}
                      >
                        <span style={{ fontSize: 18 }}>{s.icon}</span>
                        <span className="type-option-label">{s.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={saveCupon} disabled={saving}>
                {saving ? "Guardando…" : "Guardar cupón"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL: DELETE ═══════════════════════════════════════ */}
      {showDelModal && (
        <div className="modal-overlay open" onClick={e => { if (e.target === e.currentTarget) setShowDelModal(false); }}>
          <div className="modal modal-sm">
            <div style={{ padding: "28px 24px", textAlign: "center" }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🗑</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-1)", marginBottom: 8 }}>¿Eliminar cupón?</div>
              <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.5 }}>
                El cupón <strong>{delTarget?.code}</strong> será eliminado permanentemente.
                Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="modal-footer" style={{ justifyContent: "center", gap: 12 }}>
              <button className="btn btn-secondary" style={{ minWidth: 100 }} onClick={() => setShowDelModal(false)}>Cancelar</button>
              <button className="btn btn-danger"    style={{ minWidth: 100 }} onClick={doDelete} disabled={deleting}>
                {deleting ? "Eliminando…" : "Sí, eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
