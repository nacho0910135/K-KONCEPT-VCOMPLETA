import { Bell, ClipboardList, Gauge, Gavel, PlusCircle, ShieldCheck, UserRound } from 'lucide-react';
import AppShell from './AppShell.jsx';

const navItems = [
  { to: 'dashboard', label: 'Inicio', icon: Gauge },
  { to: 'tickets', label: 'Mis tickets', icon: ClipboardList },
  { to: 'appeals', label: 'Apelaciones', icon: Gavel },
  { to: 'tickets/new', label: 'Nuevo ticket', icon: PlusCircle },
  { to: 'warranties', label: 'Garantias', icon: ShieldCheck },
  { to: 'notifications', label: 'Notificaciones', icon: Bell },
  { to: 'profile', label: 'Perfil', icon: UserRound }
];

const ClientLayout = () => <AppShell navItems={navItems} roleLabel="Cliente" />;

export default ClientLayout;
