import { useState, useEffect } from 'react';
import clientAxios from '../helpers/clientAxios';
import Swal from 'sweetalert2';

const METODOS = {
  efectivo:      { label: 'Efectivo',      icon: '💵' },
  transferencia: { label: 'Transferencia', icon: '🏦' },
  mercadopago:   { label: 'MercadoPago',   icon: '📱' },
  otro:          { label: 'Otro',          icon: '💳' },
  sin_cobro:     { label: 'Sin cobro',     icon: '—'  },
};

const fmtHora = (d) => d
  ? new Date(d).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  : '—';

const ModalCierreCaja = ({ show, onHide, turno, onCierreCaja }) => {
  const [cobros, setCobros]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [cerrando, setCerrando] = useState(false);
  const [retiro, setRetiro]   = useState('');
  const [nota, setNota]       = useState('');

  useEffect(() => {
    if (show && turno) {
      cargarCobros();
      setRetiro('');
      setNota('');
    }
  }, [show, turno]);

  const cargarCobros = async () => {
    setLoading(true);
    try {
      const { data } = await clientAxios.get(`/cobros/turno/${turno._id}`);
      setCobros(data);
    } catch (error) {
      console.error('Error al cargar cobros:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCerrar = async () => {
    const retiroNum = Number(retiro) || 0;

    const confirm = await Swal.fire({
      title: '¿Confirmar cierre de caja?',
      html: retiroNum > 0
        ? `Se registrará un retiro de <strong>$${retiroNum.toFixed(2)}</strong>.`
        : 'No se registró ningún retiro.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, cerrar turno',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#4A7C59',
    });
    if (!confirm.isConfirmed) return;

    setCerrando(true);
    try {
      await clientAxios.put(`/turnos/${turno._id}/cerrar`, {
        retiro: retiroNum,
        notaParaSiguiente: nota.trim(),
      });
      Swal.fire({ icon: 'success', title: 'Turno cerrado', timer: 1800, showConfirmButton: false });
      if (onCierreCaja) onCierreCaja();
      onHide();
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo cerrar el turno' });
    } finally {
      setCerrando(false);
    }
  };

  if (!show) return null;

  // Resumen por método
  const resumenMetodos = cobros.reduce((acc, c) => {
    if (c.metodoPago !== 'sin_cobro' && c.saldoCobrado > 0) {
      acc[c.metodoPago] = (acc[c.metodoPago] || 0) + c.saldoCobrado;
    }
    return acc;
  }, {});

  const totalCobrado  = Object.values(resumenMetodos).reduce((s, v) => s + v, 0);
  const efectivoBruto = resumenMetodos.efectivo || 0;
  const retiroNum     = Number(retiro) || 0;
  const efectivoNeto  = Math.max(0, efectivoBruto - retiroNum);

  return (
    <div className="modal-overlay open" onClick={(e) => { if (e.target === e.currentTarget) onHide(); }}>
      <div className="modal" style={{ maxWidth: 720, width: '95vw' }}>

        {/* HEADER */}
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-eyebrow">Cierre de turno</div>
            <div className="modal-title">{turno?.empleado}</div>
          </div>
          <button className="modal-close" onClick={onHide}>✕</button>
        </div>

        {/* BODY */}
        <div className="modal-body" style={{ maxHeight: '72vh', overflowY: 'auto', gap: 16 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-3)' }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>⏳</div>Cargando…
            </div>
          ) : (
            <>
              {/* Info del turno */}
              <div style={{ display: 'flex', gap: 24, padding: '10px 14px', background: 'var(--surface-2,#f5f5f5)', borderRadius: 8, fontSize: 13 }}>
                <span><strong>Empleado:</strong> {turno?.empleado}</span>
                <span><strong>Apertura:</strong> {fmtHora(turno?.fechaApertura)}</span>
                <span><strong>Egresos:</strong> {cobros.length}</span>
              </div>

              {/* Resumen por método */}
              <div>
                <div className="cl-section-title">Resumen de cobros</div>
                {Object.keys(resumenMetodos).length === 0 ? (
                  <div style={{ padding: '12px 0', color: 'var(--text-3)', fontSize: 13, textAlign: 'center' }}>
                    No se realizaron cobros en este turno
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px,1fr))', gap: 10 }}>
                    {Object.entries(resumenMetodos).map(([metodo, monto]) => {
                      const m = METODOS[metodo] || { icon: '💳', label: metodo };
                      return (
                        <div key={metodo} style={{ textAlign: 'center', padding: '12px 8px', borderRadius: 8, border: '1px solid var(--border)', background: 'rgba(74,124,89,.06)' }}>
                          <div style={{ fontSize: 20, marginBottom: 4 }}>{m.icon}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 3 }}>{m.label}</div>
                          <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--green,#4A7C59)' }}>${monto.toFixed(2)}</div>
                        </div>
                      );
                    })}
                    <div style={{ textAlign: 'center', padding: '12px 8px', borderRadius: 8, border: '2px solid var(--border)', background: 'var(--surface-2,#f5f5f5)' }}>
                      <div style={{ fontSize: 20, marginBottom: 4 }}>💰</div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 3 }}>TOTAL</div>
                      <div style={{ fontWeight: 800, fontSize: 16 }}>${totalCobrado.toFixed(2)}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Detalle de egresos */}
              {cobros.length > 0 && (
                <div>
                  <div className="cl-section-title">Detalle de egresos</div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--border)' }}>
                        {['Pasajero', 'Hab.', 'Noches', 'Consumos', 'Cobrado', 'Método'].map((h, i) => (
                          <th key={h} style={{ padding: '6px 10px', textAlign: i >= 2 && i <= 4 ? 'right' : 'left', color: 'var(--text-2)', fontWeight: 600 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {cobros.map((c) => {
                        const m = METODOS[c.metodoPago] || { icon: '💳', label: c.metodoPago };
                        return (
                          <tr key={c._id} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '7px 10px' }}>{c.nombrePasajero}</td>
                            <td style={{ padding: '7px 10px' }}>
                              <span className="badge badge-confirmed" style={{ fontSize: 10 }}>{c.habitacion}</span>
                            </td>
                            <td style={{ padding: '7px 10px', textAlign: 'right' }}>${c.totalNoches.toFixed(2)}</td>
                            <td style={{ padding: '7px 10px', textAlign: 'right' }}>${c.totalConsumos.toFixed(2)}</td>
                            <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 700 }}>${c.saldoCobrado.toFixed(2)}</td>
                            <td style={{ padding: '7px 10px' }}>{m.icon} {m.label}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Retiro de caja */}
              <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ padding: '9px 14px', background: 'var(--surface-2,#f5f5f5)', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontWeight: 700, fontSize: 13 }}>💵 Retiro de caja</span>
                  <span style={{ fontSize: 11, color: 'var(--text-3)', marginLeft: 8 }}>opcional — monto que se retira del efectivo</span>
                </div>
                <div style={{ padding: '14px 16px', display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                  <div className="form-group" style={{ flex: '0 0 180px', margin: 0 }}>
                    <label className="form-label">Monto a retirar ($)</label>
                    <input
                      type="number"
                      className="form-input"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={retiro}
                      onChange={(e) => setRetiro(e.target.value)}
                    />
                  </div>

                  {/* Cálculo de efectivo */}
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ textAlign: 'center', padding: '8px 14px', borderRadius: 8, background: 'var(--surface-2,#f5f5f5)', border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Efectivo cobrado</div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>${efectivoBruto.toFixed(2)}</div>
                    </div>
                    {retiroNum > 0 && (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', color: 'var(--text-3)', fontSize: 18 }}>−</div>
                        <div style={{ textAlign: 'center', padding: '8px 14px', borderRadius: 8, background: 'rgba(192,57,43,.07)', border: '1px solid rgba(192,57,43,.25)' }}>
                          <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Retiro</div>
                          <div style={{ fontWeight: 700, fontSize: 15, color: '#C0392B' }}>${retiroNum.toFixed(2)}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', color: 'var(--text-3)', fontSize: 18 }}>=</div>
                        <div style={{ textAlign: 'center', padding: '8px 14px', borderRadius: 8, background: 'rgba(74,124,89,.08)', border: '1px solid rgba(74,124,89,.3)' }}>
                          <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Queda en caja</div>
                          <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--green,#4A7C59)' }}>${efectivoNeto.toFixed(2)}</div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Nota para el siguiente turno */}
              <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ padding: '9px 14px', background: 'var(--surface-2,#f5f5f5)', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontWeight: 700, fontSize: 13 }}>📝 Nota para el turno siguiente</span>
                  <span style={{ fontSize: 11, color: 'var(--text-3)', marginLeft: 8 }}>opcional</span>
                </div>
                <div style={{ padding: '14px 16px' }}>
                  <textarea
                    className="form-textarea"
                    rows={3}
                    placeholder="Ej: Queda pendiente el cobro de habitación 5, el señor García paga mañana al mediodía…"
                    value={nota}
                    onChange={(e) => setNota(e.target.value)}
                    style={{ resize: 'vertical' }}
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* FOOTER */}
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onHide} disabled={cerrando}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleCerrar} disabled={loading || cerrando}>
            {cerrando ? 'Cerrando turno…' : 'Confirmar cierre de caja'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default ModalCierreCaja;
