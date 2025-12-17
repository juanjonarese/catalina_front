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
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error al cargar las habitaciones",
      });
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
      title: "¿Estás seguro?",
      text: "Esta acción no se puede deshacer",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (!result.isConfirmed) return;

    try {
      await clientAxios.delete(`/habitaciones/${id}`);
      Swal.fire({
        icon: "success",
        title: "Eliminada",
        text: "Habitación eliminada exitosamente",
        timer: 2000,
      });
      cargarHabitaciones();
    } catch (error) {
      console.error("Error al eliminar habitación:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.msg || "Error al eliminar la habitación",
      });
    }
  };

  const handleToggleDisponibilidad = async (id, disponible) => {
    try {
      await clientAxios.put(`/habitaciones/${id}`, { disponible: !disponible });
      cargarHabitaciones();
    } catch (error) {
      console.error("Error al cambiar disponibilidad:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error al cambiar disponibilidad",
      });
    }
  };

  return (
    <div className="container my-5">
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            <h1>Gestión de Habitaciones</h1>
            <button
              className="btn btn-primary btn-lg"
              onClick={handleNuevaHabitacion}
            >
              <i className="bi bi-plus-circle me-2"></i>
              Nueva Habitación
            </button>
          </div>
          <p className="text-muted">
            Administra las habitaciones del hotel: crea, edita y gestiona la disponibilidad
          </p>
        </div>
      </div>

      <div className="row">
        <div className="col-12">
          {loading ? (
            <div className="text-center">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
            </div>
          ) : habitaciones.length === 0 ? (
            <div className="alert alert-info text-center" role="alert">
              <i className="bi bi-info-circle me-2"></i>
              No hay habitaciones creadas. Comienza creando tu primera habitación.
            </div>
          ) : (
            <TablaHabitaciones
              habitaciones={habitaciones}
              onEditar={handleEditarHabitacion}
              onEliminar={handleEliminarHabitacion}
              onToggleDisponibilidad={handleToggleDisponibilidad}
            />
          )}
        </div>
      </div>

      {showModal && (
        <ModalHabitacion
          show={showModal}
          onHide={() => setShowModal(false)}
          habitacion={habitacionSeleccionada}
          onGuardar={cargarHabitaciones}
        />
      )}
    </div>
  );
};

export default GestionHabitacionesScreen;
