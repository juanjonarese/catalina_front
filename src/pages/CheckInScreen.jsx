import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import clientAxios from "../helpers/clientAxios";
import Swal from "sweetalert2";

const EMPTY_PASAJERO = {
  nombre: "", dni: "", edad: "", nacionalidad: "", telefono: "",
};

const fmtDate = (d) => {
  if (!d) return "";
  return new Date(d).toISOString().split("T")[0];
};

const Campo = ({ label, required, error, children }) => (
  <div className="form-group">
    <label className="form-label">
      {label} {required && <span style={{ color: "var(--red,#C0392B)" }}>*</span>}
    </label>
    {children}
    {error && <div style={{ color: "var(--red,#C0392B)", fontSize: 11, marginTop: 3 }}>{error}</div>}
  </div>
);

export default function CheckInScreen() {
  const { reservaId } = useParams();
  const navigate      = useNavigate();

  const [reserva, setReserva]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [guardando, setGuardando] = useState(false);

  // Un formulario por adulto
  const [pasajeros, setPasajeros] = useState([]);
  const [errores, setErrores]     = useState([]);

  /* ── Cargar reserva ──────────────────────────────────────────── */
  useEffect(() => {
    const cargar = async () => {
      try {
        const { data } = await clientAxios.get(`/reservas/${reservaId}`);
        setReserva(data);

        const totalAdultos = data.numAdultos || 1;
        const checkin  = fmtDate(data.fechaCheckIn);
        const checkout = fmtDate(data.fechaCheckOut);
        const habitacion = data.habitacionId?.numero?.toString() || "";

        // Primer pasajero pre-llenado con datos del titular
        const inicial = Array.from({ length: totalAdultos }, (_, i) =>
          i === 0
            ? {
                nombre: data.nombreCliente || "",
                dni: "",
                edad: "",
                nacionalidad: "",
                telefono: data.telefonoCliente || "",
                checkin,
                checkout,
                habitacion,
                reservaId: data._id,
              }
            : { ...EMPTY_PASAJERO, checkin, checkout, habitacion, reservaId: data._id }
        );
        setPasajeros(inicial);
        setErrores(Array(totalAdultos).fill({}));
      } catch {
        Swal.fire({ icon: "error", title: "Error", text: "No se pudo cargar la reserva" });
        navigate("/admin/reservas");
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, [reservaId]);

  /* ── Actualizar campo de un pasajero ─────────────────────────── */
  const setcampo = (idx, campo, valor) => {
    setPasajeros((prev) => {
      const copia = [...prev];
      copia[idx] = { ...copia[idx], [campo]: valor };
      return copia;
    });
    setErrores((prev) => {
      const copia = [...prev];
      copia[idx] = { ...copia[idx], [campo]: "" };
      return copia;
    });
  };

  /* ── Validar ─────────────────────────────────────────────────── */
  const validar = () => {
    let valido = true;
    const nuevosErrores = pasajeros.map((p) => {
      const err = {};
      if (!p.nombre.trim())       { err.nombre = "Requerido"; valido = false; }
      if (!p.dni.trim())          { err.dni    = "Requerido"; valido = false; }
      if (!p.edad || p.edad <= 0) { err.edad   = "Requerido"; valido = false; }
      if (!p.nacionalidad.trim()) { err.nacionalidad = "Requerida"; valido = false; }
      if (!p.telefono.trim())     { err.telefono = "Requerido"; valido = false; }
      return err;
    });
    setErrores(nuevosErrores);
    return valido;
  };

  /* ── Guardar ─────────────────────────────────────────────────── */
  const handleGuardar = async () => {
    if (!validar()) return;
    setGuardando(true);
    try {
      // Registrar cada pasajero
      await Promise.all(pasajeros.map((p) => clientAxios.post("/pasajeros", p)));

      // Marcar reserva como confirmada
      await clientAxios.put(`/reservas/${reservaId}/estado`, { estado: "confirmada" });

      Swal.fire({
        icon: "success",
        title: "Check-in realizado",
        text: `${pasajeros.length} pasajero${pasajeros.length > 1 ? "s" : ""} registrado${pasajeros.length > 1 ? "s" : ""} correctamente.`,
        timer: 2500,
        showConfirmButton: false,
      });
      navigate("/admin/reservas");
    } catch (err) {
      Swal.fire({ icon: "error", title: "Error", text: err.response?.data?.msg || "No se pudo completar el check-in" });
    } finally {
      setGuardando(false);
    }
  };

  /* ── Render ──────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="empty-state">
        <div className="empty-icon">⏳</div>
        <div className="empty-title">Cargando reserva…</div>
      </div>
    );
  }

  const habitacion = reserva?.habitacionId?.numero;
  const totalAdultos = pasajeros.length;

  return (
    <>
      {/* HEADER */}
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-eyebrow">Check-In</div>
          <h1 className="page-title">Registro de pasajeros</h1>
          <p className="page-subtitle">
            Room {habitacion} · {totalAdultos} adulto{totalAdultos > 1 ? "s" : ""} ·{" "}
            {new Date(reserva.fechaCheckIn).toLocaleDateString("es-AR")} →{" "}
            {new Date(reserva.fechaCheckOut).toLocaleDateString("es-AR")}
          </p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={() => navigate("/admin/reservas")}>
            ← Volver
          </button>
          <button className="btn btn-primary" onClick={handleGuardar} disabled={guardando}>
            {guardando ? "Guardando…" : "✓ Confirmar check-in"}
          </button>
        </div>
      </div>

      {/* Resumen de la reserva */}
      <div style={{
        background: "var(--bg-2)", border: "1px solid var(--border)",
        borderRadius: 10, padding: "14px 20px", marginBottom: 24,
        display: "flex", gap: 32, flexWrap: "wrap", fontSize: 13,
      }}>
        <div><span style={{ color: "var(--text-3)" }}>Titular:</span> <strong>{reserva.nombreCliente}</strong></div>
        <div><span style={{ color: "var(--text-3)" }}>Email:</span> {reserva.emailCliente}</div>
        <div><span style={{ color: "var(--text-3)" }}>Teléfono:</span> {reserva.telefonoCliente}</div>
        <div><span style={{ color: "var(--text-3)" }}>Habitación:</span> <strong>Room {habitacion}</strong></div>
        {reserva.numNinos > 0 && (
          <div><span style={{ color: "var(--text-3)" }}>Menores:</span> {reserva.numNinos}</div>
        )}
      </div>

      {/* Formulario por cada pasajero */}
      {pasajeros.map((p, idx) => (
        <div key={idx} style={{
          background: "var(--bg-card,#fff)", border: "1px solid var(--border)",
          borderRadius: 12, padding: "20px 24px", marginBottom: 20,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%", background: "var(--brand,#4A7C59)",
              color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 700, fontSize: 14, flexShrink: 0,
            }}>
              {idx + 1}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>
                {idx === 0 ? "Titular de la reserva" : `Pasajero ${idx + 1}`}
              </div>
              {idx === 0 && totalAdultos === 1 && (
                <div style={{ fontSize: 12, color: "var(--text-3)" }}>
                  Datos pre-cargados desde la reserva — completá los faltantes
                </div>
              )}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
            <Campo label="Nombre y apellido" required error={errores[idx]?.nombre}>
              <input
                className={`form-input${errores[idx]?.nombre ? " error" : ""}`}
                type="text"
                placeholder="Nombre completo"
                value={p.nombre}
                onChange={(e) => setcampo(idx, "nombre", e.target.value)}
              />
            </Campo>

            <Campo label="DNI" required error={errores[idx]?.dni}>
              <input
                className={`form-input${errores[idx]?.dni ? " error" : ""}`}
                type="text"
                placeholder="Número de DNI"
                value={p.dni}
                onChange={(e) => setcampo(idx, "dni", e.target.value)}
              />
            </Campo>

            <Campo label="Edad" required error={errores[idx]?.edad}>
              <input
                className={`form-input${errores[idx]?.edad ? " error" : ""}`}
                type="number"
                placeholder="Años"
                min="1"
                value={p.edad}
                onChange={(e) => setcampo(idx, "edad", e.target.value)}
              />
            </Campo>

            <Campo label="Nacionalidad" required error={errores[idx]?.nacionalidad}>
              <input
                className={`form-input${errores[idx]?.nacionalidad ? " error" : ""}`}
                type="text"
                placeholder="Argentina, etc."
                value={p.nacionalidad}
                onChange={(e) => setcampo(idx, "nacionalidad", e.target.value)}
              />
            </Campo>

            <Campo label="Teléfono" required error={errores[idx]?.telefono}>
              <input
                className={`form-input${errores[idx]?.telefono ? " error" : ""}`}
                type="tel"
                placeholder="Teléfono de contacto"
                value={p.telefono}
                onChange={(e) => setcampo(idx, "telefono", e.target.value)}
              />
            </Campo>
          </div>
        </div>
      ))}

      {/* Botón final */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 8 }}>
        <button className="btn btn-secondary" onClick={() => navigate("/admin/reservas")}>
          Cancelar
        </button>
        <button className="btn btn-primary" onClick={handleGuardar} disabled={guardando}>
          {guardando ? "Guardando…" : `✓ Confirmar check-in (${totalAdultos} pasajero${totalAdultos > 1 ? "s" : ""})`}
        </button>
      </div>
    </>
  );
}
