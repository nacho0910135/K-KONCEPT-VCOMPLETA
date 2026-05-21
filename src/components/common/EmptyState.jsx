import { Inbox } from 'lucide-react';
import Button from './Button.jsx';

const EmptyState = ({ title = 'Sin resultados', description, actionLabel, onAction }) => (
  <div className="grid place-items-center rounded-lg border border-dashed border-neutral-200 bg-white px-6 py-12 text-center">
    <Inbox className="h-10 w-10 text-neutral-400" aria-hidden="true" />
    <h3 className="mt-3 text-base font-semibold text-neutral-900">{title}</h3>
    {description && <p className="mt-1 max-w-md text-sm text-neutral-500">{description}</p>}
    {actionLabel && <Button className="mt-5" onClick={onAction}>{actionLabel}</Button>}
  </div>
);

export default EmptyState;
