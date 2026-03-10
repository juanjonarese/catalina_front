const ModalCheckOut = ({ show, onHide, onConfirmar, reserva, loading }) => {
  if (!reserva || !show) return null;

  const calcularNoches = () => {
    const entrada = new Date(reserva.fechaCheckIn);
    const salida = new Date(reserva.fechaCheckOut);
    return Math.ceil(Math.abs(salida - entrada) / (1000 * 60 * 60 * 24));
  };

  const noches = calcularNoches();
  const precioPorNoche = noches > 0 ? (reserva.precioTotal / noches).toFixed(2) : 0;
  const fechaDocumento = new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" });

  const handleImprimir = () => {
    const filaHtml = (label, value) =>
      `<div style="display:flex;justify-content:space-between;margin-bottom:3px;">
        <span style="color:#666;">${label}</span><span>${value}</span>
      </div>`;

    const copiaHtml = (tipo) => `
      <div style="padding:10px 24px;font-size:11px;box-sizing:border-box;overflow:hidden;height:100%;">
        <div style="text-align:right;margin-bottom:2px;">
          <span style="font-size:9px;font-weight:bold;letter-spacing:2px;color:#888;border:1px solid #ccc;padding:1px 6px;border-radius:3px;">${tipo}</span>
        </div>
        <div style="text-align:center;margin-bottom:6px;">
          <div style="font-weight:bold;font-size:14px;">Hotel Catalina</div>
          <div style="color:#666;font-size:10px;">Comprobante de Estadía — ${fechaDocumento}</div>
        </div>
        <hr style="margin:5px 0;border-color:#ddd;"/>
        <div style="font-weight:bold;margin-bottom:3px;">Cliente</div>
        ${filaHtml("Nombre:", `<strong>${reserva.nombreCliente}</strong>`)}
        ${filaHtml("Email:", reserva.emailCliente)}
        ${filaHtml("Teléfono:", reserva.telefonoCliente)}
        <hr style="margin:5px 0;border-color:#ddd;"/>
        <div style="font-weight:bold;margin-bottom:3px;">Estadía</div>
        ${filaHtml("Habitación:", `<strong>Room ${reserva.habitacionId?.numero} — ${reserva.habitacionId?.titulo}</strong>`)}
        ${filaHtml("Check-In:", new Date(reserva.fechaCheckIn).toLocaleDateString("es-ES"))}
        ${filaHtml("Check-Out:", new Date(reserva.fechaCheckOut).toLocaleDateString("es-ES"))}
        ${filaHtml("Noches:", noches)}
        ${filaHtml("Huéspedes:", `${reserva.numAdultos} adulto(s)${reserva.numNinos > 0 ? `, ${reserva.numNinos} niño(s)` : ""}`)}
        <hr style="margin:5px 0;border-color:#ddd;"/>
        <div style="font-weight:bold;margin-bottom:3px;">Detalle</div>
        ${filaHtml(`$${precioPorNoche} x ${noches} noche(s)`, `$${reserva.precioTotal}`)}
        <div style="display:flex;justify-content:space-between;align-items:center;background:#f0f7ff;border:1px solid #c9e0ff;border-radius:5px;padding:6px 10px;margin-top:6px;">
          <span style="font-weight:bold;font-size:13px;">TOTAL</span>
          <span style="font-weight:bold;font-size:14px;color:#0d6efd;">$${reserva.precioTotal}</span>
        </div>
        ${reserva.codigoReserva ? `<div style="text-align:center;margin-top:5px;color:#666;font-size:10px;">Código: <strong>${reserva.codigoReserva}</strong></div>` : ""}
        <div style="text-align:center;margin-top:8px;color:#bbb;font-size:9px;font-style:italic;">Documento no válido como factura</div>
      </div>`;

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Comprobante</title>
  <style>
    @page { size: A4 portrait; margin: 6mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { height: 100%; font-family: Arial, sans-serif; }
    .wrapper { display: flex; flex-direction: column; height: 100%; }
    .copia { flex: 1; overflow: hidden; }
    .separador { height: 28px; position: relative; display: flex; align-items: center; margin: 0 20px; }
    .separador::before { content: ""; position: absolute; width: 100%; border-top: 2px dashed #bbb; }
    .separador span { position: relative; background: white; padding: 0 10px; font-size: 9px; color: #aaa; margin: 0 auto; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="copia">${copiaHtml("ORIGINAL")}</div>
    <div class="separador"><span>✂ cortar aquí</span></div>
    <div class="copia">${copiaHtml("DUPLICADO")}</div>
  </div>
  <script>window.onload = function(){ window.print(); window.close(); }</script>
</body>
</html>`;

    const ventana = window.open("", "_blank", "width=794,height=1123");
    ventana.document.write(html);
    ventana.document.close();
  };

  return (
    <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && !loading && onHide()}>
      <div className="modal" style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-eyebrow">Check-Out</div>
            <div className="modal-title">Resumen de Estadía</div>
          </div>
          <button className="modal-close" onClick={onHide} disabled={loading} aria-label="Cerrar">✕</button>
        </div>

        <div className="modal-body">
          {/* Comprobante preview */}
          <div style={{
            background: "var(--bg-2)", border: "1px solid var(--border)",
            borderRadius: 10, padding: "16px 20px", fontSize: 13,
          }}>
            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: 12 }}>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: "var(--text-1)" }}>
                Hotel Catalina
              </div>
              <div style={{ fontSize: 11, color: "var(--text-3)" }}>
                Comprobante de Estadía — {fechaDocumento}
              </div>
            </div>

            <div style={{ borderTop: "1px solid var(--border)", paddingTop: 10, marginBottom: 10 }}>
              <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--brand)", fontWeight: 600, marginBottom: 6 }}>
                Cliente
              </div>
              {[
                ["Nombre", <strong>{reserva.nombreCliente}</strong>],
                ["Email", reserva.emailCliente],
                ["Teléfono", reserva.telefonoCliente],
              ].map(([label, val], i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 3, fontSize: 12 }}>
                  <span style={{ color: "var(--text-3)" }}>{label}</span>
                  <span style={{ color: "var(--text-1)" }}>{val}</span>
                </div>
              ))}
            </div>

            <div style={{ borderTop: "1px solid var(--border)", paddingTop: 10, marginBottom: 10 }}>
              <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--brand)", fontWeight: 600, marginBottom: 6 }}>
                Estadía
              </div>
              {[
                ["Habitación", `Room ${reserva.habitacionId?.numero} — ${reserva.habitacionId?.titulo}`],
                ["Check-In", new Date(reserva.fechaCheckIn).toLocaleDateString("es-ES")],
                ["Check-Out", new Date(reserva.fechaCheckOut).toLocaleDateString("es-ES")],
                ["Noches", noches],
                ["Huéspedes", `${reserva.numAdultos} adulto(s)${reserva.numNinos > 0 ? `, ${reserva.numNinos} niño(s)` : ""}`],
              ].map(([label, val], i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 3, fontSize: 12 }}>
                  <span style={{ color: "var(--text-3)" }}>{label}</span>
                  <span style={{ color: "var(--text-1)" }}>{val}</span>
                </div>
              ))}
            </div>

            {/* Total */}
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              background: "var(--bg-card)", border: "1px solid var(--border)",
              borderRadius: 8, padding: "10px 14px",
            }}>
              <span style={{ fontWeight: 700, fontSize: 13, color: "var(--text-1)" }}>TOTAL</span>
              <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: "var(--brand)" }}>
                ${reserva.precioTotal}
              </span>
            </div>

            {reserva.codigoReserva && (
              <div style={{ textAlign: "center", marginTop: 8, fontSize: 11, color: "var(--text-3)" }}>
                Código: <strong style={{ color: "var(--blue)" }}>{reserva.codigoReserva}</strong>
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onHide} disabled={loading}>Cancelar</button>
          <button
            className="btn btn-secondary"
            onClick={handleImprimir}
            disabled={loading}
            style={{ gap: 6 }}
          >
            🖨 Imprimir
          </button>
          <button className="btn btn-primary" onClick={onConfirmar} disabled={loading}>
            {loading ? "Procesando…" : "Confirmar Check-Out"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalCheckOut;
