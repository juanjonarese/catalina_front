import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import clientAxios from "../helpers/clientAxios";
import TablaHabitaciones from "../components/TablaHabitaciones";
import ModalHabitacion from "../components/ModalHabitacion";

const GestionHabitacionesScreen = () => {
  const [habitaciones, setHabitaciones] = useState([]);
  const [habitacionSeleccionada, setHabitacionSeleccionada] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("all");

  useEffect(() => {
    cargarHabitaciones();
  }, []);

  const cargarHabitaciones = async () => {
    try {
      setLoading(true);
      const { data } = await clientAxios.get("/habitaciones");
      setHabitaciones(data.habitaciones);
    } catch (error) {
      console.error("Error al cargar habitaciones:", error);
      Swal.fire({ icon: "error", title: "Error", text: "Error al cargar las habitaciones" });
    } finally {
      setLoading(false);
    }
  };

  const handleNuevaHabitacion = () => {
    setHabitacionSeleccionada(null);
    setShowModal(true);
  };

  const handleEditarHabitacion = (habitacion) => {
    setHabitacionSeleccionada(habitacion);
    setShowModal(true);
  };

  const handleEliminarHabitacion = async (id) => {
    const result = await Swal.fire({
      title: "¿Eliminar habitación?",
      text: "Esta acción no se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#C0392B",
      cancelButtonColor: "#948A7C",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (!result.isConfirmed) return;

    try {
      await clientAxios.delete(`/habitaciones/${id}`);
      Swal.fire({ icon: "success", title: "Eliminada", text: "Habitación eliminada exitosamente", timer: 2000 });
      cargarHabitaciones();
    } catch (error) {
      console.error("Error al eliminar habitación:", error);
      Swal.fire({ icon: "error", title: "Error", text: error.response?.data?.msg || "Error al eliminar la habitación" });
    }
  };

  const handleToggleDisponibilidad = async (id, disponible) => {
    try {
      await clientAxios.put(`/habitaciones/${id}`, { disponible: !disponible });
      cargarHabitaciones();
    } catch (error) {
      console.error("Error al cambiar disponibilidad:", error);
      Swal.fire({ icon: "error", title: "Error", text: "Error al cambiar disponibilidad" });
    }
  };

  // Stats calculadas
  const total = habitaciones.length;
  const disponibles = habitaciones.filter((h) => h.disponible).length;
  const noDisponibles = total - disponibles;
  const conPromo = habitaciones.filter((h) => h.precioPromocion && h.precioPromocion > 0).length;

  // Filtrado
  const habitacionesFiltradas = habitaciones.filter((h) => {
    const matchBusqueda =
      !busqueda ||
      String(h.numero).includes(busqueda) ||
      h.titulo?.toLowerCase().includes(busqueda.toLowerCase()) ||
      h.descripcion?.toLowerCase().includes(busqueda.toLowerCase());

    const matchEstado =
      filtroEstado === "all" ||
      (filtroEstado === "available" && h.disponible) ||
      (filtroEstado === "unavailable" && !h.disponible);

    return matchBusqueda && matchEstado;
  });

  return (
    <>
      {/* PAGE HEADER */}
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-eyebrow">Administración</div>
          <h1 className="page-title">Gestión de Habitaciones</h1>
          <p className="page-subtitle">Creá, editá y gestioná la disponibilidad de cada habitación.</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={cargarHabitaciones}>
            <span>↻</span> Actualizar
          </button>
          <button className="btn btn-primary" onClick={handleNuevaHabitacion}>
            <span>＋</span> Nueva Habitación
          </button>
        </div>
      </div>

      {/* STATS STRIP */}
      <div className="stats-strip">
        <div className="stat-card">
          <div className="stat-icon total">🛏</div>
          <div className="stat-info">
            <div className="stat-num">{loading ? "—" : total}</div>
            <div className="stat-label">Total habitaciones</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon avail">✅</div>
          <div className="stat-info">
            <div className="stat-num">{loading ? "—" : disponibles}</div>
            <div className="stat-label">Disponibles</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon ocup">🔴</div>
          <div className="stat-info">
            <div className="stat-num">{loading ? "—" : noDisponibles}</div>
            <div className="stat-label">No disponibles</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon promo">🏷</div>
          <div className="stat-info">
            <div className="stat-num">{loading ? "—" : conPromo}</div>
            <div className="stat-label">Con promoción</div>
          </div>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="toolbar">
        <div className="search-wrap">
          <span className="search-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
          </span>
          <input
            type="search"
            className="search-input"
            placeholder="Buscar por nombre, N° o descripción…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            aria-label="Buscar habitaciones"
          />
        </div>

        <div className="toolbar-sep" />

        <select
          className="filter-select"
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          aria-label="Filtrar por estado"
        >
          <option value="all">Todos los estados</option>
          <option value="available">Disponible</option>
          <option value="unavailable">No disponible</option>
        </select>
      </div>

      {/* CONTENIDO */}
      {loading ? (
        <div className="empty-state">
          <div className="empty-icon">⏳</div>
          <div className="empty-title">Cargando habitaciones…</div>
        </div>
      ) : habitaciones.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🛏</div>
          <div className="empty-title">Sin habitaciones</div>
          <div className="empty-text">Comenzá creando tu primera habitación.</div>
          <button className="btn btn-primary" onClick={handleNuevaHabitacion}>
            ＋ Nueva Habitación
          </button>
        </div>
      ) : (
        <TablaHabitaciones
          habitaciones={habitacionesFiltradas}
          onEditar={handleEditarHabitacion}
          onEliminar={handleEliminarHabitacion}
          onToggleDisponibilidad={handleToggleDisponibilidad}
        />
      )}

      {/* MODAL */}
      {showModal && (
        <ModalHabitacion
          show={showModal}
          onHide={() => setShowModal(false)}
          habitacion={habitacionSeleccionada}
          onGuardar={cargarHabitaciones}
        />
      )}
    </>
  );
};

export default GestionHabitacionesScreen;
