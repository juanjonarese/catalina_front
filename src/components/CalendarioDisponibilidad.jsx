import { useState, useMemo } from "react";

const ROOM_W   = 168;
const DAY_W    = 36;
const HEADER_H = 56;
const ROW_H    = 54;

const STATUS_COLOR = {
  pendiente:  "amber",
  confirmada: "blue",
  completada: "green",
  cancelada:  "red",
};

const DOW = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sá"];

function toISO(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function fmtDate(iso) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

const CalendarioDisponibilidad = ({ reservas, onVerReserva }) => {
  const [fechaActual, setFechaActual] = useState(new Date());

  const mesAnterior  = () => setFechaActual(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const mesSiguiente = () => setFechaActual(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  const mesHoy       = () => setFechaActual(new Date());

  const año         = fechaActual.getFullYear();
  const mes         = fechaActual.getMonth();
  const daysInMonth = new Date(año, mes + 1, 0).getDate();
  const today       = toISO(new Date());
  const monthStart  = toISO(new Date(año, mes, 1));
  const monthEnd    = toISO(new Date(año, mes, daysInMonth));

  const nombreMes = fechaActual.toLocaleDateString("es-ES", { month: "long", year: "numeric" });

  const days = useMemo(() => (
    Array.from({ length: daysInMonth }, (_, i) => {
      const d   = new Date(año, mes, i + 1);
      const iso = toISO(d);
      return {
        num:       i + 1,
        iso,
        dow:       DOW[d.getDay()],
        isToday:   iso === today,
        isWeekend: d.getDay() === 0 || d.getDay() === 6,
      };
    })
  ), [año, mes]);

  const rooms = useMemo(() => {
    const map = new Map();
    reservas.forEach(r => {
      const hab = r.habitacionId;
      if (!hab?._id) return;
      if (!map.has(hab._id)) {
        map.set(hab._id, {
          id:     hab._id,
          numero: hab.numero,
          nombre: hab.nombre || `Hab. ${hab.numero}`,
          tipo:   hab.tipo   || "",
        });
      }
    });
    return [...map.values()].sort((a, b) => a.numero - b.numero);
  }, [reservas]);

  const ganttReservas = useMemo(() => (
    reservas
      .filter(r => r.habitacionId?._id)
      .map(r => {
        const ci     = toISO(new Date(r.fechaCheckIn));
        const co     = toISO(new Date(r.fechaCheckOut));
        const nights = Math.round((new Date(co) - new Date(ci)) / 86400000);
        return {
          id:        r._id,
          roomId:    r.habitacionId._id,
          checkin:   ci,
          checkout:  co,
          guestName: r.nombreCliente || "—",
          status:    r.estado,
          nights,
          color:     STATUS_COLOR[r.estado] || "amber",
        };
      })
  ), [reservas]);

  const totalW = ROOM_W + daysInMonth * DAY_W;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* ── Cal header ── */}
      <div className="cal-header">
        <div className="cal-month-nav">
          <button className="cal-nav-btn" onClick={mesAnterior} aria-label="Mes anterior">‹</button>
          <div className="cal-month-label" style={{ textTransform: "capitalize" }}>{nombreMes}</div>
          <button className="cal-nav-btn" onClick={mesSiguiente} aria-label="Mes siguiente">›</button>
          <button className="cal-today-btn" onClick={mesHoy}>Hoy</button>
        </div>
        <div className="cal-legend" aria-label="Leyenda">
          <div className="legend-item"><div className="legend-dot" style={{ background: "var(--amber)" }} /> Pendiente</div>
          <div className="legend-item"><div className="legend-dot" style={{ background: "var(--blue)"  }} /> Confirmada</div>
          <div className="legend-item"><div className="legend-dot" style={{ background: "var(--green)" }} /> Completada</div>
          <div className="legend-item"><div className="legend-dot" style={{ background: "var(--red)"   }} /> Cancelada</div>
        </div>
      </div>

      {/* ── Gantt ── */}
      <div className="cal-wrap" style={{ overflowX: "auto" }}>
        <div className="gantt" style={{ width: totalW, minWidth: totalW }}>

          {/* HEADER: dow + date numbers */}
          <div className="gantt-header" style={{ height: HEADER_H }}>
            <div className="gantt-corner" style={{ width: ROOM_W, height: HEADER_H }}>
              <span style={{ fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--text-3)", fontWeight: 600 }}>
                Habitación
              </span>
            </div>
            {days.map(day => (
              <div
                key={day.iso}
                className={`gantt-daycol${day.isToday ? " gantt-day-today" : ""}${day.isWeekend ? " gantt-day-weekend" : ""}`}
                style={{ width: DAY_W, height: HEADER_H }}
              >
                <div className="gantt-dow">{day.dow}</div>
                <div className={`gantt-datenum${day.isToday ? " is-today" : ""}`}>{day.num}</div>
              </div>
            ))}
          </div>

          {/* ROOM ROWS */}
          {rooms.map(room => {
            const roomRes    = ganttReservas.filter(r => r.roomId === room.id);
            const bookedDays = days.filter(day =>
              roomRes.some(r => r.checkin <= day.iso && r.checkout > day.iso)
            ).length;
            const pct      = Math.round(bookedDays / daysInMonth * 100);
            const occClass = pct >= 80 ? "high" : pct >= 40 ? "mid" : "low";

            return (
              <div key={room.id} className="gantt-row" style={{ height: ROW_H }}>

                {/* Room label — sticky left */}
                <div className="gantt-room-label" style={{ width: ROOM_W, height: ROW_H }}>
                  <div className="gantt-room-main">
                    <span className="gantt-room-id">Hab. {room.numero}</span>
                    <span className="gantt-room-name">{room.nombre}</span>
                  </div>
                  <div className="gantt-room-meta">
                    <span className="gantt-room-type">{room.tipo}</span>
                    <span className={`gantt-room-occ ${occClass}`}>{pct}%</span>
                  </div>
                </div>

                {/* Day cells + bars */}
                <div className="gantt-cells" style={{ width: daysInMonth * DAY_W, height: ROW_H, position: "relative" }}>

                  {/* Background cells */}
                  {days.map(day => {
                    const isCheckin  = roomRes.some(r => r.checkin  === day.iso);
                    const isCheckout = roomRes.some(r => r.checkout === day.iso);
                    return (
                      <div
                        key={day.iso}
                        className={`gantt-cell${day.isToday ? " gantt-cell-today" : ""}${day.isWeekend ? " gantt-cell-weekend" : ""}`}
                        style={{ left: (day.num - 1) * DAY_W, width: DAY_W, height: ROW_H }}
                      >
                        {isCheckin  && <div className="gantt-ci-marker" title="Check-in"  />}
                        {isCheckout && <div className="gantt-co-marker" title="Check-out" />}
                      </div>
                    );
                  })}

                  {/* Reservation bars */}
                  {roomRes.map(res => {
                    if (res.checkout <= monthStart || res.checkin > monthEnd) return null;

                    const clampedStart = res.checkin  < monthStart ? monthStart : res.checkin;
                    const clampedEnd   = res.checkout > monthEnd   ? monthEnd   : res.checkout;

                    const startDay = parseInt(clampedStart.split("-")[2], 10);
                    const endDay   = parseInt(clampedEnd.split("-")[2],   10);
                    const barLeft  = (startDay - 1) * DAY_W;
                    const barWidth = (endDay - startDay) * DAY_W;

                    if (barWidth <= 0) return null;

                    const continuesLeft  = res.checkin  < monthStart;
                    const continuesRight = res.checkout > monthEnd;
                    const isActive       = res.checkin <= today && res.checkout > today;
                    const guestFirst     = res.guestName.split(" ")[0];
                    const original       = reservas.find(r => r._id === res.id);

                    return (
                      <div
                        key={res.id}
                        className={`gantt-bar gantt-bar-${res.color}${isActive ? " gantt-bar-active" : ""}`}
                        style={{ left: barLeft, width: barWidth, top: 8, height: ROW_H - 16 }}
                        onClick={() => onVerReserva && original && onVerReserva(original)}
                        title={`${res.guestName} · ${fmtDate(res.checkin)} → ${fmtDate(res.checkout)} · ${res.status}`}
                        role="button"
                        tabIndex={0}
                        onKeyDown={e => e.key === "Enter" && onVerReserva && original && onVerReserva(original)}
                      >
                        {continuesLeft  && <span className="gantt-bar-arr gantt-bar-arr-l">◂</span>}
                        <span className="gantt-bar-label">
                          <span className="gantt-bar-name">{guestFirst}</span>
                          <span className="gantt-bar-nights">{res.nights}n</span>
                        </span>
                        {continuesRight && <span className="gantt-bar-arr gantt-bar-arr-r">▸</span>}
                      </div>
                    );
                  })}

                  {roomRes.length === 0 && (
                    <div className="gantt-empty-row">Sin reservas</div>
                  )}
                </div>
              </div>
            );
          })}

          {rooms.length === 0 && (
            <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-3)", fontSize: 13 }}>
              No hay habitaciones con reservas este mes.
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default CalendarioDisponibilidad;
