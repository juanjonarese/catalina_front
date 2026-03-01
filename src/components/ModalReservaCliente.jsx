import { useState } from "react";
import { Modal, Button } from "react-bootstrap";
import Swal from "sweetalert2";
import clientAxios from "../helpers/clientAxios";

const ModalReservaCliente = ({ show, onHide, habitacion, criterios, precioTotal }) => {
  const [formData, setFormData] = useState({
    nombreCliente: "",
    emailCliente: "",
    telefonoCliente: "",
  });
  const [loading, setLoading] = useState(null); // null | "pagar" | "reservar"

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validarFormulario = () => {
    if (!formData.nombreCliente || !formData.emailCliente || !formData.telefonoCliente) {
      Swal.fire({
        icon: "warning",
        title: "Campos incompletos",
        text: "Por favor completá todos los datos antes de continuar.",
      });
      return false;
    }
    return true;
  };

  const handlePagar = async () => {
    if (!validarFormulario()) return;
    setLoading("pagar");

    try {
      const pagoData = {
        nombreCliente: formData.nombreCliente,
        emailCliente: formData.emailCliente,
        telefonoCliente: formData.telefonoCliente,
        habitacionId: habitacion._id,
        numAdultos: criterios.numAdultos,
        numNinos: criterios.numNinos,
        fechaCheckIn: criterios.fechaCheckIn,
        fechaCheckOut: criterios.fechaCheckOut,
        precioTotal: precioTotal,
        tituloHabitacion: habitacion.titulo,
        numeroHabitacion: habitacion.numero,
      };

      const response = await clientAxios.post("/pagos/crear-preferencia", pagoData);

      await Swal.fire({
        icon: "info",
        title: "Redirigiendo a Pago",
        html: `
          <p>Serás redirigido a MercadoPago para completar el pago.</p>
          <p><strong>Habitación:</strong> ${habitacion.titulo}</p>
          <p><strong>Total a pagar:</strong> $${precioTotal}</p>
          <p class="mt-3 text-muted"><small>Una vez completado el pago, recibirás un email con la confirmación de tu reserva.</small></p>
        `,
        confirmButtonText: "Ir a Pagar",
        showCancelButton: true,
        cancelButtonText: "Cancelar",
      });

      const paymentUrl = response.data.initPoint;

      if (!paymentUrl) {
        throw new Error("No se recibió URL de pago de MercadoPago");
      }

      window.location.href = paymentUrl;

    } catch (error) {
      console.error("Error al crear preferencia de pago:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.msg || "Error al procesar el pago",
      });
    } finally {
      setLoading(null);
    }
  };

  const handleReservar = async () => {
    if (!validarFormulario()) return;
    setLoading("reservar");

    try {
      const reservaData = {
        nombreCliente: formData.nombreCliente,
        emailCliente: formData.emailCliente,
        telefonoCliente: formData.telefonoCliente,
        habitacionId: habitacion._id,
        numAdultos: criterios.numAdultos,
        numNinos: criterios.numNinos,
        fechaCheckIn: criterios.fechaCheckIn,
        fechaCheckOut: criterios.fechaCheckOut,
        precioTotal: precioTotal,
      };

      const response = await clientAxios.post("/reservas", reservaData);
      const { reserva } = response.data;

      await Swal.fire({
        icon: "success",
        title: "¡Reserva Recibida!",
        html: `
          <p>Tu reserva fue registrada exitosamente.</p>
          <p><strong>Código de reserva:</strong></p>
          <h3 style="color:#1a73e8; letter-spacing:2px">${reserva.codigoReserva}</h3>
          <p style="font-size:13px; color:#666">
            Recibirás un email con los detalles.<br/>
            El hotel se comunicará para confirmar disponibilidad.
          </p>
        `,
        confirmButtonText: "Entendido",
      });

      onHide();

    } catch (error) {
      console.error("Error al crear reserva:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.msg || "Error al registrar la reserva",
      });
    } finally {
      setLoading(null);
    }
  };

  const calcularNoches = () => {
    const entrada = new Date(criterios.fechaCheckIn);
    const salida = new Date(criterios.fechaCheckOut);
    const diffTime = Math.abs(salida - entrada);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" fullscreen="sm-down">
      <Modal.Header closeButton>
        <Modal.Title>Completar Reserva</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="row mb-4">
          <div className="col-12">
            <div className="card bg-light">
              <div className="card-body">
                <h5 className="card-title">{habitacion.titulo}</h5>
                <div className="row">
                  <div className="col-md-6">
                    <p className="mb-1">
                      <strong>Check-in:</strong>{" "}
                      {new Date(criterios.fechaCheckIn).toLocaleDateString("es-ES")}
                    </p>
                    <p className="mb-1">
                      <strong>Check-out:</strong>{" "}
                      {new Date(criterios.fechaCheckOut).toLocaleDateString("es-ES")}
                    </p>
                  </div>
                  <div className="col-md-6">
                    <p className="mb-1">
                      <strong>Noches:</strong> {calcularNoches()}
                    </p>
                    <p className="mb-1">
                      <strong>Huéspedes:</strong> {criterios.numAdultos} adulto(s)
                      {criterios.numNinos > 0 && `, ${criterios.numNinos} niño(s)`}
                    </p>
                  </div>
                </div>
                <hr />
                <h4 className="text-primary mb-0">
                  Total: ${precioTotal}
                </h4>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h5 className="mb-3">Datos del Cliente</h5>
          <div className="row g-3">
            <div className="col-12">
              <label className="form-label">Nombre Completo *</label>
              <input
                type="text"
                className="form-control"
                name="nombreCliente"
                value={formData.nombreCliente}
                onChange={handleChange}
                placeholder="Juan Pérez"
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
                placeholder="juan@ejemplo.com"
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
                placeholder="+54 9 11 1234-5678"
              />
            </div>
          </div>

          <div className="d-flex justify-content-end gap-2 mt-4">
            <Button variant="secondary" type="button" onClick={onHide} disabled={!!loading}>
              Cancelar
            </Button>
            <Button variant="primary" type="button" onClick={handleReservar} disabled={!!loading}>
              {loading === "reservar" ? "Reservando..." : "Reservar"}
            </Button>
            <Button variant="primary" type="button" onClick={handlePagar} disabled={!!loading}>
              {loading === "pagar" ? "Procesando..." : "Pagar ahora"}
            </Button>
          </div>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default ModalReservaCliente;
