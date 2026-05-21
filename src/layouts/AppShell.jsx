import { Bell, LogOut, Menu, Search, UserRound, X } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';
import { useState } from 'react';
import clsx from 'clsx';
import { useAuth } from '../hooks/useAuth.js';
import { useNotifications } from '../hooks/useNotifications.js';
import { formatRelativeDate } from '../utils/formatDate.js';
import kollabLogo from '../assets/kollab-logo.png';

const AppShell = ({ navItems, roleLabel }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { user, logout } = useAuth();
  const { unreadCount, notifications } = useNotifications();

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white/95 backdrop-blur">
        <div className="flex h-16 items-center gap-3 px-4 lg:px-6">
          <button className="rounded-md p-2 text-neutral-600 hover:bg-neutral-100 lg:hidden" onClick={() => setSidebarOpen(true)} aria-label="Abrir navegacion">
            <Menu className="h-5 w-5" />
          </button>
          <NavLink to="/" className="flex items-center gap-2 font-bold text-neutral-900" aria-label="Kollab Koncepts">
            <span className="grid h-10 w-32 place-items-center rounded-md bg-white px-2">
              <img className="max-h-8 w-full object-contain" src={kollabLogo} alt="Kollab Koncepts" />
            </span>
          </NavLink>
          <div className="relative ml-auto hidden w-full max-w-md md:block">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-5 w-5 text-neutral-400" />
            <input className="h-10 w-full rounded-md border border-neutral-200 bg-neutral-50 pl-10 pr-3 text-sm outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-100" placeholder="Buscar tickets, usuarios o categorias" />
          </div>
          <div className="relative">
            <button className="relative rounded-md p-2 text-neutral-600 hover:bg-neutral-100" onClick={() => setNotificationsOpen((open) => !open)} aria-label="Notificaciones">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">{unreadCount}</span>}
            </button>
            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 rounded-lg border border-neutral-200 bg-white p-2 shadow-soft">
                <div className="px-2 py-2 text-sm font-semibold text-neutral-900">Notificaciones</div>
                <div className="grid gap-1">
                  {notifications.slice(0, 5).map((item) => (
                    <NavLink key={item.id} to="notificaciones" className="rounded-md px-2 py-2 text-sm hover:bg-neutral-50">
                      <span className="block font-medium text-neutral-800">{item.title || item.message}</span>
                      <span className="text-xs text-neutral-500">{formatRelativeDate(item.createdAt)}</span>
                    </NavLink>
                  ))}
                  {notifications.length === 0 && <p className="px-2 py-3 text-sm text-neutral-500">No hay notificaciones recientes.</p>}
                </div>
              </div>
            )}
          </div>
          <div className="hidden items-center gap-3 border-l border-neutral-200 pl-4 sm:flex">
            <div className="text-right">
              <p className="text-sm font-semibold text-neutral-900">{user?.name || 'Usuario'}</p>
              <p className="text-xs text-neutral-500">{roleLabel}</p>
            </div>
            <UserRound className="h-9 w-9 rounded-full bg-neutral-100 p-2 text-neutral-600" />
            <button className="rounded-md p-2 text-neutral-500 hover:bg-neutral-100" onClick={logout} aria-label="Cerrar sesion">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <aside className={clsx('fixed inset-y-0 left-0 z-40 w-72 border-r border-neutral-200 bg-white p-4 transition lg:top-16 lg:z-20 lg:block lg:translate-x-0', sidebarOpen ? 'translate-x-0' : '-translate-x-full')}>
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
              className={({ isActive }) => clsx('flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition', isActive ? 'bg-primary-50 text-primary-700 shadow-sm' : 'text-neutral-600 hover:bg-neutral-100')}
            >
              <Icon className="h-5 w-5" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {sidebarOpen && <button className="fixed inset-0 z-30 bg-neutral-900/30 lg:hidden" onClick={() => setSidebarOpen(false)} aria-label="Cerrar menu" />}

      <main className="px-4 py-6 pb-24 lg:ml-72 lg:px-8">
        <Outlet />
      </main>
      <footer className="border-t border-neutral-200 bg-white px-4 py-4 text-center text-xs text-neutral-500 lg:ml-72">Kollab Koncepts</footer>

      <nav className="fixed bottom-0 left-0 right-0 z-30 grid grid-cols-4 border-t border-neutral-200 bg-white lg:hidden">
        {navItems.slice(0, 4).map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} end={to === ''} className={({ isActive }) => clsx('grid place-items-center gap-1 px-2 py-2 text-[11px] font-semibold', isActive ? 'text-primary-700' : 'text-neutral-500')}>
            <Icon className="h-5 w-5" />
            <span className="max-w-full truncate">{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default AppShell;
