import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from 'lucide-react';
import clsx from 'clsx';

const styles = {
  success: { icon: CheckCircle2, className: 'border-success/20 bg-green-50 text-green-900' },
  error: { icon: AlertCircle, className: 'border-danger/20 bg-red-50 text-red-900' },
  warning: { icon: TriangleAlert, className: 'border-warning/20 bg-amber-50 text-amber-900' },
  info: { icon: Info, className: 'border-primary-100 bg-primary-50 text-primary-700' }
};

const Toast = ({ toast, onDismiss }) => {
  const Icon = styles[toast.type]?.icon || Info;

  return (
    <div className={clsx('rounded-lg border p-4 shadow-soft', styles[toast.type]?.className)}>
      <div className="flex gap-3">
        <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          {toast.title && <p className="text-sm font-semibold">{toast.title}</p>}
          {toast.message && <p className="mt-1 text-sm opacity-90">{toast.message}</p>}
        </div>
        <button className="rounded-md p-1 opacity-70 transition hover:bg-white/70 hover:opacity-100" onClick={onDismiss} aria-label="Cerrar">
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};

export default Toast;
