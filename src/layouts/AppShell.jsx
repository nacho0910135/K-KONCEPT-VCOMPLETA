import { Bell, LogOut, Menu, Search, UserRound, X } from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import clsx from 'clsx';
import { useAuth } from '../hooks/useAuth.js';
import { useNotifications } from '../hooks/useNotifications.js';
import { searchTickets } from '../services/tickets.service.js';
import kollabLogo from '../assets/kollab-logo.png';
import EnterpriseChat from '../components/chat/EnterpriseChat.jsx';

const AppShell = ({ navItems, roleLabel }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const notificationsPath = user?.role === 'ADMIN' ? '/admin/notificaciones' : 'notifications';
  const canSearch = user?.role !== 'CLIENT';

  const goToNotifications = () => {
    navigate(notificationsPath);
  };

  const runSearch = async (event) => {
    event.preventDefault();
    const q = searchTerm.trim();
    if (!q) return;

    if (user?.role === 'TECHNICIAN' || user?.role === 'ADMIN') {
      try {
        const response = await searchTickets({ q, limit: 1 });
        const ticket = response.data?.[0];
        if (ticket) {
          if (user.role === 'ADMIN') navigate(`/admin/tickets/${ticket.id}`);
          else if (user.role === 'TECHNICIAN') navigate(`/technician/tickets/${ticket.id}`);
        }
      } catch (_error) {
        return;
      }
      return;
    }

    navigate('/client/tickets');
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#722F37]">
      <header className="sticky top-0 z-30 border-b border-neutral-200 bg-[#efeeee]/95 shadow-sm backdrop-blur-xl">
        <div className="flex h-16 items-center gap-3 px-4 lg:px-6">
          <button className="rounded-md p-2 text-neutral-600 transition hover:bg-neutral-100 hover:text-primary-700 lg:hidden" onClick={() => setSidebarOpen(true)} aria-label="Abrir navegacion">
            <Menu className="h-5 w-5" />
          </button>
          <NavLink to="/" className="flex items-center gap-2 font-bold text-neutral-900 transition hover:scale-[1.01]" aria-label="Kollab Koncepts">
            <span className="grid h-10 w-32 place-items-center rounded-md bg-white px-2 shadow-sm ring-1 ring-neutral-100">
              <img className="max-h-8 w-full object-contain" src={kollabLogo} alt="Kollab Koncepts" />
            </span>
          </NavLink>
          {canSearch && (
            <form className="relative ml-auto hidden w-full max-w-md md:block" onSubmit={runSearch}>
              <Search className="pointer-events-none absolute left-3 top-2.5 h-5 w-5 text-neutral-400" />
              <input className="h-10 w-full rounded-md border border-neutral-200 bg-white/90 pl-10 pr-3 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-100" placeholder="Buscar tickets, usuarios o categorias" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} />
            </form>
          )}
          {!canSearch && <div className="ml-auto hidden md:block" />}
          <div className="relative">
            <button className="relative rounded-md p-2 text-neutral-600 transition hover:bg-primary-50 hover:text-primary-700" onClick={goToNotifications} aria-label="Notificaciones">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && <span className="absolute right-1 top-1 grid h-4 min-w-4 animate-pulse place-items-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">{unreadCount}</span>}
            </button>
          </div>
          <div className="hidden items-center gap-3 border-l border-neutral-200 pl-4 sm:flex">
            <div className="text-right">
              <p className="text-sm font-semibold text-neutral-900">{user?.name || 'Usuario'}</p>
              <p className="text-xs text-neutral-500">{roleLabel}</p>
            </div>
            {user?.avatarUrl ? (
              <img className="h-9 w-9 rounded-full object-cover ring-1 ring-primary-100" src={user.avatarUrl} alt={user?.name || 'Usuario'} />
            ) : (
              <UserRound className="h-9 w-9 rounded-full bg-primary-50 p-2 text-primary-700 ring-1 ring-primary-100" />
            )}
            <button className="rounded-md p-2 text-neutral-500 transition hover:bg-neutral-100 hover:text-danger" onClick={logout} aria-label="Cerrar sesion">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <aside className={clsx('fixed inset-y-0 left-0 z-40 w-72 border-r border-neutral-200 bg-[#f1eeee] p-4 shadow-soft transition lg:top-16 lg:z-20 lg:block lg:translate-x-0 lg:shadow-none', sidebarOpen ? 'translate-x-0' : '-translate-x-full')}>
        <div className="mb-4 flex items-center justify-between lg:hidden">
          <span className="font-semibold text-neutral-900">Menu</span>
          <button className="rounded-md p-2 hover:bg-neutral-100" onClick={() => setSidebarOpen(false)} aria-label="Cerrar navegacion">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="grid gap-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === ''}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => clsx('flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition hover:translate-x-0.5', isActive ? 'bg-primary-50 text-primary-700 shadow-sm ring-1 ring-primary-100' : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900')}
            >
              <Icon className="h-5 w-5" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {sidebarOpen && <button className="fixed inset-0 z-30 bg-neutral-900/30 lg:hidden" onClick={() => setSidebarOpen(false)} aria-label="Cerrar menu" />}

      <main className="flex-1 bg-[#722F37] px-4 py-5 pb-24 lg:ml-72 lg:px-6">
        <div className="min-h-full rounded-xl bg-[#f7f4f4] p-4 shadow-[0_24px_70px_rgba(20,6,10,0.28)] ring-1 ring-white/10 lg:p-6">
          <Outlet />
        </div>
      </main>
      <footer className="border-t border-white/10 bg-[#722F37] px-4 py-4 text-center text-xs text-white/70 lg:ml-72">Kollab Koncepts</footer>

      <nav className="fixed bottom-0 left-0 right-0 z-30 grid grid-cols-4 border-t border-neutral-200 bg-white lg:hidden">
        {navItems.slice(0, 4).map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} end={to === ''} className={({ isActive }) => clsx('grid place-items-center gap-1 px-2 py-2 text-[11px] font-semibold', isActive ? 'text-primary-700' : 'text-neutral-500')}>
            <Icon className="h-5 w-5" />
            <span className="max-w-full truncate">{label}</span>
          </NavLink>
        ))}
      </nav>
      <EnterpriseChat />
    </div>
  );
};

export default AppShell;
