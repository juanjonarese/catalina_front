import { Routes, Route } from "react-router-dom";
import HomeScreen from "../pages/HomeScreen";
import GestionReservasScreen from "../pages/GestionReservasScreen";
import GestionHabitacionesScreen from "../pages/GestionHabitacionesScreen";
import RegistroPasajerosScreen from "../pages/RegistroPasajerosScreen";
import RespuestaPagoScreen from "../pages/RespuestaPagoScreen";

const PrincipalRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<HomeScreen />} />
      <Route path="/admin/habitaciones" element={<GestionHabitacionesScreen />} />
      <Route path="/admin/reservas" element={<GestionReservasScreen />} />
      <Route path="/registro-pasajeros" element={<RegistroPasajerosScreen />} />

      {/* Rutas de respuesta de pago de MercadoPago */}
      <Route path="/pago/success" element={<RespuestaPagoScreen />} />
      <Route path="/pago/pending" element={<RespuestaPagoScreen />} />
      <Route path="/pago/failure" element={<RespuestaPagoScreen />} />
    </Routes>
  );
};

export default PrincipalRoutes;