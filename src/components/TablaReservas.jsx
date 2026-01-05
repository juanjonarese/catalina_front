const TablaReservas = ({ reservas, onEditar, onCancelar, onCheckIn, onCheckOut, onEliminar }) => {
  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString("es-ES");
  };

  const getBadgeEstado = (estado) => {
    const badges = {
      pendiente: "bg-warning text-dark",
      confirmada: "bg-success",
      completada: "bg-info",
      cancelada: "bg-danger",
    };
    return badges[estado] || "bg-secondary";
  };

  const calcularNoches = (fechaCheckIn, fechaCheckOut) => {
    const entrada = new Date(fechaCheckIn);
    const salida = new Date(fechaCheckOut);
    const diffTime = Math.abs(salida - entrada);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (reservas.length === 0) {
    return (
      <div className="alert alert-info text-center" role="alert">
        No hay reservas para mostrar
      </div>
    );
  }

  return (
    <div className="table-responsive">
      <table className="table table-hover table-striped">
        <thead className="table-dark">
          <tr>
            <th>Código</th>
            <th>Habitación</th>
            <th>Cliente</th>
            <th>Check-In</th>
            <th>Check-Out</th>
            <th>Noches</th>
            <th>Huéspedes</th>
            <th>Precio</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {reservas.map((reserva) => (
            <tr key={reserva._id}>
              <td>
                <span
                  className="badge bg-primary"
                  style={{
                    fontSize: '0.9rem',
                    padding: '8px 12px',
                    letterSpacing: '1px',
                    fontWeight: 'bold'
                  }}
                >
                  {reserva.codigoReserva || 'N/A'}
                </span>
              </td>
              <td>
                {reserva.habitacionId ? (
                  <>
                    <strong>{reserva.habitacionId.titulo}</strong>
                    <br />
                    <small className="text-muted">
                      <i className="bi bi-people me-1"></i>
                      {reserva.habitacionId.capacidadPersonas} personas
                    </small>
                  </>
                ) : (
                  <span className="text-muted">No asignada</span>
                )}
              </td>
              <td>
                <strong>{reserva.nombreCliente}</strong>
                <br />
                <small className="text-muted">{reserva.emailCliente}</small>
                <br />
                <small className="text-muted">{reserva.telefonoCliente}</small>
              </td>
              <td>{formatearFecha(reserva.fechaCheckIn)}</td>
              <td>{formatearFecha(reserva.fechaCheckOut)}</td>
              <td>{calcularNoches(reserva.fechaCheckIn, reserva.fechaCheckOut)}</td>
              <td>
                {reserva.numAdultos} adulto(s)
                {reserva.numNinos > 0 && (
                  <>
                    <br />
                    {reserva.numNinos} niño(s)
                  </>
                )}
              </td>
              <td>${reserva.precioTotal}</td>
              <td>
                <span className={`badge ${getBadgeEstado(reserva.estado)}`}>
                  {reserva.estado.toUpperCase()}
                </span>
              </td>
              <td>
                <div className="btn-group-vertical" role="group">
                  {reserva.estado === "pendiente" && (
                    <>
                      <button
                        className="btn btn-sm btn-success mb-1"
                        onClick={() => onCheckIn(reserva._id)}
                        title="Realizar Check-In"
                      >
                        <i className="bi bi-check-circle me-1"></i>
                        Check-In
                      </button>
                      <button
                        className="btn btn-sm btn-primary mb-1"
                        onClick={() => onEditar(reserva)}
                        title="Editar"
                      >
                        <i className="bi bi-pencil me-1"></i>
                        Editar
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => onCancelar(reserva._id)}
                        title="Cancelar"
                      >
                        <i className="bi bi-x-circle me-1"></i>
                        Cancelar
                      </button>
                    </>
                  )}
                  {reserva.estado === "confirmada" && (
                    <>
                      <button
                        className="btn btn-sm btn-info"
                        onClick={() => onCheckOut(reserva._id)}
                        title="Realizar Check-Out"
                      >
                        <i className="bi bi-box-arrow-right me-1"></i>
                        Check-Out
                      </button>
                    </>
                  )}
                  {(reserva.estado === "completada" || reserva.estado === "cancelada") && (
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => onEditar(reserva)}
                      title="Ver detalles"
                    >
                      <i className="bi bi-eye me-1"></i>
                      Ver
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TablaReservas;
