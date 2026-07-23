import { Bell, ChartNoAxesCombined, Clock3, FileText, Gauge, Layers3, Mail, ShieldCheck, ShieldAlert, SlidersHorizontal, Tags, UserRound, UsersRound } from 'lucide-react';
import AppShell from './AppShell.jsx';

const navItems = [
  { to: 'dashboard', label: 'Inicio', icon: Gauge },
  { to: 'tickets', label: 'Casos', icon: FileText },
  { to: 'users', label: 'Usuarios', icon: UsersRound },
  { to: 'categories', label: 'Categorias', icon: Tags },
  { to: 'garantias', label: 'Garantias', icon: ShieldCheck },
  { to: 'slas', label: 'SLAs', icon: Clock3 },
  { to: 'reports', label: 'Reportes', icon: ChartNoAxesCombined },
  { to: 'audit', label: 'Auditoria', icon: ShieldAlert },
  { to: 'notifications/templates', label: 'Plantillas', icon: Layers3 },
  { to: 'notifications/channels', label: 'Canales', icon: Mail },
  { to: 'notifications/frequency', label: 'Frecuencia', icon: SlidersHorizontal },
  { to: 'notificaciones', label: 'Notificaciones', icon: Bell },
  { to: 'profile', label: 'Perfil', icon: UserRound }
];

const AdminLayout = () => <AppShell navItems={navItems} roleLabel="Administrador" />;

export default AdminLayout;
