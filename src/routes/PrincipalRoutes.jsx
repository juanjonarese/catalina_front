import { Routes, Route } from "react-router-dom";
import HomeScreen from "../pages/HomeScreen";
import GestionReservasScreen from "../pages/GestionReservasScreen";
import GestionHabitacionesScreen from "../pages/GestionHabitacionesScreen";
import RegistroPasajerosScreen from "../pages/RegistroPasajerosScreen";

const PrincipalRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<HomeScreen />} />
      <Route path="/admin/habitaciones" element={<GestionHabitacionesScreen />} />
      <Route path="/admin/reservas" element={<GestionReservasScreen />} />
      <Route path="/registro-pasajeros" element={<RegistroPasajerosScreen />} />
    </Routes>
  );
};

export default PrincipalRoutes;