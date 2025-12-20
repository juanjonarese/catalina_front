import { useState, useEffect } from "react";
import { Tab, Tabs } from "react-bootstrap";
import Swal from "sweetalert2";
import clientAxios from "../helpers/clientAxios";
import TablaReservas from "../components/TablaReservas";
import ModalReserva from "../components/ModalReserva";
import CalendarioDisponibilidad from "../components/CalendarioDisponibilidad";

const GestionReservasScreen = () => {
  const [reservas, setReservas] = useState([]);
  const [reservaSeleccionada, setReservaSeleccionada] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [filtro, setFiltro] = useState("todas");
  const [filtroFecha, setFiltroFecha] = useState("");
  const [filtroHabitacion, setFiltroHabitacion] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarReservas();
  }, []);

  const cargarReservas = async () => {
    try {
      setLoading(true);
      const { data } = await clientAxios.get("/reservas");
      setReservas(data.reservas);
    } catch (error) {
      console.error("Error al cargar reservas:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error al cargar las reservas",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerReserva = (reserva) => {
    setReservaSeleccionada(reserva);
    setShowModal(true);
  };

  const handleCancelarReserva = async (id) => {
    const result = await Swal.fire({
      title: "¿Cancelar reserva?",
      text: "Esta acción no se puede deshacer",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Sí, cancelar",
      cancelButtonText: "No",
    });

    if (!result.isConfirmed) return;

    try {
      await clientAxios.put(`/reservas/${id}/cancelar`);
      Swal.fire({
        icon: "success",
        title: "Cancelada",
        text: "Reserva cancelada exitosamente",
        timer: 2000,
      });
      cargarReservas();
    } catch (error) {
      console.error("Error al cancelar reserva:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error al cancelar la reserva",
      });
    }
  };

  const handleCheckIn = async (id) => {
    const result = await Swal.fire({
      title: "¿Realizar Check-In?",
      text: "Confirmar entrada del huésped",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#28a745",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Sí, check-in",
      cancelButtonText: "Cancelar",
    });

    if (!result.isConfirmed) return;

    try {
      await clientAxios.put(`/reservas/${id}/estado`, { estado: "confirmada" });
      Swal.fire({
        icon: "success",
        title: "Check-In Realizado",
        text: "Check-in realizado exitosamente",
        timer: 2000,
      });
      cargarReservas();
    } catch (error) {
      console.error("Error al hacer check-in:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error al realizar check-in",
      });
    }
  };

  const handleCheckOut = async (id) => {
    const result = await Swal.fire({
      title: "¿Realizar Check-Out?",
      text: "Confirmar salida del huésped",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#17a2b8",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Sí, check-out",
      cancelButtonText: "Cancelar",
    });

    if (!result.isConfirmed) return;

    try {
      await clientAxios.put(`/reservas/${id}/estado`, { estado: "completada" });
      Swal.fire({
        icon: "success",
        title: "Check-Out Realizado",
        text: "Check-out realizado exitosamente",
        timer: 2000,
      });
      cargarReservas();
    } catch (error) {
      console.error("Error al hacer check-out:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error al realizar check-out",
      });
    }
  };

  // Obtener lista única de habitaciones
  const habitacionesUnicas = [...new Set(reservas.map(r => r.habitacionId?.numero).filter(Boolean))].sort((a, b) => a - b);

  // Aplicar todos los filtros
  const reservasFiltradas = reservas.filter((reserva) => {
    // Filtro por estado
    if (filtro !== "todas" && reserva.estado !== filtro) return false;

    // Filtro por fecha (busca si la fecha está dentro del rango de la reserva)
    if (filtroFecha) {
      const fechaBusqueda = new Date(filtroFecha);
      const checkIn = new Date(reserva.fechaCheckIn);
      const checkOut = new Date(reserva.fechaCheckOut);

      // Normalizar fechas para comparación solo de día
      fechaBusqueda.setHours(0, 0, 0, 0);
      checkIn.setHours(0, 0, 0, 0);
      checkOut.setHours(0, 0, 0, 0);

      if (fechaBusqueda < checkIn || fechaBusqueda > checkOut) return false;
    }

    // Filtro por habitación
    if (filtroHabitacion && reserva.habitacionId?.numero?.toString() !== filtroHabitacion) return false;

    return true;
  });

  const limpiarFiltros = () => {
    setFiltro("todas");
    setFiltroFecha("");
    setFiltroHabitacion("");
  };

  return (
    <div className="container my-5">
      <div className="row mb-4">
        <div className="col-12">
          <h1>Gestión de Reservas</h1>
          <p className="text-muted">
            Administra las reservas del hotel: realiza check-in, check-out y cancela reservas
          </p>
        </div>
      </div>

      <Tabs
        defaultActiveKey="lista"
        id="reservas-tabs"
        className="mb-4"
        fill
      >
        {/* Pestaña de Lista de Reservas */}
        <Tab eventKey="lista" title={<><i className="bi bi-list-ul me-2"></i>Lista de Reservas</>}>
          {/* Filtros */}
          <div className="row mb-4">
            <div className="col-12">
              <div className="card">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="card-title mb-0">Filtros</h5>
                    <button className="btn btn-sm btn-outline-secondary" onClick={limpiarFiltros}>
                      <i className="bi bi-x-circle me-1"></i>
                      Limpiar Filtros
                    </button>
                  </div>

                  {/* Filtro por Estado */}
                  <div className="mb-3">
                    <label className="form-label fw-bold">Por Estado:</label>
                    <div className="btn-group d-flex flex-wrap" role="group">
                      <button
                        type="button"
                        className={`btn ${filtro === "todas" ? "btn-primary" : "btn-outline-primary"}`}
                        onClick={() => setFiltro("todas")}
                      >
                        Todas
                      </button>
                      <button
                        type="button"
                        className={`btn ${filtro === "pendiente" ? "btn-warning" : "btn-outline-warning"}`}
                        onClick={() => setFiltro("pendiente")}
                      >
                        Pendientes
                      </button>
                      <button
                        type="button"
                        className={`btn ${filtro === "confirmada" ? "btn-success" : "btn-outline-success"}`}
                        onClick={() => setFiltro("confirmada")}
                      >
                        Confirmadas
                      </button>
                      <button
                        type="button"
                        className={`btn ${filtro === "completada" ? "btn-info" : "btn-outline-info"}`}
                        onClick={() => setFiltro("completada")}
                      >
                        Completadas
                      </button>
                      <button
                        type="button"
                        className={`btn ${filtro === "cancelada" ? "btn-danger" : "btn-outline-danger"}`}
                        onClick={() => setFiltro("cancelada")}
                      >
                        Canceladas
                      </button>
                    </div>
                  </div>

                  {/* Filtros por Fecha y Habitación */}
                  <div className="row">
                    <div className="col-md-6">
                      <label className="form-label fw-bold">Por Fecha:</label>
                      <input
                        type="date"
                        className="form-control"
                        value={filtroFecha}
                        onChange={(e) => setFiltroFecha(e.target.value)}
                        placeholder="Seleccione una fecha"
                      />
                      <small className="text-muted">Muestra reservas activas en la fecha seleccionada</small>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold">Por Habitación:</label>
                      <select
                        className="form-select"
                        value={filtroHabitacion}
                        onChange={(e) => setFiltroHabitacion(e.target.value)}
                      >
                        <option value="">Todas las habitaciones</option>
                        {habitacionesUnicas.map((numero) => (
                          <option key={numero} value={numero}>
                            Room {numero}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Contador de resultados */}
                  <div className="mt-3 text-end">
                    <small className="text-muted">
                      Mostrando <strong>{reservasFiltradas.length}</strong> de <strong>{reservas.length}</strong> reservas
                    </small>
                  </div>
                </div>
              </div>
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
              ) : (
                <TablaReservas
                  reservas={reservasFiltradas}
                  onEditar={handleVerReserva}
                  onCancelar={handleCancelarReserva}
                  onCheckIn={handleCheckIn}
                  onCheckOut={handleCheckOut}
                />
              )}
            </div>
          </div>
        </Tab>

        {/* Pestaña de Calendario */}
        <Tab eventKey="calendario" title={<><i className="bi bi-calendar3 me-2"></i>Calendario de Disponibilidad</>}>
          <div className="row">
            <div className="col-12">
              {loading ? (
                <div className="text-center">
                  <div className="spinner-border" role="status">
                    <span className="visually-hidden">Cargando...</span>
                  </div>
                </div>
              ) : (
                <CalendarioDisponibilidad reservas={reservas} />
              )}
            </div>
          </div>
        </Tab>
      </Tabs>

      {showModal && (
        <ModalReserva
          show={showModal}
          onHide={() => setShowModal(false)}
          reserva={reservaSeleccionada}
          onGuardar={cargarReservas}
        />
      )}
    </div>
  );
};

export default GestionReservasScreen;
