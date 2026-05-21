import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import Badge from '../../components/common/Badge.jsx';
import Card from '../../components/common/Card.jsx';
import IllustratedEmptyState from '../../components/common/IllustratedEmptyState.jsx';
import { clientProducts } from './clientMockData.js';
import { warrantyTone } from './clientUtils.jsx';
import { formatDate } from '../../utils/formatDate.js';

const MisGarantias = () => {
  const [query, setQuery] = useState('');
  const products = useMemo(() => clientProducts.filter((product) => `${product.name} ${product.serial}`.toLowerCase().includes(query.toLowerCase())), [query]);

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
      {products.length === 0 ? <IllustratedEmptyState title="Sin garantias encontradas" description="No hay productos que coincidan con tu busqueda." /> : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => (
            <Card key={product.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-neutral-900">{product.name}</h2>
                  <p className="mt-1 text-sm text-neutral-500">{product.serial}</p>
                </div>
                <Badge tone={warrantyTone[product.warrantyStatus]}>{product.warrantyStatus}</Badge>
              </div>
              <p className="mt-4 text-sm text-neutral-600">
                {product.warrantyStatus === 'VIGENTE' ? `Quedan ${product.daysLeft} dias. Vence ${formatDate(product.warrantyEndsAt)}.` : product.warrantyStatus === 'EXPIRADA' ? `Vencio ${formatDate(product.warrantyEndsAt)}.` : 'Este producto no aplica para garantia.'}
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MisGarantias;
