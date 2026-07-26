import { Bell, Boxes, CircleDollarSign, Gauge, ClipboardCheck, MessageCircleMore, ShieldCheck, UserRound } from 'lucide-react';
import AppShell from './AppShell.jsx';

const navItems = [
  { to: 'dashboard', label: 'Inicio', icon: Gauge },
  { to: 'tickets', label: 'Asignados', icon: ClipboardCheck },
  { to: 'validar-garantia', label: 'Validar garantia', icon: ShieldCheck },
  { to: 'reemplazos', label: 'Reemplazos', icon: Boxes },
  { to: 'reembolsos', label: 'Reembolsos', icon: CircleDollarSign },
  { to: 'notifications', label: 'Notificaciones', icon: Bell },
  { to: 'chat', label: 'Chat del personal', icon: MessageCircleMore },
  { to: 'profile', label: 'Perfil', icon: UserRound }
];

const TechnicianLayout = () => <AppShell navItems={navItems} roleLabel="Tecnico" />;

export default TechnicianLayout;
