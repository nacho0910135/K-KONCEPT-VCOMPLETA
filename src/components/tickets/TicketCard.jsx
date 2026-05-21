import { CalendarDays, UserRound } from 'lucide-react';
import Card from '../common/Card.jsx';
import TicketStatusBadge from './TicketStatusBadge.jsx';
import { formatDate } from '../../utils/formatDate.js';

const TicketCard = ({ ticket, onClick }) => (
  <Card className="p-4 transition hover:border-primary-100 hover:shadow-md">
    <button className="grid w-full gap-3 text-left" onClick={onClick} type="button">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{ticket.code || ticket.id}</p>
          <h3 className="mt-1 text-base font-semibold text-neutral-900">{ticket.title}</h3>
        </div>
        <TicketStatusBadge status={ticket.status} />
      </div>
      {ticket.description && <p className="line-clamp-2 text-sm text-neutral-600">{ticket.description}</p>}
      <div className="flex flex-wrap gap-4 text-xs text-neutral-500">
        <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-4 w-4" />{formatDate(ticket.createdAt)}</span>
        {ticket.assignee && <span className="inline-flex items-center gap-1.5"><UserRound className="h-4 w-4" />{ticket.assignee.name}</span>}
      </div>
    </button>
  </Card>
);

export default TicketCard;
