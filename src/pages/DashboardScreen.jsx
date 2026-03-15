import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import clientAxios from "../helpers/clientAxios";

const MESES_CORTO = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

const fmtPrecio = (n) =>
  "$" + Number(n).toLocaleString("es-AR", { minimumFractionDigits: 0 });

const fmtFecha = (f) => {
  if (!f) return "—";
  const d = new Date(f);
  return `${d.getDate()} ${MESES_CORTO[d.getMonth()]}`;
};

const hoy = () => {
  const d = new Date();
  const dias = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
  return {
    dia: d.getDate(),
    resto: `${dias[d.getDay()]} · ${MESES_CORTO[d.getMonth()]} ${d.getFullYear()}`,
    saludo: d.getHours() < 12 ? "Buen día" : d.getHours() < 19 ? "Buenas tardes" : "Buenas noches",
  };
};

// ── Estilos del dashboard (inline o via CSS-in-JS simple) ─────────────────────
const s = {
  kpiStrip:   { display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:14 },
  kpiCard:    { background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:"var(--radius)", padding:"20px 22px", boxShadow:"var(--shadow-sm)", display:"flex", flexDirection:"column", gap:10, position:"relative", overflow:"hidden", transition:"all var(--transition)", animation:"fadeUp .45s ease backwards" },
  kpiLabel:   { fontSize:11, letterSpacing:".1em", textTransform:"uppercase", color:"var(--text-3)", fontWeight:600, display:"flex", alignItems:"center", gap:6 },
  kpiIcon:    { width:28, height:28, borderRadius:7, display:"inline-flex", alignItems:"center", justifyContent:"center", fontSize:14, flexShrink:0 },
  kpiNum:     { fontFamily:"'DM Serif Display', serif", fontSize:34, color:"var(--text-1)", lineHeight:1 },
  kpiSub:     { fontSize:11, color:"var(--text-3)" },

  dashBody:   { display:"grid", gridTemplateColumns:"1fr 340px", gap:20, alignItems:"start" },
  dashCol:    { display:"flex", flexDirection:"column", gap:20 },
  section:    { background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:"var(--radius)", boxShadow:"var(--shadow-sm)", overflow:"hidden", transition:"background var(--transition),border-color var(--transition)" },
  secHeader:  { padding:"16px 20px 14px", display:"flex", alignItems:"center", justifyContent:"space-between", borderBottom:"1px solid var(--border)" },
  secTitle:   { fontFamily:"'DM Serif Display', serif", fontSize:17, color:"var(--text-1)" },
  secLink:    { fontSize:12, color:"var(--brand)", fontWeight:600, textDecoration:"none" },

  todayStrip: { display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:0 },
  todayCell:  { padding:"18px 20px", textAlign:"center", borderRight:"1px solid var(--border)", cursor:"pointer", transition:"background var(--transition)" },
  todayCellLast: { padding:"18px 20px", textAlign:"center", cursor:"pointer", transition:"background var(--transition)" },
  todayNum:   { fontFamily:"'DM Serif Display', serif", fontSize:32, color:"var(--text-1)", lineHeight:1, marginBottom:4 },
  todayLabel: { fontSize:11, color:"var(--text-3)", textTransform:"uppercase", letterSpacing:".08em", fontWeight:600 },

  miniRow:    { display:"flex", alignItems:"center", gap:12, padding:"12px 20px", borderBottom:"1px solid var(--border)", cursor:"pointer", transition:"background var(--transition)", textDecoration:"none", color:"inherit" },
  miniAvatar: { width:36, height:36, borderRadius:"50%", background:"var(--brand)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, color:"white", flexShrink:0 },
  miniInfo:   { flex:1, minWidth:0 },
  miniName:   { fontSize:13, fontWeight:600, color:"var(--text-1)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" },
  miniMeta:   { fontSize:11, color:"var(--text-3)", marginTop:1 },
  miniRight:  { display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4, flexShrink:0 },

  occChart:   { padding:"16px 20px 20px", display:"flex", flexDirection:"column", gap:10 },
  occRow:     { display:"grid", gridTemplateColumns:"110px 1fr 38px", alignItems:"center", gap:10 },
  occName:    { fontSize:12, color:"var(--text-2)", fontWeight:500, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" },
  occTrack:   { height:8, background:"var(--bg-2)", borderRadius:99, overflow:"hidden" },
  occFill:    { height:"100%", borderRadius:99, transition:"width .8s cubic-bezier(.4,0,.2,1)" },
  occPct:     { fontSize:11, fontWeight:700, color:"var(--text-2)", textAlign:"right" },

  qaGrid:     { display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, padding:"16px 20px" },
  qaBtn:      { display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:6, padding:"16px 10px", background:"var(--bg-2)", border:"1.5px solid var(--border)", borderRadius:10, cursor:"pointer", transition:"all var(--transition)", textDecoration:"none", color:"var(--text-2)" },

  alertList:  { display:"flex", flexDirection:"column" },
  alertItem:  { display:"flex", alignItems:"flex-start", gap:12, padding:"13px 20px", borderBottom:"1px solid var(--border)", transition:"background var(--transition)" },
  alertDot:   { width:8, height:8, borderRadius:"50%", marginTop:5, flexShrink:0 },
  alertText:  { flex:1, fontSize:12, color:"var(--text-2)", lineHeight:1.5 },
  alertTime:  { fontSize:10, color:"var(--text-3)", whiteSpace:"nowrap", marginTop:2 },

  roomGrid:   { display:"grid", gridTemplateColumns:"1fr 1fr", gap:0 },
  roomCell:   { padding:"12px 16px", borderRight:"1px solid var(--border)", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", gap:10, cursor:"pointer", transition:"background var(--transition)" },
  roomDot:    { width:9, height:9, borderRadius:"50%", flexShrink:0 },
  roomInfo:   { flex:1, minWidth:0 },
  roomName:   { fontSize:12, fontWeight:600, color:"var(--text-1)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" },
  roomType:   { fontSize:10, color:"var(--text-3)" },
};

const KPICARD_COLORS = {
  green:  { icon: { background:"var(--green-bg)", color:"var(--green)" } },
  blue:   { icon: { background:"var(--blue-bg)",  color:"var(--blue)"  } },
  amber:  { icon: { background:"var(--amber-bg)", color:"var(--amber)" } },
  purple: { icon: { background:"var(--purple-bg)",color:"var(--purple)"} },
};

export default function DashboardScreen() {
  const navigate = useNavigate();
  const fecha = hoy();

  const [reservas, setReservas]     = useState([]);
  const [habitaciones, setHabitaciones] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      try {
        const [resR, resH] = await Promise.all([
          clientAxios.get("/reservas"),
          clientAxios.get("/habitaciones"),
        ]);
        setReservas(resR.data.reservas || []);
        setHabitaciones(resH.data.habitaciones || []);
      } catch { /* silencioso */ }
      finally { setLoadingData(false); }
    };
    cargar();
  }, []);

  // ── KPIs ─────────────────────────────────────────────────────────────────
  const totalHabitaciones = habitaciones.length;
  const hoyStr = new Date().toISOString().split("T")[0];

  const reservasActivas = reservas.filter(r =>
    r.estado === "confirmada" || r.estado === "pendiente"
  );
  const pendientes = reservas.filter(r => r.estado === "pendiente");

  const ingresosMes = reservas
    .filter(r => {
      if (r.estado === "cancelada") return false;
      const f = new Date(r.fechaCheckIn);
      const ahora = new Date();
      return f.getMonth() === ahora.getMonth() && f.getFullYear() === ahora.getFullYear();
    })
    .reduce((acc, r) => acc + (r.precioTotal || 0), 0);

  const ocupadas = habitaciones.filter(h => !h.disponible).length;
  const pctOcupacion = totalHabitaciones > 0 ? Math.round((ocupadas / totalHabitaciones) * 100) : 0;

  // ── Actividad de hoy ──────────────────────────────────────────────────────
  const checkinHoy = reservas.filter(r => {
    const ci = new Date(r.fechaCheckIn).toISOString().split("T")[0];
    return ci === hoyStr && (r.estado === "confirmada" || r.estado === "pendiente");
  }).length;

  const checkoutHoy = reservas.filter(r => {
    const co = new Date(r.fechaCheckOut).toISOString().split("T")[0];
    return co === hoyStr && r.estado === "confirmada";
  }).length;

  const enCasa = reservas.filter(r => {
    if (r.estado !== "confirmada") return false;
    const ci = new Date(r.fechaCheckIn).toISOString().split("T")[0];
    const co = new Date(r.fechaCheckOut).toISOString().split("T")[0];
    return ci <= hoyStr && co >= hoyStr;
  }).length;

  // ── Próximas reservas (ordenadas por check-in, tomamos las 5 primeras) ────
  const proximas = [...reservas]
    .filter(r => r.estado === "confirmada" || r.estado === "pendiente")
    .sort((a, b) => new Date(a.fechaCheckIn) - new Date(b.fechaCheckIn))
    .slice(0, 5);

  // ── Ingresos últimos 6 meses ──────────────────────────────────────────────
  const revData = (() => {
    const ahora = new Date();
    const meses = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
      meses.push({ label: MESES_CORTO[d.getMonth()], mes: d.getMonth(), año: d.getFullYear(), total: 0 });
    }
    reservas
      .filter(r => r.estado !== "cancelada")
      .forEach(r => {
        const d = new Date(r.fechaCheckIn);
        const slot = meses.find(m => m.mes === d.getMonth() && m.año === d.getFullYear());
        if (slot) slot.total += r.precioTotal || 0;
      });
    return meses;
  })();
  const maxRev = Math.max(...revData.map(m => m.total), 1);
  const totalAcumulado = revData.reduce((a, m) => a + m.total, 0);

  // ── Ocupación por habitación (% de días del mes actual) ───────────────────
  const occData = (() => {
    const ahora = new Date();
    const diasMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0).getDate();
    return habitaciones.slice(0, 6).map(hab => {
      const diasOcupados = reservas.filter(r => {
        if (r.estado === "cancelada") return false;
        if (r.habitacionId?._id?.toString() !== hab._id?.toString()) return false;
        const ci = new Date(r.fechaCheckIn);
        const co = new Date(r.fechaCheckOut);
        const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
        const finMes    = new Date(ahora.getFullYear(), ahora.getMonth(), diasMes);
        return ci <= finMes && co >= inicioMes;
      }).reduce((acc, r) => {
        const ci = new Date(r.fechaCheckIn);
        const co = new Date(r.fechaCheckOut);
        const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
        const finMes    = new Date(ahora.getFullYear(), ahora.getMonth(), diasMes);
        const desde = ci < inicioMes ? inicioMes : ci;
        const hasta = co > finMes   ? finMes   : co;
        return acc + Math.max(0, Math.ceil((hasta - desde) / 86400000));
      }, 0);
      const pct = Math.round((diasOcupados / diasMes) * 100);
      return { nombre: `Room ${hab.numero}`, tipo: hab.titulo, pct };
    });
  })();

  // ── Alertas ───────────────────────────────────────────────────────────────
  const alertas = [
    pendientes.length > 0 && {
      tipo: "warning",
      color: "var(--amber)",
      texto: <><strong>{pendientes.length} reserva{pendientes.length !== 1 ? "s" : ""} pendiente{pendientes.length !== 1 ? "s" : ""}</strong> requieren confirmación.</>,
      hora: "Ahora",
    },
    checkinHoy > 0 && {
      tipo: "info",
      color: "var(--blue)",
      texto: <><strong>{checkinHoy} check-in{checkinHoy !== 1 ? "s" : ""}</strong> programado{checkinHoy !== 1 ? "s" : ""} para hoy.</>,
      hora: "Hoy",
    },
    checkoutHoy > 0 && {
      tipo: "info",
      color: "var(--blue)",
      texto: <><strong>{checkoutHoy} check-out{checkoutHoy !== 1 ? "s" : ""}</strong> programado{checkoutHoy !== 1 ? "s" : ""} para hoy.</>,
      hora: "Hoy",
    },
  ].filter(Boolean);

  const estadoColor = (h) =>
    !h.disponible ? "var(--red)" : h.precioPromocion ? "var(--amber)" : "var(--green)";

  const iniciales = (nombre) =>
    nombre?.split(" ").slice(0, 2).map(p => p[0]).join("").toUpperCase() || "?";

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24 }}>

      {/* Saludo */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
        <div>
          <h1 style={{ fontFamily:"'DM Serif Display', serif", fontSize:26, color:"var(--text-1)" }}>{fecha.saludo}</h1>
          <p style={{ fontSize:13, color:"var(--text-3)", marginTop:3 }}>
            {loadingData ? "Cargando datos..." : `${reservasActivas.length} reservas activas · ${pctOcupacion}% de ocupación`}
          </p>
        </div>
        <div style={{ background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:10, padding:"10px 18px", textAlign:"center", boxShadow:"var(--shadow-sm)" }}>
          <div style={{ fontFamily:"'DM Serif Display', serif", fontSize:28, color:"var(--text-1)", lineHeight:1 }}>{fecha.dia}</div>
          <div style={{ fontSize:11, color:"var(--text-3)", textTransform:"uppercase", letterSpacing:".08em", marginTop:2 }}>{fecha.resto}</div>
        </div>
      </div>

      {/* KPI Strip */}
      <div style={s.kpiStrip}>
        {[
          { color:"green", icon:"🏨", label:"Ocupación hoy", num: `${pctOcupacion}%`, sub: `${ocupadas} de ${totalHabitaciones} habitaciones`, delay:0 },
          { color:"blue",  icon:"📅", label:"Reservas activas", num: reservasActivas.length, sub: "confirmadas + pendientes", delay:.07 },
          { color:"amber", icon:"⏳", label:"Pendientes",  num: pendientes.length, sub: "requieren acción", delay:.14 },
          { color:"purple",icon:"💰", label:"Ingresos del mes", num: fmtPrecio(ingresosMes), sub: `${MESES_CORTO[new Date().getMonth()]} ${new Date().getFullYear()}`, delay:.21 },
        ].map(({ color, icon, label, num, sub, delay }) => (
          <div key={label} style={{ ...s.kpiCard, animationDelay:`${delay}s` }}>
            <div style={s.kpiLabel}>
              <span style={{ ...s.kpiIcon, ...KPICARD_COLORS[color].icon }}>{icon}</span>
              {label}
            </div>
            <div style={s.kpiNum}>{num}</div>
            <div style={s.kpiSub}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Dash Body */}
      <div style={s.dashBody}>
        {/* Columna izquierda */}
        <div style={s.dashCol}>

          {/* Actividad de hoy */}
          <div style={s.section}>
            <div style={s.secHeader}>
              <div style={s.secTitle}>Actividad de hoy</div>
              <Link to="/admin/reservas" style={s.secLink}>Ver todas →</Link>
            </div>
            <div style={s.todayStrip}>
              <div style={s.todayCell} onClick={() => navigate("/admin/reservas")}>
                <div style={s.todayNum}>{checkinHoy}</div>
                <div style={s.todayLabel}>Check-ins</div>
              </div>
              <div style={s.todayCell} onClick={() => navigate("/admin/reservas")}>
                <div style={s.todayNum}>{checkoutHoy}</div>
                <div style={s.todayLabel}>Check-outs</div>
              </div>
              <div style={s.todayCellLast}>
                <div style={s.todayNum}>{enCasa}</div>
                <div style={s.todayLabel}>En casa</div>
              </div>
            </div>
          </div>

          {/* Próximas reservas */}
          <div style={s.section}>
            <div style={s.secHeader}>
              <div style={s.secTitle}>Próximas reservas</div>
              <Link to="/admin/reservas" style={s.secLink}>Ver todas →</Link>
            </div>
            {proximas.length === 0 ? (
              <div style={{ padding:"28px 20px", textAlign:"center", fontSize:13, color:"var(--text-3)" }}>
                No hay reservas próximas
              </div>
            ) : proximas.map((r, i) => (
              <div key={r._id} style={{ ...s.miniRow, borderBottom: i === proximas.length - 1 ? "none" : "1px solid var(--border)" }}
                onClick={() => navigate("/admin/reservas")}>
                <div style={s.miniAvatar}>{iniciales(r.nombreCliente)}</div>
                <div style={s.miniInfo}>
                  <div style={s.miniName}>{r.nombreCliente}</div>
                  <div style={s.miniMeta}>Room {r.habitacionId?.numero} · {fmtFecha(r.fechaCheckIn)} → {fmtFecha(r.fechaCheckOut)}</div>
                </div>
                <div style={s.miniRight}>
                  <div style={{ fontSize:13, fontWeight:600, color:"var(--text-1)" }}>{fmtPrecio(r.precioTotal)}</div>
                  <div style={{ fontSize:10, color: r.estado === "pendiente" ? "var(--amber)" : "var(--blue)", fontWeight:700, textTransform:"uppercase", letterSpacing:".04em" }}>
                    {r.estado}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Ingresos últimos 6 meses */}
          <div style={s.section}>
            <div style={s.secHeader}>
              <div style={s.secTitle}>Ingresos — últimos 6 meses</div>
            </div>
            <div style={{ padding:"16px 20px 20px" }}>
              <div style={{ display:"flex", alignItems:"flex-end", gap:6, height:80, marginBottom:8 }}>
                {revData.map((m, i) => {
                  const pct = m.total / maxRev;
                  const isActual = i === revData.length - 1;
                  return (
                    <div key={m.label} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", height:"100%", justifyContent:"flex-end" }}>
                      <div style={{
                        width:"100%", borderRadius:"4px 4px 0 0", minHeight:4,
                        height: `${Math.max(pct * 100, 5)}%`,
                        background: isActual ? "var(--brand)" : "var(--bg-2)",
                        border: `1px solid ${isActual ? "var(--brand)" : "var(--border)"}`,
                        transition:"all .7s cubic-bezier(.4,0,.2,1)",
                      }} />
                      <div style={{ fontSize:9, color:"var(--text-3)", textAlign:"center", marginTop:4 }}>{m.label}</div>
                    </div>
                  );
                })}
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", paddingTop:10, borderTop:"1px solid var(--border)" }}>
                <span style={{ fontSize:11, color:"var(--text-3)", textTransform:"uppercase", letterSpacing:".08em" }}>Total acumulado</span>
                <span style={{ fontFamily:"'DM Serif Display', serif", fontSize:22, color:"var(--text-1)" }}>{fmtPrecio(totalAcumulado)}</span>
              </div>
            </div>
          </div>

          {/* Ocupación por habitación */}
          {occData.length > 0 && (
            <div style={s.section}>
              <div style={s.secHeader}>
                <div style={s.secTitle}>Ocupación este mes por habitación</div>
              </div>
              <div style={s.occChart}>
                {occData.map(({ nombre, tipo, pct }) => (
                  <div key={nombre} style={s.occRow}>
                    <div style={s.occName} title={`${nombre} — ${tipo}`}>{nombre}</div>
                    <div style={s.occTrack}>
                      <div style={{ ...s.occFill, width:`${pct}%`, background: pct > 70 ? "var(--green)" : pct > 40 ? "var(--blue)" : "var(--amber)" }} />
                    </div>
                    <div style={s.occPct}>{pct}%</div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Columna derecha */}
        <div style={s.dashCol}>

          {/* Acciones rápidas */}
          <div style={s.section}>
            <div style={s.secHeader}>
              <div style={s.secTitle}>Acciones rápidas</div>
            </div>
            <div style={s.qaGrid}>
              {[
                { icon:"📋", label:"Ver Reservas",   to:"/admin/reservas" },
                { icon:"🛏",  label:"Habitaciones",   to:"/admin/habitaciones" },
                { icon:"🎫", label:"Cupones",         to:"/admin/cupones" },
                { icon:"👥", label:"Pasajeros",        to:"/admin/clientes" },
              ].map(({ icon, label, to }) => (
                <Link key={label} to={to} style={s.qaBtn}>
                  <span style={{ fontSize:22 }}>{icon}</span>
                  <span style={{ fontSize:11, fontWeight:600, textAlign:"center", lineHeight:1.3 }}>{label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Alertas */}
          <div style={s.section}>
            <div style={s.secHeader}>
              <div style={s.secTitle}>Alertas</div>
              <span style={{ fontSize:11, color:"var(--text-3)" }}>{alertas.length} activa{alertas.length !== 1 ? "s" : ""}</span>
            </div>
            <div style={s.alertList}>
              {alertas.length === 0 ? (
                <div style={{ padding:"28px 20px", textAlign:"center", fontSize:13, color:"var(--text-3)" }}>
                  ✓ Sin alertas pendientes
                </div>
              ) : alertas.map((a, i) => (
                <div key={i} style={{ ...s.alertItem, borderBottom: i === alertas.length - 1 ? "none" : "1px solid var(--border)" }}>
                  <div style={{ ...s.alertDot, background: a.color, boxShadow: `0 0 0 3px var(--bg-2)` }} />
                  <div style={{ flex:1 }}>
                    <div style={s.alertText}>{a.texto}</div>
                    <div style={s.alertTime}>{a.hora}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Estado de habitaciones */}
          <div style={s.section}>
            <div style={s.secHeader}>
              <div style={s.secTitle}>Estado de habitaciones</div>
              <Link to="/admin/habitaciones" style={s.secLink}>Gestionar →</Link>
            </div>
            <div style={s.roomGrid}>
              {habitaciones.slice(0, 8).map((hab, i) => (
                <div
                  key={hab._id}
                  style={{
                    ...s.roomCell,
                    borderRight:   i % 2 === 0 ? "1px solid var(--border)" : "none",
                    borderBottom:  i < habitaciones.slice(0,8).length - 2 ? "1px solid var(--border)" : "none",
                  }}
                  onClick={() => navigate("/admin/habitaciones")}
                >
                  <div style={{ ...s.roomDot, background: estadoColor(hab) }} />
                  <div style={s.roomInfo}>
                    <div style={s.roomName}>Room {hab.numero}</div>
                    <div style={s.roomType}>{hab.titulo}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
