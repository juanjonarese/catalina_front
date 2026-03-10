import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import clientAxios from "../helpers/clientAxios";
import TablaReservas from "../components/TablaReservas";
import ModalReserva from "../components/ModalReserva";
import ModalCheckOut from "../components/ModalCheckOut";
import CalendarioDisponibilidad from "../components/CalendarioDisponibilidad";

const GestionReservasScreen = () => {
  const [reservas, setReservas] = useState([]);
  const [reservaSeleccionada, setReservaSeleccionada] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [reservaCheckOut, setReservaCheckOut] = useState(null);
  const [showModalCheckOut, setShowModalCheckOut] = useState(false);
  const [loadingCheckOut, setLoadingCheckOut] = useState(false);
  const [tabActivo, setTabActivo] = useState("lista");
  const [filtro, setFiltro] = useState("todas");
  const [busqueda, setBusqueda] = useState("");
  const [filtroFecha, setFiltroFecha] = useState("");
  const [filtroHabitacion, setFiltroHabitacion] = useState("");
  const [loading, setLoading] = useState(true);
  const [paginaActual, setPaginaActual] = useState(1);
  const reservasPorPagina = 10;

  useEffect(() => { cargarReservas(); }, []);

  const cargarReservas = async () => {
    try {
      setLoading(true);
      const { data } = await clientAxios.get("/reservas");
      setReservas(data.reservas);
    } catch (error) {
      console.error("Error al cargar reservas:", error);
      Swal.fire({ icon: "error", title: "Error", text: "Error al cargar las reservas" });
    } finally {
      setLoading(false);
    }
  };

  const handleVerReserva = (reserva) => { setReservaSeleccionada(reserva); setShowModal(true); };

  const handleCancelarReserva = async (id) => {
    const result = await Swal.fire({
      title: "¿Cancelar reserva?", text: "Esta acción no se puede deshacer",
      icon: "warning", showCancelButton: true,
      confirmButtonColor: "#C0392B", cancelButtonColor: "#948A7C",
      confirmButtonText: "Sí, cancelar", cancelButtonText: "No",
    });
    if (!result.isConfirmed) return;
    try {
      await clientAxios.put(`/reservas/${id}/cancelar`);
      Swal.fire({ icon: "success", title: "Cancelada", text: "Reserva cancelada exitosamente", timer: 2000 });
      cargarReservas();
    } catch (error) {
      Swal.fire({ icon: "error", title: "Error", text: "Error al cancelar la reserva" });
    }
  };

  const handleCheckIn = async (id) => {
    const result = await Swal.fire({
      title: "¿Realizar Check-In?", text: "Confirmar entrada del huésped",
      icon: "question", showCancelButton: true,
      confirmButtonColor: "#4A7C59", cancelButtonColor: "#948A7C",
      confirmButtonText: "Sí, check-in", cancelButtonText: "Cancelar",
    });
    if (!result.isConfirmed) return;
    try {
      await clientAxios.put(`/reservas/${id}/estado`, { estado: "confirmada" });
      Swal.fire({ icon: "success", title: "Check-In Realizado", timer: 2000 });
      cargarReservas();
    } catch (error) {
      Swal.fire({ icon: "error", title: "Error", text: "Error al realizar check-in" });
    }
  };

  const handleCheckOut = (reserva) => { setReservaCheckOut(reserva); setShowModalCheckOut(true); };

  const handleConfirmarCheckOut = async () => {
    setLoadingCheckOut(true);
    try {
      await clientAxios.put(`/reservas/${reservaCheckOut._id}/estado`, { estado: "completada" });
      setShowModalCheckOut(false);
      setReservaCheckOut(null);
      Swal.fire({ icon: "success", title: "Check-Out Realizado", timer: 2000 });
      cargarReservas();
    } catch (error) {
      Swal.fire({ icon: "error", title: "Error", text: "Error al realizar check-out" });
    } finally {
      setLoadingCheckOut(false);
    }
  };

  const handleEliminarReserva = async (id) => {
    const result = await Swal.fire({
      title: "¿Eliminar reserva?", text: "Esta acción no se puede deshacer",
      icon: "warning", showCancelButton: true,
      confirmButtonColor: "#C0392B", cancelButtonColor: "#948A7C",
      confirmButtonText: "Sí, eliminar", cancelButtonText: "Cancelar",
    });
    if (!result.isConfirmed) return;
    try {
      await clientAxios.delete(`/reservas/${id}`);
      Swal.fire({ icon: "success", title: "Eliminada", timer: 2000 });
      cargarReservas();
    } catch (error) {
      Swal.fire({ icon: "error", title: "Error", text: error.response?.data?.msg || "Error al eliminar la reserva" });
    }
  };

  // Stats
  const stats = {
    total:     reservas.length,
    pendiente: reservas.filter(r => r.estado === "pendiente").length,
    confirmada:reservas.filter(r => r.estado === "confirmada").length,
    completada:reservas.filter(r => r.estado === "completada").length,
    cancelada: reservas.filter(r => r.estado === "cancelada").length,
  };

  const habitacionesUnicas = [...new Set(reservas.map(r => r.habitacionId?.numero).filter(Boolean))].sort((a, b) => a - b);

  // Filtrado
  const reservasFiltradas = reservas.filter((reserva) => {
    if (filtro !== "todas" && reserva.estado !== filtro) return false;
    if (busqueda) {
      const q = busqueda.toLowerCase();
      const coincide =
        (reserva.codigoReserva || "").toLowerCase().includes(q) ||
        (reserva.nombreCliente || "").toLowerCase().includes(q) ||
        String(reserva.habitacionId?.numero || "").includes(q);
      if (!coincide) return false;
    }
    if (filtroFecha) {
      const fechaBusqueda = new Date(filtroFecha);
      const checkIn = new Date(reserva.fechaCheckIn);
      const checkOut = new Date(reserva.fechaCheckOut);
      fechaBusqueda.setHours(0,0,0,0); checkIn.setHours(0,0,0,0); checkOut.setHours(0,0,0,0);
      if (fechaBusqueda < checkIn || fechaBusqueda > checkOut) return false;
    }
    if (filtroHabitacion && reserva.habitacionId?.numero?.toString() !== filtroHabitacion) return false;
    return true;
  });

  const limpiarFiltros = () => {
    setFiltro("todas"); setBusqueda(""); setFiltroFecha(""); setFiltroHabitacion(""); setPaginaActual(1);
  };

  // Paginación
  const indiceUltimo = paginaActual * reservasPorPagina;
  const indicePrimero = indiceUltimo - reservasPorPagina;
  const reservasPaginadas = reservasFiltradas.slice(indicePrimero, indiceUltimo);
  const totalPaginas = Math.ceil(reservasFiltradas.length / reservasPorPagina);

  const cambiarPagina = (num) => { setPaginaActual(num); window.scrollTo({ top: 0, behavior: "smooth" }); };

  const getStatusTabClass = (estado) => {
    const activos = { todas: "active-all", pendiente: "active-pending", confirmada: "active-confirmed", completada: "active-completed", cancelada: "active-cancelled" };
    return filtro === estado ? `status-tab ${activos[estado]}` : "status-tab";
  };

  return (
    <>
      {/* PAGE HEADER */}
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-eyebrow">Administración</div>
          <h1 className="page-title">Gestión de Reservas</h1>
          <p className="page-subtitle">Realizá check-in, check-out y gestioná el estado de cada reserva.</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={limpiarFiltros}>↺ Limpiar filtros</button>
          <button className="btn btn-secondary" onClick={cargarReservas}>↻ Actualizar</button>
        </div>
      </div>

      {/* STATS */}
      <div className="stats-strip">
        <div className="stat-card">
          <div className="stat-icon total">📋</div>
          <div className="stat-info"><div className="stat-num">{loading ? "—" : stats.total}</div><div className="stat-label">Total</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon pending">⏳</div>
          <div className="stat-info"><div className="stat-num">{loading ? "—" : stats.pendiente}</div><div className="stat-label">Pendientes</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon confirmed">✅</div>
          <div className="stat-info"><div className="stat-num">{loading ? "—" : stats.confirmada}</div><div className="stat-label">Confirmadas</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon completed">🏁</div>
          <div className="stat-info"><div className="stat-num">{loading ? "—" : stats.completada}</div><div className="stat-label">Completadas</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon cancelled">❌</div>
          <div className="stat-info"><div className="stat-num">{loading ? "—" : stats.cancelada}</div><div className="stat-label">Canceladas</div></div>
        </div>
      </div>

      {/* TAB BAR */}
      <div className="tab-bar" role="tablist">
        <button
          className={`tab-btn${tabActivo === "lista" ? " active" : ""}`}
          onClick={() => setTabActivo("lista")}
          role="tab"
        >
          <span className="tab-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 3h18M3 9h18M3 15h18M3 21h18"/>
            </svg>
          </span>
          Lista de Reservas
        </button>
        <button
          className={`tab-btn${tabActivo === "calendario" ? " active" : ""}`}
          onClick={() => setTabActivo("calendario")}
          role="tab"
        >
          <span className="tab-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </span>
          Calendario de Disponibilidad
        </button>
      </div>

      {/* ── LISTA VIEW ── */}
      {tabActivo === "lista" && (
        <>
          {/* FILTER BAR */}
          <div className="filter-bar" style={{ gap: 10 }}>
            {/* Status tabs */}
            <div className="filter-status-tabs" role="group">
              {[
                { key: "todas",     label: "Todas",      count: stats.total },
                { key: "pendiente", label: "⏳ Pendientes", count: stats.pendiente },
                { key: "confirmada",label: "✅ Confirmadas", count: stats.confirmada },
                { key: "completada",label: "🏁 Completadas", count: stats.completada },
                { key: "cancelada", label: "❌ Canceladas", count: stats.cancelada },
              ].map(({ key, label, count }) => (
                <button
                  key={key}
                  className={getStatusTabClass(key)}
                  onClick={() => { setFiltro(key); setPaginaActual(1); }}
                >
                  {label}
                  <span className="tab-count">{count}</span>
                </button>
              ))}
            </div>

            {/* Search + inline filters */}
            <div className="filter-inline-row">
              <div className="search-wrap-filter">
                <span className="search-icon-f">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                  </svg>
                </span>
                <input
                  type="search"
                  className="filter-input search-inp"
                  placeholder="Buscar por código, huésped, habitación…"
                  value={busqueda}
                  onChange={(e) => { setBusqueda(e.target.value); setPaginaActual(1); }}
                />
              </div>

              <div className="filter-inline-item">
                <span className="filter-inline-label">📅</span>
                <input
                  type="date"
                  className="filter-input"
                  value={filtroFecha}
                  onChange={(e) => { setFiltroFecha(e.target.value); setPaginaActual(1); }}
                  style={{ width: 152 }}
                />
              </div>

              <div className="filter-inline-item">
                <span className="filter-inline-label">🛏</span>
                <select
                  className="filter-select"
                  value={filtroHabitacion}
                  onChange={(e) => { setFiltroHabitacion(e.target.value); setPaginaActual(1); }}
                  style={{ minWidth: 170 }}
                >
                  <option value="">Todas las hab.</option>
                  {habitacionesUnicas.map((n) => (
                    <option key={n} value={n}>Room {n}</option>
                  ))}
                </select>
              </div>

              <div className="filter-results-count">
                {reservasFiltradas.length} de {reservas.length}
              </div>
            </div>
          </div>

          {/* TABLA + PAGINACIÓN */}
          {loading ? (
            <div className="empty-state"><div className="empty-icon">⏳</div><div className="empty-title">Cargando reservas…</div></div>
          ) : (
            <>
              <TablaReservas
                reservas={reservasPaginadas}
                onEditar={handleVerReserva}
                onCancelar={handleCancelarReserva}
                onCheckIn={handleCheckIn}
                onCheckOut={handleCheckOut}
                onEliminar={handleEliminarReserva}
              />

              {totalPaginas > 1 && (
                <div className="pagination">
                  <span className="pagination-info">
                    Página {paginaActual} de {totalPaginas} · {reservasFiltradas.length} reservas
                  </span>
                  <div className="pagination-controls">
                    <button
                      className="page-btn"
                      disabled={paginaActual === 1}
                      onClick={() => cambiarPagina(paginaActual - 1)}
                    >‹</button>

                    {[...Array(totalPaginas)].map((_, i) => {
                      const n = i + 1;
                      if (n === 1 || n === totalPaginas || (n >= paginaActual - 2 && n <= paginaActual + 2)) {
                        return (
                          <button
                            key={n}
                            className={`page-btn${paginaActual === n ? " active" : ""}`}
                            onClick={() => cambiarPagina(n)}
                          >{n}</button>
                        );
                      } else if (n === paginaActual - 3 || n === paginaActual + 3) {
                        return <button key={n} className="page-btn" disabled>…</button>;
                      }
                      return null;
                    })}

                    <button
                      className="page-btn"
                      disabled={paginaActual === totalPaginas}
                      onClick={() => cambiarPagina(paginaActual + 1)}
                    >›</button>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ── CALENDARIO VIEW ── */}
      {tabActivo === "calendario" && (
        loading ? (
          <div className="empty-state"><div className="empty-icon">⏳</div><div className="empty-title">Cargando…</div></div>
        ) : (
          <CalendarioDisponibilidad reservas={reservas} onVerReserva={handleVerReserva} />
        )
      )}

      {/* MODALES */}
      {showModal && (
        <ModalReserva
          show={showModal}
          onHide={() => setShowModal(false)}
          reserva={reservaSeleccionada}
          onGuardar={cargarReservas}
        />
      )}

      <ModalCheckOut
        show={showModalCheckOut}
        onHide={() => { setShowModalCheckOut(false); setReservaCheckOut(null); }}
        onConfirmar={handleConfirmarCheckOut}
        reserva={reservaCheckOut}
        loading={loadingCheckOut}
      />
    </>
  );
};

export default GestionReservasScreen;
