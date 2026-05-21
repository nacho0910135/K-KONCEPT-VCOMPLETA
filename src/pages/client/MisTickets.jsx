import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import IllustratedEmptyState from '../../components/common/IllustratedEmptyState.jsx';
import DateRangePicker from '../../components/forms/DateRangePicker.jsx';
import { clientTickets } from './clientMockData.js';
import { ClientPriorityBadge, ClientStatusBadge, clientStatusLabels, currentClientId } from './clientUtils.jsx';
import { formatDate } from '../../utils/formatDate.js';

const statuses = ['OPEN', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'RESOLVED', 'CLOSED', 'CANCELLED', 'REOPENED'];

const MisTickets = () => {
  const [status, setStatus] = useState('');
  const [query, setQuery] = useState('');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  const tickets = useMemo(() => clientTickets
    .filter((ticket) => ticket.ownerId === currentClientId)
    .filter((ticket) => !status || ticket.status === status)
    .filter((ticket) => !query || ticket.code.toLowerCase().includes(query.toLowerCase()) || ticket.title.toLowerCase().includes(query.toLowerCase()))
    .filter((ticket) => !dateRange.from || new Date(ticket.createdAt) >= new Date(dateRange.from))
    .filter((ticket) => !dateRange.to || new Date(ticket.createdAt) <= new Date(`${dateRange.to}T23:59:59`)), [status, query, dateRange]);

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Mis tickets</h1>
          <p className="mt-1 text-sm text-neutral-500">Consulta estado, tecnico asignado y avance.</p>
        </div>
        <Link to="/client/tickets/new"><Button>Crear nuevo ticket</Button></Link>
      </div>

      <Card className="grid gap-4 p-4">
        <div className="flex flex-wrap gap-2">
          <button className={`rounded-full px-3 py-1.5 text-sm font-semibold ${status === '' ? 'bg-primary-600 text-white' : 'bg-neutral-100 text-neutral-700'}`} onClick={() => setStatus('')}>Todos</button>
          {statuses.map((item) => (
            <button key={item} className={`rounded-full px-3 py-1.5 text-sm font-semibold ${status === item ? 'bg-primary-600 text-white' : 'bg-neutral-100 text-neutral-700'}`} onClick={() => setStatus(item)}>
              {clientStatusLabels[item]}
            </button>
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-5 w-5 text-neutral-400" />
            <input className="h-10 w-full rounded-md border border-neutral-200 pl-10 pr-3 text-sm outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-100" placeholder="Buscar por code o titulo" value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>
          <DateRangePicker value={dateRange} onChange={setDateRange} />
        </div>
      </Card>

      {tickets.length === 0 ? (
        <IllustratedEmptyState title="No hay tickets con esos filtros" description="Ajusta la busqueda o crea una nueva solicitud." actionLabel="Crear ticket" onAction={() => { window.location.href = '/client/tickets/new'; }} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {tickets.map((ticket) => (
            <Link key={ticket.id} to={`/client/tickets/${ticket.id}`}>
              <Card className="h-full p-4 transition hover:border-primary-200 hover:shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase text-neutral-500">{ticket.code}</p>
                    <h2 className="mt-1 text-base font-semibold text-neutral-900">{ticket.title}</h2>
                  </div>
                  <ClientStatusBadge status={ticket.status} />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <ClientPriorityBadge priority={ticket.priority} />
                  <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-700">{ticket.category}</span>
                </div>
                <div className="mt-4 text-sm text-neutral-600">
                  <p>{formatDate(ticket.createdAt)}</p>
                  <p className="mt-1">Tecnico: {ticket.technician?.name || 'Sin asignar'}</p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default MisTickets;
