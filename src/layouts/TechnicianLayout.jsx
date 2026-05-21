import { Bell, Boxes, Gauge, ClipboardCheck } from 'lucide-react';
import AppShell from './AppShell.jsx';

const navItems = [
  { to: 'dashboard', label: 'Inicio', icon: Gauge },
  { to: 'tickets', label: 'Asignados', icon: ClipboardCheck },
  { to: 'reemplazos', label: 'Reemplazos', icon: Boxes },
  { to: 'notifications', label: 'Notificaciones', icon: Bell }
];

const TechnicianLayout = () => <AppShell navItems={navItems} roleLabel="Tecnico" />;

export default TechnicianLayout;
