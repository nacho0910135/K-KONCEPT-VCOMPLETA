import { Link } from 'react-router-dom';
import Card from '../../components/common/Card.jsx';
import Badge from '../../components/common/Badge.jsx';
import { technicianTickets } from './technicianMockData.js';

const Reemplazos = () => {
  const ticketsWithReplacement = technicianTickets.filter((ticket) => ticket.replacement);

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Reemplazos</h1>
        <p className="mt-1 text-sm text-neutral-500">Accede al wizard desde el panel de resolucion del ticket.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {ticketsWithReplacement.map((ticket) => (
          <Link key={ticket.id} to={`/technician/tickets/${ticket.id}`}>
            <Card className="p-4 transition hover:border-primary-200 hover:shadow-md">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase text-neutral-500">{ticket.code}</p>
                  <h2 className="mt-1 font-semibold text-neutral-900">{ticket.title}</h2>
                  <p className="mt-1 text-sm text-neutral-500">{ticket.client.company}</p>
                </div>
                <Badge tone={ticket.replacement.status === 'DELIVERED' ? 'success' : 'warning'}>{ticket.replacement.status}</Badge>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Reemplazos;
