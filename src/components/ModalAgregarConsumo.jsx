import { useState, useEffect } from 'react';
import { Modal, Button, Form, Table, Badge } from 'react-bootstrap';
import clientAxios from '../helpers/clientAxios';
import Swal from 'sweetalert2';

const ModalAgregarConsumo = ({ show, onHide, pasajero, turnoId, onConsumoAgregado }) => {
  const [consumos, setConsumos] = useState([]);
  const [descripcion, setDescripcion] = useState('');
  const [monto, setMonto] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (show && pasajero) {
      cargarConsumos();
    }
  }, [show, pasajero]);

  const cargarConsumos = async () => {
    try {
      const { data } = await clientAxios.get(`/consumos/pasajero/${pasajero._id}`);
      setConsumos(data);
    } catch (error) {
      console.error('Error al cargar consumos:', error);
    }
  };

  const handleAgregar = async (e) => {
    e.preventDefault();
    if (!descripcion.trim() || !monto || Number(monto) <= 0) return;

    setLoading(true);
    try {
      await clientAxios.post('/consumos', {
        pasajeroId: pasajero._id,
        reservaId: pasajero.reservaId || null,
        turnoId: turnoId || null,
        descripcion: descripcion.trim(),
        monto: Number(Number(monto).toFixed(2)),
      });

      setDescripcion('');
      setMonto('');
      await cargarConsumos();
      if (onConsumoAgregado) onConsumoAgregado();
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo registrar el consumo' });
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async (id) => {
    const result = await Swal.fire({
      title: '¿Eliminar consumo?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
    });
    if (!result.isConfirmed) return;

    try {
      await clientAxios.delete(`/consumos/${id}`);
      await cargarConsumos();
      if (onConsumoAgregado) onConsumoAgregado();
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo eliminar el consumo' });
    }
  };

  const totalConsumos = consumos.reduce((sum, c) => sum + c.monto, 0);

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          Consumos — {pasajero?.nombre}
          <small className="text-muted ms-2" style={{ fontSize: '0.8rem' }}>Hab. {pasajero?.habitacion}</small>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {/* Formulario para agregar */}
        <Form onSubmit={handleAgregar} className="mb-4">
          <div className="d-flex gap-2 align-items-end">
            <Form.Group style={{ flex: 2 }}>
              <Form.Label className="small fw-semibold">Descripción</Form.Label>
              <Form.Control
                type="text"
                placeholder="Ej: Minibar, Desayuno, Spa..."
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                required
              />
            </Form.Group>
            <Form.Group style={{ flex: 1 }}>
              <Form.Label className="small fw-semibold">Monto ($)</Form.Label>
              <Form.Control
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                required
              />
            </Form.Group>
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? '...' : '+ Agregar'}
            </Button>
          </div>
        </Form>

        {/* Lista de consumos */}
        {consumos.length === 0 ? (
          <p className="text-muted text-center py-3">Sin consumos registrados</p>
        ) : (
          <Table size="sm" bordered>
            <thead className="table-light">
              <tr>
                <th>Descripción</th>
                <th className="text-end" style={{ width: '120px' }}>Monto</th>
                <th style={{ width: '80px' }}></th>
              </tr>
            </thead>
            <tbody>
              {consumos.map((c) => (
                <tr key={c._id}>
                  <td>{c.descripcion}</td>
                  <td className="text-end">${c.monto.toFixed(2)}</td>
                  <td className="text-center">
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleEliminar(c._id)}
                    >
                      ✕
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="table-warning fw-bold">
                <td>Total consumos</td>
                <td className="text-end">${totalConsumos.toFixed(2)}</td>
                <td></td>
              </tr>
            </tfoot>
          </Table>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Cerrar</Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ModalAgregarConsumo;
