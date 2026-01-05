import { useState, useEffect } from 'react';
import { Button, Badge } from 'react-bootstrap';

const CalendarioDisponibilidad = ({ reservas, onVerReserva }) => {
  const [fechaActual, setFechaActual] = useState(new Date());
  const [diasMes, setDiasMes] = useState([]);

  // Colores por estado de reserva
  const coloresPorEstado = {
    'pendiente': '#FFC107',      // Amarillo - Reserva pendiente
    'confirmada': '#28A745',     // Verde - Reserva confirmada
    'completada': '#33FF57',     // Verde (no se muestra)
    'cancelada': '#999999'       // Gris (no se muestra)
  };

  useEffect(() => {
    generarDiasMes();
  }, [fechaActual]);

  const generarDiasMes = () => {
    const año = fechaActual.getFullYear();
    const mes = fechaActual.getMonth();

    const primerDia = new Date(año, mes, 1);
    const ultimoDia = new Date(año, mes + 1, 0);
    const diasEnMes = ultimoDia.getDate();
    const primerDiaSemana = primerDia.getDay();

    const dias = [];

    // Días vacíos antes del primer día del mes
    for (let i = 0; i < primerDiaSemana; i++) {
      dias.push(null);
    }

    // Días del mes
    for (let dia = 1; dia <= diasEnMes; dia++) {
      dias.push(new Date(año, mes, dia));
    }

    setDiasMes(dias);
  };

  const mesAnterior = () => {
    setFechaActual(new Date(fechaActual.getFullYear(), fechaActual.getMonth() - 1, 1));
  };

  const mesSiguiente = () => {
    setFechaActual(new Date(fechaActual.getFullYear(), fechaActual.getMonth() + 1, 1));
  };

  const mesActual = () => {
    setFechaActual(new Date());
  };

  const obtenerReservasPorDia = (fecha) => {
    if (!fecha) return [];

    return reservas.filter(reserva => {
      // Excluir reservas canceladas y completadas (checkout) - habitaciones disponibles
      if (reserva.estado === 'cancelada' || reserva.estado === 'completada') {
        return false;
      }

      const checkIn = new Date(reserva.fechaCheckIn);
      const checkOut = new Date(reserva.fechaCheckOut);

      // Normalizar las fechas para comparar solo día/mes/año
      const fechaNormalizada = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
      const checkInNormalizado = new Date(checkIn.getFullYear(), checkIn.getMonth(), checkIn.getDate());
      const checkOutNormalizado = new Date(checkOut.getFullYear(), checkOut.getMonth(), checkOut.getDate());

      return fechaNormalizada >= checkInNormalizado && fechaNormalizada <= checkOutNormalizado;
    });
  };

  const esDiaActual = (fecha) => {
    if (!fecha) return false;
    const hoy = new Date();
    return fecha.getDate() === hoy.getDate() &&
           fecha.getMonth() === hoy.getMonth() &&
           fecha.getFullYear() === hoy.getFullYear();
  };

  const nombreMes = fechaActual.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

  return (
    <div className="calendario-disponibilidad">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="text-capitalize mb-0">{nombreMes}</h3>
        <div>
          <Button variant="outline-secondary" onClick={mesAnterior} className="me-2">
            <i className="bi bi-chevron-left"></i> Mes Anterior
          </Button>
          <Button variant="outline-primary" onClick={mesActual} className="me-2">
            Hoy
          </Button>
          <Button variant="outline-secondary" onClick={mesSiguiente}>
            Mes Siguiente <i className="bi bi-chevron-right"></i>
          </Button>
        </div>
      </div>

      {/* Aclaración del calendario */}
      <div className="mb-3 p-3 bg-light rounded">
        <div className="d-flex flex-column gap-2">
          <div>
            <i className="bi bi-info-circle me-2 text-primary"></i>
            <strong>Solo se muestran habitaciones con reservas activas (confirmadas o pendientes)</strong>
          </div>
          <div className="d-flex align-items-center gap-3 ms-4">
            <div className="d-flex align-items-center gap-2">
              <div
                style={{
                  backgroundColor: '#FFC107',
                  width: '80px',
                  height: '32px',
                  borderRadius: '6px',
                  border: '2px solid rgba(0,0,0,0.2)',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
                }}
              ></div>
              <span>= Reserva Pendiente</span>
            </div>
            <div className="d-flex align-items-center gap-2">
              <div
                style={{
                  backgroundColor: '#28A745',
                  width: '80px',
                  height: '32px',
                  borderRadius: '6px',
                  border: '2px solid rgba(0,0,0,0.2)',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
                }}
              ></div>
              <span>= Reserva Confirmada</span>
            </div>
          </div>
        </div>
      </div>

      <div className="calendario-grid">
        {/* Encabezados de días de la semana */}
        <div className="row g-2 mb-2">
          {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(dia => (
            <div key={dia} className="col">
              <div className="text-center fw-bold text-muted py-2">
                {dia}
              </div>
            </div>
          ))}
        </div>

        {/* Días del mes */}
        <div className="row g-2">
          {diasMes.map((fecha, index) => {
            const reservasDia = obtenerReservasPorDia(fecha);
            const esHoy = esDiaActual(fecha);

            return (
              <div key={index} className="col">
                <div
                  className={`dia-calendario ${!fecha ? 'vacio' : ''} ${esHoy ? 'dia-actual' : ''}`}
                  style={{
                    minHeight: '120px',
                    border: '1px solid #dee2e6',
                    borderRadius: '8px',
                    padding: '8px',
                    backgroundColor: esHoy ? '#e3f2fd' : '#fff',
                    position: 'relative'
                  }}
                >
                  {fecha && (
                    <>
                      <div className={`fw-bold mb-2 ${esHoy ? 'text-primary' : 'text-dark'}`}>
                        {fecha.getDate()}
                      </div>
                      <div className="d-flex flex-column gap-2">
                        {reservasDia.map((reserva, idx) => {
                          const esAmarillo = reserva.estado === 'pendiente';
                          const colorFondo = coloresPorEstado[reserva.estado] || '#6c757d';
                          return (
                            <div
                              key={idx}
                              className="text-truncate"
                              onClick={() => onVerReserva && onVerReserva(reserva)}
                              style={{
                                backgroundColor: colorFondo,
                                fontSize: '0.85rem',
                                padding: '6px 10px',
                                cursor: 'pointer',
                                maxWidth: '100%',
                                fontWeight: 'bold',
                                border: '2px solid rgba(0,0,0,0.2)',
                                color: esAmarillo ? '#000' : '#fff',
                                textShadow: esAmarillo ? 'none' : '1px 1px 2px rgba(0,0,0,0.4)',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                                borderRadius: '6px',
                                textAlign: 'center',
                                transition: 'transform 0.2s, box-shadow 0.2s'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'scale(1.05)';
                                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.25)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.15)';
                              }}
                              title={`Room ${reserva.habitacionId?.numero} - ${reserva.nombreCliente} - ${reserva.estado}`}
                            >
                              Room {reserva.habitacionId?.numero}
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style jsx>{`
        .calendario-grid {
          background: white;
          padding: 20px;
          border-radius: 10px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .dia-calendario.vacio {
          background-color: #f8f9fa !important;
        }
        .dia-actual {
          border: 2px solid #0d6efd !important;
        }
      `}</style>
    </div>
  );
};

export default CalendarioDisponibilidad;
