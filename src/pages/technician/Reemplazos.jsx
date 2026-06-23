import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Card from '../../components/common/Card.jsx';
import Badge from '../../components/common/Badge.jsx';
import Button from '../../components/common/Button.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { exportReplacementsPdf, listReplacements } from '../../services/replacements.client.service.js';

const statusLabel = {
  APPROVED: 'Aprobado',
  DELIVERED: 'Entregado',
  REJECTED: 'Rechazado',
  IN_TRANSIT: 'En transito',
  PENDING_APPROVAL: 'Aprobado'
};

const Reemplazos = () => {
  const [replacements, setReplacements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    const loadReplacements = async () => {
      try {
        setIsLoading(true);
        const response = await listReplacements();
        if (mounted) setReplacements(response.replacements || []);
      } catch (loadError) {
        if (mounted) setError(loadError.response?.data?.message || 'No pudimos cargar reemplazos.');
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    loadReplacements();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Reemplazos</h1>
          <p className="mt-1 text-sm text-neutral-500">Reemplazos solicitados desde resoluciones de tickets.</p>
        </div>
        <Button onClick={exportReplacementsPdf}>Exportar PDF</Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {isLoading && Array.from({ length: 4 }, (_, index) => <div key={index} className="h-32 animate-pulse rounded-lg bg-neutral-100" />)}
        {error && <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-danger md:col-span-2">{error}</div>}
        {!isLoading && !error && replacements.length === 0 && (
          <div className="md:col-span-2">
            <EmptyState title="Sin reemplazos" description="Cuando un ticket requiera reemplazo aparecera aqui." />
          </div>
        )}
        {replacements.map((replacement) => (
          <Link key={replacement.id} to={`/technician/tickets/${replacement.ticketId}`}>
            <Card className="p-4 transition hover:border-primary-200 hover:shadow-md">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase text-neutral-500">{replacement.ticket?.code}</p>
                  <h2 className="mt-1 font-semibold text-neutral-900">{replacement.requestedProduct}</h2>
                  <p className="mt-1 text-sm text-neutral-500">{replacement.ticket?.client?.company || replacement.ticket?.client?.name || 'Cliente'}</p>
                  <p className="mt-1 text-sm text-neutral-500">Tecnico: {replacement.requestedBy?.name || replacement.ticket?.assignedTechnician?.name || 'No indicado'}</p>
                </div>
                <Badge tone={['APPROVED', 'DELIVERED', 'PENDING_APPROVAL'].includes(replacement.status) ? 'success' : 'warning'}>{statusLabel[replacement.status] || replacement.status}</Badge>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Reemplazos;
