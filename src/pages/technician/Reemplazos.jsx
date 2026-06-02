import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Card from '../../components/common/Card.jsx';
import Badge from '../../components/common/Badge.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { getAssignedTickets } from '../../services/tickets.service.js';

const Reemplazos = () => {
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    const loadTickets = async () => {
      try {
        setIsLoading(true);
        const response = await getAssignedTickets({ limit: 100 });
        const items = response.data?.items || response.data || [];
        const candidates = items.filter((ticket) => ticket.replacement || ['RESOLVED', 'PENDING_REPLACEMENT', 'IN_PROGRESS'].includes(ticket.status));
        if (mounted) setTickets(candidates);
      } catch (loadError) {
        if (mounted) setError(loadError.response?.data?.message || 'No pudimos cargar reemplazos reales.');
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    loadTickets();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Reemplazos</h1>
        <p className="mt-1 text-sm text-neutral-500">Accede al wizard desde el panel de resolucion del ticket.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {isLoading && Array.from({ length: 4 }, (_, index) => <div key={index} className="h-32 animate-pulse rounded-lg bg-neutral-100" />)}
        {error && <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-danger md:col-span-2">{error}</div>}
        {!isLoading && !error && tickets.length === 0 && (
          <div className="md:col-span-2">
            <EmptyState title="Sin reemplazos reales" description="Cuando un ticket requiera reemplazo aparecera aqui desde la base de datos." />
          </div>
        )}
        {tickets.map((ticket) => (
          <Link key={ticket.id} to={`/technician/tickets/${ticket.id}`}>
            <Card className="p-4 transition hover:border-primary-200 hover:shadow-md">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase text-neutral-500">{ticket.code}</p>
                  <h2 className="mt-1 font-semibold text-neutral-900">{ticket.title}</h2>
                  <p className="mt-1 text-sm text-neutral-500">{ticket.client?.company || ticket.client?.name || 'Cliente'}</p>
                </div>
                <Badge tone={ticket.replacement?.status === 'DELIVERED' ? 'success' : 'warning'}>{ticket.replacement?.status || ticket.status}</Badge>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Reemplazos;
