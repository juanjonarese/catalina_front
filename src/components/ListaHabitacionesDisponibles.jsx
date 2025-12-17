import { useState } from "react";
import ModalReservaCliente from "./ModalReservaCliente";

const ListaHabitacionesDisponibles = ({ habitaciones, criterios }) => {
  const [habitacionSeleccionada, setHabitacionSeleccionada] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const calcularNoches = () => {
    const entrada = new Date(criterios.fechaCheckIn);
    const salida = new Date(criterios.fechaCheckOut);
    const diffTime = Math.abs(salida - entrada);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const calcularPrecioTotal = (habitacion) => {
    const noches = calcularNoches();
    const precio = habitacion.precioPromocion || habitacion.precio;
    return precio * noches;
  };

  const handleReservar = (habitacion) => {
    setHabitacionSeleccionada(habitacion);
    setShowModal(true);
  };

  const noches = calcularNoches();

  return (
    <>
      <div className="mb-4">
        <h3>Habitaciones Disponibles</h3>
        <p className="text-muted">
          Del {new Date(criterios.fechaCheckIn).toLocaleDateString("es-ES")} al{" "}
          {new Date(criterios.fechaCheckOut).toLocaleDateString("es-ES")} ({noches}{" "}
          {noches === 1 ? "noche" : "noches"}) - {criterios.totalPersonas}{" "}
          {criterios.totalPersonas === 1 ? "persona" : "personas"}
        </p>
      </div>

      <div className="row g-4">
        {habitaciones.map((habitacion) => (
          <div key={habitacion._id} className="col-md-6 col-lg-4">
            <div className="card h-100 shadow-sm">
              {habitacion.imagenes && habitacion.imagenes.length > 0 ? (
                <img
                  src={habitacion.imagenes[0]}
                  className="card-img-top"
                  alt={habitacion.titulo}
                  style={{ height: "200px", objectFit: "cover" }}
                />
              ) : (
                <div
                  className="card-img-top bg-light d-flex align-items-center justify-content-center"
                  style={{ height: "200px" }}
                >
                  <i className="bi bi-image text-muted" style={{ fontSize: "3rem" }}></i>
                </div>
              )}

              <div className="card-body d-flex flex-column">
                <h5 className="card-title">{habitacion.titulo}</h5>
                <p className="card-text text-muted small">
                  {habitacion.descripcion}
                </p>

                <div className="mb-3">
                  <small className="text-muted">
                    <i className="bi bi-people me-1"></i>
                    Capacidad: {habitacion.capacidadPersonas} personas
                  </small>
                </div>

                {habitacion.amenidades && habitacion.amenidades.length > 0 && (
                  <div className="mb-3">
                    <div className="d-flex flex-wrap gap-1">
                      {habitacion.amenidades.slice(0, 4).map((amenidad, index) => (
                        <span key={index} className="badge bg-secondary">
                          {amenidad}
                        </span>
                      ))}
                      {habitacion.amenidades.length > 4 && (
                        <span className="badge bg-secondary">
                          +{habitacion.amenidades.length - 4}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="mt-auto">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div>
                      {habitacion.precioPromocion ? (
                        <>
                          <small className="text-muted text-decoration-line-through">
                            ${habitacion.precio}/noche
                          </small>
                          <h4 className="text-success mb-0">
                            ${habitacion.precioPromocion}/noche
                          </h4>
                        </>
                      ) : (
                        <h4 className="mb-0">${habitacion.precio}/noche</h4>
                      )}
                    </div>
                  </div>

                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <small className="text-muted">Precio total</small>
                      <h5 className="text-primary mb-0">
                        ${calcularPrecioTotal(habitacion)}
                      </h5>
                    </div>
                    <button
                      className="btn btn-primary"
                      onClick={() => handleReservar(habitacion)}
                    >
                      Reservar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <ModalReservaCliente
          show={showModal}
          onHide={() => setShowModal(false)}
          habitacion={habitacionSeleccionada}
          criterios={criterios}
          precioTotal={calcularPrecioTotal(habitacionSeleccionada)}
        />
      )}
    </>
  );
};

export default ListaHabitacionesDisponibles;
