import { useState } from "react";
import { Modal, Button } from "react-bootstrap";
import Swal from "sweetalert2";
import clientAxios from "../helpers/clientAxios";

const ModalReservaCliente = ({ show, onHide, habitacion, criterios, precioTotal, onReservaExitosa }) => {
  const [formData, setFormData] = useState({
    nombreCliente: "",
    emailCliente: "",
    telefonoCliente: "",
  });
  const [loading, setLoading] = useState(false);

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
      // Datos para crear la preferencia de pago
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

      // Crear preferencia de pago en MercadoPago
      const response = await clientAxios.post("/pagos/crear-preferencia", pagoData);

      // Mostrar mensaje informativo antes de redirigir
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

      // Redirigir a la página de pago de MercadoPago
      // En producción usar: response.data.initPoint
      // En desarrollo/pruebas usar: response.data.sandboxInitPoint
      const paymentUrl = response.data.sandboxInitPoint || response.data.initPoint;
      window.location.href = paymentUrl;

    } catch (error) {
      console.error("Error al crear preferencia de pago:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.msg || "Error al procesar el pago",
      });
      setLoading(false);
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
    <Modal show={show} onHide={onHide} size="lg">
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

        <form onSubmit={handleSubmit}>
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
                required
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
                required
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
                required
                placeholder="+54 9 11 1234-5678"
              />
            </div>
          </div>

          <div className="d-flex justify-content-end gap-2 mt-4">
            <Button variant="secondary" onClick={onHide} disabled={loading}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? "Procesando..." : "Confirmar Reserva"}
            </Button>
          </div>
        </form>
      </Modal.Body>
    </Modal>
  );
};

export default ModalReservaCliente;
