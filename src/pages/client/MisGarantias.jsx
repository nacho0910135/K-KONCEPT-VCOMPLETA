import { Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import Badge from '../../components/common/Badge.jsx';
import Card from '../../components/common/Card.jsx';
import IllustratedEmptyState from '../../components/common/IllustratedEmptyState.jsx';
import { warrantyTone } from './clientUtils.jsx';
import { formatDate } from '../../utils/formatDate.js';
import { listMyWarranties } from '../../services/warranties.client.service.js';
import { getErrorMessage } from '../../utils/errorHandler.js';

const getProductText = (warranty) => {
  const product = warranty.product || {};
  return `${product.name || ''} ${product.serialNumber || product.serial || ''}`;
};

const MisGarantias = () => {
  const [query, setQuery] = useState('');
  const [warranties, setWarranties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setIsLoading(true);
      setError('');

      try {
        const result = await listMyWarranties();
        if (mounted) setWarranties(Array.isArray(result) ? result : []);
      } catch (err) {
        if (mounted) setError(getErrorMessage(err, 'No pudimos cargar tus garantias.'));
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => warranties.filter((warranty) => (
    getProductText(warranty).toLowerCase().includes(query.toLowerCase())
  )), [query, warranties]);

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Mis garantias</h1>
        <p className="mt-1 text-sm text-neutral-500">Productos registrados y estado de cobertura.</p>
      </div>
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-2.5 h-5 w-5 text-neutral-400" />
        <input className="h-10 w-full rounded-md border border-neutral-200 pl-10 pr-3 text-sm outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-100" placeholder="Buscar por nombre o serial" value={query} onChange={(event) => setQuery(event.target.value)} />
      </div>
      {error && <Card className="border-danger bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</Card>}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => <div key={index} className="h-36 animate-pulse rounded-lg bg-neutral-100" />)}
        </div>
      ) : filtered.length === 0 ? (
        <IllustratedEmptyState title={warranties.length === 0 ? 'Aun no tienes garantias' : 'Sin garantias encontradas'} description={warranties.length === 0 ? 'Cuando se registren productos con garantia apareceran aqui.' : 'No hay productos que coincidan con tu busqueda.'} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((warranty) => {
            const product = warranty.product || {};
            const status = warranty.calculatedStatus || warranty.status;
            return (
              <Card key={warranty.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold text-neutral-900">{product.name || 'Producto'}</h2>
                    <p className="mt-1 text-sm text-neutral-500">{product.serialNumber || product.serial || 'Sin serial'}</p>
                  </div>
                  <Badge tone={warrantyTone[status] || 'neutral'}>{status}</Badge>
                </div>
                <p className="mt-4 text-sm text-neutral-600">
                  {warranty.isValid ? `Quedan ${warranty.daysRemaining} dias. Vence ${formatDate(warranty.endDate)}.` : warranty.endDate ? `Vencio ${formatDate(warranty.endDate)}.` : 'Este producto no aplica para garantia.'}
                </p>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MisGarantias;
