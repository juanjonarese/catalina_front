import { useState, useEffect } from 'react';
import { Container, Row, Col, Table, Button, Badge, Card, Form, Modal, Alert } from 'react-bootstrap';
import clientAxios from '../helpers/clientAxios';
import Swal from 'sweetalert2';
import ModalAgregarConsumo from '../components/ModalAgregarConsumo';
import ModalCobro from '../components/ModalCobro';
import ModalCierreCaja from '../components/ModalCierreCaja';

const CajaTurnoScreen = () => {
  const [turnoActual, setTurnoActual]         = useState(null);
  const [habitaciones, setHabitaciones]       = useState([]); // [{ numero, pasajeros, consumos }]
  const [loadingTurno, setLoadingTurno]       = useState(true);

  const [modalAbrirTurno, setModalAbrirTurno] = useState(false);
  const [nombreEmpleado, setNombreEmpleado]   = useState('');
  const [modalConsumo, setModalConsumo]       = useState({ show: false, habitacion: null });
  const [modalCobro, setModalCobro]           = useState({ show: false, habitacion: null });
  const [modalCierre, setModalCierre]         = useState(false);

  useEffect(() => {
    cargarTurnoActual();
    cargarHabitaciones();
  }, []);

  const cargarTurnoActual = async () => {
    setLoadingTurno(true);
    try {
      const { data } = await clientAxios.get('/turnos/actual');
      setTurnoActual(data.turno);
    } catch (error) {
      console.error('Error al cargar turno:', error);
    } finally {
      setLoadingTurno(false);
    }
  };

  const cargarHabitaciones = async () => {
    try {
      // Traer todos los pasajeros activos
      const { data: pasajeros } = await clientAxios.get('/pasajeros');
      const activos = pasajeros.filter((p) => p.activo !== false);

      // Agrupar por habitación
      const mapa = {};
      activos.forEach((p) => {
        if (!mapa[p.habitacion]) mapa[p.habitacion] = { numero: p.habitacion, pasajeros: [], consumos: [] };
        mapa[p.habitacion].pasajeros.push(p);
      });

      // Cargar consumos por habitación en paralelo
      await Promise.all(
        Object.keys(mapa).map(async (hab) => {
          try {
            const { data } = await clientAxios.get(`/consumos/habitacion/${hab}`);
            mapa[hab].consumos = data;
          } catch {
            mapa[hab].consumos = [];
          }
        })
      );

      // Ordenar habitaciones por número
      const lista = Object.values(mapa).sort((a, b) =>
        a.numero.toString().localeCompare(b.numero.toString(), undefined, { numeric: true })
      );
      setHabitaciones(lista);
    } catch (error) {
      console.error('Error al cargar habitaciones:', error);
    }
  };

  const handleAbrirTurno = async (e) => {
    e.preventDefault();
    if (!nombreEmpleado.trim()) return;
    try {
      const { data } = await clientAxios.post('/turnos/abrir', { empleado: nombreEmpleado.trim() });
      setTurnoActual(data.turno);
      setModalAbrirTurno(false);
      setNombreEmpleado('');
      Swal.fire({ icon: 'success', title: 'Turno abierto', timer: 1500, showConfirmButton: false });
    } catch (error) {
      const msg = error.response?.data?.msg || 'Error al abrir el turno';
      Swal.fire({ icon: 'error', title: 'Error', text: msg });
    }
  };

  const handleCierreCaja = () => {
    setTurnoActual(null);
    cargarHabitaciones();
  };

  const formatFecha = (fecha) => {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleString('es-AR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <Container fluid className="py-4">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="mb-0">Caja por Turno</h1>
              <small className="text-muted">Consumos y cobros por habitación</small>
            </div>
            {!loadingTurno && (
              turnoActual ? (
                <Button variant="outline-danger" onClick={() => setModalCierre(true)}>
                  Cerrar Caja
                </Button>
              ) : (
                <Button variant="success" size="lg" onClick={() => setModalAbrirTurno(true)}>
                  Abrir Turno
                </Button>
              )
            )}
          </div>
        </Col>
      </Row>

      {/* Estado del turno */}
      {loadingTurno ? (
        <Alert variant="light">Cargando turno...</Alert>
      ) : turnoActual ? (
        <Card className="mb-4 border-success">
          <Card.Body className="py-2">
            <div className="d-flex align-items-center gap-3">
              <Badge bg="success" style={{ fontSize: '0.85rem' }}>Turno abierto</Badge>
              <span><strong>Empleado:</strong> {turnoActual.empleado}</span>
              <span className="text-muted"><strong>Desde:</strong> {formatFecha(turnoActual.fechaApertura)}</span>
            </div>
          </Card.Body>
        </Card>
      ) : (
        <Alert variant="warning" className="mb-4">
          No hay turno abierto. Haga clic en <strong>Abrir Turno</strong> para comenzar.
        </Alert>
      )}

      {/* Tabla de habitaciones ocupadas */}
      <Row>
        <Col>
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h5 className="mb-0">
              Habitaciones ocupadas
              <Badge bg="secondary" className="ms-2">{habitaciones.length}</Badge>
            </h5>
            <Button variant="outline-secondary" size="sm" onClick={cargarHabitaciones}>
              Actualizar
            </Button>
          </div>

          <div className="table-responsive shadow-sm rounded bg-white">
            <Table striped bordered hover className="mb-0">
              <thead className="table-dark">
                <tr>
                  <th style={{ width: 80 }}>Hab.</th>
                  <th>Pasajeros</th>
                  <th>Check-in</th>
                  <th>Check-out</th>
                  <th className="text-end">Consumos</th>
                  <th style={{ width: 200 }} className="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {habitaciones.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-5 text-muted">
                      No hay habitaciones ocupadas en este momento.
                    </td>
                  </tr>
                ) : (
                  habitaciones.map((hab) => {
                    const totalConsumos = hab.consumos.reduce((s, c) => s + c.monto, 0);
                    const ref = hab.pasajeros[0];
                    return (
                      <tr key={hab.numero}>
                        <td className="text-center">
                          <Badge bg="info" style={{ fontSize: '0.9rem' }}>{hab.numero}</Badge>
                        </td>
                        <td>
                          {hab.pasajeros.map((p) => (
                            <div key={p._id} className="small">{p.nombre}</div>
                          ))}
                        </td>
                        <td className="small">{ref ? new Date(ref.checkin).toLocaleDateString('es-AR') : '-'}</td>
                        <td className="small">{ref ? new Date(ref.checkout).toLocaleDateString('es-AR') : '-'}</td>
                        <td className="text-end">
                          {hab.consumos.length > 0 ? (
                            <span>
                              <Badge bg="warning" text="dark" className="me-1">{hab.consumos.length}</Badge>
                              <strong>${totalConsumos.toFixed(2)}</strong>
                            </span>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                        <td className="text-center">
                          <div className="d-flex gap-1 justify-content-center">
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => setModalConsumo({ show: true, habitacion: hab.numero })}
                            >
                              Consumos
                            </Button>
                            <Button
                              variant={turnoActual ? 'success' : 'outline-secondary'}
                              size="sm"
                              disabled={!turnoActual}
                              onClick={() => turnoActual && setModalCobro({ show: true, habitacion: hab.numero })}
                              title={turnoActual ? 'Cobrar y dar de egreso' : 'Debe haber un turno abierto'}
                            >
                              Cobrar
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </Table>
          </div>
        </Col>
      </Row>

      {/* Modal abrir turno */}
      <Modal show={modalAbrirTurno} onHide={() => setModalAbrirTurno(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Abrir Turno</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleAbrirTurno}>
          <Modal.Body>
            <Form.Group>
              <Form.Label className="fw-semibold">Nombre del empleado</Form.Label>
              <Form.Control
                type="text"
                placeholder="Ingrese su nombre..."
                value={nombreEmpleado}
                onChange={(e) => setNombreEmpleado(e.target.value)}
                required
                autoFocus
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setModalAbrirTurno(false)}>Cancelar</Button>
            <Button type="submit" variant="success">Abrir Turno</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Modal consumos por habitación */}
      <ModalAgregarConsumo
        show={modalConsumo.show}
        onHide={() => setModalConsumo({ show: false, habitacion: null })}
        habitacion={modalConsumo.habitacion}
        turnoId={turnoActual?._id}
        onConsumoAgregado={cargarHabitaciones}
      />

      {/* Modal cobro por habitación */}
      <ModalCobro
        show={modalCobro.show}
        onHide={() => setModalCobro({ show: false, habitacion: null })}
        habitacion={modalCobro.habitacion}
        turnoId={turnoActual?._id}
        onCobrado={cargarHabitaciones}
      />

      {/* Modal cierre de caja */}
      <ModalCierreCaja
        show={modalCierre}
        onHide={() => setModalCierre(false)}
        turno={turnoActual}
        onCierreCaja={handleCierreCaja}
      />
    </Container>
  );
};

export default CajaTurnoScreen;
