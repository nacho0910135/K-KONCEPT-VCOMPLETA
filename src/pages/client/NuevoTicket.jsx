import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { useMemo, useState } from 'react';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import Badge from '../../components/common/Badge.jsx';
import FormInput from '../../components/forms/FormInput.jsx';
import FormSelect from '../../components/forms/FormSelect.jsx';
import FormTextarea from '../../components/forms/FormTextarea.jsx';
import FileDropzone from '../../components/forms/FileDropzone.jsx';
import { clientCategories, clientProducts } from './clientMockData.js';
import { priorityLabels, simulateClientAction, warrantyTone } from './clientUtils.jsx';
import { useToast } from '../../hooks/useToast.js';
import { createTicket } from '../../services/tickets.service.js';

const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'application/pdf'];
const maxFileSize = 20 * 1024 * 1024;

const ticketSchema = z.object({
  title: z.string().min(5, 'Describe el problema en el titulo'),
  categoryId: z.string().min(1, 'Selecciona una categoria'),
  subcategoryId: z.string().min(1, 'Selecciona una subcategoria'),
  productId: z.string().optional(),
  priority: z.string().min(1, 'Selecciona una prioridad estimada'),
  description: z.string().min(30, 'La descripcion debe tener al menos 30 caracteres'),
  files: z.array(z.any()).superRefine((files, ctx) => {
    files.forEach((file, index) => {
      if (!allowedTypes.includes(file.type)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: [index], message: `${file.name}: tipo no permitido` });
      }
      if (file.size > maxFileSize) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: [index], message: `${file.name}: supera 20 MB` });
      }
    });
  })
});

