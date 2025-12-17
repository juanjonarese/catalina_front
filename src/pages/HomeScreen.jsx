import { useState } from "react";
import BusquedaHabitaciones from "../components/BusquedaHabitaciones";
import ListaHabitacionesDisponibles from "../components/ListaHabitacionesDisponibles";
import "../css/home.css";

const HomeScreen = () => {
  const [habitacionesDisponibles, setHabitacionesDisponibles] = useState([]);
  const [criteriosBusqueda, setCriteriosBusqueda] = useState(null);
  const [buscando, setBuscando] = useState(false);

  const handleBuscar = (habitaciones, criterios) => {
    setHabitacionesDisponibles(habitaciones);
    setCriteriosBusqueda(criterios);
    setBuscando(false);
  };

  const handleBuscando = (estado) => {
    setBuscando(estado);
  };

  return (
    <div className="container my-5">
      <div className="row">
        <div className="col-12 text-center mb-5">
          <h1>Bienvenido a Hotel</h1>
          <p className="lead">Sistema de Reserva de Habitaciones</p>
        </div>
      </div>

      <div className="row justify-content-center mb-5">
        <div className="col-lg-10">
          <BusquedaHabitaciones
            onBuscar={handleBuscar}
            onBuscando={handleBuscando}
          />
        </div>
      </div>

      {buscando && (
        <div className="row">
          <div className="col-12 text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Buscando habitaciones...</span>
            </div>
            <p className="mt-2">Buscando habitaciones disponibles...</p>
          </div>
        </div>
      )}

      {!buscando && habitacionesDisponibles.length > 0 && (
        <div className="row">
          <div className="col-12">
            <ListaHabitacionesDisponibles
              habitaciones={habitacionesDisponibles}
              criterios={criteriosBusqueda}
            />
          </div>
        </div>
      )}

      {!buscando && criteriosBusqueda && habitacionesDisponibles.length === 0 && (
        <div className="row">
          <div className="col-12">
            <div className="alert alert-info text-center" role="alert">
              <i className="bi bi-info-circle me-2"></i>
              No hay habitaciones disponibles para las fechas seleccionadas.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeScreen;


