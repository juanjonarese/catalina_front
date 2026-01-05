import { useState, useEffect } from "react";
import { Modal, Button } from "react-bootstrap";
import clientAxios from "../helpers/clientAxios";

const ModalReserva = ({ show, onHide, reserva, onGuardar }) => {
  const [formData, setFormData] = useState({
    nombreCliente: "",
    emailCliente: "",
    telefonoCliente: "",
    fechaCheckIn: "",
    fechaCheckOut: "",
    numAdultos: 1,
    numNinos: 0,
    tipoHabitacion: "",
    numeroHabitacion: "",
    precioTotal: 0,
  });

  const [habitacionesDisponibles, setHabitacionesDisponibles] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (reserva) {
      setFormData({
        nombreCliente: reserva.nombreCliente || "",
        emailCliente: reserva.emailCliente || "",
        telefonoCliente: reserva.telefonoCliente || "",
        fechaCheckIn: reserva.fechaCheckIn ? reserva.fechaCheckIn.split('T')[0] : "",
        fechaCheckOut: reserva.fechaCheckOut ? reserva.fechaCheckOut.split('T')[0] : "",
        numAdultos: reserva.numAdultos || 1,
        numNinos: reserva.numNinos || 0,
        tipoHabitacion: reserva.tipoHabitacion || "",
        numeroHabitacion: reserva.numeroHabitacion || "",
        precioTotal: reserva.precioTotal || 0,
      });
    }
  }, [reserva]);

  useEffect(() => {
    if (formData.fechaCheckIn && formData.fechaCheckOut) {
      buscarHabitacionesDisponibles();
    }
  }, [formData.fechaCheckIn, formData.fechaCheckOut, formData.numAdultos, formData.numNinos]);

  useEffect(() => {
    if (formData.numeroHabitacion && formData.fechaCheckIn && formData.fechaCheckOut) {
      calcularPrecioTotal();
    }
  }, [formData.numeroHabitacion, formData.fechaCheckIn, formData.fechaCheckOut]);

  const buscarHabitacionesDisponibles = async () => {
    try {
      const { data } = await clientAxios.get("/habitaciones/disponibilidad", {
        params: {
          fechaCheckIn: formData.fechaCheckIn,
          fechaCheckOut: formData.fechaCheckOut,
          numAdultos: formData.numAdultos,
          numNinos: formData.numNinos,
        },
      });
      setHabitacionesDisponibles(data.habitaciones);
    } catch (error) {
      console.error("Error al buscar habitaciones:", error);
    }
  };

  const calcularPrecioTotal = () => {
    const habitacion = habitacionesDisponibles.find(
      (h) => h.numero.toString() === formData.numeroHabitacion
    );

    if (habitacion) {
      const fechaEntrada = new Date(formData.fechaCheckIn);
      const fechaSalida = new Date(formData.fechaCheckOut);
      const noches = Math.ceil((fechaSalida - fechaEntrada) / (1000 * 60 * 60 * 24));
      const precio = habitacion.precioPorNoche * noches;

      setFormData((prev) => ({
        ...prev,
        tipoHabitacion: habitacion.tipo,
        precioTotal: precio,
      }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (reserva) {
        // Editar reserva existente
        await clientAxios.put(`/reservas/${reserva._id}/estado`, {
          estado: formData.estado || reserva.estado,
        });
      } else {
        // Crear nueva reserva
        await clientAxios.post("/reservas", formData);
      }

      alert(reserva ? "Reserva actualizada exitosamente" : "Reserva creada exitosamente");
      onGuardar();
      onHide();
    } catch (error) {
      console.error("Error al guardar reserva:", error);
      alert("Error al guardar la reserva: " + (error.response?.data?.msg || error.message));
    } finally {
      setLoading(false);
    }
  };

  const obtenerFechaMinima = () => {
    const hoy = new Date();
    return hoy.toISOString().split("T")[0];
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          {reserva ? "Editar Reserva" : "Nueva Reserva"}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {reserva && reserva.codigoReserva && (
          <div className="alert alert-info d-flex align-items-center justify-content-between mb-4">
            <div>
              <strong>Código de Reserva:</strong>
            </div>
            <span
              className="badge bg-primary"
              style={{
                fontSize: '1.1rem',
                padding: '10px 15px',
                letterSpacing: '2px',
                fontWeight: 'bold'
              }}
            >
              {reserva.codigoReserva}
            </span>
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <h5 className="mb-3">Información del Cliente</h5>
          <div className="row g-3 mb-4">
            <div className="col-md-6">
              <label className="form-label">Nombre Completo *</label>
              <input
                type="text"
                className="form-control"
                name="nombreCliente"
                value={formData.nombreCliente}
                onChange={handleChange}
                required
                disabled={reserva}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Email *</label>
              <input
                type="email"
                className="form-control"
                name="emailCliente"
                value={formData.emailCliente}
                onChange={handleChange}
                required
                disabled={reserva}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Teléfono *</label>
              <input
                type="tel"
                className="form-control"
                name="telefonoCliente"
                value={formData.telefonoCliente}
                onChange={handleChange}
                required
                disabled={reserva}
              />
            </div>
          </div>

          <h5 className="mb-3">Detalles de la Reserva</h5>
          <div className="row g-3 mb-4">
            <div className="col-md-3">
              <label className="form-label">Fecha Check-In *</label>
              <input
                type="date"
                className="form-control"
                name="fechaCheckIn"
                value={formData.fechaCheckIn}
                onChange={handleChange}
                min={obtenerFechaMinima()}
                required
                disabled={reserva}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">Fecha Check-Out *</label>
              <input
                type="date"
                className="form-control"
                name="fechaCheckOut"
                value={formData.fechaCheckOut}
                onChange={handleChange}
                min={formData.fechaCheckIn || obtenerFechaMinima()}
                required
                disabled={reserva}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">Adultos *</label>
              <input
                type="number"
                className="form-control"
                name="numAdultos"
                value={formData.numAdultos}
                onChange={handleChange}
                min="1"
                max="10"
                required
                disabled={reserva}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">Niños</label>
              <input
                type="number"
                className="form-control"
                name="numNinos"
                value={formData.numNinos}
                onChange={handleChange}
                min="0"
                max="10"
                disabled={reserva}
              />
            </div>
          </div>

          {!reserva && habitacionesDisponibles.length > 0 && (
            <div className="mb-4">
              <h5 className="mb-3">Habitaciones Disponibles</h5>
              <div className="row g-3">
                {habitacionesDisponibles.map((habitacion) => (
                  <div key={habitacion.numero} className="col-md-6">
                    <div
                      className={`card ${formData.numeroHabitacion === habitacion.numero.toString() ? "border-primary" : ""}`}
                      style={{ cursor: "pointer" }}
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          numeroHabitacion: habitacion.numero.toString(),
                        }))
                      }
                    >
                      <div className="card-body">
                        <h6>
                          Habitación #{habitacion.numero} -{" "}
                          <span className="text-capitalize">{habitacion.tipo}</span>
                        </h6>
                        <p className="mb-1">
                          <small>
                            Capacidad: {habitacion.capacidadAdultos} adultos,{" "}
                            {habitacion.capacidadNinos} niños
                          </small>
                        </p>
                        <p className="mb-0">
                          <strong>${habitacion.precioPorNoche}</strong> / noche
                        </p>
                        {formData.numeroHabitacion === habitacion.numero.toString() && (
                          <span className="badge bg-primary mt-2">Seleccionada</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!reserva && habitacionesDisponibles.length === 0 && formData.fechaCheckIn && formData.fechaCheckOut && (
            <div className="alert alert-warning" role="alert">
              No hay habitaciones disponibles para las fechas y cantidad de huéspedes seleccionados.
            </div>
          )}

          {formData.precioTotal > 0 && (
            <div className="alert alert-info">
              <strong>Precio Total: ${formData.precioTotal}</strong>
            </div>
          )}

          <div className="d-flex justify-content-end gap-2">
            <Button variant="secondary" onClick={onHide}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={loading || (!reserva && !formData.numeroHabitacion)}
            >
              {loading ? "Guardando..." : reserva ? "Actualizar" : "Crear Reserva"}
            </Button>
          </div>
        </form>
      </Modal.Body>
    </Modal>
  );
};

export default ModalReserva;
