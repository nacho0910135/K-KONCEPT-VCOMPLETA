import { Navigate, Route, Routes } from 'react-router-dom';
import PublicLayout from '../layouts/PublicLayout.jsx';
import ClientLayout from '../layouts/ClientLayout.jsx';
import TechnicianLayout from '../layouts/TechnicianLayout.jsx';
import AdminLayout from '../layouts/AdminLayout.jsx';
import Login from '../pages/auth/Login.jsx';
import Register from '../pages/auth/Register.jsx';
import AccessDenied from '../pages/shared/AccessDenied.jsx';
import NotFound from '../pages/shared/NotFound.jsx';
import ClientDashboard from '../pages/client/Dashboard.jsx';
import ClientMisTickets from '../pages/client/MisTickets.jsx';
import NuevoTicket from '../pages/client/NuevoTicket.jsx';
import ClientDetalleTicket from '../pages/client/DetalleTicket.jsx';
import MisGarantias from '../pages/client/MisGarantias.jsx';
import ClientNotificaciones from '../pages/client/Notificaciones.jsx';
import Perfil from '../pages/client/Perfil.jsx';
import TechnicianDashboard from '../pages/technician/Dashboard.jsx';
import TicketsAsignados from '../pages/technician/TicketsAsignados.jsx';
import TechnicianDetalleTicket from '../pages/technician/DetalleTicket.jsx';
import Reemplazos from '../pages/technician/Reemplazos.jsx';
import TechnicianNotificaciones from '../pages/technician/Notificaciones.jsx';
import AdminDashboard from '../pages/admin/Dashboard.jsx';
import AdminTickets from '../pages/admin/Tickets.jsx';
import Usuarios from '../pages/admin/Usuarios.jsx';
import Categorias from '../pages/admin/Categorias.jsx';
import SLAs from '../pages/admin/SLAs.jsx';
import Reportes from '../pages/admin/Reportes.jsx';
import Auditoria from '../pages/admin/Auditoria.jsx';
import Plantillas from '../pages/admin/Plantillas.jsx';
import Canales from '../pages/admin/Canales.jsx';
import Frecuencia from '../pages/admin/Frecuencia.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';
import RoleRoute from './RoleRoute.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { ROLE_HOME } from '../utils/constants.js';

const HomeRedirect = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to={ROLE_HOME[user?.role] || '/access-denied'} replace />;
};

const AppRouter = () => (
  <Routes>
    <Route element={<PublicLayout />}>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/access-denied" element={<AccessDenied />} />
    </Route>

    <Route element={<ProtectedRoute />}>
      <Route element={<RoleRoute roles={['CLIENT']} />}>
        <Route path="/client" element={<ClientLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<ClientDashboard />} />
          <Route path="tickets" element={<ClientMisTickets />} />
          <Route path="tickets/new" element={<NuevoTicket />} />
          <Route path="nuevo-ticket" element={<NuevoTicket />} />
          <Route path="tickets/:id" element={<ClientDetalleTicket />} />
          <Route path="warranties" element={<MisGarantias />} />
          <Route path="garantias" element={<MisGarantias />} />
          <Route path="notifications" element={<ClientNotificaciones />} />
          <Route path="notificaciones" element={<ClientNotificaciones />} />
          <Route path="profile" element={<Perfil />} />
          <Route path="perfil" element={<Perfil />} />
        </Route>
      </Route>

      <Route element={<RoleRoute roles={['TECHNICIAN']} />}>
        <Route path="/technician" element={<TechnicianLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<TechnicianDashboard />} />
          <Route path="tickets" element={<TicketsAsignados />} />
          <Route path="tickets/:id" element={<TechnicianDetalleTicket />} />
          <Route path="reemplazos" element={<Reemplazos />} />
          <Route path="notifications" element={<TechnicianNotificaciones />} />
          <Route path="notificaciones" element={<TechnicianNotificaciones />} />
        </Route>
      </Route>

      <Route element={<RoleRoute roles={['ADMIN']} />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="tickets" element={<AdminTickets />} />
          <Route path="tickets/:id" element={<AdminTickets />} />
          <Route path="users" element={<Usuarios />} />
          <Route path="usuarios" element={<Usuarios />} />
          <Route path="categories" element={<Categorias />} />
          <Route path="categorias" element={<Categorias />} />
          <Route path="slas" element={<SLAs />} />
          <Route path="reports" element={<Reportes />} />
          <Route path="reportes" element={<Reportes />} />
          <Route path="audit" element={<Auditoria />} />
          <Route path="auditoria" element={<Auditoria />} />
          <Route path="notifications/templates" element={<Plantillas />} />
          <Route path="plantillas" element={<Plantillas />} />
          <Route path="notifications/channels" element={<Canales />} />
          <Route path="canales" element={<Canales />} />
          <Route path="notifications/frequency" element={<Frecuencia />} />
          <Route path="frecuencia" element={<Frecuencia />} />
          <Route path="notificaciones" element={<ClientNotificaciones />} />
        </Route>
      </Route>
    </Route>

    <Route path="/" element={<HomeRedirect />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

export default AppRouter;
