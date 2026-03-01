import { useState, useEffect } from "react";
import { Modal, Button } from "react-bootstrap";
import Swal from "sweetalert2";
import clientAxios from "../helpers/clientAxios";

const ModalHabitacion = ({ show, onHide, habitacion, onGuardar }) => {
  const [formData, setFormData] = useState({
    numero: "",
    titulo: "",
    descripcion: "",
    capacidadPersonas: 1,
    precio: 0,
    precioPromocion: 0,
    amenidades: [],
    disponible: true,
  });

  const [imagenes, setImagenes] = useState([]);
  const [nuevaImagen, setNuevaImagen] = useState("");
  const [amenidad, setAmenidad] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (habitacion) {
      setFormData({
        numero: habitacion.numero || "",
        titulo: habitacion.titulo || "",
        descripcion: habitacion.descripcion || "",
        capacidadPersonas: habitacion.capacidadPersonas || 1,
        precio: habitacion.precio || 0,
        precioPromocion: habitacion.precioPromocion || 0,
        amenidades: habitacion.amenidades || [],
        disponible: habitacion.disponible !== undefined ? habitacion.disponible : true,
      });
      setImagenes(habitacion.imagenes || []);
    }
  }, [habitacion]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleAgregarImagen = () => {
    if (nuevaImagen.trim()) {
      setImagenes([...imagenes, nuevaImagen]);
      setNuevaImagen("");
    }
  };

  const handleEliminarImagen = (index) => {
    setImagenes(imagenes.filter((_, i) => i !== index));
  };

  const handleAgregarAmenidad = () => {
    if (amenidad.trim() && !formData.amenidades.includes(amenidad)) {
      setFormData((prev) => ({
        ...prev,
        amenidades: [...prev.amenidades, amenidad],
      }));
      setAmenidad("");
    }
  };

  const handleEliminarAmenidad = (index) => {
    setFormData((prev) => ({
      ...prev,
      amenidades: prev.amenidades.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dataToSend = {
        ...formData,
        imagenes,
      };

      if (habitacion) {
        await clientAxios.put(`/habitaciones/${habitacion._id}`, dataToSend);
        Swal.fire({
          icon: "success",
          title: "Actualizada",
          text: "Habitación actualizada exitosamente",
          timer: 2000,
        });
      } else {
        await clientAxios.post("/habitaciones", dataToSend);
        Swal.fire({
          icon: "success",
          title: "Creada",
          text: "Habitación creada exitosamente",
          timer: 2000,
        });
      }

      onGuardar();
      onHide();
    } catch (error) {
      console.error("Error al guardar habitación:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.msg || error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" fullscreen="sm-down">
      <Modal.Header closeButton>
        <Modal.Title>
          {habitacion ? "Editar Habitación" : "Nueva Habitación"}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <form onSubmit={handleSubmit}>
          <div className="row g-3">
            <div className="col-md-3">
              <label className="form-label">Número de Habitación *</label>
              <input
                type="number"
                className="form-control"
                name="numero"
                value={formData.numero}
                onChange={handleChange}
                required
                min="1"
                placeholder="101"
                disabled={!!habitacion}
              />
              {habitacion && (
                <small className="text-muted">El número no se puede cambiar una vez creada</small>
              )}
            </div>

            <div className="col-md-9">
              <label className="form-label">Título *</label>
              <input
                type="text"
                className="form-control"
                name="titulo"
                value={formData.titulo}
                onChange={handleChange}
                required
                placeholder="Ej: Suite Presidencial con Vista al Mar"
              />
            </div>

            <div className="col-12">
              <label className="form-label">Descripción *</label>
              <textarea
                className="form-control"
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                required
                rows="3"
                placeholder="Descripción detallada de la habitación"
              ></textarea>
            </div>

            <div className="col-md-4">
              <label className="form-label">Capacidad (Personas) *</label>
              <input
                type="number"
                className="form-control"
                name="capacidadPersonas"
                value={formData.capacidadPersonas}
                onChange={handleChange}
                required
                min="1"
                max="10"
              />
            </div>

            <div className="col-md-4">
              <label className="form-label">Precio por Noche *</label>
              <input
                type="number"
                className="form-control"
                name="precio"
                value={formData.precio}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
              />
            </div>

            <div className="col-md-4">
              <label className="form-label">Precio Promoción</label>
              <input
                type="number"
                className="form-control"
                name="precioPromocion"
                value={formData.precioPromocion}
                onChange={handleChange}
                min="0"
                step="0.01"
              />
            </div>

            <div className="col-12">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  name="disponible"
                  checked={formData.disponible}
                  onChange={handleChange}
                  id="disponibleCheck"
                />
                <label className="form-check-label" htmlFor="disponibleCheck">
                  Habitación disponible para reservas
                </label>
              </div>
            </div>

            <div className="col-12">
              <hr />
              <h6>Imágenes (URLs)</h6>
              <div className="input-group mb-2">
                <input
                  type="url"
                  className="form-control"
                  value={nuevaImagen}
                  onChange={(e) => setNuevaImagen(e.target.value)}
                  placeholder="https://ejemplo.com/imagen.jpg"
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={handleAgregarImagen}
                >
                  <i className="bi bi-plus-circle me-1"></i>
                  Agregar
                </button>
              </div>
              <div className="row g-2">
                {imagenes.map((img, index) => (
                  <div key={index} className="col-md-4">
                    <div className="card">
                      <img
                        src={img}
                        alt={`Imagen ${index + 1}`}
                        className="card-img-top"
                        style={{ height: "100px", objectFit: "cover" }}
                      />
                      <div className="card-body p-2">
                        <button
                          type="button"
                          className="btn btn-sm btn-danger w-100"
                          onClick={() => handleEliminarImagen(index)}
                        >
                          <i className="bi bi-trash"></i> Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="col-12">
              <hr />
              <h6>Amenidades</h6>
              <div className="input-group mb-2">
                <input
                  type="text"
                  className="form-control"
                  value={amenidad}
                  onChange={(e) => setAmenidad(e.target.value)}
                  placeholder="Ej: WiFi, TV, Minibar"
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={handleAgregarAmenidad}
                >
                  <i className="bi bi-plus-circle me-1"></i>
                  Agregar
                </button>
              </div>
              <div className="d-flex flex-wrap gap-2">
                {formData.amenidades.map((am, index) => (
                  <span key={index} className="badge bg-info d-flex align-items-center gap-1">
                    {am}
                    <i
                      className="bi bi-x-circle"
                      style={{ cursor: "pointer" }}
                      onClick={() => handleEliminarAmenidad(index)}
                    ></i>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="d-flex justify-content-end gap-2 mt-4">
            <Button variant="secondary" onClick={onHide}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? "Guardando..." : habitacion ? "Actualizar" : "Crear Habitación"}
            </Button>
          </div>
        </form>
      </Modal.Body>
    </Modal>
  );
};

export default ModalHabitacion;
