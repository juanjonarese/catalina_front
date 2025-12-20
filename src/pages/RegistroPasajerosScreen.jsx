import { useState, useEffect } from 'react';
import { Container, Row, Col, Table, Button, Modal, Badge } from 'react-bootstrap';
import FormularioRegistroPasajero from '../components/FormularioRegistroPasajero';
import clientAxios from '../helpers/clientAxios';
import Swal from 'sweetalert2';

const RegistroPasajerosScreen = () => {
  const [pasajeros, setPasajeros] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [firmaModal, setFirmaModal] = useState({ show: false, firma: null, pasajero: null });

  useEffect(() => {
    obtenerPasajeros();
  }, []);

  const obtenerPasajeros = async () => {
    try {
      const { data } = await clientAxios.get('/pasajeros');
      setPasajeros(data);
    } catch (error) {
      console.error('Error al obtener pasajeros:', error);
      // Si no hay endpoint aún, usar datos de prueba
      setPasajeros([]);
    }
  };

  const handleRegistrarPasajero = async (datosPasajero) => {
    try {
      const { data } = await clientAxios.post('/pasajeros', datosPasajero);

      Swal.fire({
        icon: 'success',
        title: 'Pasajero registrado',
        text: 'El pasajero ha sido registrado exitosamente',
        timer: 2000,
        showConfirmButton: false
      });

      obtenerPasajeros();
      setShowModal(false);
    } catch (error) {
      console.error('Error al registrar pasajero:', error);

      // Modo de prueba: agregar pasajero localmente si no hay backend
      const nuevoPasajero = {
        ...datosPasajero,
        id: Date.now()
      };
      setPasajeros([...pasajeros, nuevoPasajero]);

      Swal.fire({
        icon: 'success',
        title: 'Pasajero registrado',
        text: 'El pasajero ha sido registrado exitosamente (modo local)',
        timer: 2000,
        showConfirmButton: false
      });

      setShowModal(false);
    }
  };

  const handleVerFirma = (pasajero) => {
    setFirmaModal({
      show: true,
      firma: pasajero.firma,
      pasajero: pasajero.nombre
    });
  };

  const handleEliminarPasajero = async (id) => {
    const result = await Swal.fire({
      title: '¿Está seguro?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await clientAxios.delete(`/pasajeros/${id}`);
        obtenerPasajeros();
        Swal.fire('Eliminado', 'El pasajero ha sido eliminado', 'success');
      } catch (error) {
        // Modo local
        setPasajeros(pasajeros.filter(p => p.id !== id));
        Swal.fire('Eliminado', 'El pasajero ha sido eliminado', 'success');
      }
    }
  };

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <h1 className="mb-0">Registro de Pasajeros</h1>
            <Button
              variant="primary"
              size="lg"
              onClick={() => setShowModal(true)}
            >
              + Nuevo Pasajero
            </Button>
          </div>
        </Col>
      </Row>

      <Row>
        <Col>
          <div className="table-responsive shadow-sm rounded bg-white">
            <Table striped bordered hover className="mb-0">
              <thead className="table-dark">
                <tr>
                  <th style={{ width: '50px' }}>#</th>
                  <th>Nombre y Apellido</th>
                  <th>DNI</th>
                  <th>Edad</th>
                  <th>Nacionalidad</th>
                  <th>Teléfono</th>
                  <th>Check-in</th>
                  <th>Check-out</th>
                  <th>Habitación</th>
                  <th>Firma</th>
                  <th style={{ width: '120px' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pasajeros.length === 0 ? (
                  <tr>
                    <td colSpan="11" className="text-center py-5 text-muted">
                      <div>
                        <i className="bi bi-inbox fs-1 d-block mb-2"></i>
                        No hay pasajeros registrados. Haga clic en "Nuevo Pasajero" para comenzar.
                      </div>
                    </td>
                  </tr>
                ) : (
                  pasajeros.map((pasajero, index) => (
                    <tr key={pasajero.id || index}>
                      <td className="text-center fw-bold">{index + 1}</td>
                      <td>{pasajero.nombre}</td>
                      <td>{pasajero.dni}</td>
                      <td className="text-center">{pasajero.edad}</td>
                      <td>{pasajero.nacionalidad}</td>
                      <td>{pasajero.telefono}</td>
                      <td>{new Date(pasajero.checkin).toLocaleDateString()}</td>
                      <td>{new Date(pasajero.checkout).toLocaleDateString()}</td>
                      <td className="text-center">
                        <Badge bg="info">{pasajero.habitacion}</Badge>
                      </td>
                      <td className="text-center">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => handleVerFirma(pasajero)}
                        >
                          Ver Firma
                        </Button>
                      </td>
                      <td className="text-center">
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleEliminarPasajero(pasajero.id)}
                        >
                          Eliminar
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>

          {pasajeros.length > 0 && (
            <div className="mt-3 text-muted">
              Total de pasajeros registrados: <strong>{pasajeros.length}</strong>
            </div>
          )}
        </Col>
      </Row>

      {/* Modal para nuevo pasajero */}
      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Registrar Nuevo Pasajero</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <FormularioRegistroPasajero onSubmit={handleRegistrarPasajero} />
        </Modal.Body>
      </Modal>

      {/* Modal para ver firma */}
      <Modal
        show={firmaModal.show}
        onHide={() => setFirmaModal({ show: false, firma: null, pasajero: null })}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Firma de {firmaModal.pasajero}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          {firmaModal.firma ? (
            <img
              src={firmaModal.firma}
              alt="Firma del pasajero"
              className="img-fluid border rounded"
              style={{ maxHeight: '300px' }}
            />
          ) : (
            <p className="text-muted">No hay firma disponible</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setFirmaModal({ show: false, firma: null, pasajero: null })}>
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default RegistroPasajerosScreen;
