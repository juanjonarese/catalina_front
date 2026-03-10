const ESTADO_CONFIG = {
  pendiente:  { label: "Pendiente",  bg: "var(--amber-bg)",  color: "var(--amber)",  border: "var(--amber-border)"  },
  confirmada: { label: "Confirmada", bg: "var(--blue-bg)",   color: "var(--blue)",   border: "var(--blue-border)"   },
  completada: { label: "Completada", bg: "var(--green-bg)",  color: "var(--green)",  border: "var(--green-border)"  },
  cancelada:  { label: "Cancelada",  bg: "var(--red-bg)",    color: "var(--red)",    border: "var(--red-border)"    },
};

const formatearFecha = (fecha) => new Date(fecha).toLocaleDateString("es-ES");

const calcularNoches = (fechaCheckIn, fechaCheckOut) => {
  const diff = Math.abs(new Date(fechaCheckOut) - new Date(fechaCheckIn));
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

const BadgeEstado = ({ estado }) => {
  const cfg = ESTADO_CONFIG[estado] || { label: estado, bg: "var(--bg-2)", color: "var(--text-2)", border: "var(--border)" };
  return (
    <span style={{
      background: cfg.bg, color: cfg.color,
      border: `1px solid ${cfg.border}`,
      padding: "3px 10px", borderRadius: 20,
      fontSize: 11, fontWeight: 700, letterSpacing: "0.04em",
      whiteSpace: "nowrap",
    }}>
      {cfg.label.toUpperCase()}
    </span>
  );
};

const TablaReservas = ({ reservas, onEditar, onCancelar, onCheckIn, onCheckOut, onEliminar }) => {
  if (reservas.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📋</div>
        <div className="empty-title">Sin reservas</div>
        <div className="empty-text">No hay reservas que coincidan con los filtros aplicados.</div>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table className="data-table" role="table" aria-label="Listado de reservas">
        <thead>
          <tr>
            <th>Código</th>
            <th>Habitación</th>
            <th>Cliente</th>
            <th>Check-In</th>
            <th>Check-Out</th>
            <th style={{ textAlign: "center" }}>N°</th>
            <th>Precio</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {reservas.map((reserva) => (
            <tr key={reserva._id}>
              {/* Código */}
              <td>
                <span style={{
                  background: "var(--blue-bg)", color: "var(--blue)",
                  border: "1px solid var(--blue-border)",
                  padding: "3px 9px", borderRadius: 6,
                  fontSize: 11, fontWeight: 700, letterSpacing: "0.06em",
                }}>
                  {reserva.codigoReserva || "N/A"}
                </span>
              </td>

              {/* Habitación */}
              <td>
                {reserva.habitacionId ? (
                  <>
                    <strong style={{ color: "var(--text-1)", fontSize: 13 }}>
                      Room {reserva.habitacionId.numero}
                    </strong>
                    <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>
                      {reserva.habitacionId.titulo}
                    </div>
                  </>
                ) : (
                  <span style={{ color: "var(--text-3)" }}>No asignada</span>
                )}
              </td>

              {/* Cliente */}
              <td>
                <strong style={{ color: "var(--text-1)", fontSize: 13 }}>{reserva.nombreCliente}</strong>
                <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>{reserva.emailCliente}</div>
              </td>

              {/* Fechas */}
              <td style={{ color: "var(--text-2)", fontSize: 13 }}>{formatearFecha(reserva.fechaCheckIn)}</td>
              <td style={{ color: "var(--text-2)", fontSize: 13 }}>{formatearFecha(reserva.fechaCheckOut)}</td>

              {/* Noches */}
              <td style={{ textAlign: "center" }}>
                <span style={{
                  background: "var(--bg-2)", color: "var(--text-2)",
                  border: "1px solid var(--border)",
                  padding: "2px 8px", borderRadius: 12,
                  fontSize: 12, fontWeight: 600,
                }}>
                  {calcularNoches(reserva.fechaCheckIn, reserva.fechaCheckOut)}
                </span>
              </td>

              {/* Precio */}
              <td>
                <strong style={{ color: "var(--text-1)" }}>${reserva.precioTotal}</strong>
              </td>

              {/* Estado */}
              <td><BadgeEstado estado={reserva.estado} /></td>

              {/* Acciones */}
              <td>
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                  {/* Ver siempre */}
                  <button
                    className="btn-icon btn-icon-view"
                    onClick={() => onEditar(reserva)}
                    title="Ver detalle"
                  >👁</button>

                  {reserva.estado === "pendiente" && (
                    <>
                      <button
                        className="btn-icon btn-icon-edit"
                        style={{ background: "var(--green-bg)", color: "var(--green)" }}
                        onClick={() => onCheckIn(reserva._id)}
                        title="Check-In"
                      >✅</button>
                      <button
                        className="btn-icon btn-icon-delete"
                        onClick={() => onCancelar(reserva._id)}
                        title="Cancelar"
                      >✕</button>
                    </>
                  )}

                  {reserva.estado === "confirmada" && (
                    <button
                      className="btn-icon btn-icon-edit"
                      style={{ background: "var(--blue-bg)", color: "var(--blue)" }}
                      onClick={() => onCheckOut(reserva)}
                      title="Check-Out"
                    >🚪</button>
                  )}

                  {(reserva.estado === "completada" || reserva.estado === "cancelada") && (
                    <button
                      className="btn-icon btn-icon-delete"
                      onClick={() => onEliminar(reserva._id)}
                      title="Eliminar"
                    >🗑</button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TablaReservas;
