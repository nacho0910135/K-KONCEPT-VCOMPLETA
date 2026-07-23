import { zodResolver } from '@hookform/resolvers/zod';
import { ClipboardCheck, FileText, PackageCheck, Truck } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import Badge from '../../components/common/Badge.jsx';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import Modal from '../../components/common/Modal.jsx';
import FormInput from '../../components/forms/FormInput.jsx';
import FormTextarea from '../../components/forms/FormTextarea.jsx';
import { useToast } from '../../hooks/useToast.js';
import {
  downloadReplacementCertificate,
  exportReplacements,
  listReplacements,
  registerReplacementDelivery,
  registerReplacementProduct,
  validateReplacement
} from '../../services/replacements.client.service.js';
import { getErrorMessage } from '../../utils/errorHandler.js';
import { formatDateTime } from '../../utils/formatDate.js';

const statusLabel = {
  APPROVED: 'Aprobado',
  DELIVERED: 'Entregado',
  REJECTED: 'Rechazado',
  IN_TRANSIT: 'En transito',
  PENDING_APPROVAL: 'Pendiente de validacion'
};
const deliveryTypeLabel = {
  STORE_PICKUP: 'Retiro en tienda',
  HOME_DELIVERY: 'Entrega a domicilio',
  COURIER: 'Mensajeria'
};

const validationSchema = z.object({ validationNotes: z.string().min(8, 'Indica la condicion validada') });
const productSchema = z.object({
  replacementSerialNumber: z.string().min(1, 'Serie obligatoria'),
  replacementBrand: z.string().min(1, 'Marca obligatoria'),
  replacementModel: z.string().min(1, 'Modelo obligatorio'),
  replacementNotes: z.string().optional()
});
const deliverySchema = z.object({
  deliveryDate: z.string().min(1, 'Fecha obligatoria'),
  deliveryType: z.string().min(1, 'Tipo de entrega obligatorio'),
  deliveryObservations: z.string().min(8, 'Observacion obligatoria')
});

