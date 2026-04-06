import { useState, useEffect } from 'react';
import { Container, Row, Col, Table, Button, Badge, Card, Form, Modal, Alert } from 'react-bootstrap';
import clientAxios from '../helpers/clientAxios';
import Swal from 'sweetalert2';
import ModalAgregarConsumo from '../components/ModalAgregarConsumo';
import ModalCobro from '../components/ModalCobro';
import ModalCierreCaja from '../components/ModalCierreCaja';

const CajaTurnoScreen = () => {
  const [turnoActual, setTurnoActual] = useState(null);
  const [pasajerosActivos, setPasajerosActivos] = useState([]);
  const [consumosPorPasajero, setConsumosPorPasajero] = useState({});
  const [loadingTurno, setLoadingTurno] = useState(true);

  // Modales
  const [modalAbrirTurno, setModalAbrirTurno] = useState(false);
  const [nombreEmpleado, setNombreEmpleado] = useState('');
  const [modalConsumo, setModalConsumo] = useState({ show: false, pasajero: null });
  const [modalCobro, setModalCobro] = useState({ show: false, pasajero: null });
  const [modalCierre, setModalCierre] = useState(false);

  useEffect(() => {
    cargarTurnoActual();
    cargarPasajerosActivos();
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

  const cargarPasajerosActivos = async () => {
    try {
      const { data } = await clientAxios.get('/pasajeros');
      // Filtrar solo los activos (activo: true o campo no presente = true por defecto)
      const activos = data.filter((p) => p.activo !== false);
      setPasajerosActivos(activos);

      // Cargar consumos en paralelo para mostrar el contador en la tabla
      const consumosMap = {};
      await Promise.all(
        activos.map(async (p) => {
          try {
            const res = await clientAxios.get(`/consumos/pasajero/${p._id}`);
            consumosMap[p._id] = res.data;
          } catch {
            consumosMap[p._id] = [];
          }
        })
      );
      setConsumosPorPasajero(consumosMap);
    } catch (error) {
      console.error('Error al cargar pasajeros:', error);
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

  const handleConsumoAgregado = () => {
    cargarPasajerosActivos();
  };

  const handleCobrado = () => {
    cargarPasajerosActivos();
  };

  const handleCierreCaja = () => {
    setTurnoActual(null);
    cargarPasajerosActivos();
  };

  const formatFecha = (fecha) => {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleString('es-AR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const totalConsumoPasajero = (pasajeroId) => {
    const consumos = consumosPorPasajero[pasajeroId] || [];
    return consumos.reduce((sum, c) => sum + c.monto, 0);
  };

  return (
    <Container fluid className="py-4">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="mb-0">Caja por Turno</h1>
              <small className="text-muted">Gestión de egresos y cobros</small>
            </div>
            {!loadingTurno && (
              turnoActual ? (
                <div className="d-flex gap-2">
                  <Button variant="outline-danger" onClick={() => setModalCierre(true)}>
                    Cerrar Caja
                  </Button>
                </div>
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
              <span>
                <strong>Empleado:</strong> {turnoActual.empleado}
              </span>
              <span className="text-muted">
                <strong>Desde:</strong> {formatFecha(turnoActual.fechaApertura)}
              </span>
            </div>
          </Card.Body>
        </Card>
      ) : (
        <Alert variant="warning" className="mb-4">
          No hay turno abierto. Haga clic en <strong>Abrir Turno</strong> para comenzar.
        </Alert>
      )}

      {/* Tabla de pasajeros activos */}
      <Row>
        <Col>
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h5 className="mb-0">
              Pasajeros activos
              <Badge bg="secondary" className="ms-2">{pasajerosActivos.length}</Badge>
            </h5>
            <Button variant="outline-secondary" size="sm" onClick={cargarPasajerosActivos}>
              Actualizar
            </Button>
          </div>

          <div className="table-responsive shadow-sm rounded bg-white">
            <Table striped bordered hover className="mb-0">
              <thead className="table-dark">
                <tr>
                  <th style={{ width: 40 }}>#</th>
                  <th>Pasajero</th>
                  <th>DNI</th>
                  <th>Hab.</th>
                  <th>Check-in</th>
                  <th>Check-out</th>
                  <th className="text-end">Consumos</th>
                  <th style={{ width: 200 }} className="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pasajerosActivos.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-5 text-muted">
                      No hay pasajeros activos en este momento.
                    </td>
                  </tr>
                ) : (
                  pasajerosActivos.map((p, i) => {
                    const totalConsumos = totalConsumoPasajero(p._id);
                    const cantConsumos = (consumosPorPasajero[p._id] || []).length;
                    return (
                      <tr key={p._id}>
                        <td className="text-center">{i + 1}</td>
                        <td className="fw-semibold">{p.nombre}</td>
                        <td>{p.dni}</td>
                        <td className="text-center">
                          <Badge bg="info">{p.habitacion}</Badge>
                        </td>
                        <td>{new Date(p.checkin).toLocaleDateString('es-AR')}</td>
                        <td>{new Date(p.checkout).toLocaleDateString('es-AR')}</td>
                        <td className="text-end">
                          {cantConsumos > 0 ? (
                            <span>
                              <Badge bg="warning" text="dark" className="me-1">{cantConsumos}</Badge>
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
                              onClick={() => setModalConsumo({ show: true, pasajero: p })}
                              title="Agregar/ver consumos"
                            >
                              Consumos
                            </Button>
                            <Button
                              variant={turnoActual ? 'success' : 'outline-secondary'}
                              size="sm"
                              disabled={!turnoActual}
                              onClick={() => {
                                if (turnoActual) setModalCobro({ show: true, pasajero: p });
                              }}
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

      {/* Modal consumos */}
      <ModalAgregarConsumo
        show={modalConsumo.show}
        onHide={() => setModalConsumo({ show: false, pasajero: null })}
        pasajero={modalConsumo.pasajero}
        turnoId={turnoActual?._id}
        onConsumoAgregado={handleConsumoAgregado}
      />

      {/* Modal cobro */}
      <ModalCobro
        show={modalCobro.show}
        onHide={() => setModalCobro({ show: false, pasajero: null })}
        pasajero={modalCobro.pasajero}
        turnoId={turnoActual?._id}
        onCobrado={handleCobrado}
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
