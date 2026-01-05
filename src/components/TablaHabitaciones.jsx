const TablaHabitaciones = ({ habitaciones, onEditar, onEliminar, onToggleDisponibilidad }) => {
  return (
    <div className="table-responsive">
      <table className="table table-hover table-striped">
        <thead className="table-dark">
          <tr>
            <th>Número</th>
            <th>Imagen</th>
            <th>Título</th>
            <th>Descripción</th>
            <th>Capacidad</th>
            <th>Precio</th>
            <th>Precio Promoción</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {habitaciones.map((habitacion) => (
            <tr key={habitacion._id}>
              <td>
                <strong className="text-primary" style={{ fontSize: '1.1rem' }}>
                  Room {habitacion.numero}
                </strong>
              </td>
              <td>
                {habitacion.imagenes && habitacion.imagenes.length > 0 ? (
                  <img
                    src={habitacion.imagenes[0]}
                    alt={habitacion.titulo}
                    style={{
                      width: "80px",
                      height: "60px",
                      objectFit: "cover",
                      borderRadius: "5px",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "80px",
                      height: "60px",
                      backgroundColor: "#e9ecef",
                      borderRadius: "5px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <i className="bi bi-image text-muted"></i>
                  </div>
                )}
              </td>
              <td>
                <strong>{habitacion.titulo}</strong>
              </td>
              <td>
                <small>{habitacion.descripcion.substring(0, 60)}...</small>
              </td>
              <td>
                <i className="bi bi-people me-1"></i>
                {habitacion.capacidadPersonas} personas
              </td>
              <td>
                <strong>${habitacion.precio}</strong> / noche
              </td>
              <td>
                {habitacion.precioPromocion ? (
                  <span className="text-success">
                    <strong>${habitacion.precioPromocion}</strong>
                  </span>
                ) : (
                  <span className="text-muted">-</span>
                )}
              </td>
              <td>
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    role="switch"
                    checked={habitacion.disponible}
                    onChange={() =>
                      onToggleDisponibilidad(habitacion._id, habitacion.disponible)
                    }
                  />
                  <label className="form-check-label">
                    {habitacion.disponible ? (
                      <span className="badge bg-success">Disponible</span>
                    ) : (
                      <span className="badge bg-secondary">No disponible</span>
                    )}
                  </label>
                </div>
              </td>
              <td>
                <div className="btn-group" role="group">
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => onEditar(habitacion)}
                    title="Editar"
                  >
                    <i className="bi bi-pencil"></i>
                  </button>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => onEliminar(habitacion._id)}
                    title="Eliminar"
                  >
                    <i className="bi bi-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TablaHabitaciones;
