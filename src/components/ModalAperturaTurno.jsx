import { useState, useEffect } from 'react';
import clientAxios from '../helpers/clientAxios';
import Swal from 'sweetalert2';

const METODO_LABELS = {
  efectivo:      { label: 'Efectivo',      icon: '💵' },
  transferencia: { label: 'Transferencia', icon: '🏦' },
  mercadopago:   { label: 'MercadoPago',   icon: '📱' },
  otro:          { label: 'Otro',          icon: '💳' },
};

const fmtHora = (d) => d
  ? new Date(d).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
  : '—';

const fmtFecha = (d) => d
  ? new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  : '—';

/* ── Mini tabla reutilizable ───────────────────────────────── */
const MiniTabla = ({ headers, rows, emptyText }) =>
  rows.length === 0 ? (
    <div style={{ padding: '14px 0', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
      {emptyText}
    </div>
  ) : (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
      <thead>
        <tr>
          {headers.map((h) => (
            <th key={h.key} style={{ padding: '6px 10px', textAlign: h.align || 'left', color: 'var(--text-2)', fontWeight: 600, borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>
              {h.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
            {headers.map((h) => (
              <td key={h.key} style={{ padding: '7px 10px', textAlign: h.align || 'left', color: 'var(--text-1)', verticalAlign: 'middle' }}>
                {row[h.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );

/* ── Bloque de sección ─────────────────────────────────────── */
const Seccion = ({ titulo, subtitulo, badge, accentColor = 'var(--green,#4A7C59)', children }) => (
  <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
    <div style={{ padding: '9px 14px', background: 'var(--surface-2,#f5f5f5)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div>
        <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-1)' }}>{titulo}</span>
        {subtitulo && <span style={{ fontSize: 11, color: 'var(--text-3)', marginLeft: 8 }}>{subtitulo}</span>}
      </div>
      {badge != null && (
        <span style={{ background: accentColor, color: '#fff', borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>
          {badge}
        </span>
      )}
    </div>
    <div style={{ background: 'var(--surface,#fff)' }}>{children}</div>
  </div>
);

/* ── Resumen de caja (cobros del turno saliente) ───────────── */
const ResumenCaja = ({ cobros, turno }) => {
  const resumen = cobros.reduce((acc, c) => {
    if (c.metodoPago !== 'sin_cobro') {
      acc[c.metodoPago] = (acc[c.metodoPago] || 0) + c.saldoCobrado;
      acc.total = (acc.total || 0) + c.saldoCobrado;
    }
    return acc;
  }, {});

  return (
    <div style={{ padding: '14px 16px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr) auto', gap: 10, marginBottom: 14 }}>
        {['efectivo', 'transferencia', 'mercadopago', 'otro'].map((m) => {
          const monto = resumen[m] || 0;
          const info = METODO_LABELS[m];
          return (
            <div key={m} style={{ textAlign: 'center', padding: '10px 8px', borderRadius: 8, background: monto > 0 ? 'rgba(74,124,89,.07)' : 'var(--surface-2,#f5f5f5)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 18, marginBottom: 4 }}>{info.icon}</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 2 }}>{info.label}</div>
              <div style={{ fontWeight: 700, fontSize: 15, color: monto > 0 ? 'var(--green,#4A7C59)' : 'var(--text-2)' }}>
                ${monto.toFixed(2)}
              </div>
            </div>
          );
        })}
        <div style={{ textAlign: 'center', padding: '10px 12px', borderRadius: 8, background: 'var(--surface-2,#f5f5f5)', border: '2px solid var(--border)' }}>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 2 }}>TOTAL</div>
          <div style={{ fontWeight: 800, fontSize: 17, color: 'var(--text-1)' }}>
            ${(resumen.total || 0).toFixed(2)}
          </div>
        </div>
      </div>

      {cobros.length > 0 && (
        <MiniTabla
          emptyText=""
          headers={[
            { key: 'pasajero', label: 'Pasajero' },
            { key: 'hab',      label: 'Hab.', align: 'center' },
            { key: 'cobrado',  label: 'Cobrado', align: 'right' },
            { key: 'metodo',   label: 'Método' },
          ]}
          rows={cobros.map((c) => ({
            pasajero: c.nombrePasajero,
            hab:      <span className="badge badge-confirmed" style={{ fontSize: 10 }}>{c.habitacion}</span>,
            cobrado:  <strong>${c.saldoCobrado.toFixed(2)}</strong>,
            metodo:   METODO_LABELS[c.metodoPago]
              ? `${METODO_LABELS[c.metodoPago].icon} ${METODO_LABELS[c.metodoPago].label}`
              : c.metodoPago,
          }))}
        />
      )}
    </div>
  );
};

/* ══ Componente principal ════════════════════════════════════ */
const ModalAperturaTurno = ({ show, nombre, onTurnoAbierto }) => {
  const [resumen, setResumen] = useState(null);
  const [loading, setLoading] = useState(false);
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    if (show) cargarResumen();
  }, [show]);

  const cargarResumen = async () => {
    setLoading(true);
    try {
      const { data } = await clientAxios.get('/turnos/resumen-apertura');
      setResumen(data);
    } catch (error) {
      console.error('Error al cargar resumen:', error);
    } finally {
      setLoading(false);
    }
  };

  // Caso 1: no hay turno → abrir
  const handleAbrirTurno = async () => {
    setProcesando(true);
    try {
      const { data } = await clientAxios.post('/turnos/abrir', { empleado: nombre });
      onTurnoAbierto(data.turno);
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Error', text: error.response?.data?.msg || 'Error al abrir el turno' });
    } finally {
      setProcesando(false);
    }
  };

  // Caso 2: mi turno → continuar
  const handleContinuar = () => onTurnoAbierto(resumen.turnoActual);

  // Caso 3: turno de otro → cambio
  const handleCambioTurno = async () => {
    setProcesando(true);
    try {
      const { data } = await clientAxios.post('/turnos/cambio', { empleado: nombre });
      onTurnoAbierto(data.turnoNuevo);
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Error', text: error.response?.data?.msg || 'Error al realizar el cambio' });
    } finally {
      setProcesando(false);
    }
  };

  if (!show) return null;

  const turnoActual  = resumen?.turnoActual;
  const esMiTurno    = turnoActual?.empleado === nombre;
  const esDeOtro     = turnoActual && !esMiTurno;
  const cobros       = resumen?.cobrosDelTurnoActual || [];
  const ult          = resumen?.ultimoTurnoCerrado;
  const notaAnterior = ult?.notaParaSiguiente?.trim() || null;

  /* ── Vista: cambio de turno ──────────────────────────────── */
  if (!loading && esDeOtro) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 780, width: '95vw' }}>
          <div className="modal-header">
            <div className="modal-title-group">
              <div className="modal-eyebrow">Cambio de turno</div>
              <div className="modal-title">Turno de {turnoActual.empleado}</div>
            </div>
          </div>

          <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto', gap: 14 }}>
            {/* Aviso */}
            <div style={{ background: 'rgba(200,136,42,.1)', border: '1px solid rgba(200,136,42,.4)', borderRadius: 8, padding: '10px 14px', fontSize: 13 }}>
              ⚠️ Hay un turno activo de <strong>{turnoActual.empleado}</strong> abierto desde las <strong>{fmtHora(turnoActual.fechaApertura)}</strong>.
              Al realizar el cambio, ese turno se cerrará automáticamente y se abrirá uno a tu nombre.
            </div>

            {/* Nota del turno anterior (si existe) */}
            {notaAnterior && (
              <div style={{ background: 'rgba(52,152,219,.08)', border: '1px solid rgba(52,152,219,.35)', borderRadius: 8, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#3498db', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  📝 Nota del turno anterior — {ult?.empleado}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-1)', whiteSpace: 'pre-wrap' }}>{notaAnterior}</div>
              </div>
            )}

            {/* Resumen del turno saliente */}
            <Seccion
              titulo={`Resumen del turno de ${turnoActual.empleado}`}
              subtitulo={`desde ${fmtHora(turnoActual.fechaApertura)}`}
              badge={`${cobros.length} cobro${cobros.length !== 1 ? 's' : ''}`}
            >
              <ResumenCaja cobros={cobros} turno={turnoActual} />
            </Seccion>

            {/* Estado actual del hotel */}
            <div className="stats-strip" style={{ margin: 0 }}>
              <div className="stat-card">
                <div className="stat-icon" style={{ background: 'rgba(74,124,89,.12)', color: 'var(--green,#4A7C59)' }}>🏨</div>
                <div className="stat-info">
                  <div className="stat-num">{resumen.pasajerosActivos.length}</div>
                  <div className="stat-label">En el hotel</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon" style={{ background: 'rgba(52,152,219,.12)', color: '#3498db' }}>📥</div>
                <div className="stat-info">
                  <div className="stat-num">{resumen.reservasCheckInHoy.length}</div>
                  <div className="stat-label">Entradas hoy</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon" style={{ background: 'rgba(200,136,42,.12)', color: 'var(--amber,#C8882A)' }}>📤</div>
                <div className="stat-info">
                  <div className="stat-num">{resumen.reservasCheckOutHoy.length}</div>
                  <div className="stat-label">Salidas hoy</div>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
              Se cerrará el turno de <strong>{turnoActual.empleado}</strong> y se abrirá uno para <strong>{nombre}</strong>
            </span>
            <button className="btn btn-primary" onClick={handleCambioTurno} disabled={procesando}>
              {procesando ? 'Realizando cambio…' : 'Realizar cambio de turno'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Vista: normal (sin turno o mi turno) ─────────────────── */
  return (
    <div className="modal-overlay open">
      <div className="modal" style={{ maxWidth: 860, width: '95vw' }}>

        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-eyebrow">
              {new Date().toLocaleString('es-AR', { weekday: 'long', day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className="modal-title">Bienvenido, {nombre}</div>
          </div>
        </div>

        <div className="modal-body" style={{ maxHeight: '72vh', overflowY: 'auto', gap: 16 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-3)' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
              <div>Cargando resumen del hotel…</div>
            </div>
          ) : resumen ? (
            <>
              {/* Nota del turno anterior */}
              {notaAnterior && (
                <div style={{ background: 'rgba(52,152,219,.08)', border: '1px solid rgba(52,152,219,.35)', borderRadius: 8, padding: '12px 14px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#3498db', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    📝 Nota del turno anterior — {ult?.empleado}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-1)', whiteSpace: 'pre-wrap' }}>{notaAnterior}</div>
                </div>
              )}

              {/* Aviso turno propio activo */}
              {esMiTurno && (
                <div style={{ background: 'rgba(74,124,89,.08)', border: '1px solid rgba(74,124,89,.3)', borderRadius: 8, padding: '10px 14px', fontSize: 13 }}>
                  ✅ Tu turno está activo desde las <strong>{fmtHora(turnoActual.fechaApertura)}</strong>.
                </div>
              )}

              {/* Stats */}
              <div className="stats-strip" style={{ margin: 0 }}>
                <div className="stat-card">
                  <div className="stat-icon" style={{ background: 'rgba(74,124,89,.12)', color: 'var(--green,#4A7C59)' }}>🏨</div>
                  <div className="stat-info">
                    <div className="stat-num">{resumen.pasajerosActivos.length}</div>
                    <div className="stat-label">En el hotel</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon" style={{ background: 'rgba(52,152,219,.12)', color: '#3498db' }}>📥</div>
                  <div className="stat-info">
                    <div className="stat-num">{resumen.reservasCheckInHoy.length}</div>
                    <div className="stat-label">Entradas hoy</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon" style={{ background: 'rgba(200,136,42,.12)', color: 'var(--amber,#C8882A)' }}>📤</div>
                  <div className="stat-info">
                    <div className="stat-num">{resumen.reservasCheckOutHoy.length}</div>
                    <div className="stat-label">Salidas hoy</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon" style={{ background: 'rgba(74,124,89,.12)', color: 'var(--green,#4A7C59)' }}>💰</div>
                  <div className="stat-info">
                    <div className="stat-num" style={{ fontSize: 16 }}>${Number(ult?.resumen?.total || 0).toFixed(0)}</div>
                    <div className="stat-label">Caja anterior</div>
                  </div>
                </div>
              </div>

              {/* 3 columnas */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
                <Seccion titulo="Pasajeros en el hotel" badge={resumen.pasajerosActivos.length}>
                  <MiniTabla
                    emptyText="Sin pasajeros activos"
                    headers={[
                      { key: 'nombre', label: 'Nombre' },
                      { key: 'hab',    label: 'Hab.', align: 'center' },
                      { key: 'salida', label: 'Salida', align: 'center' },
                    ]}
                    rows={resumen.pasajerosActivos.map((p) => ({
                      nombre: p.nombre,
                      hab:    <span className="badge badge-confirmed" style={{ fontSize: 10 }}>{p.habitacion}</span>,
                      salida: fmtFecha(p.checkout),
                    }))}
                  />
                </Seccion>

                <Seccion titulo="Entradas esperadas hoy" badge={resumen.reservasCheckInHoy.length} accentColor="#3498db">
                  <MiniTabla
                    emptyText="Sin check-ins hoy"
                    headers={[
                      { key: 'nombre', label: 'Huésped' },
                      { key: 'hab',    label: 'Hab.', align: 'center' },
                      { key: 'total',  label: 'Total', align: 'right' },
                    ]}
                    rows={resumen.reservasCheckInHoy.map((r) => ({
                      nombre: <span>{r.nombreCliente}<br /><span style={{ fontSize: 10, color: 'var(--text-3)' }}>{r.codigoReserva}</span></span>,
                      hab:    <span className="badge badge-confirmed" style={{ fontSize: 10 }}>{r.habitacionId?.numero ?? '—'}</span>,
                      total:  <span>${r.precioTotal?.toFixed(0)}{r.pagoId && <span className="badge badge-completed" style={{ fontSize: 9, marginLeft: 4 }}>✓</span>}</span>,
                    }))}
                  />
                </Seccion>

                <Seccion titulo="Salidas esperadas hoy" badge={resumen.reservasCheckOutHoy.length} accentColor="var(--amber,#C8882A)">
                  <MiniTabla
                    emptyText="Sin check-outs hoy"
                    headers={[
                      { key: 'nombre', label: 'Huésped' },
                      { key: 'hab',    label: 'Hab.', align: 'center' },
                    ]}
                    rows={resumen.reservasCheckOutHoy.map((r) => ({
                      nombre: <span>{r.nombreCliente}<br /><span style={{ fontSize: 10, color: 'var(--text-3)' }}>{r.codigoReserva}</span></span>,
                      hab:    <span className="badge badge-pending" style={{ fontSize: 10 }}>{r.habitacionId?.numero ?? '—'}</span>,
                    }))}
                  />
                </Seccion>
              </div>

              {/* Dinero en caja anterior */}
              <Seccion
                titulo="Dinero en caja — último turno cerrado"
                subtitulo={ult ? `${ult.empleado} · ${fmtHora(ult.fechaCierre)}` : undefined}
              >
                {!ult ? (
                  <div style={{ padding: '14px 0', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
                    No hay turnos anteriores registrados
                  </div>
                ) : (
                  <div style={{ padding: '14px 16px', display: 'grid', gridTemplateColumns: 'repeat(4,1fr) auto', gap: 10 }}>
                    {['efectivo', 'transferencia', 'mercadopago', 'otro'].map((m) => {
                      const monto = ult.resumen[m] || 0;
                      const info  = METODO_LABELS[m];
                      return (
                        <div key={m} style={{ textAlign: 'center', padding: '10px 8px', borderRadius: 8, background: monto > 0 ? 'rgba(74,124,89,.07)' : 'var(--surface-2,#f5f5f5)', border: '1px solid var(--border)' }}>
                          <div style={{ fontSize: 18, marginBottom: 4 }}>{info.icon}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 2 }}>{info.label}</div>
                          <div style={{ fontWeight: 700, fontSize: 15, color: monto > 0 ? 'var(--green,#4A7C59)' : 'var(--text-2)' }}>${monto.toFixed(2)}</div>
                        </div>
                      );
                    })}
                    <div style={{ textAlign: 'center', padding: '10px 12px', borderRadius: 8, background: 'var(--surface-2,#f5f5f5)', border: '2px solid var(--border)' }}>
                      <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 2 }}>TOTAL</div>
                      <div style={{ fontWeight: 800, fontSize: 17 }}>${Number(ult.resumen.total).toFixed(2)}</div>
                    </div>
                  </div>
                )}
              </Seccion>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-3)' }}>
              No se pudo cargar el resumen. Intentá nuevamente.
            </div>
          )}
        </div>

        <div className="modal-footer">
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
            {esMiTurno ? 'Continuás con tu turno activo' : 'Al confirmar se abrirá un nuevo turno a tu nombre'}
          </span>
          <button
            className="btn btn-primary"
            onClick={esMiTurno ? handleContinuar : handleAbrirTurno}
            disabled={loading || procesando}
          >
            {procesando ? 'Procesando…' : esMiTurno ? 'Continuar mi turno' : 'Abrir turno y entrar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalAperturaTurno;
