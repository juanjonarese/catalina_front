import { useState } from "react";
import Swal from "sweetalert2";
import clientAxios from "../helpers/clientAxios";

const BusquedaHabitaciones = ({ onBuscar, onBuscando }) => {
  const [fechaEntrada, setFechaEntrada] = useState("");
  const [fechaSalida, setFechaSalida] = useState("");
  const [numAdultos, setNumAdultos] = useState(1);
  const [numNinos, setNumNinos] = useState(0);

  const handleBuscar = async (e) => {
    e.preventDefault();

    if (!fechaEntrada || !fechaSalida) {
      Swal.fire({
        icon: "warning",
        title: "Fechas requeridas",
        text: "Por favor selecciona las fechas de entrada y salida",
      });
      return;
    }

    if (new Date(fechaSalida) <= new Date(fechaEntrada)) {
      Swal.fire({
        icon: "error",
        title: "Error en las fechas",
        text: "La fecha de salida debe ser posterior a la fecha de entrada",
      });
      return;
    }

    if (numAdultos === 0) {
      Swal.fire({
        icon: "warning",
        title: "Huéspedes requeridos",
        text: "Debe haber al menos 1 adulto",
      });
      return;
    }

    try {
      onBuscando(true);
      const totalPersonas = numAdultos + numNinos;

      const { data } = await clientAxios.get("/habitaciones/disponibilidad", {
        params: {
          fechaCheckIn: fechaEntrada,
          fechaCheckOut: fechaSalida,
          numPersonas: totalPersonas,
        },
      });

      onBuscar(data.habitaciones, {
        fechaCheckIn: fechaEntrada,
        fechaCheckOut: fechaSalida,
        numAdultos,
        numNinos,
        totalPersonas,
      });
    } catch (error) {
      console.error("Error al buscar habitaciones:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error al buscar habitaciones disponibles",
      });
      onBuscando(false);
    }
  };

  const obtenerFechaMinima = () => {
    const hoy = new Date();
    return hoy.toISOString().split('T')[0];
  };

  return (
    <div className="card shadow-lg">
      <div className="card-body p-4">
        <h3 className="card-title text-center mb-4">Buscar Habitaciones</h3>
        <form onSubmit={handleBuscar}>
          <div className="row g-3">
            <div className="col-md-3">
              <label htmlFor="fechaEntrada" className="form-label fw-bold">
                Fecha de Entrada
              </label>
              <input
                type="date"
                className="form-control form-control-lg"
                id="fechaEntrada"
                value={fechaEntrada}
                onChange={(e) => setFechaEntrada(e.target.value)}
                min={obtenerFechaMinima()}
                required
              />
            </div>

            <div className="col-md-3">
              <label htmlFor="fechaSalida" className="form-label fw-bold">
                Fecha de Salida
              </label>
              <input
                type="date"
                className="form-control form-control-lg"
                id="fechaSalida"
                value={fechaSalida}
                onChange={(e) => setFechaSalida(e.target.value)}
                min={fechaEntrada || obtenerFechaMinima()}
                required
              />
            </div>

            <div className="col-md-3">
              <label htmlFor="numAdultos" className="form-label fw-bold">
                Adultos
              </label>
              <input
                type="number"
                className="form-control form-control-lg"
                id="numAdultos"
                value={numAdultos}
                onChange={(e) => setNumAdultos(parseInt(e.target.value))}
                min="1"
                max="10"
                required
              />
            </div>

            <div className="col-md-3">
              <label htmlFor="numNinos" className="form-label fw-bold">
                Niños
              </label>
              <input
                type="number"
                className="form-control form-control-lg"
                id="numNinos"
                value={numNinos}
                onChange={(e) => setNumNinos(parseInt(e.target.value))}
                min="0"
                max="10"
                required
              />
            </div>

            <div className="col-12">
              <button type="submit" className="btn btn-primary btn-lg w-100">
                Buscar Habitaciones Disponibles
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BusquedaHabitaciones;
