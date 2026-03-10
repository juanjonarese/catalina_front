import { useState, useEffect, useCallback } from "react";
import clientAxios from "../helpers/clientAxios";
import Swal from "sweetalert2";

/* ── Helpers ────────────────────────────────────────────── */
const money = (n) => "$" + Number(n || 0).toLocaleString("es-AR");
const pct   = (n, d) => (d > 0 ? Math.round((n / d) * 100) : 0);
const pad   = (n) => String(n).padStart(2, "0");

function toISO(d) {
  if (!d) return "";
  const dt = new Date(d);
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
}

function nights(ci, co) {
  if (!ci || !co) return 0;
  return Math.max(0, Math.round((new Date(co) - new Date(ci)) / 86400000));
}

function initials(name) {
  return (name || "?")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function todayPrefix() {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;
}

const MONTH_LABELS = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

function getMonthBuckets(range) {
  const buckets = [];
  const [fy, fm] = range.from.split("-").map(Number);
  const [ty, tm] = range.to.split("-").map(Number);
  let cy = fy, cm = fm - 1;
  const endY = ty, endM = tm - 1;
  const curYear = new Date().getFullYear();
  while (cy < endY || (cy === endY && cm <= endM)) {
    const prefix = `${cy}-${pad(cm + 1)}`;
    const label = MONTH_LABELS[cm] + (cy !== curYear ? ` '${String(cy).slice(2)}` : "");
    buckets.push({ year: cy, month: cm, prefix, label });
    cm++;
    if (cm > 11) { cm = 0; cy++; }
    if (buckets.length > 36) break;
  }
  return buckets;
}

/* ── Pie chart (SVG) ────────────────────────────────────── */
function PieChart({ data, size = 110 }) {
  const cx = size / 2;
  const r  = cx - 8;
  const ri = r * 0.55;
  const total = data.reduce((a, d) => a + d.value, 0);
  if (total === 0) {
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <text x={cx} y={cx + 4} textAnchor="middle" fontSize="10" fill="var(--text-3)">Sin datos</text>
      </svg>
    );
  }
  let startAngle = -Math.PI / 2;
  const slices = data.map((d) => {
    const angle = (d.value / total) * 2 * Math.PI;
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cx + r * Math.sin(startAngle);
    startAngle += angle;
    const x2 = cx + r * Math.cos(startAngle);
    const y2 = cx + r * Math.sin(startAngle);
    const large = angle > Math.PI ? 1 : 0;
    const xi1 = cx + ri * Math.cos(startAngle);
    const yi1 = cx + ri * Math.sin(startAngle);
    const xi2 = cx + ri * Math.cos(startAngle - angle);
    const yi2 = cx + ri * Math.sin(startAngle - angle);
    return {
      ...d,
      path: `M${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2} L${xi1},${yi1} A${ri},${ri} 0 ${large},0 ${xi2},${yi2} Z`,
      pct: Math.round((d.value / total) * 100),
    };
  });
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      {slices.map((s, i) => (
        <path key={i} d={s.path} fill={s.color} opacity={0.9}>
          <title>{s.label}: {s.pct}%</title>
        </path>
      ))}
      <circle cx={cx} cy={cx} r={ri - 2} fill="var(--bg-card)" />
    </svg>
  );
}

