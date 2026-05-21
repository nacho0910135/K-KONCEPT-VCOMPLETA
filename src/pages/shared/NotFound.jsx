import { Link } from 'react-router-dom';

const NotFound = () => (
  <section className="mx-auto grid min-h-screen max-w-md place-items-center px-4 text-center">
    <div>
      <p className="text-sm font-semibold uppercase tracking-wide text-primary-600">404</p>
      <h1 className="mt-2 text-3xl font-bold text-neutral-900">Pagina no encontrada</h1>
      <p className="mt-2 text-sm text-neutral-600">La ruta solicitada no existe o fue movida.</p>
      <Link className="mt-6 inline-flex min-h-10 items-center justify-center rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-700" to="/">
        Ir al inicio
      </Link>
    </div>
  </section>
);

export default NotFound;
