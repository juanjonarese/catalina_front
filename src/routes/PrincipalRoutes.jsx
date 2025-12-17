import { Routes, Route } from "react-router-dom";
import HomeScreen from "../pages/HomeScreen";
import GestionReservasScreen from "../pages/GestionReservasScreen";
import GestionHabitacionesScreen from "../pages/GestionHabitacionesScreen";

const PrincipalRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<HomeScreen />} />
      <Route path="/admin/habitaciones" element={<GestionHabitacionesScreen />} />
      <Route path="/admin/reservas" element={<GestionReservasScreen />} />
    </Routes>
  );
};

export default PrincipalRoutes;