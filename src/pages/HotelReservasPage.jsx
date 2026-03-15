import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import clientAxios from '../helpers/clientAxios';
import '../css/hotel-system.css';
import '../css/hotel-reservas.css';

// ── Helpers ───────────────────────────────────────────────────────────────────
const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

const fmtDate = (d) => {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  return `${parseInt(day)} ${MESES[parseInt(m) - 1]}, ${y}`;
};

const calcNights = (inD, outD) => {
  if (!inD || !outD) return 0;
  return Math.round((new Date(outD) - new Date(inD)) / 86400000);
};

const todayStr = () => new Date().toISOString().split('T')[0];
const tomorrowStr = () => {
  const d = new Date(); d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
};

const formatPrecio = (n) =>
  Number(n).toLocaleString('es-AR', { minimumFractionDigits: 0 });

// ── SVG Icons ─────────────────────────────────────────────────────────────────
const IconCalendar = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="14" height="14">
    <rect x="3" y="4" width="18" height="18" rx="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);
const IconMoon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="14" height="14">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);
const IconUsers = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="14" height="14">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const IconSearch = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="15" height="15">
    <circle cx="11" cy="11" r="8"/>
    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const IconBed = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="13" height="13">
    <path d="M2 9V19M22 9V19M2 14H22M4 9H20A2 2 0 0 1 22 11V14H2V11A2 2 0 0 1 4 9Z"/>
  </svg>
);
const IconPerson = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="13" height="13">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

