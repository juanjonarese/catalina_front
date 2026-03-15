import { useState, useMemo, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

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

const STATUS_BADGE = {
  pendiente:  "badge-pending",
  confirmada: "badge-confirmed",
  completada: "badge-completed",
  cancelada:  "badge-cancelled",
};

const STATUS_LABEL = {
  pendiente:  "Pendiente",
  confirmada: "Confirmada",
  completada: "Completada",
  cancelada:  "Cancelada",
};

const STATUS_ICON = {
  pendiente:  "⏳",
  confirmada: "✅",
  completada: "🏁",
  cancelada:  "❌",
};

const DOW_ES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function toISO(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function fmtDate(iso) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

// "18 mar" style
function fmtShort(iso) {
  if (!iso) return "—";
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("es-AR", { day: "numeric", month: "short" });
}

function dayOfWeek(iso) {
  if (!iso) return "";
  const d = new Date(iso + "T12:00:00");
  return DOW_ES[d.getDay()];
}

/* ── Popover ──────────────────────────────────────────────────────── */
function CalPopover({ reserva, rect, onClose, onVerDetalle }) {
  const POP_W = 290;
  const POP_H = 280;

  const n = Math.round(
    (new Date(reserva.fechaCheckOut) - new Date(reserva.fechaCheckIn)) / 86400000
  );

  const ci  = toISO(new Date(reserva.fechaCheckIn));
  const co  = toISO(new Date(reserva.fechaCheckOut));
  const hab = reserva.habitacionId;

  let left = rect.left + rect.width / 2 - POP_W / 2;
  let top  = rect.bottom + 8;
  if (left < 8) left = 8;
  if (left + POP_W > window.innerWidth - 8) left = window.innerWidth - POP_W - 8;
  if (top + POP_H > window.innerHeight - 8) top = rect.top - POP_H - 8;
  top = Math.max(8, top);

  return createPortal(
    <div
      className="popover cal-popover"
      style={{ left, top }}
      onClick={e => e.stopPropagation()}
    >
      <button className="popover-close" onClick={onClose} aria-label="Cerrar">✕</button>

      {/* Header: estado + código */}
      <div className="cal-pop-head" style={{ paddingRight: 28 }}>
        <span className={`badge ${STATUS_BADGE[reserva.estado] || "badge-pending"}`}>
          {STATUS_ICON[reserva.estado]} {STATUS_LABEL[reserva.estado]}
        </span>
        <span className="cal-pop-code">{reserva.codigoReserva || "—"}</span>
      </div>

      {/* Habitación */}
      <div className="cal-pop-room">
        {hab ? `Room ${hab.numero} — ${hab.titulo || hab.nombre}` : "—"}
      </div>

      {/* Huésped */}
      <div className="cal-pop-guest">
        <span className="cal-pop-guest-icon">👤</span>
        <span>{reserva.nombreCliente || "—"}</span>
      </div>

      {/* Fechas */}
      <div className="cal-pop-dates">
        <div className="cal-pop-date-block">
          <div className="cal-pop-date-label">Check-in</div>
          <div className="cal-pop-date-val">{fmtShort(ci)}</div>
          <div className="cal-pop-date-day">{dayOfWeek(ci)}</div>
        </div>
        <div className="cal-pop-date-arrow">→</div>
        <div className="cal-pop-date-block">
          <div className="cal-pop-date-label">Check-out</div>
          <div className="cal-pop-date-val">{fmtShort(co)}</div>
          <div className="cal-pop-date-day">{dayOfWeek(co)}</div>
        </div>
        <div className="cal-pop-nights">
          <div className="cal-pop-nights-num">{n}</div>
          <div className="cal-pop-nights-lbl">noche{n !== 1 ? "s" : ""}</div>
        </div>
      </div>

      {/* Precio */}
      <div className="cal-pop-price">
        Total: <strong>${Number(reserva.precioTotal || 0).toLocaleString("es-AR")}</strong>
      </div>

      {/* Acciones */}
      <div className="cal-pop-actions">
        <button
          className="btn btn-secondary"
          style={{ flex: 1, fontSize: 11, padding: "7px 10px" }}
          onClick={() => { onClose(); onVerDetalle(reserva); }}
        >
          Ver detalle completo
        </button>
      </div>
    </div>,
    document.body
  );
}

/* ── CalendarioDisponibilidad ─────────────────────────────────────── */
const CalendarioDisponibilidad = ({ reservas, onVerReserva }) => {
  const [fechaActual, setFechaActual] = useState(new Date());
  const [popover, setPopover]         = useState(null); // { reserva, rect }

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

  // Cerrar popover al hacer click fuera
  const closePopover = useCallback(() => setPopover(null), []);

  useEffect(() => {
    if (!popover) return;
    const handler = () => closePopover();
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [popover, closePopover]);

  const days = useMemo(() => (
    Array.from({ length: daysInMonth }, (_, i) => {
      const d   = new Date(año, mes, i + 1);
      const iso = toISO(d);
      return {
        num:       i + 1,
        iso,
        dow:       DOW_ES[d.getDay()],
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

          {/* HEADER */}
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

                {/* Room label */}
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

                    const continuesLeft  = res.checkin  < monthStart;
                    const continuesRight = res.checkout > monthEnd;

                    // Media celda en los extremos: check-in a las 14h, check-out a las 11h
                    const halfDay     = DAY_W / 2;
                    const adjLeft     = continuesLeft  ? 0       : halfDay;
                    const adjRight    = continuesRight ? DAY_W   : halfDay;
                    const adjBarLeft  = (startDay - 1) * DAY_W + adjLeft;
                    const adjBarRight = (endDay   - 1) * DAY_W + adjRight;
                    const adjBarWidth = adjBarRight - adjBarLeft;

                    if (adjBarWidth <= 0) return null;

                    const isActive   = res.checkin <= today && res.checkout > today;
                    const guestFirst = res.guestName.split(" ")[0];
                    const original   = reservas.find(r => r._id === res.id);

                    return (
                      <div
                        key={res.id}
                        className={`gantt-bar gantt-bar-${res.color}${isActive ? " gantt-bar-active" : ""}`}
                        style={{ left: adjBarLeft, width: adjBarWidth, top: 8, height: ROW_H - 16 }}
                        onClick={e => {
                          e.stopPropagation();
                          if (original) {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setPopover({ reserva: original, rect });
                          }
                        }}
                        title={`${res.guestName} · ${fmtDate(res.checkin)} → ${fmtDate(res.checkout)} · ${res.status}`}
                        role="button"
                        tabIndex={0}
                        onKeyDown={e => {
                          if (e.key === "Enter" && original) {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setPopover({ reserva: original, rect });
                          }
                        }}
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

      {/* Popover */}
      {popover && (
        <CalPopover
          reserva={popover.reserva}
          rect={popover.rect}
          onClose={closePopover}
          onVerDetalle={r => { onVerReserva && onVerReserva(r); }}
        />
      )}
    </div>
  );
};

export default CalendarioDisponibilidad;
