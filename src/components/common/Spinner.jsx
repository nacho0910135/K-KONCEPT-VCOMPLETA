import { Loader2 } from 'lucide-react';
import clsx from 'clsx';

const Spinner = ({ className, label = 'Cargando' }) => (
  <div className={clsx('flex items-center justify-center gap-2 text-sm text-neutral-500', className)} role="status">
    <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
    <span>{label}</span>
  </div>
);

export default Spinner;