// ── HotelReservasPage ─────────────────────────────────────────────────────────
export default function HotelReservasPage() {
  const [theme, setTheme] = useState('light');

  // Búsqueda
  const [checkIn, setCheckIn]     = useState(todayStr());
  const [checkOut, setCheckOut]   = useState(tomorrowStr());
  const [adults, setAdults]       = useState(1);
  const [children, setChildren]   = useState(0);

  // Habitaciones
  const [rooms, setRooms]         = useState([]);
  const [loading, setLoading]     = useState(false);
  const [searched, setSearched]   = useState(false);

  // Filtro amenidades
  const [chipActivo, setChipActivo] = useState(null);

  // Modal multi-paso
  const [modalStep, setModalStep]     = useState(0); // 0 = cerrado, 1 | 2 | 3
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [guestInfo, setGuestInfo]     = useState({ nombre: '', email: '', telefono: '' });
  const [loadingPago, setLoadingPago] = useState(false);

  // Cupón
  const [couponInput,   setCouponInput]   = useState('');
  const [cupon,         setCupon]         = useState(null);
  const [couponMsg,     setCouponMsg]     = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState([]);

  const nights = calcNights(checkIn, checkOut) || 1;

  // ── Toast helper ─────────────────────────────────────────────────────────
  const showToast = (msg, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  };

  // ── Carga inicial ─────────────────────────────────────────────────────────
  useEffect(() => {
    const cargarHabitaciones = async () => {
      setLoading(true);
      try {
        const res = await clientAxios.get('/habitaciones');
        setRooms(res.data.habitaciones || []);
      } catch {
        showToast('Error al cargar las habitaciones.', 'warn');
      } finally {
        setLoading(false);
      }
    };
    cargarHabitaciones();
  }, []);

  // ── Chips de amenidades ───────────────────────────────────────────────────
  const allAmenidades = useMemo(() => {
    const set = new Set();
    rooms.forEach(r => (r.amenidades || []).forEach(a => set.add(a)));
    return [...set].slice(0, 8);
  }, [rooms]);

  const roomsFiltrados = useMemo(() => {
    if (!chipActivo) return rooms;
    return rooms.filter(r => (r.amenidades || []).includes(chipActivo));
  }, [rooms, chipActivo]);

  // ── Búsqueda por disponibilidad ───────────────────────────────────────────
  const handleSearch = async () => {
    if (!checkIn || !checkOut || checkIn >= checkOut) {
      showToast('La fecha de salida debe ser posterior a la entrada.', 'warn');
      return;
    }
    setLoading(true);
    try {
      const res = await clientAxios.get('/habitaciones/disponibilidad', {
        params: {
          fechaCheckIn: checkIn,
          fechaCheckOut: checkOut,
          numPersonas: adults + children,
        },
      });
      setRooms(res.data.habitaciones || []);
      setSearched(true);
      setChipActivo(null);
      showToast('Disponibilidad actualizada.');
    } catch {
      showToast('Error al buscar disponibilidad.', 'warn');
    } finally {
      setLoading(false);
    }
  };

  // ── Modal ─────────────────────────────────────────────────────────────────
  const openModal = (room) => {
    setSelectedRoom(room);
    setGuestInfo({ nombre: '', email: '', telefono: '' });
    setCouponInput('');
    setCupon(null);
    setCouponMsg('');
    setModalStep(1);
  };

  const closeModal = () => {
    if (loadingPago) return;
    setModalStep(0);
  };

  // ── Payload común ─────────────────────────────────────────────────────────
  const buildPayload = () => {
    return {
      nombreCliente:     guestInfo.nombre.trim(),
      emailCliente:      guestInfo.email.trim(),
      telefonoCliente:   guestInfo.telefono.trim(),
      habitacionId:      selectedRoom._id,
      numAdultos:        adults,
      numNinos:          children,
      fechaCheckIn:      checkIn,
      fechaCheckOut:     checkOut,
      precioTotal:       precioFinal,
      codigoCupon:       cupon ? cupon.code : undefined,
      descuentoAplicado: descuento > 0 ? descuento : undefined,
      tituloHabitacion:  selectedRoom.titulo,
      numeroHabitacion:  selectedRoom.numero,
    };
  };

  // ── Aplicar cupón ──────────────────────────────────────────────────────────
  const handleApplyCoupon = async () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    setCouponLoading(true);
    setCupon(null);
    setCouponMsg('');
    try {
      const res = await clientAxios.get('/cupones/validar', {
        params: { codigo: code, noches: nights, tipoHabitacion: selectedRoom?.tipo || '' },
      });
      setCupon(res.data);
      const disc = calcDiscount(res.data, precioTotal, precioNoche);
      const label = res.data.type === 'pct'  ? `${res.data.value}% OFF`
                  : res.data.type === 'flat' ? `$${formatPrecio(res.data.value)} OFF`
                  : 'Una noche gratis';
      setCouponMsg(`✓ ${res.data.name} — ${label}. Ahorrás $${formatPrecio(disc)}`);
    } catch (err) {
      const errorMap = {
        notfound:  'Cupón no encontrado.',
        inactive:  'Este cupón está inactivo.',
        expired:   'Este cupón está vencido.',
        notyet:    'Este cupón aún no está vigente.',
        maxused:   'Este cupón ya alcanzó el límite de usos.',
        minnights: `Este cupón requiere mínimo ${err.response?.data?.min} noches.`,
        scope:     'Este cupón no aplica a esta habitación.',
      };
      setCouponMsg(errorMap[err.response?.data?.error] || 'Error al validar el cupón.');
    } finally {
      setCouponLoading(false);
    }
  };

  // ── Pagar con MercadoPago ─────────────────────────────────────────────────
  const confirmReservation = async () => {
    setLoadingPago(true);
    try {
      const res = await clientAxios.post('/pagos/crear-preferencia', buildPayload());
      window.location.href = res.data.initPoint;
    } catch (err) {
      console.error(err);
      showToast('Error al procesar el pago. Intentá de nuevo.', 'warn');
      setLoadingPago(false);
    }
  };

  // ── Solo reservar (sin pago) ──────────────────────────────────────────────
  const soloReservar = async () => {
    setLoadingPago(true);
    try {
      await clientAxios.post('/reservas', buildPayload());
      setModalStep(0);
      showToast('¡Reserva creada! Te contactaremos para coordinar el pago.');
    } catch (err) {
      console.error(err);
      showToast('Error al crear la reserva. Intentá de nuevo.', 'warn');
    } finally {
      setLoadingPago(false);
    }
  };

  // ── Precio seleccionado ───────────────────────────────────────────────────
  const precioNoche = selectedRoom ? (selectedRoom.precioPromocion || selectedRoom.precio) : 0;
  const precioTotal = precioNoche * nights;

  const calcDiscount = (cup, total, noche) => {
    if (!cup) return 0;
    if (cup.type === 'pct')  return Math.round(total * cup.value / 100);
    if (cup.type === 'flat') return Math.min(cup.value, total);
    if (cup.type === 'free') return noche;
    return 0;
  };

  const descuento  = calcDiscount(cupon, precioTotal, precioNoche);
  const precioFinal = precioTotal - descuento;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="hs-root" data-theme={theme} style={{ minHeight: '100svh', background: 'var(--bg)', transition: 'background var(--transition)' }}>

      {/* TOPBAR */}
      <header className="topbar" style={{ position: 'sticky', top: 0, zIndex: 100 }}>
        <div className="topbar-brand">
          <div className="brand-dot">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          Hotel Catalina
        </div>
        <div className="topbar-meta">
          <strong>Sistema de Reservas</strong>
          <span className="divider-dot">·</span>
          Disponibilidad
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
            aria-label="Cambiar tema"
            style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 8, padding: '5px 10px', cursor: 'pointer',
              color: 'var(--text-2)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 5,
              transition: 'all var(--transition)',
            }}
          >
            {theme === 'dark' ? '☀' : '☾'}
          </button>
        </div>
      </header>

      {/* LAYOUT: panel + results */}
      <div className="hs-layout">

        {/* LEFT PANEL */}
        <aside className="hs-panel">
          <div className="hs-panel-header">
            <div className="hs-panel-eyebrow">Disponibilidad</div>
            <div className="hs-panel-title">Buscá tu habitación</div>
            <div className="hs-panel-sub">Seleccioná fechas y cantidad de huéspedes</div>
          </div>
          <div className="hs-divider" />

          <div className="hs-form">

            {/* Dates */}
            <div>
              <span className="hs-field-label">Fechas</span>
              <div className="hs-date-pair">
                <div className="hs-date-field">
                  <label>Check-in</label>
                  <input
                    className="hs-date-input"
                    type="date"
                    value={checkIn}
                    onChange={e => setCheckIn(e.target.value)}
                  />
                </div>
                <div className="hs-date-field">
                  <label>Check-out</label>
                  <input
                    className="hs-date-input"
                    type="date"
                    value={checkOut}
                    min={checkIn}
                    onChange={e => setCheckOut(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Nights pill */}
            <div className={`hs-nights-pill${nights <= 0 ? ' hidden' : ''}`}>
              <span className="hs-nights-label">
                <IconMoon /> Duración de la estadía
              </span>
              <span className="hs-nights-count">{nights}n</span>
            </div>

            {/* Guest counters */}
            <div>
              <span className="hs-field-label">Huéspedes</span>
              <div className="hs-guests-grid">
                <div className="hs-counter">
                  <span className="hs-counter-label">Adultos</span>
                  <div className="hs-counter-ctrl">
                    <button className="hs-cnt-btn" onClick={() => setAdults(a => Math.max(1, a - 1))} disabled={adults <= 1}>−</button>
                    <span className="hs-cnt-val">{adults}</span>
                    <button className="hs-cnt-btn" onClick={() => setAdults(a => Math.min(10, a + 1))} disabled={adults >= 10}>+</button>
                  </div>
                </div>
                <div className="hs-counter">
                  <span className="hs-counter-label">Menores</span>
                  <div className="hs-counter-ctrl">
                    <button className="hs-cnt-btn" onClick={() => setChildren(c => Math.max(0, c - 1))} disabled={children <= 0}>−</button>
                    <span className="hs-cnt-val">{children}</span>
                    <button className="hs-cnt-btn" onClick={() => setChildren(c => Math.min(10, c + 1))} disabled={children >= 10}>+</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Search button */}
            <button className="hs-btn-search" onClick={handleSearch} disabled={loading}>
              <IconSearch />
              {loading ? 'Buscando...' : 'Ver disponibilidad'}
            </button>

          </div>

          {/* Promo strip */}
          <div className="hs-promo">
            <div className="hs-promo-tag">Oferta especial</div>
            <div className="hs-promo-text">
              Reservas de <strong>3+ noches</strong> incluyen desayuno continental sin cargo.
            </div>
          </div>
        </aside>

        {/* RIGHT RESULTS */}
        <section className="hs-results">

          {/* Summary bar */}
          <div className="hs-summary">
            <div className="hs-sum-item">
              <div className="hs-sum-label">Entrada</div>
              <div className="hs-sum-value">{fmtDate(checkIn)}</div>
            </div>
            <div className="hs-sum-item">
              <div className="hs-sum-label">Salida</div>
              <div className="hs-sum-value">{fmtDate(checkOut)}</div>
            </div>
            <div className="hs-sum-item">
              <div className="hs-sum-label">Noches</div>
              <div className="hs-sum-value"><span className="accent">{nights}</span></div>
            </div>
            <div className="hs-sum-item">
              <div className="hs-sum-label">Huéspedes</div>
              <div className="hs-sum-value">
                {adults} adulto{adults !== 1 ? 's' : ''}
                {children > 0 ? `, ${children} menor${children !== 1 ? 'es' : ''}` : ''}
              </div>
            </div>
          </div>

          {/* Results header */}
          <div className="hs-results-header">
            <div className="hs-results-title">
              {searched ? 'Habitaciones Disponibles' : 'Todas las Habitaciones'}
            </div>
            <div className="hs-results-count">
              {roomsFiltrados.length} habitación{roomsFiltrados.length !== 1 ? 'es' : ''}
            </div>
          </div>

          {/* Amenity chips */}
          {allAmenidades.length > 0 && (
            <div className="hs-chips">
              <span className="hs-chips-label">Filtrar:</span>
              {allAmenidades.map((a) => (
                <button
                  key={a}
                  className={`hs-chip${chipActivo === a ? ' active' : ''}`}
                  onClick={() => setChipActivo(chipActivo === a ? null : a)}
                >
                  {a}
                </button>
              ))}
            </div>
          )}

          {/* Rooms list */}
          <div className="hs-rooms-list">
            {loading ? (
              <div className="hs-empty">
                <div className="hs-empty-icon">⏳</div>
                <div className="hs-empty-title">Buscando habitaciones...</div>
              </div>
            ) : roomsFiltrados.length === 0 ? (
              <div className="hs-empty">
                <div className="hs-empty-icon">🔍</div>
                <div className="hs-empty-title">Sin resultados</div>
                <div className="hs-empty-text">
                  {chipActivo
                    ? 'Ninguna habitación tiene esa amenidad. Probá otro filtro.'
                    : 'No hay habitaciones disponibles para estas fechas y cantidad de huéspedes.'}
                </div>
              </div>
            ) : (
              roomsFiltrados.map(room => (
                <RoomCard key={room._id} room={room} nights={nights} onReserve={openModal} />
              ))
            )}
          </div>

        </section>
      </div>

      {/* ── MODAL MULTI-PASO (portal → siempre centrado sobre toda la pantalla) ── */}
      {modalStep > 0 && createPortal(
        <div
          className="modal-overlay open"
          onClick={e => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="modal" style={{ maxWidth: 520, padding: 0, overflow: 'hidden' }}>

            {/* Steps indicator */}
            <div className="bk-steps">
              {[['Habitación', 1], ['Tus datos', 2], ['Confirmar', 3]].map(([label, step], i) => (
                <div key={step} style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                  <div className={`bk-step${modalStep === step ? ' active' : ''}${modalStep > step ? ' done' : ''}`}>
                    <div className="bk-step-num">{modalStep > step ? '✓' : step}</div>
                    {label}
                  </div>
                  {i < 2 && <div className="bk-step-line" />}
                </div>
              ))}
            </div>

            {/* ── PASO 1: Detalle de la habitación ───────────────────────────── */}
            {modalStep === 1 && selectedRoom && (
              <>
                <div style={{ position: 'relative' }}>
                  <img
                    className="hs-modal-img"
                    src={selectedRoom.imagenes?.[0] || 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=700&q=75'}
                    alt={selectedRoom.titulo}
                  />
                  <button className="hs-modal-close-img" onClick={closeModal}>✕</button>
                  {!!selectedRoom.precioPromocion && (
                    <div style={{
                      position: 'absolute', bottom: 12, left: 12,
                      background: 'var(--amber)', color: 'white',
                      padding: '3px 10px', borderRadius: 6,
                      fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
                    }}>PROMO</div>
                  )}
                </div>

                <div className="modal-body" style={{ paddingTop: 16 }}>
                  <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--brand)', fontWeight: 600, marginBottom: 4 }}>
                    Room {selectedRoom.numero}
                  </div>
                  <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: 'var(--text-1)', marginBottom: 8 }}>
                    {selectedRoom.titulo}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6, marginBottom: 12 }}>
                    {selectedRoom.descripcion}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
                    <IconPerson /> {selectedRoom.capacidadPersonas} personas máx.
                  </div>
                  {(selectedRoom.amenidades || []).length > 0 && (
                    <div className="hs-modal-amenities">
                      {(selectedRoom.amenidades || []).map((a, i) => (
                        <span key={i} className="hs-modal-amenity">{a}</span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bk-footer">
                  <div className="bk-price-wrap">
                    {!!selectedRoom.precioPromocion && (
                      <div style={{ fontSize: 11, color: 'var(--text-3)', textDecoration: 'line-through' }}>
                        ${formatPrecio(selectedRoom.precio)}/noche
                      </div>
                    )}
                    <div className="bk-price-num">${formatPrecio(precioNoche)}</div>
                    <div className="bk-price-unit">/noche · {nights} noche{nights !== 1 ? 's' : ''}</div>
                  </div>
                  <button className="btn btn-primary" onClick={() => setModalStep(2)}>
                    Continuar →
                  </button>
                </div>
              </>
            )}

            {/* ── PASO 2: Datos del huésped ──────────────────────────────────── */}
            {modalStep === 2 && selectedRoom && (
              <>
                <div className="bk-pane-header">
                  <button className="bk-back-btn" onClick={() => setModalStep(1)}>← Atrás</button>
                  <div className="bk-pane-title">Tus datos</div>
                  <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', fontSize: 16 }} onClick={closeModal}>✕</button>
                </div>

                <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {/* Mini room summary */}
                  <div className="bk-room-summary">
                    <img
                      className="bk-rs-img"
                      src={selectedRoom.imagenes?.[0] || 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&q=75'}
                      alt={selectedRoom.titulo}
                    />
                    <div className="bk-rs-info">
                      <div className="bk-rs-name">{selectedRoom.titulo}</div>
                      <div className="bk-rs-meta">
                        Room {selectedRoom.numero} · {nights} noche{nights !== 1 ? 's' : ''}
                        · {fmtDate(checkIn)} → {fmtDate(checkOut)}
                      </div>
                    </div>
                    <div className="bk-rs-price">${formatPrecio(precioTotal)}</div>
                  </div>

                  {/* Form fields */}
                  <div className="form-group">
                    <label className="form-label">Nombre completo <span className="required">*</span></label>
                    <input
                      className="form-input"
                      type="text"
                      placeholder="Tu nombre y apellido"
                      value={guestInfo.nombre}
                      onChange={e => setGuestInfo(g => ({ ...g, nombre: e.target.value }))}
                      disabled={loadingPago}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email <span className="required">*</span></label>
                    <input
                      className="form-input"
                      type="email"
                      placeholder="tu@email.com"
                      value={guestInfo.email}
                      onChange={e => setGuestInfo(g => ({ ...g, email: e.target.value }))}
                      disabled={loadingPago}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Teléfono <span className="required">*</span></label>
                    <input
                      className="form-input"
                      type="tel"
                      placeholder="+54 9 ..."
                      value={guestInfo.telefono}
                      onChange={e => setGuestInfo(g => ({ ...g, telefono: e.target.value }))}
                      disabled={loadingPago}
                    />
                  </div>

                  {/* Cupón de descuento */}
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
                    <div style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 600, marginBottom: 10 }}>
                      Cupón de descuento
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        className="form-input"
                        type="text"
                        placeholder="Ej: HOTEL20"
                        value={couponInput}
                        style={{ flex: 1, textTransform: 'uppercase', letterSpacing: '0.05em' }}
                        onChange={e => {
                          setCouponInput(e.target.value.toUpperCase());
                          if (cupon) { setCupon(null); setCouponMsg(''); }
                        }}
                        onKeyDown={e => e.key === 'Enter' && handleApplyCoupon()}
                        disabled={loadingPago}
                      />
                      <button
                        className="btn btn-secondary"
                        onClick={handleApplyCoupon}
                        disabled={!couponInput.trim() || couponLoading || loadingPago}
                        style={{ whiteSpace: 'nowrap', minWidth: 82 }}
                      >
                        {couponLoading ? '...' : 'Aplicar'}
                      </button>
                    </div>
                    {couponMsg && (
                      <div style={{
                        fontSize: 12, marginTop: 8, padding: '8px 12px', borderRadius: 7, lineHeight: 1.4,
                        background: cupon ? '#f0fdf4' : '#fef2f2',
                        color: cupon ? '#16a34a' : '#dc2626',
                        border: `1px solid ${cupon ? '#bbf7d0' : '#fecaca'}`,
                      }}>
                        {couponMsg}
                      </div>
                    )}
                  </div>
                </div>

                <div className="bk-footer">
                  <div className="bk-price-wrap">
                    {descuento > 0 && (
                      <div style={{ fontSize: 11, color: 'var(--text-3)', textDecoration: 'line-through' }}>
                        ${formatPrecio(precioTotal)}
                      </div>
                    )}
                    <div className="bk-price-num">${formatPrecio(precioFinal)}</div>
                    <div className="bk-price-unit">total · {nights} noche{nights !== 1 ? 's' : ''}</div>
                  </div>
                  <button
                    className="btn btn-primary"
                    disabled={!guestInfo.nombre.trim() || !guestInfo.email.trim() || !guestInfo.telefono.trim()}
                    onClick={() => setModalStep(3)}
                  >
                    Revisar →
                  </button>
                </div>
              </>
            )}

            {/* ── PASO 3: Confirmar ──────────────────────────────────────────── */}
            {modalStep === 3 && selectedRoom && (
              <>
                <div className="bk-pane-header">
                  <button className="bk-back-btn" onClick={() => setModalStep(2)}>← Atrás</button>
                  <div className="bk-pane-title">Confirmación</div>
                  <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', fontSize: 16 }} onClick={closeModal}>✕</button>
                </div>

                <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Estadía */}
                  <div className="bk-confirm-section">
                    <div className="bk-confirm-title">Estadía</div>
                    <div className="bk-confirm-row">
                      <span>Habitación</span>
                      <strong>Room {selectedRoom.numero} — {selectedRoom.titulo}</strong>
                    </div>
                    <div className="bk-confirm-row">
                      <span>Check-in</span>
                      <strong>{fmtDate(checkIn)}</strong>
                    </div>
                    <div className="bk-confirm-row">
                      <span>Check-out</span>
                      <strong>{fmtDate(checkOut)}</strong>
                    </div>
                    <div className="bk-confirm-row">
                      <span>Noches</span>
                      <strong>{nights}</strong>
                    </div>
                    <div className="bk-confirm-row">
                      <span>Huéspedes</span>
                      <strong>
                        {adults} adulto{adults !== 1 ? 's' : ''}
                        {children > 0 ? `, ${children} menor${children !== 1 ? 'es' : ''}` : ''}
                      </strong>
                    </div>
                  </div>

                  {/* Contacto */}
                  <div className="bk-confirm-section">
                    <div className="bk-confirm-title">Contacto</div>
                    <div className="bk-confirm-row">
                      <span>Nombre</span>
                      <strong>{guestInfo.nombre}</strong>
                    </div>
                    <div className="bk-confirm-row">
                      <span>Email</span>
                      <strong>{guestInfo.email}</strong>
                    </div>
                    <div className="bk-confirm-row">
                      <span>Teléfono</span>
                      <strong>{guestInfo.telefono}</strong>
                    </div>
                  </div>

                  {/* Descuento (si aplica) */}
                  {descuento > 0 && (
                    <div className="bk-confirm-section">
                      <div className="bk-confirm-title">Precio</div>
                      <div className="bk-confirm-row">
                        <span>Subtotal</span>
                        <strong>${formatPrecio(precioTotal)}</strong>
                      </div>
                      <div className="bk-confirm-row" style={{ color: '#16a34a' }}>
                        <span>Descuento ({cupon.code})</span>
                        <strong>-${formatPrecio(descuento)}</strong>
                      </div>
                    </div>
                  )}

                  {/* Total */}
                  <div className="bk-confirm-total">
                    <span>Total a pagar</span>
                    <span className="bk-confirm-total-num">${formatPrecio(precioFinal)}</span>
                  </div>
                </div>

                <div className="bk-footer" style={{ flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', gap: 10, width: '100%' }}>
                    <button
                      className="btn btn-secondary"
                      style={{ flex: 1 }}
                      onClick={soloReservar}
                      disabled={loadingPago}
                    >
                      {loadingPago ? 'Procesando...' : '📋 Solo reservar'}
                    </button>
                    <button
                      className="btn btn-primary"
                      style={{ flex: 1 }}
                      onClick={confirmReservation}
                      disabled={loadingPago}
                    >
                      {loadingPago ? 'Procesando...' : '🔒 Pagar'}
                    </button>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', textAlign: 'center', lineHeight: 1.4 }}>
                    "Solo reservar" crea la reserva en estado <strong>pendiente</strong> sin pago inmediato.
                  </div>
                </div>
              </>
            )}

          </div>
        </div>,
        document.body
      )}

      {/* ── TOASTS ────────────────────────────────────────────────────────────── */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className="toast">
            <span className={`toast-dot ${t.type === 'warn' ? 'error' : 'success'}`} />
            <div>{t.msg}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── RoomCard ──────────────────────────────────────────────────────────────────
function RoomCard({ room, nights, onReserve }) {
  const precio = room.precioPromocion || room.precio;
  const precioTotal = precio * nights;
  const imagen = room.imagenes?.[0] || 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=700&q=75';

  return (
    <div className="hs-room-card">
      {/* Imagen */}
      <div className="hrc-img">
        <img src={imagen} alt={room.titulo} />
        <div className={`hrc-status${room.precioPromocion ? ' promo' : ' avail'}`}>
          <div className="hrc-dot" />
          {room.precioPromocion ? 'PROMO' : `Hab. ${room.numero}`}
        </div>
      </div>

      {/* Info */}
      <div className="hrc-info">
        <div className="hrc-type">Room {room.numero}</div>
        <div className="hrc-name">{room.titulo}</div>
        <div className="hrc-desc">{room.descripcion}</div>
        <div className="hrc-tags">
          {(room.amenidades || []).slice(0, 5).map((a, i) => (
            <span key={i} className="hrc-tag">{a}</span>
          ))}
          {(room.amenidades || []).length > 5 && (
            <span className="hrc-tag">+{room.amenidades.length - 5}</span>
          )}
        </div>
        <div className="hrc-meta">
          <span className="hrc-meta-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="13" height="13">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            Hasta {room.capacidadPersonas} personas
          </span>
          <span className="hrc-meta-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="13" height="13">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            {nights} noche{nights !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Precio */}
      <div className="hrc-price">
        <div className="hrc-price-group">
          {!!room.precioPromocion && (
            <div className="hrc-price-was">${formatPrecio(room.precio)}</div>
          )}
          <div className="hrc-price-main">${formatPrecio(precio)}</div>
          <div className="hrc-price-unit">/noche</div>
          <div className="hrc-price-total">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="11" height="11">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
            Total ${formatPrecio(precioTotal)}
          </div>
        </div>
        <div className="hrc-actions">
          <button className="hrc-btn-res" onClick={() => onReserve(room)}>
            Reservar
          </button>
        </div>
      </div>
    </div>
  );
}