function PieLegend({ data }) {
  const total = data.reduce((a, d) => a + d.value, 0);
  if (total === 0) return null;
  return (
    <div className="pie-legend">
      {data.map((d, i) => (
        <div className="pie-item" key={i}>
          <div className="pie-dot" style={{ background: d.color }} />
          <div className="pie-item-name">{d.label}</div>
          <div>
            <div className="pie-item-pct">{total > 0 ? Math.round((d.value / total) * 100) : 0}%</div>
            <div className="pie-item-count">{d.value}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Bar chart SVG ──────────────────────────────────────── */
function OccBarChart({ buckets, monthlyOcc }) {
  const barW = 28, barGap = 10, chartH = 120, labelH = 22;
  const svgW = Math.max(buckets.length * (barW + barGap), 200);
  const today = todayPrefix();
  const avgOcc = Math.round(monthlyOcc.reduce((a, m) => a + m.occ, 0) / (monthlyOcc.length || 1));

  return (
    <svg viewBox={`0 0 ${svgW} ${chartH + labelH + 16}`} width="100%" xmlns="http://www.w3.org/2000/svg">
      {[25, 50, 75, 100].map((v) => {
        const gy = chartH - Math.round((v / 100) * chartH);
        return (
          <g key={v}>
            <line x1={0} y1={gy} x2={svgW} y2={gy} stroke="var(--border)" strokeWidth={1} strokeDasharray="3,4" />
            <text x={-2} y={gy + 3} textAnchor="end" fontSize={8} fill="var(--text-3)" fontFamily="DM Sans,sans-serif">{v}%</text>
          </g>
        );
      })}
      {monthlyOcc.map((m, i) => {
        const h = Math.max(4, Math.round((m.occ / 100) * chartH));
        const x = i * (barW + barGap);
        const y = chartH - h;
        const isCur = m.prefix === today;
        const color = m.occ >= 70 ? "#4A7C59" : m.occ >= 40 ? "#948A7C" : "#BEB4A8";
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={h} rx={5} fill={isCur ? "var(--brand)" : color} opacity={isCur ? 1 : 0.75}>
              <title>{m.label}: {m.occ}%</title>
            </rect>
            <text x={x + barW / 2} y={chartH + 14} textAnchor="middle" fontSize={9} fill="var(--text-3)" fontFamily="DM Sans,sans-serif">{m.label}</text>
            {m.occ > 0 && (
              <text x={x + barW / 2} y={y - 4} textAnchor="middle" fontSize={9} fontWeight={700} fill={isCur ? "var(--brand)" : "var(--text-2)"} fontFamily="DM Sans,sans-serif">{m.occ}%</text>
            )}
          </g>
        );
      })}
      <text x={svgW - 2} y={10} textAnchor="end" fontSize={9} fill="var(--text-3)" fontFamily="DM Sans,sans-serif">Prom: {avgOcc}%</text>
    </svg>
  );
}

function RevBarChart({ buckets, monthlyRev }) {
  const barW = 28, barGap = 10, chartH = 140, labelH = 22;
  const svgW = Math.max(buckets.length * (barW + barGap), 200);
  const maxRev = Math.max(...monthlyRev.map((m) => m.rev), 1);
  const today = todayPrefix();
  let cumulative = 0;
  const cumLine = monthlyRev.map((m) => { cumulative += m.rev; return cumulative; });
  const totalCum = cumLine[cumLine.length - 1] || 1;

  const pts = monthlyRev
    .map((m, i) => `${i * (barW + barGap) + barW / 2},${chartH - Math.round((cumLine[i] / totalCum) * chartH * 0.9)}`)
    .join(" ");

  return (
    <svg viewBox={`0 0 ${svgW} ${chartH + labelH + 16}`} width="100%" xmlns="http://www.w3.org/2000/svg">
      {[0.25, 0.5, 0.75, 1].map((v) => {
        const gy = chartH - Math.round(v * chartH);
        const lv = maxRev * v;
        return (
          <g key={v}>
            <line x1={0} y1={gy} x2={svgW} y2={gy} stroke="var(--border)" strokeWidth={1} strokeDasharray="3,4" />
            <text x={-2} y={gy + 3} textAnchor="end" fontSize={8} fill="var(--text-3)" fontFamily="DM Sans,sans-serif">{(lv / 1000).toFixed(0)}k</text>
          </g>
        );
      })}
      {monthlyRev.map((m, i) => {
        const h = Math.max(3, Math.round((m.rev / maxRev) * chartH));
        const x = i * (barW + barGap);
        const y = chartH - h;
        const isCur = m.prefix === today;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={h} rx={5} fill={isCur ? "var(--brand)" : "#BEB4A8"} opacity={isCur ? 1 : 0.8}>
              <title>{m.label}: {money(m.rev)}</title>
            </rect>
            <text x={x + barW / 2} y={chartH + 14} textAnchor="middle" fontSize={9} fill="var(--text-3)" fontFamily="DM Sans,sans-serif">{m.label}</text>
            {m.rev > 0 && (
              <text x={x + barW / 2} y={y - 4} textAnchor="middle" fontSize={8} fontWeight={700} fill={isCur ? "var(--brand)" : "var(--text-2)"} fontFamily="DM Sans,sans-serif">{(m.rev / 1000).toFixed(0)}k</text>
            )}
          </g>
        );
      })}
      {buckets.length > 1 && (
        <>
          <polyline points={pts} fill="none" stroke="var(--green)" strokeWidth={2} strokeLinejoin="round" opacity={0.7} />
          {monthlyRev.map((m, i) => {
            const cx2 = i * (barW + barGap) + barW / 2;
            const cy2 = chartH - Math.round((cumLine[i] / totalCum) * chartH * 0.9);
            return <circle key={i} cx={cx2} cy={cy2} r={3} fill="var(--green)"><title>Acumulado: {money(cumLine[i])}</title></circle>;
          })}
        </>
      )}
    </svg>
  );
}

/* ══ Main component ═════════════════════════════════════ */
export default function GestionReportesScreen() {
  const [periodo, setPeriodo] = useState("last6");
  const [tab, setTab]         = useState("ocupacion");
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (p) => {
    setLoading(true);
    try {
      const res = await clientAxios.get(`/reportes?periodo=${p}`);
      setData(res.data);
    } catch {
      Swal.fire({ icon: "error", title: "Error", text: "No se pudieron cargar los reportes." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(periodo); }, [periodo, fetchData]);

  /* ── Compute KPIs + derived data ──────────────────────── */
  const computed = data ? computeAll(data) : null;

  /* ── CSV export ───────────────────────────────────────── */
  function exportCSV() {
    if (!data) return;
    const { reservas, range } = data;
    const active = reservas.filter((r) => r.estado !== "cancelada");
    const rows = [["ID","Habitación","Huésped","Email","Check-in","Check-out","Noches","Adultos","Menores","Precio","Estado"]];
    active.forEach((r) => {
      rows.push([
        r._id,
        r.habitacionId?.titulo || "—",
        r.nombreCliente,
        r.emailCliente,
        toISO(r.fechaCheckIn),
        toISO(r.fechaCheckOut),
        nights(r.fechaCheckIn, r.fechaCheckOut),
        r.numAdultos,
        r.numNinos,
        r.precioTotal,
        r.estado,
      ]);
    });
    const csv  = rows.map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `reportes_${range.from}_${range.to}.csv`;
    a.click(); URL.revokeObjectURL(url);
    Swal.fire({ icon: "success", title: "CSV exportado", text: `${active.length} reservas exportadas.`, timer: 2000, showConfirmButton: false });
  }

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-eyebrow">Análisis</div>
          <h1 className="page-title">Reportes</h1>
          <p className="page-subtitle">Ocupación, ingresos y comportamiento de huéspedes</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={() => fetchData(periodo)}>↻ Actualizar</button>
          <button className="btn btn-primary"   onClick={exportCSV}>⬇ Exportar CSV</button>
        </div>
      </div>

      {/* Controls */}
      <div className="rpt-controls">
        <span className="rpt-ctrl-label">Período</span>
        <select className="rpt-select" value={periodo} onChange={(e) => setPeriodo(e.target.value)}>
          <option value="thisMonth">Este mes</option>
          <option value="lastMonth">Mes anterior</option>
          <option value="last3">Últimos 3 meses</option>
          <option value="last6">Últimos 6 meses</option>
          <option value="thisYear">Este año</option>
          <option value="allTime">Todo el tiempo</option>
        </select>
        <div className="rpt-sep" />
        <span className="rpt-ctrl-label">Vista</span>
        <div className="rpt-tab-row">
          {[["ocupacion","📊 Ocupación"],["ingresos","💳 Ingresos"],["huespedes","👥 Huéspedes"]].map(([key, label]) => (
            <button key={key} className={`rpt-tab${tab === key ? " active" : ""}`} onClick={() => setTab(key)}>{label}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="rpt-empty-state">Cargando reportes…</div>
      ) : computed ? (
        <>
          <KPIGrid kpis={computed.kpis} />
          {tab === "ocupacion"  && <PanelOcupacion  data={computed} />}
          {tab === "ingresos"   && <PanelIngresos   data={computed} />}
          {tab === "huespedes"  && <PanelHuespedes  data={computed} />}
        </>
      ) : null}
    </div>
  );
}

/* ── computeAll ─────────────────────────────────────────── */
function computeAll({ reservas, prevReservas, habitaciones, range }) {
  const active     = reservas.filter((r) => r.estado !== "cancelada");
  const prevActive = prevReservas.filter((r) => r.estado !== "cancelada");
  const totalRooms = habitaciones.length;

  const revenue     = active.reduce((a, r) => a + r.precioTotal, 0);
  const prevRevenue = prevActive.reduce((a, r) => a + r.precioTotal, 0);
  const revDelta    = prevRevenue > 0 ? Math.round(((revenue - prevRevenue) / prevRevenue) * 100) : null;

  const periodDays  = Math.round((new Date(range.to) - new Date(range.from)) / 86400000) + 1;
  let bookedNights  = 0;
  active.forEach((r) => { bookedNights += nights(r.fechaCheckIn, r.fechaCheckOut); });
  const maxNights   = totalRooms * periodDays;
  const occupancyPct = pct(bookedNights, maxNights);
  const avgNights   = active.length > 0 ? (bookedNights / active.length).toFixed(1) : "0";
  const revPAR      = totalRooms > 0 && periodDays > 0 ? Math.round(revenue / (totalRooms * periodDays)) : 0;

  const buckets     = getMonthBuckets(range);

  // Monthly occupancy
  const monthlyOcc  = buckets.map((b) => {
    const daysInMonth = new Date(b.year, b.month + 1, 0).getDate();
    let booked = 0;
    active.forEach((r) => {
      if (!toISO(r.fechaCheckIn).startsWith(b.prefix)) return;
      booked += nights(r.fechaCheckIn, r.fechaCheckOut);
    });
    const o = pct(booked, totalRooms * daysInMonth);
    return { ...b, occ: o, booked, max: totalRooms * daysInMonth };
  });

  // Monthly revenue
  const monthlyRev  = buckets.map((b) => {
    const rev = active
      .filter((r) => toISO(r.fechaCheckIn).startsWith(b.prefix))
      .reduce((a, r) => a + r.precioTotal, 0);
    return { ...b, rev };
  });

  // Status breakdown (all reservas)
  const counts = { pendiente: 0, confirmada: 0, completada: 0, cancelada: 0 };
  reservas.forEach((r) => { if (counts[r.estado] !== undefined) counts[r.estado]++; });

  // Occupancy by room
  const roomOcc = habitaciones.map((h) => {
    let booked = 0;
    active.filter((r) => String(r.habitacionId?._id || r.habitacionId) === String(h._id))
      .forEach((r) => { booked += nights(r.fechaCheckIn, r.fechaCheckOut); });
    const o = pct(booked, periodDays);
    return { ...h, booked, occPct: o };
  }).sort((a, b) => b.occPct - a.occPct);

  // Revenue by room
  const roomRev = habitaciones.map((h) => {
    const recs   = active.filter((r) => String(r.habitacionId?._id || r.habitacionId) === String(h._id));
    const rev    = recs.reduce((a, r) => a + r.precioTotal, 0);
    return { ...h, rev, count: recs.length };
  }).sort((a, b) => b.rev - a.rev);

  // Guests map
  const guestMap = {};
  active.forEach((r) => {
    const key = r.emailCliente || r.nombreCliente;
    if (!guestMap[key]) {
      guestMap[key] = { name: r.nombreCliente, email: r.emailCliente, phone: r.telefonoCliente, stays: 0, revenue: 0, lastStay: "" };
    }
    guestMap[key].stays++;
    guestMap[key].revenue += r.precioTotal;
    const ci = toISO(r.fechaCheckIn);
    if (ci > guestMap[key].lastStay) guestMap[key].lastStay = ci;
  });
  const guests = Object.values(guestMap).sort((a, b) => b.revenue - a.revenue);

  // Adults vs kids
  const totalAdults = active.reduce((a, r) => a + r.numAdultos, 0);
  const totalKids   = active.reduce((a, r) => a + r.numNinos, 0);
  const avgGuests   = active.length > 0 ? ((totalAdults + totalKids) / active.length).toFixed(1) : "0";

  // Check-in by day of week
  const dowCount = Array(7).fill(0);
  active.forEach((r) => {
    const dow = new Date(toISO(r.fechaCheckIn) + "T12:00:00").getDay();
    dowCount[dow]++;
  });

  return {
    kpis: { revenue, totalRes: active.length, occupancyPct, avgNights, revPAR, revDelta, bookedNights, periodDays },
    buckets, monthlyOcc, monthlyRev, counts,
    roomOcc, roomRev, guests, totalAdults, totalKids, avgGuests, dowCount,
    totalRooms, active,
  };
}

/* ── KPI Grid ────────────────────────────────────────────── */
function KPIGrid({ kpis }) {
  const { revenue, totalRes, occupancyPct, avgNights, revPAR, revDelta, bookedNights } = kpis;
  const deltaEl = revDelta !== null ? (
    <span className={`rpt-kpi-delta ${revDelta > 0 ? "up" : revDelta < 0 ? "down" : "flat"}`}>
      {revDelta > 0 ? "▲" : "▼"} {Math.abs(revDelta)}% vs período ant.
    </span>
  ) : null;

  const cards = [
    { label: "Ingresos",         num: money(revenue),         sub: `${totalRes} reservas activas`,     accent: "var(--green)",  extra: deltaEl },
    { label: "Ocupación",        num: `${occupancyPct}%`,     sub: `${bookedNights} noches reservadas`, accent: "var(--brand)",  extra: null },
    { label: "Estadía promedio", num: `${avgNights} noches`,  sub: `de ${totalRes} reservas`,           accent: "#6B4FA0",       extra: null },
    { label: "RevPAR",           num: money(revPAR),          sub: "ingreso / hab. / noche disponible", accent: "#2D6DA4",       extra: null },
  ];

  return (
    <div className="rpt-kpi-grid">
      {cards.map((k, i) => (
        <div className="rpt-kpi" key={i} style={{ "--kpi-accent": k.accent }}>
          <div className="rpt-kpi-label">{k.label}</div>
          <div className="rpt-kpi-num">{k.num}</div>
          <div className="rpt-kpi-sub">{k.sub}</div>
          {k.extra}
        </div>
      ))}
    </div>
  );
}

/* ── Panel Ocupación ────────────────────────────────────── */
const STATUS_COLORS = { pendiente: "#8B5C2A", confirmada: "#2D6DA4", completada: "#4A7C59", cancelada: "#C0392B" };
const STATUS_LABELS = { pendiente: "Pendientes", confirmada: "Confirmadas", completada: "Completadas", cancelada: "Canceladas" };

function PanelOcupacion({ data }) {
  const { buckets, monthlyOcc, counts, roomOcc } = data;
  const totalRes = Object.values(counts).reduce((a, b) => a + b, 0);
  const maxRoomOcc = Math.max(...roomOcc.map((r) => r.occPct), 1);

  const pieData = Object.entries(counts)
    .map(([k, v]) => ({ label: STATUS_LABELS[k], value: v, color: STATUS_COLORS[k] }))
    .filter((d) => d.value > 0);

  return (
    <>
      <div className="rpt-grid wide">
        <div className="rpt-card">
          <div className="rpt-card-header">
            <div>
              <div className="rpt-card-title">Ocupación mensual</div>
              <div className="rpt-card-sub">% de noches reservadas sobre total disponible</div>
            </div>
          </div>
          <div className="rpt-card-body">
            <OccBarChart buckets={buckets} monthlyOcc={monthlyOcc} />
          </div>
        </div>

        <div className="rpt-card">
          <div className="rpt-card-header">
            <div>
              <div className="rpt-card-title">Estado reservas</div>
              <div className="rpt-card-sub">{totalRes} reservas en período</div>
            </div>
          </div>
          <div className="rpt-card-body">
            <div className="pie-wrap">
              <PieChart data={pieData} size={110} />
              <PieLegend data={pieData} />
            </div>
          </div>
        </div>
      </div>

      <div className="rpt-card" style={{ marginBottom: 16 }}>
        <div className="rpt-card-header">
          <div>
            <div className="rpt-card-title">Ocupación por habitación</div>
            <div className="rpt-card-sub">Noches reservadas / días del período</div>
          </div>
        </div>
        <div className="rpt-card-body">
          {roomOcc.length === 0 ? (
            <div className="rpt-empty-state">Sin datos de habitaciones</div>
          ) : (
            <div className="occ-heatmap">
              {roomOcc.map((r) => {
                const w   = Math.round((r.occPct / maxRoomOcc) * 100);
                const col = r.occPct >= 70 ? "#4A7C59" : r.occPct >= 40 ? "#948A7C" : "#BEB4A8";
                return (
                  <div key={r._id} className="occ-hm-row" style={{ gridTemplateColumns: "160px 1fr 44px" }}>
                    <div className="occ-hm-label" title={r.titulo}>{r.titulo}</div>
                    <div className="occ-hm-bar-wrap">
                      <div className="occ-hm-bar" style={{ width: `${w}%`, background: col }}>
                        {r.occPct >= 25 && <span className="occ-hm-pct">{r.occPct}%</span>}
                      </div>
                    </div>
                    <div className="occ-hm-num">{r.occPct}%</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* ── Panel Ingresos ─────────────────────────────────────── */
function PanelIngresos({ data }) {
  const { buckets, monthlyRev, roomRev, active } = data;
  const totalRev   = active.reduce((a, r) => a + r.precioTotal, 0);
  const maxRoomRev = Math.max(...roomRev.map((r) => r.rev), 1);

  return (
    <div className="rpt-grid wide" style={{ marginBottom: 16 }}>
      <div className="rpt-card">
        <div className="rpt-card-header">
          <div>
            <div className="rpt-card-title">Ingresos por mes</div>
            <div className="rpt-card-sub">Reservas no canceladas</div>
          </div>
          <div className="rpt-card-badge">{money(totalRev)} total</div>
        </div>
        <div className="rpt-card-body">
          <RevBarChart buckets={buckets} monthlyRev={monthlyRev} />
        </div>
      </div>

      <div className="rpt-card">
        <div className="rpt-card-header">
          <div>
            <div className="rpt-card-title">Por habitación</div>
            <div className="rpt-card-sub">Contribución al ingreso total</div>
          </div>
        </div>
        <div className="rpt-card-body" style={{ padding: "12px 16px" }}>
          {roomRev.length === 0 ? (
            <div className="rpt-empty-state">Sin datos</div>
          ) : (
            <table className="rev-table">
              <thead>
                <tr>
                  <th>Habitación</th>
                  <th>Reservas</th>
                  <th>Ingresos</th>
                  <th style={{ width: 100 }}></th>
                </tr>
              </thead>
              <tbody>
                {roomRev.map((r) => (
                  <tr key={r._id}>
                    <td>
                      <div className="rt-name">{r.titulo}</div>
                      <div style={{ fontSize: 10, color: "var(--text-3)" }}>Hab. {r.numero}</div>
                    </td>
                    <td>{r.count}</td>
                    <td><div className="rt-money">{money(r.rev)}</div></td>
                    <td className="rt-bar-cell">
                      <div className="rt-mini-bar" style={{ width: `${Math.round((r.rev / maxRoomRev) * 100)}%` }} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Panel Huéspedes ────────────────────────────────────── */
const DOW = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function PanelHuespedes({ data }) {
  const { guests, totalAdults, totalKids, avgGuests, dowCount } = data;
  const totalGuests  = guests.length;
  const repeatGuests = guests.filter((g) => g.stays > 1).length;
  const maxDow       = Math.max(...dowCount, 1);

  const pieData = [
    { label: "Adultos", value: totalAdults, color: "#948A7C" },
    { label: "Menores", value: totalKids,   color: "#BEB4A8" },
  ].filter((d) => d.value > 0);

  return (
    <div className="rpt-grid" style={{ marginBottom: 16 }}>
      <div className="rpt-card">
        <div className="rpt-card-header">
          <div>
            <div className="rpt-card-title">Top huéspedes</div>
            <div className="rpt-card-sub">{totalGuests} únicos · {repeatGuests} recurrentes</div>
          </div>
          <div className="rpt-card-badge">
            {repeatGuests > 0 ? `${Math.round((repeatGuests / totalGuests) * 100)}% repiten` : "Sin datos"}
          </div>
        </div>
        <div className="rpt-card-body" style={{ padding: "12px 20px", maxHeight: 400, overflowY: "auto" }}>
          {guests.length === 0 ? (
            <div className="rpt-empty-state">Sin huéspedes en este período</div>
          ) : (
            guests.map((g, i) => (
              <div className="guest-row" key={i}>
                <div className="guest-avatar">{initials(g.name)}</div>
                <div className="guest-info">
                  <div className="guest-name">{g.name}</div>
                  <div className="guest-meta">{g.email || "—"} · {g.phone || "—"}</div>
                </div>
                <div className="guest-right">
                  <div className="guest-price">{money(g.revenue)}</div>
                  <div className="guest-stays">{g.stays} estadía{g.stays > 1 ? "s" : ""} · últ. {g.lastStay}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div className="rpt-card">
          <div className="rpt-card-header">
            <div>
              <div className="rpt-card-title">Check-in por día</div>
              <div className="rpt-card-sub">¿Cuándo prefieren llegar?</div>
            </div>
          </div>
          <div className="rpt-card-body" style={{ padding: "16px 20px" }}>
            <div style={{ display: "flex", gap: 6, alignItems: "flex-end", height: 80 }}>
              {dowCount.map((c, i) => {
                const h   = Math.round((c / maxDow) * 68) + 4;
                const col = c === Math.max(...dowCount) ? "var(--brand)" : "var(--brand-light,#c8d9ec)";
                return (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <div style={{ fontSize: 9, color: "var(--text-2)", fontWeight: 700 }}>{c || ""}</div>
                    <div style={{ width: "100%", height: h, background: col, borderRadius: "4px 4px 0 0" }} />
                    <div style={{ fontSize: 9, color: "var(--text-3)" }}>{DOW[i]}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="rpt-card">
          <div className="rpt-card-header">
            <div>
              <div className="rpt-card-title">Composición</div>
              <div className="rpt-card-sub">Adultos vs menores</div>
            </div>
          </div>
          <div className="rpt-card-body" style={{ padding: "16px 20px" }}>
            <div className="pie-wrap">
              <PieChart data={pieData} size={90} />
              <PieLegend data={pieData} />
            </div>
            <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: 22, color: "var(--text-1)" }}>{avgGuests}</div>
                <div style={{ fontSize: 10, color: "var(--text-3)" }}>huéspedes/reserva</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: 22, color: "var(--text-1)" }}>{totalAdults}</div>
                <div style={{ fontSize: 10, color: "var(--text-3)" }}>adultos</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: 22, color: "var(--text-1)" }}>{totalKids}</div>
                <div style={{ fontSize: 10, color: "var(--text-3)" }}>menores</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
