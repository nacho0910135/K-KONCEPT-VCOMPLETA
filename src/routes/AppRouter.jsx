import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import PublicLayout from '../layouts/PublicLayout.jsx';
import ClientLayout from '../layouts/ClientLayout.jsx';
import TechnicianLayout from '../layouts/TechnicianLayout.jsx';
import AdminLayout from '../layouts/AdminLayout.jsx';
import Spinner from '../components/common/Spinner.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';
import RoleRoute from './RoleRoute.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { ROLE_HOME } from '../utils/constants.js';

const Login = lazy(() => import('../pages/auth/Login.jsx'));
const Register = lazy(() => import('../pages/auth/Register.jsx'));
const ForgotPassword = lazy(() => import('../pages/auth/ForgotPassword.jsx'));
const AccessDenied = lazy(() => import('../pages/shared/AccessDenied.jsx'));
const NotFound = lazy(() => import('../pages/shared/NotFound.jsx'));
const ClientDashboard = lazy(() => import('../pages/client/Dashboard.jsx'));
const ClientMisTickets = lazy(() => import('../pages/client/MisTickets.jsx'));
const NuevoTicket = lazy(() => import('../pages/client/NuevoTicket.jsx'));
const ClientDetalleTicket = lazy(() => import('../pages/client/DetalleTicket.jsx'));
const MisGarantias = lazy(() => import('../pages/client/MisGarantias.jsx'));
const ClientNotificaciones = lazy(() => import('../pages/client/Notificaciones.jsx'));
const Perfil = lazy(() => import('../pages/client/Perfil.jsx'));
const TechnicianDashboard = lazy(() => import('../pages/technician/Dashboard.jsx'));
const TicketsAsignados = lazy(() => import('../pages/technician/TicketsAsignados.jsx'));
const TechnicianDetalleTicket = lazy(() => import('../pages/technician/DetalleTicket.jsx'));
const Reemplazos = lazy(() => import('../pages/technician/Reemplazos.jsx'));
const Reembolsos = lazy(() => import('../pages/technician/Reembolsos.jsx'));
const TechnicianNotificaciones = lazy(() => import('../pages/technician/Notificaciones.jsx'));
const AdminDashboard = lazy(() => import('../pages/admin/Dashboard.jsx'));
const AdminTickets = lazy(() => import('../pages/admin/Tickets.jsx'));
const Usuarios = lazy(() => import('../pages/admin/Usuarios.jsx'));
const Categorias = lazy(() => import('../pages/admin/Categorias.jsx'));
const SLAs = lazy(() => import('../pages/admin/SLAs.jsx'));
const Reportes = lazy(() => import('../pages/admin/Reportes.jsx'));
const Auditoria = lazy(() => import('../pages/admin/Auditoria.jsx'));
const Plantillas = lazy(() => import('../pages/admin/Plantillas.jsx'));
const Canales = lazy(() => import('../pages/admin/Canales.jsx'));
const Frecuencia = lazy(() => import('../pages/admin/Frecuencia.jsx'));

const HomeRedirect = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to={ROLE_HOME[user?.role] || '/access-denied'} replace />;
};

const AppRouter = () => (
  <Suspense fallback={<Spinner className="min-h-screen" label="Cargando modulo" />}>
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
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
            <Route path="reembolsos" element={<Reembolsos />} />
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
  </Suspense>
);

export default AppRouter;
