import { useState, useEffect } from "react";
import clientAxios from "../helpers/clientAxios";
import Swal from "sweetalert2";

/* ── helpers ── */
const ESTADO_CONFIG = {
  pendiente:  { label: "Pendiente",  color: "var(--amber)" },
  confirmada: { label: "Confirmada", color: "var(--blue)"  },
  completada: { label: "Completada", color: "var(--green)" },
  cancelada:  { label: "Cancelada",  color: "var(--red)"   },
};
const formatFecha = (f) => f ? new Date(f).toLocaleDateString("es-ES") : "—";

const noches = (ci, co) =>
  ci && co ? Math.ceil((new Date(co) - new Date(ci)) / 86400000) : 0;

/* ══════════════════════════════════════════════════════════
   MODAL NUEVA RESERVA
══════════════════════════════════════════════════════════ */
const ModalNuevaReserva = ({ onHide, onGuardar }) => {
  const hoy     = new Date().toISOString().split("T")[0];
  const manana  = new Date(Date.now() + 86400000).toISOString().split("T")[0];

  const [form, setForm] = useState({
    habitacionId:    "",
    fechaCheckIn:    hoy,
    fechaCheckOut:   manana,
    precioTotal:     "",
    numAdultos:      1,
    numNinos:        0,
    nombreCliente:   "",
    emailCliente:    "",
    telefonoCliente: "",
    estado:          "confirmada",
    codigoCupon:     "",
    observaciones:   "",
  });

  const [habitaciones,  setHabitaciones]  = useState([]);
  const [precioCalc,    setPrecioCalc]    = useState(null);
  const [couponMsg,     setCouponMsg]     = useState("");
  const [loading,       setLoading]       = useState(false);

  /* Cargar todas las habitaciones al abrir */
  useEffect(() => {
    clientAxios.get("/habitaciones")
      .then(({ data }) => setHabitaciones(data.habitaciones || []))
      .catch(() => setHabitaciones([]));
  }, []);

  /* Recalcular precio al cambiar habitación o fechas */
  useEffect(() => {
    const hab   = habitaciones.find(h => h._id === form.habitacionId);
    const n     = noches(form.fechaCheckIn, form.fechaCheckOut);
    if (hab && n > 0) {
      const calc = hab.precioPorNoche * n;
      setPrecioCalc({ noches: n, precio: calc });
      setForm(prev => ({ ...prev, precioTotal: calc }));
    } else {
      setPrecioCalc(null);
    }
  }, [form.habitacionId, form.fechaCheckIn, form.fechaCheckOut, habitaciones]);

  const set = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleGuardar = async () => {
    /* Validación */
    if (!form.habitacionId)    return Swal.fire({ icon: "warning", text: "Seleccioná una habitación." });
    if (!form.fechaCheckIn)    return Swal.fire({ icon: "warning", text: "Ingresá la fecha de check-in." });
    if (!form.fechaCheckOut)   return Swal.fire({ icon: "warning", text: "Ingresá la fecha de check-out." });
    if (form.fechaCheckOut <= form.fechaCheckIn)
      return Swal.fire({ icon: "warning", text: "El check-out debe ser después del check-in." });
    if (!form.nombreCliente)   return Swal.fire({ icon: "warning", text: "Ingresá el nombre del huésped." });
    if (!form.emailCliente)    return Swal.fire({ icon: "warning", text: "Ingresá el email." });
    if (!form.telefonoCliente) return Swal.fire({ icon: "warning", text: "Ingresá el teléfono." });
    if (!form.precioTotal)     return Swal.fire({ icon: "warning", text: "Ingresá el precio total." });

    setLoading(true);
    try {
      await clientAxios.post("/reservas", {
        habitacionId:    form.habitacionId,
        fechaCheckIn:    form.fechaCheckIn,
        fechaCheckOut:   form.fechaCheckOut,
        precioTotal:     Number(form.precioTotal),
        numAdultos:      Number(form.numAdultos),
        numNinos:        Number(form.numNinos),
        nombreCliente:   form.nombreCliente,
        emailCliente:    form.emailCliente,
        telefonoCliente: form.telefonoCliente,
        estado:          form.estado,
      });
      Swal.fire({ icon: "success", title: "Reserva creada", timer: 2000, showConfirmButton: false });
      onGuardar();
      onHide();
    } catch (error) {
      Swal.fire({ icon: "error", title: "Error", text: error.response?.data?.msg || error.message });
    } finally {
      setLoading(false);
    }
  };

  const n = noches(form.fechaCheckIn, form.fechaCheckOut);

  return (
    <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && onHide()}>
      <div className="modal" style={{ maxWidth: 600 }}>

        {/* HEADER */}
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-eyebrow">Nueva reserva</div>
            <div className="modal-title">Cargar Reserva Manual</div>
          </div>
          <button className="modal-close" onClick={onHide} aria-label="Cerrar">✕</button>
        </div>

        {/* BODY */}
        <div className="modal-body" style={{ gap: 18 }}>
          <div className="form-grid">

            {/* Habitación */}
            <div className="form-group full">
              <label className="form-label" htmlFor="habitacionId">
                Habitación <span className="required">*</span>
              </label>
              <select
                id="habitacionId"
                name="habitacionId"
                className="form-select-modal"
                value={form.habitacionId}
                onChange={set}
              >
                <option value="">— Seleccioná una habitación —</option>
                {habitaciones.map(h => (
                  <option key={h._id} value={h._id}>
                    Room {h.numero} — {h.nombre || h.titulo || h.tipo} · ${h.precioPorNoche}/noche
                  </option>
                ))}
              </select>
            </div>

            {/* Fechas */}
            <div className="form-group">
              <label className="form-label" htmlFor="fechaCheckIn">
                Check-in <span className="required">*</span>
              </label>
              <input
                type="date"
                id="fechaCheckIn"
                name="fechaCheckIn"
                className="form-input"
                value={form.fechaCheckIn}
                onChange={set}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="fechaCheckOut">
                Check-out <span className="required">*</span>
              </label>
              <input
                type="date"
                id="fechaCheckOut"
                name="fechaCheckOut"
                className="form-input"
                value={form.fechaCheckOut}
                min={form.fechaCheckIn}
                onChange={set}
              />
            </div>

            {/* Precio calculado (preview) */}
            {precioCalc && (
              <div className="form-group full">
                <div style={{
                  background: "var(--bg-2)", border: "1px solid var(--border)",
                  borderRadius: 9, padding: "12px 16px",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                }}>
                  <span style={{ fontSize: 12, color: "var(--text-2)" }}>
                    {precioCalc.noches} noche{precioCalc.noches !== 1 ? "s" : ""}
                  </span>
                  <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: "var(--brand)" }}>
                    ${precioCalc.precio.toLocaleString("es-AR")}
                  </span>
                </div>
              </div>
            )}

            {/* Precio total (override manual) */}
            <div className="form-group">
              <label className="form-label" htmlFor="precioTotal">
                Precio total ($) <span className="required">*</span>
              </label>
              <input
                type="number"
                id="precioTotal"
                name="precioTotal"
                className="form-input"
                min="0"
                placeholder="Se calcula automáticamente"
                value={form.precioTotal}
                onChange={set}
              />
            </div>

            {/* Huéspedes */}
            <div className="form-group">
              <label className="form-label">Huéspedes</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <div>
                  <div style={{ fontSize: 10, color: "var(--text-3)", marginBottom: 4 }}>Adultos</div>
                  <input type="number" name="numAdultos" className="form-input"
                    min="1" max="10" value={form.numAdultos} onChange={set} />
                </div>
                <div>
                  <div style={{ fontSize: 10, color: "var(--text-3)", marginBottom: 4 }}>Menores</div>
                  <input type="number" name="numNinos" className="form-input"
                    min="0" max="10" value={form.numNinos} onChange={set} />
                </div>
              </div>
            </div>

            {/* Divider — Datos del huésped */}
            <div className="form-group full" style={{ borderTop: "1px solid var(--border)", paddingTop: 4 }}>
              <div style={{ fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--text-3)", fontWeight: 600 }}>
                Datos del huésped
              </div>
            </div>

            {/* Nombre + Email */}
            <div className="form-group">
              <label className="form-label" htmlFor="nombreCliente">
                Nombre completo <span className="required">*</span>
              </label>
              <input type="text" id="nombreCliente" name="nombreCliente" className="form-input"
                placeholder="Ej: Juan García" value={form.nombreCliente} onChange={set} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="emailCliente">
                Email <span className="required">*</span>
              </label>
              <input type="email" id="emailCliente" name="emailCliente" className="form-input"
                placeholder="email@ejemplo.com" value={form.emailCliente} onChange={set} />
            </div>

            {/* Teléfono + Estado */}
            <div className="form-group">
              <label className="form-label" htmlFor="telefonoCliente">
                Teléfono <span className="required">*</span>
              </label>
              <input type="tel" id="telefonoCliente" name="telefonoCliente" className="form-input"
                placeholder="Ej: 0381 555 1234" value={form.telefonoCliente} onChange={set} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="estado">Estado</label>
              <select id="estado" name="estado" className="form-select-modal"
                value={form.estado} onChange={set}>
                <option value="pendiente">Pendiente</option>
                <option value="confirmada">Confirmada</option>
              </select>
            </div>

            {/* Observaciones */}
            <div className="form-group full">
              <label className="form-label" htmlFor="observaciones">Observaciones</label>
              <textarea
                id="observaciones" name="observaciones" className="form-textarea"
                placeholder="Notas internas, llegada tardía, requerimientos especiales…"
                rows="2" value={form.observaciones} onChange={set}
              />
            </div>

          </div>
        </div>

        {/* FOOTER */}
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onHide}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleGuardar} disabled={loading}>
            {loading ? "Guardando…" : "＋ Guardar reserva"}
          </button>
        </div>

      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════
   MODAL DETALLE RESERVA EXISTENTE
