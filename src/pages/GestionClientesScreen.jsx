import { useState, useEffect, useCallback } from "react";
import clientAxios from "../helpers/clientAxios";

/* ── Helpers ───────────────────────────────────────────────────── */
const money = (n) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n || 0);

const fmtDate = (d) => {
  if (!d) return "—";
  const dt = new Date(d);
  return isNaN(dt) ? d : dt.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const fmtDT = (d) => {
  if (!d) return "—";
  const dt = new Date(d);
  return isNaN(dt) ? d : dt.toLocaleString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

const initials = (c) =>
  `${c.firstName?.[0] || ""}${c.lastName?.[0] || ""}`.toUpperCase() || "?";

const fullName = (c) => `${c.firstName} ${c.lastName}`.trim();

const nightsBetween = (ci, co) =>
  Math.max(0, Math.round((new Date(co) - new Date(ci)) / 86400000));

const METHODS = {
  efectivo:      { icon: "💵", label: "Efectivo",      cls: "pay-icon-efectivo" },
  transferencia: { icon: "🏦", label: "Transferencia", cls: "pay-icon-transferencia" },
  mercadopago:   { icon: "📱", label: "Mercado Pago",  cls: "pay-icon-mercadopago" },
  otro:          { icon: "💳", label: "Otro",          cls: "pay-icon-otro" },
};

const ESTADO_BADGE = {
  pendiente:  "badge-pending",
  confirmada: "badge-confirmed",
  completada: "badge-completed",
  cancelada:  "badge-cancelled",
};

/* ── Empty form state ──────────────────────────────────────────── */
const EMPTY_FORM = {
  firstName: "", lastName: "", email: "", phone: "", dni: "",
  dob: "", nationality: "", address: "", city: "", province: "", notes: "", vip: "",
};

const EMPTY_PAY = {
  reservaId: "", method: "efectivo", amount: "", date: "", reference: "", notes: "",
};

/* ══ Component ══════════════════════════════════════════════════ */
export default function GestionClientesScreen() {
  const [clientes, setClientes]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [busqueda, setBusqueda]     = useState("");
  const [filtro, setFiltro]         = useState("all");
  const [openCards, setOpenCards]   = useState(new Set());
  const [activeTabs, setActiveTabs] = useState({});

  /* Modal add/edit */
  const [showModal, setShowModal]   = useState(false);
  const [editingId, setEditingId]   = useState(null);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [formErr, setFormErr]       = useState({});
  const [saving, setSaving]         = useState(false);

  /* Modal pago */
  const [showPayModal, setShowPayModal]     = useState(false);
  const [payClientId, setPayClientId]       = useState(null);
  const [payForm, setPayForm]               = useState(EMPTY_PAY);
  const [savingPay, setSavingPay]           = useState(false);

  /* Modal eliminar */
  const [showDelModal, setShowDelModal]     = useState(false);
  const [delTarget, setDelTarget]           = useState(null);
  const [deleting, setDeleting]             = useState(false);

  /* ── Carga de datos ────────────────────────────────────────── */
  const cargar = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await clientAxios.get("/clientes");
      setClientes(data.clientes);
    } catch (err) {
      console.error("Error al cargar clientes:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  /* Escape key */
  useEffect(() => {
    const handler = (e) => {
      if (e.key !== "Escape") return;
      setShowModal(false);
      setShowPayModal(false);
      setShowDelModal(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  /* ── Stats ──────────────────────────────────────────────────── */
  const stats = {
    total:   clientes.length,
    inhouse: clientes.filter(c => c.inhouse).length,
    vip:     clientes.filter(c => c.vip).length,
    deuda:   clientes.filter(c => c.deuda > 0).length,
  };

  /* ── Filtro + búsqueda ──────────────────────────────────────── */
  const lista = clientes.filter(c => {
    const q = busqueda.toLowerCase().trim();
    if (q && ![fullName(c), c.email, c.dni, c.phone].some(s => (s||"").toLowerCase().includes(q))) return false;
    if (filtro === "inhouse") return c.inhouse;
    if (filtro === "vip")     return c.vip;
    if (filtro === "debt")    return c.deuda > 0;
    return true;
  });

  /* ── Card toggle / tabs ─────────────────────────────────────── */
  const toggleCard = (id) => {
    setOpenCards(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const switchTab = (clientId, tab) => {
    setActiveTabs(prev => ({ ...prev, [clientId]: tab }));
  };

  /* ── Modal add/edit ─────────────────────────────────────────── */
  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormErr({});
    setShowModal(true);
  };

  const openEdit = (c) => {
    setEditingId(c._id);
    setForm({
      firstName: c.firstName, lastName: c.lastName, email: c.email,
      phone: c.phone||"", dni: c.dni||"", dob: c.dob||"",
      nationality: c.nationality||"", address: c.address||"",
      city: c.city||"", province: c.province||"",
      notes: c.notes||"", vip: c.vip ? "vip" : "",
    });
    setFormErr({});
    setShowModal(true);
  };

  const validateForm = () => {
    const err = {};
    if (!form.firstName.trim()) err.firstName = "Requerido";
    if (!form.lastName.trim())  err.lastName  = "Requerido";
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      err.email = "Email inválido";
    return err;
  };

  const saveCliente = async () => {
    const err = validateForm();
    if (Object.keys(err).length) { setFormErr(err); return; }
    setSaving(true);
    try {
      if (editingId) {
        await clientAxios.put(`/clientes/${editingId}`, form);
      } else {
        await clientAxios.post("/clientes", form);
      }
      setShowModal(false);
      cargar();
    } catch (err) {
      setFormErr({ email: err.response?.data?.msg || "Error al guardar" });
    } finally {
      setSaving(false);
    }
  };

  /* ── Modal delete ───────────────────────────────────────────── */
  const confirmDelete = (c) => { setDelTarget(c); setShowDelModal(true); };

  const doDelete = async () => {
    if (!delTarget) return;
    setDeleting(true);
    try {
      await clientAxios.delete(`/clientes/${delTarget._id}`);
      setShowDelModal(false);
      setDelTarget(null);
      cargar();
    } catch {
      // ignore
    } finally {
      setDeleting(false);
    }
  };

  /* ── Modal pago ─────────────────────────────────────────────── */
  const openPay = (clientId) => {
    setPayClientId(clientId);
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    setPayForm({ ...EMPTY_PAY, date: now.toISOString().slice(0, 16) });
    setShowPayModal(true);
  };

  const savePay = async () => {
    if (!payForm.amount || Number(payForm.amount) <= 0) return;
    if (!payForm.date) return;
    setSavingPay(true);
    try {
      await clientAxios.post(`/clientes/${payClientId}/pagos`, {
        ...payForm,
        amount: Number(payForm.amount),
        reservaId: payForm.reservaId || undefined,
      });
      setShowPayModal(false);
      // Keep the card open on pagos tab
      setOpenCards(prev => new Set([...prev, payClientId]));
      setActiveTabs(prev => ({ ...prev, [payClientId]: "pay" }));
      cargar();
    } catch {
      // ignore
    } finally {
      setSavingPay(false);
    }
  };

  /* ── Balance bar ─────────────────────────────────────────────── */
  const payClient = clientes.find(c => c._id === payClientId);
  const balanceData = (() => {
    if (!payClient) return null;
    if (!payForm.reservaId) {
      const totalDue  = (payClient.reservas || []).filter(r => r.estado !== "cancelada").reduce((s, r) => s + r.precioTotal, 0);
      const totalPaid = payClient.totalPaid || 0;
      return { label: "Total reservas", total: totalDue, paid: totalPaid, pending: Math.max(0, totalDue - totalPaid) };
    }
    const res      = (payClient.reservas || []).find(r => r._id === payForm.reservaId);
    const resPaid  = (payClient.pagos || []).filter(p => p.reservaId === payForm.reservaId).reduce((s, p) => s + p.amount, 0);
    const due      = res ? res.precioTotal - resPaid : 0;
    const after    = Math.max(0, due - (Number(payForm.amount) || 0));
    return { label: "Total reserva", total: res?.precioTotal || 0, paid: resPaid, pending: after };
  })();

  /* ── Render ──────────────────────────────────────────────────── */
  return (
    <>
      {/* PAGE HEADER */}
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-eyebrow">Gestión</div>
          <h1 className="page-title">Clientes</h1>
          <p className="page-subtitle">Fichas completas, historial de estadías y pagos registrados</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={cargar} disabled={loading}>↻ Actualizar</button>
          <button className="btn btn-primary"   onClick={openAdd}>＋ Nuevo cliente</button>
        </div>
      </div>

      {/* STATS */}
      <div className="stats-strip">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "var(--brand-light,#4A7C59)", color: "white" }}>👥</div>
          <div className="stat-info"><div className="stat-num">{stats.total}</div><div className="stat-label">Total clientes</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "rgba(74,124,89,.12)", color: "var(--green,#4A7C59)" }}>🏨</div>
          <div className="stat-info"><div className="stat-num">{stats.inhouse}</div><div className="stat-label">En casa hoy</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "rgba(200,136,42,.12)", color: "var(--amber,#C8882A)" }}>⭐</div>
          <div className="stat-info"><div className="stat-num">{stats.vip}</div><div className="stat-label">Clientes VIP</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "rgba(192,57,43,.12)", color: "var(--red,#C0392B)" }}>💳</div>
          <div className="stat-info"><div className="stat-num">{stats.deuda}</div><div className="stat-label">Con saldo pendiente</div></div>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="cl-toolbar">
        <div className="cl-search-wrap">
          <span className="cl-search-icon">🔍</span>
          <input
            type="text" className="cl-search"
            placeholder="Buscar por nombre, email, DNI…"
            value={busqueda} onChange={e => setBusqueda(e.target.value)}
          />
        </div>
        <div className="cl-filter-chips">
          {[["all","Todos"],["inhouse","En casa"],["vip","VIP"],["debt","Con deuda"]].map(([k, lbl]) => (
            <button
              key={k}
              className={`cl-chip${filtro === k ? " active" : ""}`}
              onClick={() => setFiltro(k)}
            >{lbl}</button>
          ))}
        </div>
        <div className="cl-count">{lista.length} cliente{lista.length !== 1 ? "s" : ""}</div>
      </div>

      {/* LISTA */}
      {loading ? (
        <div className="empty-state"><div className="empty-icon">⏳</div><div className="empty-title">Cargando clientes…</div></div>
      ) : lista.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">👥</div>
          <div className="empty-title">Sin clientes</div>
          <div className="empty-text">Agregá tu primer cliente o ajustá el filtro.</div>
          <button className="btn btn-primary" onClick={openAdd}>＋ Nuevo cliente</button>
        </div>
      ) : lista.map((c, idx) => {
        const isOpen   = openCards.has(c._id);
        const activeTab = activeTabs[c._id] || "info";
        const reservas = c.reservas || [];
        const pagos    = c.pagos || [];

        return (
          <div key={c._id} className={`cl-card${isOpen ? " open" : ""}`} style={{ animationDelay: `${idx * 0.05}s` }}>
            {/* Header */}
            <div className="cl-card-header" onClick={() => toggleCard(c._id)}>
              <div className={`cl-avatar${c.vip ? " vip" : ""}`}>{initials(c)}</div>
              <div>
                <div className="cl-name">
                  {fullName(c)} {c.vip && <span style={{ fontSize: 11 }}>⭐</span>}
                  {c.inhouse && <span className="badge badge-confirmed" style={{ fontSize: 10, marginLeft: 6 }}>🏨 En casa</span>}
                  {!c.inhouse && c.deuda > 0 && <span className="badge badge-pending" style={{ fontSize: 10, marginLeft: 6 }}>💳 Saldo pend.</span>}
                </div>
                <div className="cl-meta">
                  {c.email && <span className="cl-meta-item">✉ {c.email}</span>}
                  {c.phone && <span className="cl-meta-item">📞 {c.phone}</span>}
                  {c.dni   && <span className="cl-meta-item">🪪 {c.dni}</span>}
                </div>
              </div>
              <div className="cl-header-right">
                <div className="cl-stats">
                  <div className="cl-stat">
                    <div className="cl-stat-num">{reservas.length}</div>
                    <div className="cl-stat-label">Estadías</div>
                  </div>
                  <div className="cl-stat">
                    <div className="cl-stat-num" style={{ color: c.deuda > 0 ? "var(--amber,#C8882A)" : "var(--green,#4A7C59)" }}>
                      {money(c.totalPaid)}
                    </div>
                    <div className="cl-stat-label">
                      Pagado{c.deuda > 0 ? ` · debe ${money(c.deuda)}` : ""}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, marginLeft: 8 }} onClick={e => e.stopPropagation()}>
                  <button className="btn btn-secondary" style={{ fontSize: 11, padding: "5px 10px" }} onClick={() => openPay(c._id)}>💳 Pago</button>
                  <button className="btn btn-secondary" style={{ fontSize: 11, padding: "5px 10px" }} onClick={() => openEdit(c)}>✏</button>
                  <button className="btn btn-danger"    style={{ fontSize: 11, padding: "5px 10px" }} onClick={() => confirmDelete(c)}>🗑</button>
                </div>
                <span className="cl-chevron">▾</span>
              </div>
            </div>

            {/* Detail */}
            {isOpen && (
              <div className="cl-detail">
                <div className="cl-detail-tabs">
                  {[["info","Datos personales"],["res",`Reservas (${reservas.length})`],["pay",`Pagos (${pagos.length})`]].map(([t, lbl]) => (
                    <div
                      key={t}
                      className={`cl-dtab${activeTab === t ? " active" : ""}`}
                      onClick={() => switchTab(c._id, t)}
                    >{lbl}</div>
                  ))}
                </div>

                {/* Pane: INFO */}
                {activeTab === "info" && (
                  <div className="cl-info-grid">
                    {[
                      ["Nombre completo", fullName(c)],
                      ["DNI / Documento", c.dni || "—"],
                      ["Fecha de nac.", c.dob ? fmtDate(c.dob) : "—"],
                      ["Nacionalidad", c.nationality || "—"],
                      ["Email", c.email || "—"],
                      ["Teléfono", c.phone || "—"],
                      ["Dirección", c.address || "—"],
                      ["Ciudad", c.city || "—"],
                      ["Provincia", c.province || "—"],
                      ["Cliente desde", fmtDate(c.createdAt)],
                      ["Categoría", c.vip ? "⭐ VIP" : "Regular"],
                    ].map(([label, val]) => (
                      <div key={label} className="cl-info-item">
                        <div className="cl-info-label">{label}</div>
                        <div className="cl-info-val">{val}</div>
                      </div>
                    ))}
                    {c.notes && (
                      <div className="cl-info-item" style={{ gridColumn: "1/-1" }}>
                        <div className="cl-info-label">Notas</div>
                        <div className="cl-info-val">{c.notes}</div>
                      </div>
                    )}
                  </div>
                )}

                {/* Pane: RESERVAS */}
                {activeTab === "res" && (
                  <div className="cl-res-list">
                    {reservas.length === 0
                      ? <div style={{ textAlign: "center", color: "var(--text-3)", padding: "20px 0" }}>Sin reservas registradas</div>
                      : [...reservas].sort((a, b) => new Date(b.fechaCheckIn) - new Date(a.fechaCheckIn)).map(r => {
                          const n    = nightsBetween(r.fechaCheckIn, r.fechaCheckOut);
                          const hab  = r.habitacionId;
                          const room = hab ? `${hab.nombre || hab.numero || "Habitación"} · ${hab.tipo || ""}` : r.habitacionId;
                          return (
                            <div key={r._id} className="cl-res-row">
                              <div className="cl-res-id">{String(r._id).slice(-6).toUpperCase()}</div>
                              <div className="cl-res-info">
                                <div className="cl-res-room">{room}</div>
                                <div className="cl-res-dates">{fmtDate(r.fechaCheckIn)} → {fmtDate(r.fechaCheckOut)}</div>
                              </div>
                              <div className="cl-res-nights">{n} noche{n !== 1 ? "s" : ""}</div>
                              <span className={`badge ${ESTADO_BADGE[r.estado] || "badge-pending"}`} style={{ fontSize: 10 }}>{r.estado}</span>
                              <div className="cl-res-price">{money(r.precioTotal)}</div>
                            </div>
                          );
                        })}
                  </div>
                )}

                {/* Pane: PAGOS */}
                {activeTab === "pay" && (
                  <div className="cl-pay-wrap">
                    <div className="cl-pay-header">
                      <div>
                        <div className="cl-pay-total">{money(c.totalPaid)} pagado</div>
                        <div className="cl-pay-sub">{c.deuda > 0 ? `Saldo pendiente: ${money(c.deuda)}` : "Sin deuda pendiente"}</div>
                      </div>
                      <button className="btn btn-primary" style={{ fontSize: 12 }} onClick={() => openPay(c._id)}>＋ Registrar pago</button>
                    </div>
                    {pagos.length === 0
                      ? <div style={{ textAlign: "center", color: "var(--text-3)", padding: "20px 0" }}>Sin pagos registrados</div>
                      : <div style={{ borderTop: "1px solid var(--border)" }}>
                          {[...pagos].sort((a, b) => new Date(b.date) - new Date(a.date)).map(p => {
                            const m = METHODS[p.method] || METHODS.otro;
                            const res = reservas.find(r => String(r._id) === String(p.reservaId));
                            return (
                              <div key={p._id} className="cl-pay-row">
                                <div className={`cl-pay-icon ${m.cls}`}>{m.icon}</div>
                                <div className="cl-pay-info">
                                  <div className="cl-pay-label">
                                    {m.label}
                                    {p.reference && <span style={{ fontSize: 11, color: "var(--text-3)", marginLeft: 4 }}>· {p.reference}</span>}
                                  </div>
                                  <div className="cl-pay-meta">
                                    {fmtDT(p.date)}
                                    {res && ` · Res. ${String(res._id).slice(-6).toUpperCase()}`}
                                    {p.notes && ` · ${p.notes}`}
                                  </div>
                                </div>
                                <div className="cl-pay-amount paid">{money(p.amount)}</div>
                              </div>
                            );
                          })}
                        </div>}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* ══ MODAL: ADD / EDIT ═══════════════════════════════════ */}
      {showModal && (
        <div className="modal-overlay open" onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="modal" style={{ maxWidth: 660 }}>
            <div className="modal-header">
              <div className="modal-title-group">
                <div className="modal-eyebrow">{editingId ? "Editar cliente" : "Nuevo cliente"}</div>
                <div className="modal-title">{editingId ? `${form.firstName} ${form.lastName}` : "Registrar Cliente"}</div>
              </div>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ gap: 16 }}>
              <div className="form-grid">

                <div className="cl-section-title">Datos personales</div>

                <FieldGroup label="Nombre" required error={formErr.firstName}>
                  <input type="text" className={`form-input${formErr.firstName ? " error" : ""}`} placeholder="Nombre"
                    value={form.firstName} onChange={e => { setForm(p => ({ ...p, firstName: e.target.value })); setFormErr(p => ({ ...p, firstName: "" })); }} autoFocus />
                </FieldGroup>
                <FieldGroup label="Apellido" required error={formErr.lastName}>
                  <input type="text" className={`form-input${formErr.lastName ? " error" : ""}`} placeholder="Apellido"
                    value={form.lastName} onChange={e => { setForm(p => ({ ...p, lastName: e.target.value })); setFormErr(p => ({ ...p, lastName: "" })); }} />
                </FieldGroup>
                <FieldGroup label="DNI / Documento">
                  <input type="text" className="form-input" placeholder="Ej: 30.123.456"
                    value={form.dni} onChange={e => setForm(p => ({ ...p, dni: e.target.value }))} />
                </FieldGroup>
                <FieldGroup label="Fecha de nacimiento">
                  <input type="date" className="form-input"
                    value={form.dob} onChange={e => setForm(p => ({ ...p, dob: e.target.value }))} />
                </FieldGroup>
                <FieldGroup label="Nacionalidad">
                  <input type="text" className="form-input" placeholder="Ej: Argentina"
                    value={form.nationality} onChange={e => setForm(p => ({ ...p, nationality: e.target.value }))} />
                </FieldGroup>
                <FieldGroup label="Categoría">
                  <select className="form-select-modal" value={form.vip} onChange={e => setForm(p => ({ ...p, vip: e.target.value }))}>
                    <option value="">Regular</option>
                    <option value="vip">⭐ VIP</option>
                  </select>
                </FieldGroup>

                <div className="cl-section-title">Contacto</div>

                <FieldGroup label="Email" required error={formErr.email}>
                  <input type="email" className={`form-input${formErr.email ? " error" : ""}`} placeholder="email@ejemplo.com"
                    value={form.email} onChange={e => { setForm(p => ({ ...p, email: e.target.value })); setFormErr(p => ({ ...p, email: "" })); }} />
                  {formErr.email && <div style={{ color: "var(--red,#C0392B)", fontSize: 11, marginTop: 3 }}>{formErr.email}</div>}
                </FieldGroup>
                <FieldGroup label="Teléfono">
                  <input type="tel" className="form-input" placeholder="Ej: 0381 555 1234"
                    value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
                </FieldGroup>

                <div className="cl-section-title">Dirección</div>

                <div className="form-group full">
                  <label className="form-label">Calle y número</label>
                  <input type="text" className="form-input" placeholder="Ej: Av. Corrientes 1234"
                    value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} />
                </div>
                <FieldGroup label="Ciudad">
                  <input type="text" className="form-input" placeholder="Ciudad"
                    value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} />
                </FieldGroup>
                <FieldGroup label="Provincia">
                  <input type="text" className="form-input" placeholder="Provincia"
                    value={form.province} onChange={e => setForm(p => ({ ...p, province: e.target.value }))} />
                </FieldGroup>

                <div className="cl-section-title">Notas internas</div>
                <div className="form-group full">
                  <textarea className="form-textarea" rows={2} placeholder="Preferencias, alergias, notas especiales…"
                    value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={saveCliente} disabled={saving}>
                {saving ? "Guardando…" : "Guardar cliente"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL: PAGO ═════════════════════════════════════════ */}
      {showPayModal && payClient && (
        <div className="modal-overlay open" onClick={e => { if (e.target === e.currentTarget) setShowPayModal(false); }}>
          <div className="modal" style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <div className="modal-title-group">
                <div className="modal-eyebrow">Pago de {fullName(payClient)}</div>
                <div className="modal-title">Registrar Pago</div>
              </div>
              <button className="modal-close" onClick={() => setShowPayModal(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ gap: 16 }}>

              {/* Balance bar */}
              {balanceData && (
                <div className="pay-balance-bar">
                  <div><div className="pbb-label">{balanceData.label}</div><div className="pbb-val neutral">{money(balanceData.total)}</div></div>
                  <div><div className="pbb-label">Total pagado</div><div className="pbb-val green">{money(balanceData.paid)}</div></div>
                  <div><div className="pbb-label">{Number(payForm.amount) > 0 ? "Saldo tras pago" : "Saldo pendiente"}</div><div className={`pbb-val ${balanceData.pending > 0 ? "amber" : "green"}`}>{money(balanceData.pending)}</div></div>
                </div>
              )}

              {/* Reserva */}
              <div className="form-group full">
                <label className="form-label">Reserva asociada</label>
                <select className="form-select-modal" value={payForm.reservaId}
                  onChange={e => setPayForm(p => ({ ...p, reservaId: e.target.value }))}>
                  <option value="">— Pago sin reserva / abono general —</option>
                  {(payClient.reservas || [])
                    .filter(r => r.estado !== "cancelada")
                    .sort((a, b) => new Date(b.fechaCheckIn) - new Date(a.fechaCheckIn))
                    .map(r => {
                      const hab    = r.habitacionId;
                      const room   = hab ? (hab.nombre || hab.numero || "Hab.") : "Habitación";
                      const resPaid = (payClient.pagos || []).filter(p => String(p.reservaId) === String(r._id)).reduce((s, p) => s + p.amount, 0);
                      const debt   = Math.max(0, r.precioTotal - resPaid);
                      return (
                        <option key={r._id} value={r._id}>
                          {String(r._id).slice(-6).toUpperCase()} · {room} · {fmtDate(r.fechaCheckIn)} — debe {money(debt)}
                        </option>
                      );
                    })}
                </select>
              </div>

              {/* Método */}
              <div>
                <div className="form-label" style={{ marginBottom: 8 }}>Método de pago <span className="required">*</span></div>
                <div className="pay-method-selector">
                  {Object.entries(METHODS).map(([key, m]) => (
                    <button
                      key={key}
                      className={`pay-method-btn${payForm.method === key ? " active" : ""}`}
                      onClick={() => setPayForm(p => ({ ...p, method: key }))}
                    >
                      <span className="pm-icon">{m.icon}</span>
                      <span className="pm-label">{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Monto <span className="required">*</span></label>
                  <div style={{ display: "flex" }}>
                    <div style={{ padding: "9px 12px", background: "var(--bg-2)", border: "1.5px solid var(--border)", borderRight: "none", borderRadius: "8px 0 0 8px", fontSize: 13, fontWeight: 600, color: "var(--text-2)" }}>$</div>
                    <input type="number" className="form-input" min="0" placeholder="0"
                      style={{ borderRadius: "0 8px 8px 0", borderLeft: "none" }}
                      value={payForm.amount}
                      onChange={e => setPayForm(p => ({ ...p, amount: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Fecha y hora <span className="required">*</span></label>
                  <input type="datetime-local" className="form-input"
                    value={payForm.date} onChange={e => setPayForm(p => ({ ...p, date: e.target.value }))} />
                </div>
                <div className="form-group full">
                  <label className="form-label">Referencia / Comprobante</label>
                  <input type="text" className="form-input" placeholder="Ej: Transferencia #00123456…"
                    value={payForm.reference} onChange={e => setPayForm(p => ({ ...p, reference: e.target.value }))} />
                </div>
                <div className="form-group full">
                  <label className="form-label">Notas del pago</label>
                  <input type="text" className="form-input" placeholder="Seña, saldo, pago anticipado…"
                    value={payForm.notes} onChange={e => setPayForm(p => ({ ...p, notes: e.target.value }))} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowPayModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={savePay} disabled={savingPay}>
                {savingPay ? "Registrando…" : "Registrar pago"}
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
              <div style={{ fontSize: 20, color: "var(--text-1)", marginBottom: 8, fontWeight: 700 }}>¿Eliminar cliente?</div>
              <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.5 }}>
                Se eliminará <strong>{delTarget ? fullName(delTarget) : ""}</strong> y todos sus pagos registrados.
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

/* ── Micro helper ──────────────────────────────────────────────── */
function FieldGroup({ label, required, error, children }) {
  return (
    <div className="form-group">
      <label className="form-label">{label}{required && <span className="required"> *</span>}</label>
      {children}
      {error && <div style={{ color: "var(--red,#C0392B)", fontSize: 11, marginTop: 3 }}>{error}</div>}
    </div>
  );
}
