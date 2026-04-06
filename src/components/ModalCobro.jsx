import { useState, useEffect } from 'react';
import { Modal, Button, Table, Badge, Form, Alert, Spinner } from 'react-bootstrap';
import clientAxios from '../helpers/clientAxios';
import Swal from 'sweetalert2';

const METODOS_PAGO = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'mercadopago', label: 'MercadoPago' },
  { value: 'otro', label: 'Otro' },
];

const ModalCobro = ({ show, onHide, pasajero, turnoId, onCobrado }) => {
  const [cuenta, setCuenta] = useState(null);
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [loading, setLoading] = useState(false);
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    if (show && pasajero) {
      cargarCuenta();
    }
  }, [show, pasajero]);

  const cargarCuenta = async () => {
    setLoading(true);
    try {
      const { data } = await clientAxios.get(`/cobros/cuenta/${pasajero._id}`);
      setCuenta(data);
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo cargar el estado de cuenta' });
      onHide();
    } finally {
      setLoading(false);
    }
  };

  const handleCobrar = async () => {
    if (!cuenta) return;

    const metodoLabel = METODOS_PAGO.find((m) => m.value === metodoPago)?.label || metodoPago;
    const saldo = cuenta.saldoPendiente;

    const confirm = await Swal.fire({
      title: '¿Confirmar cobro?',
      html: saldo > 0
        ? `Se cobrarán <strong>$${saldo.toFixed(2)}</strong> por <strong>${metodoLabel}</strong>`
        : 'El pasajero no tiene saldo pendiente. Se registrará el egreso sin cobro.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
    });
    if (!confirm.isConfirmed) return;

    setProcesando(true);
    try {
      await clientAxios.post('/cobros', {
        pasajeroId: cuenta.pasajero._id,
        reservaId: cuenta.reserva?._id || null,
        turnoId,
        nombrePasajero: cuenta.pasajero.nombre,
        habitacion: cuenta.pasajero.habitacion,
        noches: cuenta.noches,
        precioPorNoche: cuenta.precioPorNoche,
        totalNoches: cuenta.totalNoches,
        consumos: cuenta.consumos.map((c) => ({ descripcion: c.descripcion, monto: c.monto })),
        totalConsumos: cuenta.totalConsumos,
        totalGeneral: cuenta.totalGeneral,
        montoPagadoPrevio: cuenta.pagadoPrevio,
        saldoCobrado: saldo,
        metodoPago: saldo > 0 ? metodoPago : 'sin_cobro',
      });

      Swal.fire({
        icon: 'success',
        title: 'Cobro registrado',
        text: `${cuenta.pasajero.nombre} ha sido dado de egreso correctamente.`,
        timer: 2500,
        showConfirmButton: false,
      });
      if (onCobrado) onCobrado();
      onHide();
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo registrar el cobro' });
    } finally {
      setProcesando(false);
    }
  };

  const formatFecha = (fecha) => {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton className="bg-dark text-white">
        <Modal.Title>Estado de Cuenta — Cobro al Egreso</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2 text-muted">Cargando estado de cuenta...</p>
          </div>
        ) : cuenta ? (
          <>
            {/* Datos del pasajero */}
            <div className="bg-light rounded p-3 mb-3">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h5 className="mb-1">{cuenta.pasajero.nombre}</h5>
                  <small className="text-muted">
                    DNI {cuenta.pasajero.dni} · Hab. <strong>{cuenta.pasajero.habitacion}</strong>
                  </small>
                </div>
                <div className="text-end">
                  <div className="small text-muted">Check-in: {formatFecha(cuenta.pasajero.checkin)}</div>
                  <div className="small text-muted">Check-out: {formatFecha(cuenta.pasajero.checkout)}</div>
                  <Badge bg="info" className="mt-1">{cuenta.noches} noche{cuenta.noches !== 1 ? 's' : ''}</Badge>
                </div>
              </div>
            </div>

            {/* Estado del pago de la reserva */}
            {cuenta.reserva && (
              <Alert variant={cuenta.pagadoPrevio > 0 ? 'success' : 'warning'} className="py-2">
                {cuenta.pagadoPrevio > 0 ? (
                  <>
                    Reserva <strong>pagada online</strong> via MercadoPago —
                    noches cubiertas por <strong>${cuenta.pagadoPrevio.toFixed(2)}</strong>
                  </>
                ) : (
                  <>Reserva <strong>sin pago previo</strong> — el alojamiento debe cobrarse ahora</>
                )}
              </Alert>
            )}

            {/* Desglose */}
            <Table bordered size="sm" className="mb-3">
              <thead className="table-dark">
                <tr>
                  <th>Concepto</th>
                  <th className="text-end" style={{ width: '140px' }}>Importe</th>
                </tr>
              </thead>
              <tbody>
                {/* Noches */}
                {cuenta.totalNoches > 0 && (
                  <tr className={cuenta.pagadoPrevio > 0 ? 'text-muted' : ''}>
                    <td>
                      Alojamiento ({cuenta.noches} noche{cuenta.noches !== 1 ? 's' : ''}
                      {cuenta.precioPorNoche > 0 && ` × $${cuenta.precioPorNoche.toFixed(2)}`})
                      {cuenta.pagadoPrevio > 0 && (
                        <Badge bg="success" className="ms-2" style={{ fontSize: '0.7rem' }}>Pagado</Badge>
                      )}
                    </td>
                    <td className="text-end">${cuenta.totalNoches.toFixed(2)}</td>
                  </tr>
                )}

                {/* Consumos */}
                {cuenta.consumos.length > 0 ? (
                  cuenta.consumos.map((c, i) => (
                    <tr key={i}>
                      <td className="ps-3">— {c.descripcion}</td>
                      <td className="text-end">${c.monto.toFixed(2)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="text-muted ps-3">— Sin consumos adicionales</td>
                    <td className="text-end text-muted">$0.00</td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="table-secondary">
                  <td className="fw-semibold">Total general</td>
                  <td className="text-end fw-semibold">${cuenta.totalGeneral.toFixed(2)}</td>
                </tr>
                {cuenta.pagadoPrevio > 0 && (
                  <tr className="text-success">
                    <td>— Ya pagado (MercadoPago)</td>
                    <td className="text-end">−${cuenta.pagadoPrevio.toFixed(2)}</td>
                  </tr>
                )}
                <tr className={cuenta.saldoPendiente > 0 ? 'table-danger' : 'table-success'}>
                  <td className="fw-bold">
                    {cuenta.saldoPendiente > 0 ? 'Saldo a cobrar' : 'Sin saldo pendiente'}
                  </td>
                  <td className="text-end fw-bold">${cuenta.saldoPendiente.toFixed(2)}</td>
                </tr>
              </tfoot>
            </Table>

            {/* Método de pago */}
            {cuenta.saldoPendiente > 0 && (
              <Form.Group>
                <Form.Label className="fw-semibold">Método de pago</Form.Label>
                <div className="d-flex gap-2 flex-wrap">
                  {METODOS_PAGO.map((m) => (
                    <Button
                      key={m.value}
                      variant={metodoPago === m.value ? 'dark' : 'outline-secondary'}
                      size="sm"
                      onClick={() => setMetodoPago(m.value)}
                    >
                      {m.label}
                    </Button>
                  ))}
                </div>
              </Form.Group>
            )}
          </>
        ) : null}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={procesando}>
          Cancelar
        </Button>
        <Button
          variant="success"
          onClick={handleCobrar}
          disabled={loading || procesando || !cuenta}
        >
          {procesando ? 'Procesando...' : cuenta?.saldoPendiente > 0 ? `Cobrar $${cuenta?.saldoPendiente?.toFixed(2)}` : 'Registrar Egreso'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ModalCobro;