══════════════════════════════════════════════════════════ */
const ModalDetalleReserva = ({ reserva, onHide, onGuardar }) => {
  const esFinalizada = reserva.estado === "completada" || reserva.estado === "cancelada";
  const estadoCfg    = ESTADO_CONFIG[reserva.estado];
  const n = noches(reserva.fechaCheckIn, reserva.fechaCheckOut);

  return (
    <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && onHide()}>
      <div className="modal" style={{ maxWidth: 600 }}>

        {/* HEADER */}
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-eyebrow">
              {esFinalizada ? "Resumen estadía" : "Detalle completo"}
            </div>
            <div className="modal-title">
              {esFinalizada ? reserva.nombreCliente : `Reserva ${reserva.codigoReserva || ""}`}
            </div>
          </div>
          <button className="modal-close" onClick={onHide} aria-label="Cerrar">✕</button>
        </div>

        <div className="modal-body">
          <div className="form-grid">

            {/* Código + estado */}
            <div className="form-group full">
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                background: "var(--bg-2)", border: "1px solid var(--border)",
                borderRadius: 10, padding: "12px 16px",
              }}>
                <div>
                  <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-3)", marginBottom: 3 }}>Código</div>
                  <span style={{
                    fontFamily: "'DM Serif Display', serif", fontSize: 20, color: "var(--blue)",
                    background: "var(--blue-bg)", border: "1px solid var(--blue-border)",
                    padding: "2px 12px", borderRadius: 6, fontWeight: 700, letterSpacing: "0.06em",
                  }}>
                    {reserva.codigoReserva || "N/A"}
                  </span>
                </div>
                {estadoCfg && (
                  <span style={{
                    background: "var(--bg-card)", border: `1.5px solid ${estadoCfg.color}`,
                    color: estadoCfg.color, padding: "4px 14px", borderRadius: 20,
                    fontSize: 12, fontWeight: 700,
                  }}>
                    {estadoCfg.label.toUpperCase()}
                  </span>
                )}
              </div>
            </div>

            {/* Timeline fechas */}
            <div className="form-group full">
              <div style={{
                display: "flex", gap: 16, background: "var(--bg-2)",
                border: "1px solid var(--border)", borderRadius: 10, padding: "12px 16px",
              }}>
                <div>
                  <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-3)" }}>Check-In</div>
                  <div style={{ fontWeight: 600, color: "var(--text-1)" }}>{formatFecha(reserva.fechaCheckIn)}</div>
                </div>
                <div style={{ fontSize: 18, color: "var(--text-3)", alignSelf: "center" }}>→</div>
                <div>
                  <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-3)" }}>Check-Out</div>
                  <div style={{ fontWeight: 600, color: "var(--text-1)" }}>{formatFecha(reserva.fechaCheckOut)}</div>
                </div>
                <div style={{ marginLeft: "auto", textAlign: "right" }}>
                  <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-3)" }}>Noches</div>
                  <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: "var(--brand)" }}>{n}</div>
                </div>
              </div>
            </div>

            {/* Cliente */}
            <div className="form-group">
              <label className="form-label">Nombre</label>
              <input type="text" className="form-input" value={reserva.nombreCliente || "—"} disabled />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="text" className="form-input" value={reserva.emailCliente || "—"} disabled />
            </div>
            <div className="form-group">
              <label className="form-label">Teléfono</label>
              <input type="text" className="form-input" value={reserva.telefonoCliente || "—"} disabled />
            </div>
            <div className="form-group">
              <label className="form-label">Huéspedes</label>
              <input type="text" className="form-input"
                value={`${reserva.numAdultos || 1} adulto${(reserva.numAdultos || 1) !== 1 ? "s" : ""}${reserva.numNinos ? ` · ${reserva.numNinos} menor${reserva.numNinos !== 1 ? "es" : ""}` : ""}`}
                disabled />
            </div>

            {/* Habitación */}
            {reserva.habitacionId && (
              <div className="form-group full">
                <label className="form-label">Habitación</label>
                <div style={{
                  background: "var(--bg-2)", border: "1px solid var(--border)",
                  borderRadius: 10, padding: "12px 16px",
                }}>
                  <strong style={{ color: "var(--text-1)" }}>
                    Room {reserva.habitacionId.numero} — {reserva.habitacionId.titulo || reserva.habitacionId.nombre}
                  </strong>
                  <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 4 }}>
                    👥 {reserva.habitacionId.capacidadPersonas} personas · Total: ${reserva.precioTotal?.toLocaleString("es-AR")}
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-primary" onClick={onHide}>Cerrar</button>
        </div>

      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════
   EXPORT — enruta al modal correcto según props
══════════════════════════════════════════════════════════ */
const ModalReserva = ({ show, onHide, reserva, onGuardar }) => {
  if (!show) return null;

  if (reserva) {
    return <ModalDetalleReserva reserva={reserva} onHide={onHide} onGuardar={onGuardar} />;
  }
  return <ModalNuevaReserva onHide={onHide} onGuardar={onGuardar} />;
};

export default ModalReserva;
