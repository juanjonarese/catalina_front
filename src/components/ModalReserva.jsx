import { useState, useEffect } from "react";
import clientAxios from "../helpers/clientAxios";
import Swal from "sweetalert2";

const ESTADO_CONFIG = {
  pendiente:  { label: "Pendiente",  color: "var(--amber)" },
  confirmada: { label: "Confirmada", color: "var(--blue)"  },
  completada: { label: "Completada", color: "var(--green)" },
  cancelada:  { label: "Cancelada",  color: "var(--red)"   },
};

const formatFecha = (f) => f ? new Date(f).toLocaleDateString("es-ES") : "—";

const ModalReserva = ({ show, onHide, reserva, onGuardar }) => {
  const [formData, setFormData] = useState({
    nombreCliente: "", emailCliente: "", telefonoCliente: "",
    fechaCheckIn: "", fechaCheckOut: "",
    numAdultos: 1, numNinos: 0,
    tipoHabitacion: "", numeroHabitacion: "", precioTotal: 0,
  });
  const [habitacionesDisponibles, setHabitacionesDisponibles] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (reserva) {
      setFormData({
        nombreCliente: reserva.nombreCliente || "",
        emailCliente: reserva.emailCliente || "",
        telefonoCliente: reserva.telefonoCliente || "",
        fechaCheckIn: reserva.fechaCheckIn ? reserva.fechaCheckIn.split("T")[0] : "",
        fechaCheckOut: reserva.fechaCheckOut ? reserva.fechaCheckOut.split("T")[0] : "",
        numAdultos: reserva.numAdultos || 1,
        numNinos: reserva.numNinos || 0,
        tipoHabitacion: reserva.tipoHabitacion || "",
        numeroHabitacion: reserva.numeroHabitacion || "",
        precioTotal: reserva.precioTotal || 0,
      });
    }
  }, [reserva]);

  useEffect(() => {
    if (!reserva && formData.fechaCheckIn && formData.fechaCheckOut) buscarHabitaciones();
  }, [formData.fechaCheckIn, formData.fechaCheckOut, formData.numAdultos, formData.numNinos]);

  useEffect(() => {
    if (!reserva && formData.numeroHabitacion && formData.fechaCheckIn && formData.fechaCheckOut) calcularPrecio();
  }, [formData.numeroHabitacion, formData.fechaCheckIn, formData.fechaCheckOut]);

  const buscarHabitaciones = async () => {
    try {
      const { data } = await clientAxios.get("/habitaciones/disponibilidad", {
        params: { fechaCheckIn: formData.fechaCheckIn, fechaCheckOut: formData.fechaCheckOut, numAdultos: formData.numAdultos, numNinos: formData.numNinos },
      });
      setHabitacionesDisponibles(data.habitaciones);
    } catch { setHabitacionesDisponibles([]); }
  };

  const calcularPrecio = () => {
    const hab = habitacionesDisponibles.find(h => h.numero.toString() === formData.numeroHabitacion);
    if (hab) {
      const noches = Math.ceil((new Date(formData.fechaCheckOut) - new Date(formData.fechaCheckIn)) / (1000 * 60 * 60 * 24));
      setFormData(prev => ({ ...prev, tipoHabitacion: hab.tipo, precioTotal: hab.precioPorNoche * noches }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (reserva) {
        await clientAxios.put(`/reservas/${reserva._id}/estado`, { estado: formData.estado || reserva.estado });
        Swal.fire({ icon: "success", title: "Actualizada", timer: 2000 });
      } else {
        await clientAxios.post("/reservas", formData);
        Swal.fire({ icon: "success", title: "Reserva creada", timer: 2000 });
      }
      onGuardar();
      onHide();
    } catch (error) {
      Swal.fire({ icon: "error", title: "Error", text: error.response?.data?.msg || error.message });
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  const esReadOnly = !!reserva;
  const esFinalizada = reserva?.estado === "completada" || reserva?.estado === "cancelada";
  const estadoCfg = reserva ? ESTADO_CONFIG[reserva.estado] : null;

  const noches = (formData.fechaCheckIn && formData.fechaCheckOut)
    ? Math.ceil((new Date(formData.fechaCheckOut) - new Date(formData.fechaCheckIn)) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && onHide()}>
      <div className="modal" style={{ maxWidth: 600 }}>
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-eyebrow">
              {esFinalizada ? "Resumen estadía" : reserva ? "Detalle completo" : "Nueva reserva"}
            </div>
            <div className="modal-title">
              {esFinalizada ? reserva.nombreCliente : reserva ? `Reserva ${reserva.codigoReserva || ""}` : "Cargar Reserva Manual"}
            </div>
          </div>
          <button className="modal-close" onClick={onHide} aria-label="Cerrar">✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">

            {/* Badge código + estado (solo si existe reserva) */}
            {reserva && (
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
                    color: estadoCfg.color,
                    padding: "4px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700,
                  }}>
                    {estadoCfg.label.toUpperCase()}
                  </span>
                )}
              </div>
            )}

            <div className="form-grid">
              {/* Timeline fechas */}
              {reserva && (
                <div className="form-group full" style={{
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
                    <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: "var(--brand)" }}>{noches}</div>
                  </div>
                </div>
              )}

              {/* Datos cliente */}
              <div className="form-group">
                <label className="form-label" htmlFor="nombreCliente">
                  Nombre completo {!esReadOnly && <span className="required">*</span>}
                </label>
                <input
                  type="text" id="nombreCliente" name="nombreCliente"
                  className="form-input"
                  value={formData.nombreCliente} onChange={handleChange}
                  required={!esReadOnly} disabled={esReadOnly}
                  placeholder="Ej: Juan García"
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="emailCliente">Email</label>
                <input
                  type="email" id="emailCliente" name="emailCliente"
                  className="form-input"
                  value={formData.emailCliente} onChange={handleChange}
                  disabled={esReadOnly} placeholder="email@ejemplo.com"
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="telefonoCliente">Teléfono</label>
                <input
                  type="tel" id="telefonoCliente" name="telefonoCliente"
                  className="form-input"
                  value={formData.telefonoCliente} onChange={handleChange}
                  disabled={esReadOnly} placeholder="Ej: 0381 555 1234"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Huéspedes</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 10, color: "var(--text-3)", marginBottom: 4 }}>Adultos</div>
                    <input type="number" name="numAdultos" className="form-input" min="1" max="10"
                      value={formData.numAdultos} onChange={handleChange} disabled={esReadOnly} />
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: "var(--text-3)", marginBottom: 4 }}>Menores</div>
                    <input type="number" name="numNinos" className="form-input" min="0" max="10"
                      value={formData.numNinos} onChange={handleChange} disabled={esReadOnly} />
                  </div>
                </div>
              </div>

              {/* Solo para nueva reserva: fechas */}
              {!reserva && (
                <>
                  <div className="form-group">
                    <label className="form-label" htmlFor="fechaCheckIn">Check-in <span className="required">*</span></label>
                    <input type="date" id="fechaCheckIn" name="fechaCheckIn" className="form-input"
                      value={formData.fechaCheckIn} onChange={handleChange} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="fechaCheckOut">Check-out <span className="required">*</span></label>
                    <input type="date" id="fechaCheckOut" name="fechaCheckOut" className="form-input"
                      value={formData.fechaCheckOut} onChange={handleChange}
                      min={formData.fechaCheckIn} required />
                  </div>
                </>
              )}

              {/* Habitación — para nueva reserva */}
              {!reserva && (
                <>
                  {habitacionesDisponibles.length > 0 && (
                    <div className="form-group full">
                      <label className="form-label">Habitaciones disponibles <span className="required">*</span></label>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        {habitacionesDisponibles.map((hab) => {
                          const seleccionada = formData.numeroHabitacion === hab.numero.toString();
                          return (
                            <div
                              key={hab.numero}
                              onClick={() => setFormData(prev => ({ ...prev, numeroHabitacion: hab.numero.toString() }))}
                              style={{
                                padding: "12px 14px", borderRadius: 10, cursor: "pointer",
                                border: `1.5px solid ${seleccionada ? "var(--brand)" : "var(--border)"}`,
                                background: seleccionada ? "rgba(148,138,124,0.08)" : "var(--bg-2)",
                                transition: "all 0.2s",
                              }}
                            >
                              <div style={{ fontWeight: 600, color: "var(--text-1)", marginBottom: 2 }}>
                                Room {hab.numero}
                              </div>
                              <div style={{ fontSize: 11, color: "var(--text-3)" }}>{hab.tipo}</div>
                              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 16, color: "var(--brand)", marginTop: 4 }}>
                                ${hab.precioPorNoche}/noche
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {formData.fechaCheckIn && formData.fechaCheckOut && habitacionesDisponibles.length === 0 && (
                    <div className="form-group full" style={{
                      background: "var(--amber-bg)", border: "1px solid var(--amber-border)",
                      borderRadius: 10, padding: "12px 16px", color: "var(--amber)", fontSize: 13,
                    }}>
                      ⚠️ No hay habitaciones disponibles para estas fechas y cantidad de huéspedes.
                    </div>
                  )}

                  {formData.precioTotal > 0 && (
                    <div className="form-group full" style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      background: "var(--bg-2)", border: "1px solid var(--border)",
                      borderRadius: 10, padding: "12px 16px",
                    }}>
                      <span style={{ fontSize: 12, color: "var(--text-2)" }}>
                        {noches} noche{noches !== 1 ? "s" : ""}
                      </span>
                      <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: "var(--brand)" }}>
                        ${formData.precioTotal}
                      </span>
                    </div>
                  )}
                </>
              )}

              {/* Habitación — para reserva existente */}
              {reserva?.habitacionId && (
                <div className="form-group full">
                  <label className="form-label">Habitación</label>
                  <div style={{
                    background: "var(--bg-2)", border: "1px solid var(--border)",
                    borderRadius: 10, padding: "12px 16px",
                  }}>
                    <strong style={{ color: "var(--text-1)" }}>
                      Room {reserva.habitacionId.numero} — {reserva.habitacionId.titulo}
                    </strong>
                    <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 4 }}>
                      👥 {reserva.habitacionId.capacidadPersonas} personas · ${reserva.precioTotal} total
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

          <div className="modal-footer">
            {esFinalizada ? (
              <button type="button" className="btn btn-primary" onClick={onHide}>Cerrar</button>
            ) : (
              <>
                <button type="button" className="btn btn-secondary" onClick={onHide}>Cancelar</button>
                {!reserva && (
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading || (!reserva && !formData.numeroHabitacion)}
                  >
                    {loading ? "Guardando…" : "＋ Guardar reserva"}
                  </button>
                )}
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalReserva;
