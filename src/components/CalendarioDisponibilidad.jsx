import { useState, useEffect } from "react";

const COLORES = {
  pendiente:  { bg: "var(--amber)",  text: "#000" },
  confirmada: { bg: "var(--blue)",   text: "#fff" },
};

const CalendarioDisponibilidad = ({ reservas, onVerReserva }) => {
  const [fechaActual, setFechaActual] = useState(new Date());
  const [diasMes, setDiasMes] = useState([]);

  useEffect(() => { generarDiasMes(); }, [fechaActual]);

  const generarDiasMes = () => {
    const año = fechaActual.getFullYear();
    const mes = fechaActual.getMonth();
    const ultimoDia = new Date(año, mes + 1, 0).getDate();
    const dias = [];
    for (let dia = 1; dia <= ultimoDia; dia++) dias.push(new Date(año, mes, dia));
    setDiasMes(dias);
  };

  const mesAnterior  = () => setFechaActual(new Date(fechaActual.getFullYear(), fechaActual.getMonth() - 1, 1));
  const mesSiguiente = () => setFechaActual(new Date(fechaActual.getFullYear(), fechaActual.getMonth() + 1, 1));
  const mesActual    = () => setFechaActual(new Date());

  const obtenerReservasPorDia = (fecha) => {
    if (!fecha) return [];
    return reservas.filter(r => {
      if (r.estado === "cancelada" || r.estado === "completada") return false;
      const f  = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
      const ci = new Date(new Date(r.fechaCheckIn).getFullYear(), new Date(r.fechaCheckIn).getMonth(), new Date(r.fechaCheckIn).getDate());
      const co = new Date(new Date(r.fechaCheckOut).getFullYear(), new Date(r.fechaCheckOut).getMonth(), new Date(r.fechaCheckOut).getDate());
      return f >= ci && f <= co;
    });
  };

  const esDiaActual = (fecha) => {
    if (!fecha) return false;
    const hoy = new Date();
    return fecha.getDate() === hoy.getDate() && fecha.getMonth() === hoy.getMonth() && fecha.getFullYear() === hoy.getFullYear();
  };

  const nombreMes = fechaActual.toLocaleDateString("es-ES", { month: "long", year: "numeric" });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header del calendario */}
      <div className="cal-header">
        <div className="cal-month-nav">
          <button className="cal-nav-btn" onClick={mesAnterior} aria-label="Mes anterior">‹</button>
          <div className="cal-month-label" style={{ textTransform: "capitalize" }}>{nombreMes}</div>
          <button className="cal-nav-btn" onClick={mesSiguiente} aria-label="Mes siguiente">›</button>
          <button className="cal-today-btn" onClick={mesActual}>Hoy</button>
        </div>
        <div className="cal-legend">
          <div className="legend-item">
            <div className="legend-dot" style={{ background: "var(--amber)" }} />
            Pendiente
          </div>
          <div className="legend-item">
            <div className="legend-dot" style={{ background: "var(--blue)" }} />
            Confirmada
          </div>
        </div>
      </div>

      {/* Grilla de días */}
      <div style={{
        background: "var(--bg-card)", border: "1px solid var(--border)",
        borderRadius: 12, padding: 20, boxShadow: "var(--shadow-sm)",
      }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {diasMes.map((fecha, index) => {
            const reservasDia = obtenerReservasPorDia(fecha);
            const esHoy = esDiaActual(fecha);
            const diaSemana = ["D", "L", "M", "M", "J", "V", "S"][fecha.getDay()];

            return (
              <div
                key={index}
                style={{
                  width: 105,
                  border: `${esHoy ? "2px solid var(--brand)" : "1px solid var(--border)"}`,
                  borderRadius: 10,
                  padding: 8,
                  background: esHoy ? "rgba(148,138,124,0.06)" : "var(--bg-elevated)",
                  transition: "box-shadow 0.2s",
                }}
              >
                <div style={{ fontSize: "0.68rem", textAlign: "center", color: "var(--text-3)", lineHeight: 1, marginBottom: 2 }}>
                  {diaSemana}
                </div>
                <div style={{
                  fontWeight: 700, textAlign: "center", marginBottom: 6,
                  color: esHoy ? "var(--brand)" : "var(--text-1)", fontSize: 14,
                }}>
                  {fecha.getDate()}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {reservasDia.map((reserva, idx) => {
                    const cfg = COLORES[reserva.estado] || { bg: "var(--bg-2)", text: "var(--text-1)" };
                    return (
                      <div
                        key={idx}
                        onClick={() => onVerReserva && onVerReserva(reserva)}
                        title={`Room ${reserva.habitacionId?.numero} — ${reserva.nombreCliente} (${reserva.estado})`}
                        style={{
                          background: cfg.bg, color: cfg.text,
                          fontSize: "0.68rem", fontWeight: 700,
                          padding: "3px 6px", borderRadius: 6,
                          cursor: "pointer", textAlign: "center",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                          transition: "transform 0.15s",
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"}
                        onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                      >
                        Room {reserva.habitacionId?.numero}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CalendarioDisponibilidad;
