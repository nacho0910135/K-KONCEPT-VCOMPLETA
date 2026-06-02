import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import IllustratedEmptyState from '../../components/common/IllustratedEmptyState.jsx';
import DateRangePicker from '../../components/forms/DateRangePicker.jsx';
import { ClientPriorityBadge, ClientStatusBadge, clientStatusLabels } from './clientUtils.jsx';
import { formatDate } from '../../utils/formatDate.js';
import { getMyTickets } from '../../services/tickets.service.js';
import { getErrorMessage } from '../../utils/errorHandler.js';

const statuses = ['OPEN', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'RESOLVED', 'CLOSED', 'CANCELLED', 'REOPENED'];

const getTicketCategory = (ticket) => ticket.category?.name || ticket.category || 'Sin categoria';
const getTicketTechnician = (ticket) => ticket.assignedTechnician || ticket.technician;
const normalize = (value) => String(value || '').toLowerCase();

const MisTickets = () => {
  const [status, setStatus] = useState('');
  const [query, setQuery] = useState('');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    const loadTickets = async () => {
      setIsLoading(true);
      setError('');

      try {
        const response = await getMyTickets({ limit: 100, sortBy: 'createdAt', sortOrder: 'desc' });
        if (mounted) setTickets(response.data || []);
      } catch (err) {
        if (mounted) setError(getErrorMessage(err, 'No pudimos cargar tus tickets.'));
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    loadTickets();

    return () => {
      mounted = false;
    };
  }, []);

  const filteredTickets = useMemo(() => {
    const search = normalize(query);

    return tickets
      .filter((ticket) => !status || ticket.status === status)
      .filter((ticket) => !search || normalize(ticket.code).includes(search) || normalize(ticket.title).includes(search))
      .filter((ticket) => !dateRange.from || new Date(ticket.createdAt) >= new Date(dateRange.from))
      .filter((ticket) => !dateRange.to || new Date(ticket.createdAt) <= new Date(`${dateRange.to}T23:59:59`));
  }, [tickets, status, query, dateRange]);

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

      {error && <Card className="border-danger bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</Card>}

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => <div key={index} className="h-40 animate-pulse rounded-lg bg-neutral-100" />)}
        </div>
      ) : filteredTickets.length === 0 ? (
        <IllustratedEmptyState title={tickets.length === 0 ? 'Aun no tienes tickets' : 'No hay tickets con esos filtros'} description={tickets.length === 0 ? 'Cuando crees una solicitud aparecera aqui.' : 'Ajusta la busqueda o crea una nueva solicitud.'} actionLabel="Crear ticket" onAction={() => { window.location.href = '/client/tickets/new'; }} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredTickets.map((ticket) => (
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
                  <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-700">{getTicketCategory(ticket)}</span>
                </div>
                <div className="mt-4 text-sm text-neutral-600">
                  <p>{formatDate(ticket.createdAt)}</p>
                  <p className="mt-1">Tecnico: {getTicketTechnician(ticket)?.name || 'Sin asignar'}</p>
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