const Reemplazos = () => {
  const [replacements, setReplacements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [active, setActive] = useState(null);
  const [action, setAction] = useState(null);
  const [filters, setFilters] = useState({ q: '', status: '' });
  const { showToast } = useToast();
  const validationForm = useForm({ resolver: zodResolver(validationSchema), defaultValues: { validationNotes: '' } });
  const productForm = useForm({ resolver: zodResolver(productSchema), defaultValues: { replacementSerialNumber: '', replacementBrand: '', replacementModel: '', replacementNotes: '' } });
  const deliveryForm = useForm({ resolver: zodResolver(deliverySchema), defaultValues: { deliveryDate: new Date().toISOString().slice(0, 10), deliveryType: 'STORE_PICKUP', deliveryObservations: '' } });
  const filteredReplacements = useMemo(() => replacements.filter((replacement) => {
    const q = filters.q.trim().toLowerCase();
    const text = [replacement.ticket?.code, replacement.requestedProduct, replacement.ticket?.client?.name, replacement.ticket?.client?.company].filter(Boolean).join(' ').toLowerCase();
    return (!q || text.includes(q)) && (!filters.status || replacement.status === filters.status);
  }), [replacements, filters]);

  const loadReplacements = async () => {
    try {
      setIsLoading(true);
      const response = await listReplacements();
      setReplacements(response.replacements || []);
      setError(null);
    } catch (loadError) {
      setError(loadError.response?.data?.message || 'No pudimos cargar reemplazos.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReplacements();
  }, []);

  const openAction = (replacement, nextAction) => {
    setActive(replacement);
    setAction(nextAction);
    validationForm.reset({ validationNotes: replacement.validationNotes || '' });
    productForm.reset({
      replacementSerialNumber: replacement.replacementSerialNumber || '',
      replacementBrand: replacement.replacementBrand || '',
      replacementModel: replacement.replacementModel || '',
      replacementNotes: replacement.replacementNotes || ''
    });
    deliveryForm.reset({ deliveryDate: new Date().toISOString().slice(0, 10), deliveryType: replacement.deliveryType || 'STORE_PICKUP', deliveryObservations: replacement.deliveryObservations || '' });
  };

  const closeAction = () => {
    setActive(null);
    setAction(null);
  };

  const submitValidation = async (approved, values) => {
    try {
      await validateReplacement(active.id, { approved, validationNotes: values.validationNotes });
      closeAction();
      await loadReplacements();
      showToast({ type: 'success', title: approved ? 'Reemplazo aprobado' : 'Reemplazo rechazado' });
    } catch (err) {
      showToast({ type: 'error', title: 'No se pudo validar', message: getErrorMessage(err) });
    }
  };

  const submitProduct = async (values) => {
    try {
      await registerReplacementProduct(active.id, values);
      closeAction();
      await loadReplacements();
      showToast({ type: 'success', title: 'Producto nuevo registrado' });
    } catch (err) {
      showToast({ type: 'error', title: 'No se pudo registrar', message: getErrorMessage(err) });
    }
  };

  const submitDelivery = async (values) => {
    try {
      const now = new Date();
      const [year, month, day] = values.deliveryDate.split('-').map(Number);
      await registerReplacementDelivery(active.id, {
        ...values,
        deliveryDate: new Date(year, month - 1, day, now.getHours(), now.getMinutes(), now.getSeconds()).toISOString()
      });
      closeAction();
      await loadReplacements();
      showToast({ type: 'success', title: 'Entrega registrada', message: 'La constancia fue generada.' });
    } catch (err) {
      showToast({ type: 'error', title: 'No se pudo registrar entrega', message: getErrorMessage(err) });
    }
  };

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Reemplazos</h1>
          <p className="mt-1 text-sm text-neutral-500">Validacion, trazabilidad, entrega y constancias.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" onClick={() => exportReplacements('csv')}>Exportar CSV</Button>
          <Button onClick={() => exportReplacements('xls')}>Exportar Excel</Button>
        </div>
      </div>
      <Card className="grid gap-3 p-4 md:grid-cols-2">
        <input
          className="h-10 rounded-md border border-neutral-200 px-3 text-sm outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
          placeholder="Buscar por ticket, producto o cliente"
          value={filters.q}
          onChange={(event) => setFilters({ ...filters, q: event.target.value })}
        />
        <select className="rounded-md border border-neutral-200 px-3 py-2 text-sm" value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
          <option value="">Todos los estados</option>
          {Object.entries(statusLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        {isLoading && Array.from({ length: 4 }, (_, index) => <div key={index} className="h-44 animate-pulse rounded-lg bg-neutral-100" />)}
        {error && <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-danger md:col-span-2">{error}</div>}
        {!isLoading && !error && filteredReplacements.length === 0 && (
          <div className="md:col-span-2">
            <EmptyState title="Sin reemplazos" description="Cuando un ticket requiera reemplazo aparecera aqui." />
          </div>
        )}
        {filteredReplacements.map((replacement) => (
          <Card key={replacement.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase text-neutral-500">{replacement.ticket?.code}</p>
                <Link to={`/technician/tickets/${replacement.ticketId}`} className="mt-1 block font-semibold text-neutral-900 hover:text-primary-700">{replacement.requestedProduct}</Link>
                <p className="mt-1 text-sm text-neutral-500">{replacement.ticket?.client?.company || replacement.ticket?.client?.name || 'Cliente'}</p>
                <p className="mt-1 text-sm text-neutral-500">Tecnico: {replacement.requestedBy?.name || replacement.ticket?.assignedTechnician?.name || 'No indicado'}</p>
              </div>
              <Badge tone={['APPROVED', 'DELIVERED'].includes(replacement.status) ? 'success' : replacement.status === 'REJECTED' ? 'danger' : 'warning'}>{statusLabel[replacement.status] || replacement.status}</Badge>
            </div>
            <dl className="mt-4 grid gap-2 text-sm text-neutral-600">
              <div><dt className="font-semibold text-neutral-900">Razon</dt><dd>{replacement.reason}</dd></div>
              {replacement.validationNotes && <div><dt className="font-semibold text-neutral-900">Condiciones validadas</dt><dd>{replacement.validationNotes}</dd></div>}
              {replacement.replacementSerialNumber && <div><dt className="font-semibold text-neutral-900">Producto nuevo</dt><dd>{replacement.replacementBrand} {replacement.replacementModel} - {replacement.replacementSerialNumber}</dd></div>}
              {replacement.deliveryDate && <div><dt className="font-semibold text-neutral-900">Entrega</dt><dd>{formatDateTime(replacement.deliveryDate)}{replacement.deliveryType ? ` - ${deliveryTypeLabel[replacement.deliveryType] || replacement.deliveryType}` : ''}</dd></div>}
            </dl>
            <div className="mt-4 flex flex-wrap gap-2">
              {replacement.status === 'PENDING_APPROVAL' && <Button variant="secondary" onClick={() => openAction(replacement, 'validate')}><ClipboardCheck className="h-4 w-4" />Validar</Button>}
              {replacement.status === 'APPROVED' && !replacement.deliveryDate && <Button variant="ghost" onClick={() => openAction(replacement, 'product')}><PackageCheck className="h-4 w-4" />Producto nuevo</Button>}
              {replacement.status === 'APPROVED' && replacement.replacementSerialNumber && !replacement.deliveryDate && <Button onClick={() => openAction(replacement, 'delivery')}><Truck className="h-4 w-4" />Registrar entrega</Button>}
              {replacement.status === 'DELIVERED' && <Button variant="ghost" onClick={() => downloadReplacementCertificate(replacement.id)}><FileText className="h-4 w-4" />Constancia</Button>}
            </div>
          </Card>
        ))}
      </div>

      <Modal isOpen={action === 'validate'} title="Validar condiciones de reemplazo" onClose={closeAction}>
        <form className="grid gap-4" onSubmit={validationForm.handleSubmit((values) => submitValidation(true, values))}>
          <FormTextarea register={validationForm.register} name="validationNotes" label="Condiciones y politica aplicada" error={validationForm.formState.errors.validationNotes} />
          <div className="flex justify-end gap-2">
            <Button variant="danger" onClick={validationForm.handleSubmit((values) => submitValidation(false, values))}>Rechazar</Button>
            <Button type="submit" isLoading={validationForm.formState.isSubmitting}>Aprobar</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={action === 'product'} title="Registrar producto nuevo" onClose={closeAction}>
        <form className="grid gap-4" onSubmit={productForm.handleSubmit(submitProduct)}>
          <FormInput register={productForm.register} name="replacementSerialNumber" label="Numero de serie" error={productForm.formState.errors.replacementSerialNumber} />
          <FormInput register={productForm.register} name="replacementBrand" label="Marca" error={productForm.formState.errors.replacementBrand} />
          <FormInput register={productForm.register} name="replacementModel" label="Modelo" error={productForm.formState.errors.replacementModel} />
          <FormTextarea register={productForm.register} name="replacementNotes" label="Notas" error={productForm.formState.errors.replacementNotes} />
          <Button type="submit" isLoading={productForm.formState.isSubmitting}>Guardar producto</Button>
        </form>
      </Modal>

      <Modal isOpen={action === 'delivery'} title="Registrar entrega al cliente" onClose={closeAction}>
        <form className="grid gap-4" onSubmit={deliveryForm.handleSubmit(submitDelivery)}>
          <FormInput register={deliveryForm.register} name="deliveryDate" label="Fecha de entrega" type="date" error={deliveryForm.formState.errors.deliveryDate} />
          <label className="grid gap-1.5 text-sm font-medium text-neutral-700" htmlFor="deliveryType">
            <span>Tipo de entrega</span>
            <select id="deliveryType" className="min-h-10 rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100" {...deliveryForm.register('deliveryType')}>
              {Object.entries(deliveryTypeLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            {deliveryForm.formState.errors.deliveryType && <span className="text-xs font-medium text-danger">{deliveryForm.formState.errors.deliveryType.message}</span>}
          </label>
          <FormTextarea register={deliveryForm.register} name="deliveryObservations" label="Constancia de entrega" error={deliveryForm.formState.errors.deliveryObservations} />
          <Button type="submit" isLoading={deliveryForm.formState.isSubmitting}>Registrar entrega</Button>
        </form>
      </Modal>
    </div>
  );
};

export default Reemplazos;
