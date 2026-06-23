import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, CheckCircle2, FileUp, ShieldAlert, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import FormInput from '../../components/forms/FormInput.jsx';
import FormSelect from '../../components/forms/FormSelect.jsx';
import FormTextarea from '../../components/forms/FormTextarea.jsx';
import { priorityLabels } from './clientUtils.jsx';
import { useToast } from '../../hooks/useToast.js';
import { useAuth } from '../../hooks/useAuth.js';
import { createTicket } from '../../services/tickets.service.js';
import { listCategories } from '../../services/category.client.service.js';
import { validateWarrantyBySerial } from '../../services/warranties.client.service.js';
import { uploadTicketEvidence } from '../../services/evidence.client.service.js';
import { getErrorMessage } from '../../utils/errorHandler.js';

const ticketSchema = z.object({
  title: z.string().min(5, 'Describe el problema en el titulo'),
  categoryId: z.string().min(1, 'Selecciona una categoria'),
  subcategoryId: z.string().min(1, 'Selecciona una subcategoria'),
  productId: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], { message: 'Selecciona una prioridad estimada' }),
  description: z.string().min(30, 'La descripcion debe tener al menos 30 caracteres')
});

const NuevoTicket = () => {
  const [step, setStep] = useState(1);
  const [serial, setSerial] = useState('');
  const [warranty, setWarranty] = useState(null);
  const [categories, setCategories] = useState([]);
  const [evidenceFiles, setEvidenceFiles] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState('');
  const { showToast } = useToast();
  const { refreshUser, logout } = useAuth();
  const navigate = useNavigate();
  const form = useForm({
    resolver: zodResolver(ticketSchema),
    defaultValues: { title: '', categoryId: '', subcategoryId: '', productId: '', priority: '', description: '' }
  });
  const selectedCategoryId = useWatch({ control: form.control, name: 'categoryId' });
  const selectedSubcategoryId = useWatch({ control: form.control, name: 'subcategoryId' });
  const description = useWatch({ control: form.control, name: 'description' }) || '';
  const selectedCategory = categories.find((category) => category.id === selectedCategoryId);
  const selectedSubcategory = selectedCategory?.subcategories?.find((subcategory) => subcategory.id === selectedSubcategoryId);
  const productOptions = (selectedSubcategory?.products || []).map((product) => ({ value: product.id, label: product.name }));

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setCategoriesLoading(true);
      setCategoriesError('');

      try {
        const result = await listCategories({ active: true, limit: 100, sortBy: 'name', sortOrder: 'asc' });
        if (mounted) setCategories(Array.isArray(result) ? result : result?.items || result?.data || []);
      } catch (error) {
        if (!mounted) return;
        const message = getErrorMessage(error, 'No pudimos cargar las categorias.');
        setCategoriesError(message);
        showToast({ type: 'error', title: 'Categorias no disponibles', message });
      } finally {
        if (mounted) setCategoriesLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [showToast]);

  useEffect(() => {
    form.setValue('subcategoryId', '');
    form.setValue('productId', '');
  }, [form, selectedCategoryId]);

  useEffect(() => {
    form.setValue('productId', '');
  }, [form, selectedSubcategoryId]);

  const validateWarranty = async () => {
    if (!serial.trim()) {
      setWarranty({ status: 'NOT_APPLICABLE', isValid: false, message: 'Puedes continuar sin garantia asociada.' });
      return;
    }

    try {
      const result = await validateWarrantyBySerial(serial.trim());
      setWarranty({
        ...result,
        message: result.isValid ? 'Garantia validada correctamente.' : 'Producto sin garantia vigente. Puedes continuar sin asociarla.'
      });
    } catch (error) {
      setWarranty({ status: 'NOT_APPLICABLE', isValid: false, message: getErrorMessage(error, 'Serial no encontrado. Puedes continuar sin garantia asociada.') });
    }
  };

  const goConfirmation = form.handleSubmit(() => setStep(3));

  const buildTicketPayload = () => {
    const values = form.getValues();
    const payload = {
      title: values.title,
      description: values.description,
      priority: values.priority,
      categoryId: values.categoryId,
      subcategoryId: values.subcategoryId
    };

    if (values.productId || (warranty?.isValid && warranty.product?.id)) {
      payload.productId = values.productId || warranty.product.id;
    }

    return payload;
  };

  const submit = async () => {
    try {
      const session = await refreshUser();
      const currentUser = session?.user || session;
      if (currentUser?.role !== 'CLIENT') {
        await logout();
        showToast({
          type: 'error',
          title: 'Sesion incorrecta',
          message: 'Inicia sesion con un usuario cliente para crear tickets.'
        });
        navigate('/login', { replace: true });
        return;
      }

      const response = await createTicket(buildTicketPayload());
      const ticket = response?.ticket || response?.data?.ticket;
      let evidenceUploaded = false;
      if (ticket?.id && evidenceFiles.length > 0) {
        try {
          await uploadTicketEvidence(ticket.id, evidenceFiles);
          evidenceUploaded = true;
        } catch (evidenceError) {
          showToast({
            type: 'warning',
            title: 'Ticket creado sin evidencia',
            message: getErrorMessage(evidenceError, 'El ticket se guardo, pero no pudimos adjuntar los archivos.')
          });
        }
      }
      showToast({
        type: 'success',
        title: `Ticket ${ticket?.code || ''} registrado`.trim(),
        message: evidenceUploaded ? 'Registramos la solicitud y adjuntamos la evidencia.' : 'Registramos la solicitud y generamos las notificaciones.'
      });
      form.reset();
      setStep(1);
      setWarranty(null);
      setSerial('');
      setEvidenceFiles([]);
      navigate('/client/tickets');
    } catch (error) {
      showToast({ type: 'error', title: 'No se pudo crear el ticket', message: getErrorMessage(error) });
    }
  };

  const selectEvidence = (event) => {
    const nextFiles = Array.from(event.target.files || []);
    setEvidenceFiles((current) => [...current, ...nextFiles].slice(0, 10));
    event.target.value = '';
  };

  const removeEvidence = (index) => {
    setEvidenceFiles((current) => current.filter((_, fileIndex) => fileIndex !== index));
  };

  const values = form.getValues();
  const categoryName = categories.find((category) => category.id === values.categoryId)?.name;
  const subcategoryName = selectedCategory?.subcategories.find((subcategory) => subcategory.id === values.subcategoryId)?.name;
  const productName = selectedSubcategory?.products?.find((product) => product.id === values.productId)?.name || warranty?.product?.name || 'Sin producto asociado';

  return (
    <div className="mx-auto grid max-w-4xl gap-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Crear nuevo ticket</h1>
        <p className="mt-1 text-sm text-neutral-500">Registra la solicitud con garantia, detalle y seguimiento real.</p>
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs font-semibold text-neutral-500">
        {['Garantia', 'Datos', 'Confirmacion'].map((label, index) => (
          <div key={label} className={`rounded-full px-3 py-2 text-center ${step === index + 1 ? 'bg-primary-600 text-white' : 'bg-neutral-100'}`}>{index + 1}. {label}</div>
        ))}
      </div>

      {step === 1 && (
        <Card className="p-5">
          <h2 className="text-base font-semibold text-neutral-900">Validar garantia por serial</h2>
          <p className="mt-1 text-sm text-neutral-500">Este paso es opcional. Si el serial existe y tiene garantia vigente, se asociara al ticket.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
            <input className="h-10 rounded-md border border-neutral-200 px-3 text-sm outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-100" placeholder="Serial del producto" value={serial} onChange={(event) => setSerial(event.target.value)} />
            <Button onClick={validateWarranty}>Validar</Button>
          </div>
          {warranty && (
            <div className={`mt-4 rounded-lg border p-4 text-sm ${warranty.isValid ? 'border-green-100 bg-green-50 text-green-800' : 'border-neutral-200 bg-neutral-50 text-neutral-700'}`}>
              <div className="flex items-center gap-2 font-semibold"><ShieldAlert className="h-4 w-4" />{warranty.message}</div>
              {warranty.product?.name && <p className="mt-1">{warranty.product.name} · {warranty.product.serialNumber || warranty.product.serial}</p>}
            </div>
          )}
          <div className="mt-5 flex justify-end">
            <Button onClick={() => setStep(2)}>Continuar</Button>
          </div>
        </Card>
      )}

      {step === 2 && (
        <Card className="p-5">
          <form className="grid gap-4" onSubmit={(event) => { event.preventDefault(); goConfirmation(); }}>
            <FormInput register={form.register} name="title" label="Titulo" error={form.formState.errors.title} />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormSelect
                register={form.register}
                name="categoryId"
                label="Categoria"
                error={form.formState.errors.categoryId}
                disabled={categoriesLoading}
                placeholder={categoriesLoading ? 'Cargando categorias' : 'Seleccionar'}
                options={categories.map((category) => ({ value: category.id, label: category.name }))}
              />
              <FormSelect register={form.register} name="subcategoryId" label="Subcategoria" error={form.formState.errors.subcategoryId} options={(selectedCategory?.subcategories || []).map((subcategory) => ({ value: subcategory.id, label: subcategory.name }))} />
            </div>
            <FormSelect
              register={form.register}
              name="productId"
              label="Producto"
              placeholder={selectedSubcategory ? 'Seleccionar producto' : 'Selecciona una subcategoria primero'}
              disabled={!selectedSubcategory}
              options={productOptions}
            />
            {categoriesError && <p className="text-xs font-semibold text-danger">{categoriesError}</p>}
            <FormSelect register={form.register} name="priority" label="Prioridad estimada" error={form.formState.errors.priority} options={Object.entries(priorityLabels).map(([value, label]) => ({ value, label }))} />
            <div>
              <FormTextarea register={form.register} name="description" label="Descripcion detallada" error={form.formState.errors.description} rows={6} />
              <p className={`mt-1 text-xs ${description.length < 30 ? 'text-warning' : 'text-success'}`}>{description.length}/30 minimo</p>
            </div>
            <div className="grid gap-3 rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-neutral-900">Evidencia</p>
                  <p className="text-xs text-neutral-500">Puedes adjuntar hasta 10 archivos, maximo 50 MB cada uno.</p>
                </div>
                <label className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-700">
                  <FileUp className="h-4 w-4" />
                  Adjuntar
                  <input className="sr-only" type="file" multiple onChange={selectEvidence} />
                </label>
              </div>
              {evidenceFiles.length > 0 && (
                <div className="grid gap-2">
                  {evidenceFiles.map((file, index) => (
                    <div key={`${file.name}-${file.size}-${index}`} className="flex items-center justify-between gap-3 rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm">
                      <span className="truncate text-neutral-700">{file.name}</span>
                      <button className="rounded p-1 text-neutral-500 hover:bg-neutral-100 hover:text-danger" type="button" onClick={() => removeEvidence(index)} aria-label={`Quitar ${file.name}`}>
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex flex-wrap justify-between gap-3">
              <Button variant="ghost" onClick={() => setStep(1)}><ArrowLeft className="h-4 w-4" />Volver</Button>
              <Button type="submit">Revisar y confirmar</Button>
            </div>
          </form>
        </Card>
      )}

      {step === 3 && (
        <Card className="p-5">
          <div className="flex items-center gap-2 text-success"><CheckCircle2 className="h-5 w-5" /><h2 className="font-semibold">Confirma los datos antes de registrar</h2></div>
          <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
            <div><dt className="font-semibold text-neutral-900">Titulo</dt><dd className="text-neutral-600">{values.title}</dd></div>
            <div><dt className="font-semibold text-neutral-900">Categoria</dt><dd className="text-neutral-600">{categoryName} / {subcategoryName}</dd></div>
            <div><dt className="font-semibold text-neutral-900">Producto</dt><dd className="text-neutral-600">{productName}</dd></div>
            <div><dt className="font-semibold text-neutral-900">Prioridad</dt><dd className="text-neutral-600">{priorityLabels[values.priority]}</dd></div>
            <div><dt className="font-semibold text-neutral-900">Evidencia</dt><dd className="text-neutral-600">{evidenceFiles.length} archivo(s)</dd></div>
            <div className="sm:col-span-2"><dt className="font-semibold text-neutral-900">Descripcion</dt><dd className="text-neutral-600">{values.description}</dd></div>
          </dl>
          <div className="mt-6 flex flex-wrap justify-between gap-3">
            <Button variant="ghost" onClick={() => setStep(2)}>Cancelar</Button>
            <Button onClick={submit}>Confirmar y registrar</Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default NuevoTicket;
