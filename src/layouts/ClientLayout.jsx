import { Bell, ClipboardList, LifeBuoy, PlusCircle, ShieldCheck, UserRound } from 'lucide-react';
import AppShell from './AppShell.jsx';

const navItems = [
  { to: '', label: 'Mis tickets', icon: ClipboardList },
  { to: 'nuevo-ticket', label: 'Nuevo ticket', icon: PlusCircle },
  { to: 'garantias', label: 'Garantias', icon: ShieldCheck },
  { to: 'notificaciones', label: 'Notificaciones', icon: Bell },
  { to: 'perfil', label: 'Perfil', icon: UserRound },
  { to: 'soporte', label: 'Soporte', icon: LifeBuoy }
];

const ClientLayout = () => <AppShell navItems={navItems} roleLabel="Cliente" />;

export default ClientLayout;
