import { X } from 'lucide-react';

const Drawer = ({ isOpen, title, children, onClose, width = 'max-w-xl' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-neutral-900/40">
      <aside className={`h-full w-full ${width} overflow-y-auto bg-white shadow-soft`}>
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-neutral-200 bg-white px-5 py-4">
          <h2 className="text-base font-semibold text-neutral-900">{title}</h2>
          <button className="rounded-md p-2 text-neutral-500 hover:bg-neutral-100" onClick={onClose} aria-label="Cerrar">
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="p-5">{children}</div>
      </aside>
    </div>
  );
};

export default Drawer;
