const TablaHabitaciones = ({ habitaciones, onEditar, onEliminar, onToggleDisponibilidad }) => {
  if (habitaciones.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">🔍</div>
        <div className="empty-title">Sin resultados</div>
        <div className="empty-text">No hay habitaciones que coincidan con los filtros.</div>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table className="data-table" role="table" aria-label="Listado de habitaciones">
        <thead>
          <tr>
            <th>N° Habitación</th>
            <th>Imagen</th>
            <th>Título</th>
            <th>Capacidad</th>
            <th>Precio</th>
            <th>Precio Promo</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {habitaciones.map((habitacion) => (
            <tr key={habitacion._id}>
              <td>
                <strong style={{ color: "var(--brand)", fontSize: "1rem" }}>
                  Room {habitacion.numero}
                </strong>
              </td>
              <td>
                {habitacion.imagenes && habitacion.imagenes.length > 0 ? (
                  <img
                    src={habitacion.imagenes[0]}
                    alt={habitacion.titulo}
                    style={{ width: 72, height: 52, objectFit: "cover", borderRadius: 8 }}
                  />
                ) : (
                  <div
                    style={{
                      width: 72, height: 52, borderRadius: 8,
                      background: "var(--bg-2)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 20, color: "var(--text-3)",
                    }}
                  >
                    🖼
                  </div>
                )}
              </td>
              <td>
                <strong style={{ color: "var(--text-1)" }}>{habitacion.titulo}</strong>
                {habitacion.descripcion && (
                  <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>
                    {habitacion.descripcion.substring(0, 50)}…
                  </div>
                )}
              </td>
              <td>
                <span style={{ color: "var(--text-2)", fontSize: 13 }}>
                  👥 {habitacion.capacidadPersonas} pers.
                </span>
              </td>
              <td>
                <strong style={{ color: "var(--text-1)" }}>${habitacion.precio}</strong>
                <span style={{ color: "var(--text-3)", fontSize: 12 }}> /noche</span>
              </td>
              <td>
                {habitacion.precioPromocion && habitacion.precioPromocion > 0 ? (
                  <span style={{
                    background: "var(--green-bg)", color: "var(--green)",
                    border: "1px solid var(--green-border)",
                    padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                  }}>
                    ${habitacion.precioPromocion}
                  </span>
                ) : (
                  <span style={{ color: "var(--text-3)", fontSize: 13 }}>—</span>
                )}
              </td>
              <td>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={habitacion.disponible}
                    onChange={() => onToggleDisponibilidad(habitacion._id, habitacion.disponible)}
                    style={{ display: "none" }}
                  />
                  <span
                    onClick={() => onToggleDisponibilidad(habitacion._id, habitacion.disponible)}
                    style={{
                      display: "inline-block",
                      width: 36, height: 20, borderRadius: 10,
                      background: habitacion.disponible ? "var(--green)" : "var(--border-md)",
                      position: "relative", cursor: "pointer",
                      transition: "background 0.2s",
                      flexShrink: 0,
                    }}
                  >
                    <span style={{
                      position: "absolute",
                      top: 3, left: habitacion.disponible ? 18 : 3,
                      width: 14, height: 14, borderRadius: "50%",
                      background: "white", transition: "left 0.2s",
                    }} />
                  </span>
                  <span style={{
                    fontSize: 12, fontWeight: 600,
                    color: habitacion.disponible ? "var(--green)" : "var(--text-3)",
                  }}>
                    {habitacion.disponible ? "Disponible" : "No disponible"}
                  </span>
                </label>
              </td>
              <td>
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    className="btn-icon btn-icon-edit"
                    onClick={() => onEditar(habitacion)}
                    title="Editar"
                  >
                    ✏️
                  </button>
                  <button
                    className="btn-icon btn-icon-delete"
                    onClick={() => onEliminar(habitacion._id)}
                    title="Eliminar"
                  >
                    🗑
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
