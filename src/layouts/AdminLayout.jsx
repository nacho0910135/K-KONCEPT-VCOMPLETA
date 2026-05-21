import { Bell, ChartNoAxesCombined, Clock3, FileText, Gauge, Layers3, Mail, ShieldAlert, SlidersHorizontal, Tags, UsersRound } from 'lucide-react';
import AppShell from './AppShell.jsx';

const navItems = [
  { to: '', label: 'Dashboard', icon: Gauge },
  { to: 'tickets', label: 'Tickets', icon: FileText },
  { to: 'usuarios', label: 'Usuarios', icon: UsersRound },
  { to: 'categorias', label: 'Categorias', icon: Tags },
  { to: 'slas', label: 'SLAs', icon: Clock3 },
  { to: 'reportes', label: 'Reportes', icon: ChartNoAxesCombined },
  { to: 'auditoria', label: 'Auditoria', icon: ShieldAlert },
  { to: 'plantillas', label: 'Plantillas', icon: Layers3 },
  { to: 'canales', label: 'Canales', icon: Mail },
  { to: 'frecuencia', label: 'Frecuencia', icon: SlidersHorizontal },
  { to: 'notificaciones', label: 'Notificaciones', icon: Bell }
];

const AdminLayout = () => <AppShell navItems={navItems} roleLabel="Administrador" />;

export default AdminLayout;
