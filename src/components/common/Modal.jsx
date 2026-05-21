import { X } from 'lucide-react';
import clsx from 'clsx';

const Modal = ({ isOpen, title, children, onClose, footer, maxWidth = 'max-w-lg' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-neutral-900/40 px-4 py-6">
      <div className={clsx('max-h-[92vh] w-full overflow-hidden rounded-lg bg-white shadow-soft', maxWidth)}>
        <header className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
          <h2 className="text-base font-semibold text-neutral-900">{title}</h2>
          <button className="rounded-md p-2 text-neutral-500 transition hover:bg-neutral-100" onClick={onClose} aria-label="Cerrar modal">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>
        <div className="max-h-[calc(92vh-4.5rem)] overflow-y-auto px-5 py-4">{children}</div>
        {footer && <footer className="flex justify-end gap-3 border-t border-neutral-200 px-5 py-4">{footer}</footer>}
      </div>
    </div>
  );
};

export default Modal;
