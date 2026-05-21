import clsx from 'clsx';
import { formatStatus } from '../../utils/formatStatus.js';

const statusClass = {
  OPEN: 'bg-primary-50 text-primary-700',
  ASSIGNED: 'bg-indigo-50 text-indigo-700',
  IN_PROGRESS: 'bg-amber-50 text-amber-700',
  RESOLVED: 'bg-green-50 text-green-700',
  CLOSED: 'bg-neutral-100 text-neutral-700',
  CANCELLED: 'bg-red-50 text-red-700'
};

const TicketStatusBadge = ({ status }) => (
  <span className={clsx('inline-flex rounded-full px-2.5 py-1 text-xs font-semibold', statusClass[status] || statusClass.OPEN)}>
    {formatStatus(status)}
  </span>
);

export default TicketStatusBadge;
