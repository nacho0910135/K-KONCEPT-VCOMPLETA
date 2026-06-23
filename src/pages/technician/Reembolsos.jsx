import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Card from '../../components/common/Card.jsx';
import Badge from '../../components/common/Badge.jsx';
import Button from '../../components/common/Button.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { exportRefundsPdf, listRefunds } from '../../services/refunds.client.service.js';

const refundLabel = {
  REFUND_TOTAL: 'Reembolso total',
  REFUND_PARTIAL: 'Reembolso parcial'
};

const Reembolsos = () => {
  const [refunds, setRefunds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    const loadRefunds = async () => {
      try {
        setIsLoading(true);
        const response = await listRefunds();
        if (mounted) setRefunds(response.refunds || []);
      } catch (loadError) {
        if (mounted) setError(loadError.response?.data?.message || 'No pudimos cargar reembolsos.');
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
        <Button onClick={exportRefundsPdf}>Exportar PDF</Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {isLoading && Array.from({ length: 4 }, (_, index) => <div key={index} className="h-32 animate-pulse rounded-lg bg-neutral-100" />)}
        {error && <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-danger md:col-span-2">{error}</div>}
        {!isLoading && !error && refunds.length === 0 && (
          <div className="md:col-span-2">
            <EmptyState title="Sin reembolsos" description="Cuando un ticket se resuelva con reembolso aparecera aqui." />
          </div>
        )}
        {refunds.map((refund) => (
          <Link key={refund.id} to={`/technician/tickets/${refund.ticketId}`}>
            <Card className="p-4 transition hover:border-primary-200 hover:shadow-md">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase text-neutral-500">{refund.ticket?.code}</p>
                  <h2 className="mt-1 font-semibold text-neutral-900">{refundLabel[refund.type] || refund.type}</h2>
                  <p className="mt-1 text-sm text-neutral-500">{refund.ticket?.client?.company || refund.ticket?.client?.name || 'Cliente'}</p>
                  {refund.amount && <p className="mt-1 text-sm font-semibold text-neutral-900">Monto: {refund.amount}</p>}
                </div>
                <Badge tone="warning">{refund.status}</Badge>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Reembolsos;
