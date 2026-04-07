import { Routes, Route } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import HotelReservasPage from "../pages/HotelReservasPage";
import LoginScreen from "../pages/LoginScreen";
import DashboardScreen from "../pages/DashboardScreen";
import GestionReservasScreen from "../pages/GestionReservasScreen";
import GestionHabitacionesScreen from "../pages/GestionHabitacionesScreen";
import GestionClientesScreen from "../pages/GestionClientesScreen";
import GestionTarifasScreen from "../pages/GestionTarifasScreen";
import GestionCuponesScreen from "../pages/GestionCuponesScreen";
import GestionReportesScreen from "../pages/GestionReportesScreen";
import RegistroPasajerosScreen from "../pages/RegistroPasajerosScreen";
import RespuestaPagoScreen from "../pages/RespuestaPagoScreen";
import CajaTurnoScreen from "../pages/CajaTurnoScreen";
import GestionUsuariosScreen from "../pages/GestionUsuariosScreen";
import CheckInScreen from "../pages/CheckInScreen";

const PrincipalRoutes = () => {
  return (
    <Routes>
      {/* Ruta pública */}
      <Route path="/" element={<HotelReservasPage />} />
      <Route path="/registro-pasajeros" element={<RegistroPasajerosScreen />} />

      {/* Login */}
      <Route path="/login" element={<LoginScreen />} />

      {/* Rutas de respuesta de pago de MercadoPago */}
      <Route path="/pago/success" element={<RespuestaPagoScreen />} />
      <Route path="/pago/pending" element={<RespuestaPagoScreen />} />
      <Route path="/pago/failure" element={<RespuestaPagoScreen />} />

      {/* Rutas admin — usan el AdminLayout (topbar + sidenav) */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<DashboardScreen />} />
        <Route path="dashboard" element={<DashboardScreen />} />
        <Route path="habitaciones" element={<GestionHabitacionesScreen />} />
        <Route path="reservas" element={<GestionReservasScreen />} />
        <Route path="clientes" element={<GestionClientesScreen />} />
        <Route path="tarifas"  element={<GestionTarifasScreen />} />
        <Route path="cupones"   element={<GestionCuponesScreen />} />
        <Route path="reportes" element={<GestionReportesScreen />} />
        <Route path="caja" element={<CajaTurnoScreen />} />
        <Route path="usuarios" element={<GestionUsuariosScreen />} />
        <Route path="checkin/:reservaId" element={<CheckInScreen />} />
      </Route>
    </Routes>
  );
};

export default PrincipalRoutes;
