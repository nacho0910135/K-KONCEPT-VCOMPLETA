import { Bell, ChartNoAxesCombined, Clock3, FileText, Gauge, Layers3, Mail, ShieldAlert, SlidersHorizontal, Tags, UsersRound } from 'lucide-react';
import AppShell from './AppShell.jsx';

const navItems = [
  { to: 'dashboard', label: 'Dashboard', icon: Gauge },
  { to: 'tickets', label: 'Tickets', icon: FileText },
  { to: 'users', label: 'Usuarios', icon: UsersRound },
  { to: 'categories', label: 'Categorias', icon: Tags },
  { to: 'slas', label: 'SLAs', icon: Clock3 },
  { to: 'reports', label: 'Reportes', icon: ChartNoAxesCombined },
  { to: 'audit', label: 'Auditoria', icon: ShieldAlert },
  { to: 'notifications/templates', label: 'Plantillas', icon: Layers3 },
  { to: 'notifications/channels', label: 'Canales', icon: Mail },
  { to: 'notifications/frequency', label: 'Frecuencia', icon: SlidersHorizontal },
  { to: 'notificaciones', label: 'Notificaciones', icon: Bell }
];

const AdminLayout = () => <AppShell navItems={navItems} roleLabel="Administrador" />;

export default AdminLayout;
