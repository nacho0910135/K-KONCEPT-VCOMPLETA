import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { FileText } from 'lucide-react';
import Card from '../../components/common/Card.jsx';
import Badge from '../../components/common/Badge.jsx';
import Button from '../../components/common/Button.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { downloadRefundCertificate, exportRefunds, listRefunds } from '../../services/refunds.client.service.js';
import { getErrorMessage } from '../../utils/errorHandler.js';

const refundLabel = {
  REFUND_TOTAL: 'Reembolso total',
  REFUND_PARTIAL: 'Reembolso parcial'
};

const statusLabel = {
  REGISTERED: 'Registrado',
  REQUESTED: 'Solicitado',
  APPROVED: 'Aprobado',
  REJECTED: 'Rechazado',
  PAID: 'Pagado'
};
const money = (value) => new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC' }).format(Number(value || 0));

const Reembolsos = () => {
  const [refunds, setRefunds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const { user } = useAuth();
  const ticketBasePath = user?.role === 'ADMIN' ? '/admin/tickets' : '/technician/tickets';
  const filteredRefunds = useMemo(() => refunds.filter((refund) => {
    const q = query.trim().toLowerCase();
    const text = [
      refund.ticket?.code,
      refund.ticket?.title,
      refund.ticket?.product?.name,
      refund.ticket?.product?.brand,
      refund.ticket?.product?.model,
      refund.ticket?.client?.name,
      refund.ticket?.client?.company
    ].filter(Boolean).join(' ').toLowerCase();
    return !q || text.includes(q);
  }), [refunds, query]);

  useEffect(() => {
    let mounted = true;

    const loadRefunds = async () => {
      try {
        setIsLoading(true);
        const response = await listRefunds();
        const rows = response.refunds || response.data?.refunds || response.data || [];
        if (mounted) setRefunds(Array.isArray(rows) ? rows : []);
      } catch (loadError) {
        if (mounted) setError(getErrorMessage(loadError) || 'No pudimos cargar reembolsos.');
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    loadRefunds();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Reembolsos</h1>
          <p className="mt-1 text-sm text-neutral-500">Reembolsos registrados desde resoluciones de tickets.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" onClick={() => exportRefunds('csv')}>Exportar CSV</Button>
          <Button onClick={() => exportRefunds('xls')}>Exportar Excel</Button>
        </div>
      </div>
      <Card className="p-4">
        <input
          className="h-10 w-full rounded-md border border-neutral-200 px-3 text-sm outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
          placeholder="Buscar por ticket, producto o cliente"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        {isLoading && Array.from({ length: 4 }, (_, index) => <div key={index} className="h-32 animate-pulse rounded-lg bg-neutral-100" />)}
        {error && <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-danger md:col-span-2">{error}</div>}
        {!isLoading && !error && filteredRefunds.length === 0 && (
          <div className="md:col-span-2">
            <EmptyState title="Sin reembolsos" description="Cuando un ticket se resuelva con reembolso aparecera aqui." />
          </div>
        )}
        {filteredRefunds.map((refund) => (
          <Card key={refund.id} className="p-4 transition hover:border-primary-200 hover:shadow-md">
            <Link to={`${ticketBasePath}/${refund.ticketId}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase text-neutral-500">{refund.ticket?.code}</p>
                  <h2 className="mt-1 font-semibold text-neutral-900">{refundLabel[refund.type] || refund.type}</h2>
                  <p className="mt-1 text-sm text-neutral-500">{refund.ticket?.client?.company || refund.ticket?.client?.name || 'Cliente'}</p>
                  {refund.amount && <p className="mt-1 text-sm font-semibold text-neutral-900">Monto: {money(refund.amount)}</p>}
                </div>
                <Badge tone="warning">{statusLabel[refund.status] || refund.status}</Badge>
              </div>
            </Link>
            <div className="mt-4 flex justify-end">
              <Button variant="ghost" onClick={() => downloadRefundCertificate(refund.id)}><FileText className="h-4 w-4" />Constancia</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Reembolsos;
