import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, SearchCheck } from 'lucide-react';
import Badge from '../../components/common/Badge.jsx';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import { listProducts } from '../../services/category.client.service.js';
import { getErrorMessage } from '../../utils/errorHandler.js';
import { formatDate } from '../../utils/formatDate.js';

const addMonths = (date, months) => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + Number(months || 0));
  return result;
};

const productLabel = (product) => [product.name, product.brand, product.model].filter(Boolean).join(' ');

const ValidarGarantia = () => {
  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState('');
  const [productId, setProductId] = useState('');
  const [showProducts, setShowProducts] = useState(false);
  const [purchaseDate, setPurchaseDate] = useState('');
  const [validated, setValidated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

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
        setProductId('');
        setQuery('');
      } catch (loadError) {
        if (mounted) setError(getErrorMessage(loadError, 'No pudimos cargar productos.'));
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, []);

  const product = useMemo(() => products.find((item) => item.id === productId), [products, productId]);
  const filteredProducts = useMemo(() => {
    const term = query.trim().toLowerCase();
    return term ? products.filter((item) => productLabel(item).toLowerCase().includes(term)) : products;
  }, [products, query]);
  const warrantyMonths = Number(product?.warrantyMonths || 0);
  const expiresAt = purchaseDate && warrantyMonths > 0 ? addMonths(`${purchaseDate}T00:00:00`, warrantyMonths) : null;
  const isValid = Boolean(expiresAt && expiresAt >= new Date());

  const validate = (event) => {
    event.preventDefault();
    setValidated(true);
  };

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Validar garantia</h1>
        <p className="mt-1 text-sm text-neutral-500">Selecciona el producto y la fecha de compra para confirmar si aplica reemplazo por garantia.</p>
      </div>

      <Card className="p-5">
        <form className="grid gap-4 md:grid-cols-[1fr_220px_auto] md:items-end" onSubmit={validate}>
          <label className="relative grid gap-1.5 text-sm font-medium text-neutral-700" onBlur={() => setTimeout(() => setShowProducts(false), 120)}>
            <span>Producto</span>
            <div className="relative">
              <input
                className="h-10 w-full rounded-md border border-neutral-200 px-3 pr-10 text-sm outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
                placeholder="Nombre, marca o modelo"
                disabled={isLoading}
                value={query}
                onFocus={() => setShowProducts(true)}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setProductId('');
                  setShowProducts(true);
                  setValidated(false);
                }}
              />
              <button className="absolute right-1 top-1 grid h-8 w-8 place-items-center rounded-md text-neutral-500 hover:bg-neutral-100" disabled={isLoading} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => setShowProducts((open) => !open)} aria-label="Mostrar productos">
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
            {showProducts && (
              <div className="absolute top-full z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-neutral-200 bg-white py-1 shadow-soft">
                {filteredProducts.length === 0 && <p className="px-3 py-2 text-sm text-neutral-500">Sin productos</p>}
                {filteredProducts.map((item) => (
                  <button
                    key={item.id}
                    className="block w-full px-3 py-2 text-left text-sm text-neutral-700 hover:bg-primary-50 hover:text-primary-700"
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      setProductId(item.id);
                      setQuery(productLabel(item));
                      setShowProducts(false);
                      setValidated(false);
                    }}
                  >
                    {productLabel(item) || item.name}
                  </button>
                ))}
              </div>
            )}
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-neutral-700">
            <span>Fecha de compra</span>
            <input
              className="h-10 rounded-md border border-neutral-200 px-3 text-sm outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
              required
              type="date"
              value={purchaseDate}
              onChange={(event) => { setPurchaseDate(event.target.value); setValidated(false); }}
            />
          </label>
          <Button disabled={!productId || isLoading} type="submit"><SearchCheck className="h-4 w-4" />Validar</Button>
        </form>
      </Card>

      {error && <Card className="border-danger/30 p-4 text-sm font-semibold text-danger">{error}</Card>}

      {validated && product && (
        <Card className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold text-neutral-900">{productLabel(product) || product.name}</h2>
              <p className="mt-1 text-sm text-neutral-500">Garantia configurada: {warrantyMonths || 0} meses</p>
            </div>
            <Badge tone={isValid ? 'success' : 'danger'}>{isValid ? 'Garantia valida' : 'Garantia expirada'}</Badge>
          </div>
          <p className="mt-4 text-sm text-neutral-600">
            {expiresAt
              ? `Fecha de vencimiento: ${formatDate(expiresAt)}. ${isValid ? 'El producto cumple condiciones de garantia para reemplazo.' : 'La cobertura ya vencio y no aplica reemplazo por garantia.'}`
              : 'Este producto no tiene tiempo de garantia configurado por administracion.'}
          </p>
        </Card>
      )}
    </div>
  );
};

export default ValidarGarantia;
