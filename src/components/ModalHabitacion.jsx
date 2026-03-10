import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import clientAxios from "../helpers/clientAxios";

const AMENIDADES_OPCIONES = [
  { value: "WiFi",             label: "📶 WiFi" },
  { value: "A/C",              label: "❄️ A/C" },
  { value: "TV Smart",         label: "📺 TV Smart" },
  { value: "Balcón",           label: "🌿 Balcón" },
  { value: "Jacuzzi",          label: "🛁 Jacuzzi" },
  { value: "Minibar",          label: "🍾 Minibar" },
  { value: "Desayuno",         label: "☕ Desayuno" },
  { value: "Estacionamiento",  label: "🚗 Estacionamiento" },
  { value: "Spa",              label: "🧖 Spa" },
  { value: "Cocina",           label: "🍳 Cocina" },
];

const ModalHabitacion = ({ show, onHide, habitacion, onGuardar }) => {
  const [formData, setFormData] = useState({
    numero: "",
    titulo: "",
    descripcion: "",
    capacidadPersonas: 1,
    precio: 0,
    precioPromocion: "",
    amenidades: [],
    disponible: true,
  });

  const [imagenes, setImagenes] = useState([]);
  const [nuevaImagen, setNuevaImagen] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (habitacion) {
      setFormData({
        numero: habitacion.numero || "",
        titulo: habitacion.titulo || "",
        descripcion: habitacion.descripcion || "",
        capacidadPersonas: habitacion.capacidadPersonas || 1,
        precio: habitacion.precio || 0,
        precioPromocion: habitacion.precioPromocion || "",
        amenidades: habitacion.amenidades || [],
        disponible: habitacion.disponible !== undefined ? habitacion.disponible : true,
      });
      setImagenes(habitacion.imagenes || []);
    } else {
      setFormData({
        numero: "", titulo: "", descripcion: "",
        capacidadPersonas: 1, precio: 0, precioPromocion: "",
        amenidades: [], disponible: true,
      });
      setImagenes([]);
    }
  }, [habitacion, show]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleToggleAmenidad = (valor) => {
    setFormData((prev) => ({
      ...prev,
      amenidades: prev.amenidades.includes(valor)
        ? prev.amenidades.filter((a) => a !== valor)
        : [...prev.amenidades, valor],
    }));
  };

  const handleAgregarImagen = () => {
    if (nuevaImagen.trim()) {
      setImagenes((prev) => [...prev, nuevaImagen.trim()]);
      setNuevaImagen("");
    }
  };

  const handleEliminarImagen = (index) => {
    setImagenes((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dataToSend = {
        ...formData,
        precioPromocion: formData.precioPromocion === "" ? 0 : Number(formData.precioPromocion),
        imagenes,
      };

      if (habitacion) {
        await clientAxios.put(`/habitaciones/${habitacion._id}`, dataToSend);
        Swal.fire({ icon: "success", title: "Actualizada", text: "Habitación actualizada exitosamente", timer: 2000 });
      } else {
        await clientAxios.post("/habitaciones", dataToSend);
        Swal.fire({ icon: "success", title: "Creada", text: "Habitación creada exitosamente", timer: 2000 });
      }

      onGuardar();
      onHide();
    } catch (error) {
      console.error("Error al guardar habitación:", error);
      Swal.fire({ icon: "error", title: "Error", text: error.response?.data?.msg || error.message });
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && onHide()}>
      <div className="modal" style={{ maxWidth: 620 }}>
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-eyebrow">{habitacion ? "Editar habitación" : "Nueva habitación"}</div>
            <div className="modal-title">{habitacion ? "Editar Habitación" : "Agregar Habitación"}</div>
          </div>
          <button className="modal-close" onClick={onHide} aria-label="Cerrar">✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-grid">

              <div className="form-group">
                <label className="form-label" htmlFor="fNumero">
                  N° Habitación <span className="required">*</span>
                </label>
                <input
                  type="number"
                  id="fNumero"
                  name="numero"
                  className="form-input"
                  placeholder="Ej: 101"
                  value={formData.numero}
                  onChange={handleChange}
                  required
                  min="1"
                  disabled={!!habitacion}
                />
                {habitacion && (
                  <span style={{ fontSize: 11, color: "var(--text-3)" }}>
                    El número no se puede cambiar
                  </span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="fCap">Capacidad (personas)</label>
                <input
                  type="number"
                  id="fCap"
                  name="capacidadPersonas"
                  className="form-input"
                  min="1" max="10"
                  value={formData.capacidadPersonas}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group full">
                <label className="form-label" htmlFor="fTitulo">
                  Título <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="fTitulo"
                  name="titulo"
                  className="form-input"
                  placeholder="Ej: Habitación Doble Superior"
                  value={formData.titulo}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group full">
                <label className="form-label" htmlFor="fDesc">Descripción</label>
                <textarea
                  id="fDesc"
                  name="descripcion"
                  className="form-textarea"
                  placeholder="Descripción breve de la habitación y sus amenidades…"
                  value={formData.descripcion}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="fPrecio">Precio / noche ($)</label>
                <input
                  type="number"
                  id="fPrecio"
                  name="precio"
                  className="form-input"
                  min="0" step="0.01"
                  placeholder="0.00"
                  value={formData.precio}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="fPromo">Precio promocional ($)</label>
                <input
                  type="number"
                  id="fPromo"
                  name="precioPromocion"
                  className="form-input"
                  min="0" step="0.01"
                  placeholder="Dejar vacío si no aplica"
                  value={formData.precioPromocion}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group full">
                <label className="form-label">Estado</label>
                <label className="amenity-check" style={{ width: "fit-content" }}>
                  <input
                    type="checkbox"
                    name="disponible"
                    checked={formData.disponible}
                    onChange={handleChange}
                    style={{ display: "inline-block", marginRight: 6 }}
                  />
                  ✅ Habitación disponible para reservas
                </label>
              </div>

              {/* Imágenes */}
              <div className="form-group full">
                <label className="form-label">Imágenes (URLs)</label>
                <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                  <input
                    type="url"
                    className="form-input"
                    placeholder="https://ejemplo.com/imagen.jpg"
                    value={nuevaImagen}
                    onChange={(e) => setNuevaImagen(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAgregarImagen())}
                    style={{ flex: 1 }}
                  />
                  <button type="button" className="btn btn-secondary" onClick={handleAgregarImagen}>
                    ＋ Agregar
                  </button>
                </div>
                {imagenes.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                    {imagenes.map((img, index) => (
                      <div key={index} style={{ position: "relative" }}>
                        <img
                          src={img}
                          alt={`Imagen ${index + 1}`}
                          style={{ width: 90, height: 68, objectFit: "cover", borderRadius: 8, border: "1px solid var(--border)" }}
                        />
                        <button
                          type="button"
                          onClick={() => handleEliminarImagen(index)}
                          style={{
                            position: "absolute", top: -6, right: -6,
                            width: 20, height: 20, borderRadius: "50%",
                            background: "var(--red)", color: "white",
                            border: "none", cursor: "pointer", fontSize: 11,
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Amenidades */}
              <div className="form-group full">
                <label className="form-label">Amenidades</label>
                <div className="amenity-grid">
                  {AMENIDADES_OPCIONES.map(({ value, label }) => (
                    <label key={value} className="amenity-check">
                      <input
                        type="checkbox"
                        checked={formData.amenidades.includes(value)}
                        onChange={() => handleToggleAmenidad(value)}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>

            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onHide}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Guardando…" : habitacion ? "Guardar cambios" : "Crear Habitación"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalHabitacion;
