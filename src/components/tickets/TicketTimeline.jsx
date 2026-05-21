import { formatDateTime } from '../../utils/formatDate.js';

const TicketTimeline = ({ events = [] }) => (
  <ol className="space-y-4">
    {events.map((event) => (
      <li key={event.id} className="relative border-l border-neutral-200 pl-4">
        <span className="absolute -left-1.5 top-1 h-3 w-3 rounded-full bg-primary-600" />
        <p className="text-sm font-semibold text-neutral-900">{event.title}</p>
        <p className="mt-1 text-sm text-neutral-600">{event.description}</p>
        <time className="mt-1 block text-xs text-neutral-500">{formatDateTime(event.createdAt)}</time>
      </li>
    ))}
  </ol>
);

export default TicketTimeline;
