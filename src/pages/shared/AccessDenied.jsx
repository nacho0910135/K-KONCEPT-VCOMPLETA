import { Link } from 'react-router-dom';
import { ShieldX } from 'lucide-react';

const AccessDenied = () => (
  <section className="mx-auto max-w-md rounded-lg border border-neutral-200 bg-white p-8 text-center shadow-soft">
    <ShieldX className="mx-auto h-12 w-12 text-danger" />
    <h1 className="mt-4 text-2xl font-bold text-neutral-900">Acceso denegado</h1>
    <p className="mt-2 text-sm leading-6 text-neutral-600">Tu usuario no tiene permisos para entrar a esta seccion.</p>
    <Link className="mt-6 inline-flex min-h-10 items-center justify-center rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-700" to="/">
      Volver al inicio
    </Link>
  </section>
);

export default AccessDenied;
