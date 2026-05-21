import { X } from 'lucide-react';
import Button from './Button.jsx';

const Modal = ({ isOpen, title, children, onClose, footer }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-neutral-900/40 px-4 py-6">
      <div className="w-full max-w-lg rounded-lg bg-white shadow-soft">
        <header className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
          <h2 className="text-base font-semibold text-neutral-900">{title}</h2>
          <button className="rounded-md p-2 text-neutral-500 transition hover:bg-neutral-100" onClick={onClose} aria-label="Cerrar modal">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>
        <div className="px-5 py-4">{children}</div>
        {footer && <footer className="flex justify-end gap-3 border-t border-neutral-200 px-5 py-4">{footer}</footer>}
      </div>
    </div>
  );
};

export default Modal;