const NuevoTicket = () => {
  const [step, setStep] = useState(1);
  const [serial, setSerial] = useState('');
  const [warranty, setWarranty] = useState(null);
  const { showToast } = useToast();
  const form = useForm({
    resolver: zodResolver(ticketSchema),
    defaultValues: { title: '', categoryId: '', subcategoryId: '', productId: '', priority: '', description: '', files: [] }
  });
  const selectedCategoryId = useWatch({ control: form.control, name: 'categoryId' });
  const description = useWatch({ control: form.control, name: 'description' }) || '';
  const files = useWatch({ control: form.control, name: 'files' }) || [];
  const selectedCategory = clientCategories.find((category) => category.id === selectedCategoryId);

  const validateWarranty = async () => {
    await simulateClientAction();
    const product = clientProducts.find((item) => item.serial.toLowerCase() === serial.trim().toLowerCase());
    if (!product) {
      setWarranty({ status: 'NO_APLICA', message: 'Serial no encontrado. Puedes continuar sin garantia asociada.' });
      return;
    }
    setWarranty(product.warrantyStatus === 'EXPIRADA'
      ? { ...product, message: 'Producto fuera de garantia. El envio queda bloqueado para este flujo.' }
      : { ...product, message: 'Garantia validada correctamente.' });
    if (product.warrantyStatus !== 'EXPIRADA') {
      form.setValue('productId', product.id);
    }
  };

  const goConfirmation = form.handleSubmit(() => {
    if (warranty?.warrantyStatus === 'EXPIRADA') return;
    setStep(3);
  });

  const submit = async () => {
    const code = `KK-${Math.floor(1100 + Math.random() * 800)}`;
    try {
      await createTicket({ ...form.getValues(), warrantySerial: serial || null });
    } catch {
      await simulateClientAction();
    }
    showToast({ type: 'success', title: `Ticket ${code} registrado`, message: 'Enviamos un correo de confirmacion al email registrado.' });
    form.reset();
    setStep(1);
    setWarranty(null);
    setSerial('');
  };

  const values = form.getValues();
  const categoryName = clientCategories.find((category) => category.id === values.categoryId)?.name;
  const subcategoryName = selectedCategory?.subcategories.find((subcategory) => subcategory.id === values.subcategoryId)?.name;
  const productName = clientProducts.find((product) => product.id === values.productId)?.name || 'Sin producto asociado';

  return (
    <div className="mx-auto grid max-w-4xl gap-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Crear nuevo ticket</h1>
        <p className="mt-1 text-sm text-neutral-500">Registra la solicitud con garantia, detalle y evidencias.</p>
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs font-semibold text-neutral-500">
        {['Garantia', 'Datos', 'Confirmacion'].map((label, index) => (
          <div key={label} className={`rounded-full px-3 py-2 text-center ${step === index + 1 ? 'bg-primary-600 text-white' : 'bg-neutral-100'}`}>{index + 1}. {label}</div>
        ))}
      </div>

      {step === 1 && (
        <Card className="p-5">
          <h2 className="text-base font-semibold text-neutral-900">Validar garantia por serial</h2>
          <p className="mt-1 text-sm text-neutral-500">Este paso es opcional, pero si el producto esta fuera de garantia el envio queda bloqueado.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
            <input className="h-10 rounded-md border border-neutral-200 px-3 text-sm outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-100" placeholder="Serial del producto" value={serial} onChange={(event) => setSerial(event.target.value)} />
            <Button onClick={validateWarranty}>Validar</Button>
          </div>
          {warranty && (
            <div className={`mt-4 rounded-lg border p-4 text-sm ${warranty.warrantyStatus === 'EXPIRADA' ? 'border-red-100 bg-red-50 text-red-800' : 'border-green-100 bg-green-50 text-green-800'}`}>
              <div className="flex items-center gap-2 font-semibold"><ShieldAlert className="h-4 w-4" />{warranty.message}</div>
              {warranty.name && <p className="mt-1">{warranty.name} · {warranty.serial}</p>}
            </div>
          )}
          <div className="mt-5 flex justify-end">
            <Button disabled={warranty?.warrantyStatus === 'EXPIRADA'} onClick={() => setStep(2)}>Continuar</Button>
          </div>
        </Card>
      )}

      {step === 2 && (
        <Card className="p-5">
          {warranty?.warrantyStatus === 'EXPIRADA' && <div className="mb-4 rounded-lg border border-red-100 bg-red-50 p-3 text-sm font-semibold text-red-800">Producto fuera de garantia: no se puede enviar este ticket.</div>}
          <form className="grid gap-4" onSubmit={(event) => { event.preventDefault(); goConfirmation(); }}>
            <FormInput register={form.register} name="title" label="Titulo" error={form.formState.errors.title} />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormSelect register={form.register} name="categoryId" label="Categoria" error={form.formState.errors.categoryId} options={clientCategories.map((category) => ({ value: category.id, label: category.name }))} />
              <FormSelect register={form.register} name="subcategoryId" label="Subcategoria" error={form.formState.errors.subcategoryId} options={(selectedCategory?.subcategories || []).map((subcategory) => ({ value: subcategory.id, label: subcategory.name }))} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormSelect register={form.register} name="productId" label="Producto opcional" options={clientProducts.map((product) => ({ value: product.id, label: `${product.name} (${product.serial})` }))} />
              <FormSelect register={form.register} name="priority" label="Prioridad estimada" error={form.formState.errors.priority} options={Object.entries(priorityLabels).map(([value, label]) => ({ value, label }))} />
            </div>
            <div>
              <FormTextarea register={form.register} name="description" label="Descripcion detallada" error={form.formState.errors.description} rows={6} />
              <p className={`mt-1 text-xs ${description.length < 30 ? 'text-warning' : 'text-success'}`}>{description.length}/30 minimo</p>
            </div>
            <Controller control={form.control} name="files" render={({ field, fieldState }) => <FileDropzone value={field.value} onChange={field.onChange} error={fieldState.error?.message} />} />
            <div className="flex flex-wrap justify-between gap-3">
              <Button variant="ghost" onClick={() => setStep(1)}><ArrowLeft className="h-4 w-4" />Volver</Button>
              <Button type="submit" disabled={warranty?.warrantyStatus === 'EXPIRADA'}>Revisar y confirmar</Button>
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
            <div className="sm:col-span-2"><dt className="font-semibold text-neutral-900">Descripcion</dt><dd className="text-neutral-600">{values.description}</dd></div>
            <div className="sm:col-span-2"><dt className="font-semibold text-neutral-900">Evidencias</dt><dd className="mt-1 flex flex-wrap gap-2">{files.length ? files.map((file) => <Badge key={file.name}>{file.name}</Badge>) : 'Sin archivos'}</dd></div>
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
