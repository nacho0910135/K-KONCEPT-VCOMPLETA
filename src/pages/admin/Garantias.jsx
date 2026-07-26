import { useEffect, useMemo, useState } from 'react';
import { Save, Search } from 'lucide-react';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import { useToast } from '../../hooks/useToast.js';
import { getErrorMessage } from '../../utils/errorHandler.js';
import { listProducts, updateProduct } from '../../services/category.client.service.js';

const productName = (product) => [product.name, product.brand, product.model].filter(Boolean).join(' ');

const productPayload = (product, warrantyMonths) => ({
  name: product.name,
  brand: product.brand || undefined,
  model: product.model || undefined,
  serialNumber: product.serialNumber || undefined,
  categoryId: product.categoryId || undefined,
  subcategoryId: product.subcategoryId || undefined,
  description: product.description || undefined,
  purchaseDate: product.purchaseDate || undefined,
  warrantyMonths
});

const Garantias = () => {
  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState('');
  const [monthsById, setMonthsById] = useState({});
  const [serialById, setSerialById] = useState({});
  const [savingId, setSavingId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const { showToast } = useToast();

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setIsLoading(true);
      setError('');
      try {
        const result = await listProducts({ limit: 100, active: true, sortBy: 'name', sortOrder: 'asc' });
        const items = Array.isArray(result) ? result : result?.items || [];
        if (!mounted) return;
        setProducts(items);
        setMonthsById(Object.fromEntries(items.map((product) => [product.id, product.warrantyMonths ?? ''])));
        setSerialById(Object.fromEntries(items.map((product) => [product.id, product.serialNumber || ''])));
      } catch (loadError) {
        if (mounted) setError(getErrorMessage(loadError, 'No pudimos cargar los productos.'));
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, []);

  const filtered = useMemo(() => products.filter((product) => (
    `${productName(product)} ${product.serialNumber || ''} ${product.category?.name || ''}`.toLowerCase().includes(query.toLowerCase())
  )), [products, query]);

  const saveWarranty = async (product) => {
    const rawValue = monthsById[product.id];
    const warrantyMonths = rawValue === '' || rawValue === null ? null : Number(rawValue);
    setSavingId(product.id);

    try {
      const response = await updateProduct(product.id, productPayload({ ...product, serialNumber: serialById[product.id] }, warrantyMonths));
      const updated = response?.product || response;
      setProducts((current) => current.map((item) => item.id === product.id ? updated : item));
      showToast({ type: 'success', title: 'Garantia actualizada', message: `${product.name} quedo con ${warrantyMonths || 0} meses de garantia.` });
    } catch (saveError) {
      showToast({ type: 'error', title: 'No se pudo guardar', message: getErrorMessage(saveError, 'Revisa el plazo e intenta de nuevo.') });
    } finally {
      setSavingId('');
    }
  };

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Garantias por producto</h1>
        <p className="mt-1 text-sm text-neutral-500">Configura el plazo que usaran clientes y tecnicos para validar cobertura.</p>
      </div>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-2.5 h-5 w-5 text-neutral-400" />
        <input
          className="h-10 w-full rounded-md border border-neutral-200 pl-10 pr-3 text-sm outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
          placeholder="Buscar producto"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      {error && <Card className="border-danger/30 p-4 text-sm font-semibold text-danger">{error}</Card>}
      {isLoading && Array.from({ length: 4 }, (_, index) => <div key={index} className="h-20 animate-pulse rounded-lg bg-white" />)}
      {!isLoading && !error && filtered.length === 0 && <Card className="p-6 text-sm text-neutral-500">No hay productos para configurar.</Card>}

      <div className="grid gap-3">
        {filtered.map((product) => (
          <Card key={product.id} className="p-4">
            <div className="grid gap-4 md:grid-cols-[1fr_180px_180px_auto] md:items-end">
              <div>
                <h2 className="font-semibold text-neutral-900">{productName(product) || 'Producto'}</h2>
                <p className="mt-1 text-sm text-neutral-500">
                  {product.category?.name || 'Sin categoria'}{product.serialNumber ? ` - Serie ${product.serialNumber}` : ''}
                </p>
              </div>
              <label className="grid gap-1.5 text-sm font-medium text-neutral-700">
                <span>Meses de garantia</span>
                <input
                  className="h-10 rounded-md border border-neutral-200 px-3 text-sm outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
                  min="0"
                  max="120"
                  type="number"
                  value={monthsById[product.id] ?? ''}
                  onChange={(event) => setMonthsById((current) => ({ ...current, [product.id]: event.target.value }))}
                />
              </label>
              <label className="grid gap-1.5 text-sm font-medium text-neutral-700">
                <span>Numero serial</span>
                <input
                  className="h-10 rounded-md border border-neutral-200 px-3 text-sm outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
                  placeholder="Serial"
                  value={serialById[product.id] ?? ''}
                  onChange={(event) => setSerialById((current) => ({ ...current, [product.id]: event.target.value }))}
                />
              </label>
              <Button isLoading={savingId === product.id} onClick={() => saveWarranty(product)}>
                <Save className="h-4 w-4" />Guardar
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Garantias;
