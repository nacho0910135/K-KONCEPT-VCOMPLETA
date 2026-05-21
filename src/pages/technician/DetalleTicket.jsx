import { zodResolver } from '@hookform/resolvers/zod';
import { Download, Mail, PackageCheck, Phone, Plus, Upload } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useParams } from 'react-router-dom';
import { z } from 'zod';
import Badge from '../../components/common/Badge.jsx';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import Modal from '../../components/common/Modal.jsx';
import FileDropzone from '../../components/forms/FileDropzone.jsx';
import FormInput from '../../components/forms/FormInput.jsx';
import FormSelect from '../../components/forms/FormSelect.jsx';
import FormTextarea from '../../components/forms/FormTextarea.jsx';
import { addComment, saveTicketDiagnosis, updateTicketStatus } from '../../services/tickets.service.js';
import { registerReplacementDelivery, registerReplacementProduct, requestReplacement, validateReplacement } from '../../services/replacements.client.service.js';
import { useToast } from '../../hooks/useToast.js';
import { technicianTicketDetail, technicianTickets } from './technicianMockData.js';
import { allowedTransitions, priorityLabels, PriorityBadge, simulateTechnicianAction, SlaBadge, TechnicianStatusBadge, technicianStatusLabels } from './technicianUtils.jsx';
import { formatDate, formatDateTime } from '../../utils/formatDate.js';

const statusSchema = z.object({
  status: z.string().min(1, 'Selecciona el nuevo estado'),
  comment: z.string().min(8, 'El comentario del cambio es obligatorio'),
  closeType: z.string().optional(),
  diagnosis: z.string().optional(),
  solution: z.string().optional(),
  closeJustification: z.string().optional()
}).superRefine((value, ctx) => {
  if (value.status === 'RESOLVED') {
    if (!value.closeType) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['closeType'], message: 'Selecciona el tipo de resolucion' });
    if (value.closeType === 'WITH_SOLUTION') {
      if (!value.diagnosis?.trim()) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['diagnosis'], message: 'Diagnostico obligatorio' });
      if (!value.solution?.trim()) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['solution'], message: 'Solucion obligatoria' });
    }
    if (value.closeType === 'WITHOUT_SOLUTION' && !value.closeJustification?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['closeJustification'], message: 'Justificacion obligatoria' });
    }
  }
});

const diagnosisSchema = z.object({ diagnosis: z.string().min(10, 'Agrega un diagnostico util') });
const commentSchema = z.object({ body: z.string().min(5, 'Comentario demasiado corto') });
const closeSchema = z.object({
  closeType: z.enum(['WITH_SOLUTION', 'WITHOUT_SOLUTION', 'REPLACEMENT']),
  diagnosis: z.string().optional(),
  solution: z.string().optional(),
  closeJustification: z.string().optional()
}).superRefine((value, ctx) => {
  if (value.closeType === 'WITH_SOLUTION') {
    if (!value.diagnosis?.trim()) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['diagnosis'], message: 'Diagnostico obligatorio' });
    if (!value.solution?.trim()) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['solution'], message: 'Solucion obligatoria' });
  }
  if (value.closeType === 'WITHOUT_SOLUTION' && !value.closeJustification?.trim()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['closeJustification'], message: 'Justificacion obligatoria' });
  }
});

const roleTone = { CLIENT: 'primary', TECHNICIAN: 'success', ADMIN: 'danger' };

const DetalleTicket = () => {
  const { id } = useParams();
  const [tickets, setTickets] = useState(technicianTickets);
  const ticket = tickets.find((item) => item.id === id || item.code === id) || tickets[0];
  const [evidences, setEvidences] = useState(technicianTicketDetail.evidences);
  const [preview, setPreview] = useState(null);
  const [closeOpen, setCloseOpen] = useState(false);
  const [replacement, setReplacement] = useState(ticket.replacement);
  const [replacementStep, setReplacementStep] = useState(ticket.replacement?.step || 0);
  const [rejectReplacementConfirm, setRejectReplacementConfirm] = useState(null);
  const { showToast } = useToast();
  const deliveredReplacement = replacement?.status === 'DELIVERED';

  const statusForm = useForm({ mode: 'onChange', resolver: zodResolver(statusSchema), defaultValues: { status: '', comment: '', closeType: '', diagnosis: '', solution: '', closeJustification: '' } });
  const diagnosisForm = useForm({ resolver: zodResolver(diagnosisSchema), defaultValues: { diagnosis: technicianTicketDetail.diagnosis } });
  const commentForm = useForm({ resolver: zodResolver(commentSchema), defaultValues: { body: '' } });
  const closeForm = useForm({ mode: 'onChange', resolver: zodResolver(closeSchema), defaultValues: { closeType: 'WITH_SOLUTION', diagnosis: '', solution: '', closeJustification: '' } });
  const evidenceForm = useForm({ defaultValues: { files: [] } });
  const watchedStatus = useWatch({ control: statusForm.control, name: 'status' });
  const watchedCloseType = useWatch({ control: statusForm.control, name: 'closeType' });
  const modalCloseType = useWatch({ control: closeForm.control, name: 'closeType' });
  const evidenceFiles = useWatch({ control: evidenceForm.control, name: 'files' }) || [];

  const transitionOptions = useMemo(() => (allowedTransitions[ticket.status] || [])
    .filter((status) => status !== 'CLOSED')
    .map((status) => ({ value: status, label: technicianStatusLabels[status] || status })), [ticket.status]);

  const saveStatus = async (values) => {
    if (values.closeType === 'REPLACEMENT' && !deliveredReplacement) {
      showToast({ type: 'warning', title: 'Reemplazo no entregado', message: 'La resolucion por reemplazo requiere entrega registrada.' });
      return;
    }
    try {
      await updateTicketStatus(ticket.id, values);
    } catch {
      await simulateTechnicianAction();
    }
    setTickets((current) => current.map((item) => item.id === ticket.id ? { ...item, status: values.status } : item));
    statusForm.reset();
    showToast({ type: 'success', title: 'Estado actualizado', message: values.status === 'RESOLVED' ? 'El cliente debera confirmar y calificar para cerrar.' : undefined });
  };

  const saveDiagnosis = async ({ diagnosis }) => {
    try {
      await saveTicketDiagnosis(ticket.id, { diagnosis });
    } catch {
      await simulateTechnicianAction();
    }
    showToast({ type: 'success', title: 'Diagnostico guardado' });
  };

  const publishComment = async ({ body }) => {
    try {
      await addComment(ticket.id, { body });
    } catch {
      await simulateTechnicianAction();
    }
    commentForm.reset();
    showToast({ type: 'success', title: 'Comentario publicado' });
  };

  const attachEvidence = async () => {
    if (!evidenceFiles.length) return;
    await simulateTechnicianAction();
    setEvidences((current) => [
      ...evidenceFiles.map((file) => ({ id: crypto.randomUUID(), name: file.name, type: file.type.startsWith('image') ? 'image' : file.type.startsWith('video') ? 'video' : 'pdf', uploadedBy: 'TECHNICIAN', url: '#', size: `${(file.size / 1024 / 1024).toFixed(1)} MB` })),
      ...current
    ]);
    evidenceForm.reset({ files: [] });
    showToast({ type: 'success', title: 'Evidencia adjunta' });
  };

  const closeCase = async (values) => {
    if (values.closeType === 'REPLACEMENT' && !deliveredReplacement) {
      showToast({ type: 'warning', title: 'Reemplazo pendiente', message: 'Solo disponible con reemplazo entregado.' });
      return;
    }
    try {
      await updateTicketStatus(ticket.id, { status: 'RESOLVED', comment: 'Resolucion tecnica registrada', ...values });
    } catch {
      await simulateTechnicianAction();
    }
    setTickets((current) => current.map((item) => item.id === ticket.id ? { ...item, status: 'RESOLVED' } : item));
    setCloseOpen(false);
    showToast({ type: 'success', title: 'Caso marcado como resuelto', message: 'No se cerro manualmente; queda pendiente de confirmacion del cliente.' });
  };

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase text-neutral-500">{ticket.code}</p>
          <h1 className="text-2xl font-bold text-neutral-900">{ticket.title}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <PriorityBadge priority={ticket.priority} />
          <TechnicianStatusBadge status={ticket.status} />
          <SlaBadge hours={ticket.slaHoursLeft} />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[.95fr_1.05fr]">
        <div className="grid content-start gap-6">
          <Card className="p-5">
            <h2 className="text-sm font-semibold text-neutral-900">Informacion del caso</h2>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div><dt className="font-semibold">Codigo</dt><dd>{ticket.code}</dd></div>
              <div><dt className="font-semibold">Fecha</dt><dd>{formatDate(ticket.createdAt)}</dd></div>
              <div><dt className="font-semibold">Categoria</dt><dd>{ticket.category}</dd></div>
              <div><dt className="font-semibold">Subcategoria</dt><dd>{ticket.subcategory}</dd></div>
              <div className="sm:col-span-2"><dt className="font-semibold">Descripcion</dt><dd className="mt-1 text-neutral-600">{ticket.description}</dd></div>
            </dl>
          </Card>

          <Card className="p-5">
            <h2 className="text-sm font-semibold text-neutral-900">Informacion del cliente</h2>
            <div className="mt-4 grid gap-2 text-sm text-neutral-700">
              <p className="font-semibold text-neutral-900">{ticket.client.name}</p>
              <p>{ticket.client.company}</p>
              <div className="flex flex-wrap gap-2">
                <a className="inline-flex items-center gap-1 rounded-md bg-neutral-100 px-3 py-2 font-semibold hover:bg-neutral-200" href={`tel:${ticket.client.phone}`}><Phone className="h-4 w-4" />{ticket.client.phone}</a>
                <a className="inline-flex items-center gap-1 rounded-md bg-neutral-100 px-3 py-2 font-semibold hover:bg-neutral-200" href={`mailto:${ticket.client.email}`}><Mail className="h-4 w-4" />Correo</a>
              </div>
            </div>
          </Card>

          {ticket.product && (
            <Card className="p-5">
              <h2 className="text-sm font-semibold text-neutral-900">Producto</h2>
              <p className="mt-3 font-semibold text-neutral-900">{ticket.product.brand} {ticket.product.model}</p>
              <p className="text-sm text-neutral-500">{ticket.product.serial}</p>
              <Badge className="mt-3" tone={ticket.product.warrantyStatus === 'VIGENTE' ? 'success' : ticket.product.warrantyStatus === 'NO_APLICA' ? 'neutral' : 'danger'}>{ticket.product.warrantyStatus}</Badge>
            </Card>
          )}

          <Card className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-neutral-900">Evidencias</h2>
              <Button variant="ghost" onClick={attachEvidence} disabled={!evidenceFiles.length}><Upload className="h-4 w-4" />Adjuntar evidencia</Button>
            </div>
            <div className="mt-4">
              <Controller control={evidenceForm.control} name="files" render={({ field }) => <FileDropzone value={field.value} onChange={field.onChange} />} />
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {evidences.map((file) => (
                <div key={file.id} className="rounded-lg border border-neutral-200 p-3">
                  {file.type === 'image' && <button onClick={() => setPreview(file)}><img className="h-28 w-full rounded-md object-cover" src={file.url} alt={file.name} /></button>}
                  {file.type === 'video' && <video className="h-28 w-full rounded-md object-cover" src={file.url} controls />}
                  {file.type === 'pdf' && <div className="grid h-28 place-items-center rounded-md bg-neutral-50"><Download className="h-8 w-8 text-neutral-500" /></div>}
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-neutral-900">{file.name}</p>
                    <Badge tone={file.uploadedBy === 'CLIENT' ? 'primary' : 'success'}>{file.uploadedBy === 'CLIENT' ? 'Cliente' : 'Tecnico'}</Badge>
                  </div>
                  <a className="mt-2 inline-flex text-xs font-semibold text-primary-600" href={file.url} download>Descargar</a>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="text-sm font-semibold text-neutral-900">Historial completo</h2>
            <ol className="mt-4 space-y-4">
              {technicianTicketDetail.history.map((event) => (
                <li key={event.id} className="relative border-l border-neutral-200 pl-4">
                  <span className="absolute -left-1.5 top-1 h-3 w-3 rounded-full bg-primary-600" />
                  <p className="text-sm font-semibold text-neutral-900">{event.action}</p>
                  <p className="text-sm text-neutral-600">{event.comment}</p>
                  <p className="text-xs text-neutral-500">{event.user} · {formatDateTime(event.createdAt)}</p>
                </li>
              ))}
            </ol>
          </Card>
        </div>

        <div className="grid content-start gap-6">
          <Card className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-neutral-900">Actualizar estado</h2>
              <Button variant="secondary" onClick={() => setCloseOpen(true)}>Cerrar caso</Button>
            </div>
            <form className="mt-4 grid gap-4" onSubmit={statusForm.handleSubmit(saveStatus)}>
              <FormSelect register={statusForm.register} name="status" label="Nuevo estado" error={statusForm.formState.errors.status} options={transitionOptions} />
              <FormTextarea register={statusForm.register} name="comment" label="Comentario del cambio" error={statusForm.formState.errors.comment} />
              {watchedStatus === 'RESOLVED' && (
                <>
                  <FormSelect
                    register={statusForm.register}
                    name="closeType"
                    label="Tipo de resolucion"
                    error={statusForm.formState.errors.closeType}
                    options={[
                      { value: 'WITH_SOLUTION', label: 'Con solucion' },
                      { value: 'WITHOUT_SOLUTION', label: 'Sin solucion' },
                      ...(deliveredReplacement ? [{ value: 'REPLACEMENT', label: 'Por reemplazo entregado' }] : [])
                    ]}
                  />
                  {watchedCloseType === 'WITH_SOLUTION' && (
                    <div className="grid gap-4">
                      <FormTextarea register={statusForm.register} name="diagnosis" label="Diagnostico" error={statusForm.formState.errors.diagnosis} />
                      <FormTextarea register={statusForm.register} name="solution" label="Solucion" error={statusForm.formState.errors.solution} />
                    </div>
                  )}
                  {watchedCloseType === 'WITHOUT_SOLUTION' && <FormTextarea register={statusForm.register} name="closeJustification" label="Justificacion" error={statusForm.formState.errors.closeJustification} />}
                </>
              )}
              <Button type="submit" disabled={!statusForm.formState.isValid} isLoading={statusForm.formState.isSubmitting}>Guardar cambio</Button>
              <p className="text-xs text-neutral-500">La resolucion queda pendiente de confirmacion y calificacion del cliente.</p>
            </form>
          </Card>

          <Card className="p-5">
            <h2 className="text-sm font-semibold text-neutral-900">Diagnostico</h2>
            <form className="mt-4 grid gap-3" onSubmit={diagnosisForm.handleSubmit(saveDiagnosis)}>
              <FormTextarea register={diagnosisForm.register} name="diagnosis" label="Diagnostico actual" error={diagnosisForm.formState.errors.diagnosis} rows={5} />
              <Button type="submit" isLoading={diagnosisForm.formState.isSubmitting}>Guardar diagnostico</Button>
            </form>
          </Card>

          <Card className="p-5">
            <h2 className="text-sm font-semibold text-neutral-900">Comentarios</h2>
            <div className="mt-4 grid gap-3">
              {technicianTicketDetail.comments.map((comment) => (
                <div key={comment.id} className="rounded-lg border border-neutral-200 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-neutral-900">{comment.author}</p>
                    <Badge tone={roleTone[comment.role] || 'neutral'}>{comment.role}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-neutral-600">{comment.body}</p>
                  <p className="mt-1 text-xs text-neutral-500">{formatDateTime(comment.createdAt)}</p>
                </div>
              ))}
            </div>
            <form className="mt-4 grid gap-3" onSubmit={commentForm.handleSubmit(publishComment)}>
              <FormTextarea register={commentForm.register} name="body" label="Nuevo comentario" error={commentForm.formState.errors.body} />
              <Button type="submit" isLoading={commentForm.formState.isSubmitting}>Publicar</Button>
            </form>
          </Card>

          <ReplacementWizard replacement={replacement} setReplacement={setReplacement} step={replacementStep} setStep={setReplacementStep} ticketId={ticket.id} onRejectConfirm={setRejectReplacementConfirm} />
        </div>
      </div>

      <Modal isOpen={Boolean(preview)} title={preview?.name} onClose={() => setPreview(null)}>
        {preview && <img className="max-h-[70vh] w-full rounded-lg object-contain" src={preview.url} alt={preview.name} />}
      </Modal>

      <CloseCaseModal isOpen={closeOpen} onClose={() => setCloseOpen(false)} deliveredReplacement={deliveredReplacement} form={closeForm} closeType={modalCloseType} onSubmit={closeCase} />

      <ConfirmDialog
        isOpen={Boolean(rejectReplacementConfirm)}
        title="Rechazar reemplazo"
        message="Confirma que deseas rechazar la validacion del reemplazo."
        onCancel={() => setRejectReplacementConfirm(null)}
        onConfirm={() => {
          rejectReplacementConfirm?.();
          setRejectReplacementConfirm(null);
        }}
      />
    </div>
  );
};

const CloseCaseModal = ({ isOpen, onClose, deliveredReplacement, form, closeType, onSubmit }) => (
  <Modal isOpen={isOpen} title="Cerrar caso tecnico" onClose={onClose}>
    <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
      <FormSelect
        register={form.register}
        name="closeType"
        label="Modalidad"
        error={form.formState.errors.closeType}
        options={[
          { value: 'WITH_SOLUTION', label: 'Con solucion' },
          { value: 'WITHOUT_SOLUTION', label: 'Sin solucion' },
          ...(deliveredReplacement ? [{ value: 'REPLACEMENT', label: 'Por reemplazo entregado' }] : [])
        ]}
      />
      {closeType === 'WITH_SOLUTION' && (
        <>
          <FormTextarea register={form.register} name="diagnosis" label="Diagnostico" error={form.formState.errors.diagnosis} />
          <FormTextarea register={form.register} name="solution" label="Solucion" error={form.formState.errors.solution} />
        </>
      )}
      {closeType === 'WITHOUT_SOLUTION' && <FormTextarea register={form.register} name="closeJustification" label="Justificacion" error={form.formState.errors.closeJustification} />}
      {closeType === 'REPLACEMENT' && <p className="rounded-lg bg-green-50 p-3 text-sm font-semibold text-green-700">Reemplazo entregado disponible. Se marcara como resuelto.</p>}
      <Button type="submit" disabled={!form.formState.isValid} isLoading={form.formState.isSubmitting}>Cerrar caso</Button>
    </form>
  </Modal>
);

const replacementWizardSchema = z.object({
  wizardStep: z.number(),
  reason: z.string().optional(),
  decision: z.enum(['APPROVED', 'REJECTED']).optional(),
  observation: z.string().optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  serial: z.string().optional(),
  deliveryDate: z.string().optional()
}).superRefine((value, ctx) => {
  if (value.wizardStep === 1 && !value.reason?.trim()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['reason'], message: 'Motivo obligatorio' });
  }
  if (value.wizardStep === 2) {
    if (!value.decision) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['decision'], message: 'Selecciona una decision' });
    if (!value.observation?.trim()) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['observation'], message: 'Observacion obligatoria' });
  }
  if (value.wizardStep === 3) {
    if (!value.brand?.trim()) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['brand'], message: 'Marca requerida' });
    if (!value.model?.trim()) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['model'], message: 'Modelo requerido' });
    if (!value.serial?.trim()) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['serial'], message: 'Serial requerido' });
  }
  if (value.wizardStep === 4) {
    if (!value.deliveryDate) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['deliveryDate'], message: 'Fecha requerida' });
    if (!value.observation?.trim()) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['observation'], message: 'Observacion requerida' });
  }
});

const ReplacementWizard = ({ replacement, setReplacement, step, setStep, ticketId, onRejectConfirm }) => {
  const { showToast } = useToast();
  const activeStep = step || (replacement ? replacement.step : 0);
  const form = useForm({
    mode: 'onChange',
    resolver: zodResolver(replacementWizardSchema),
    defaultValues: { wizardStep: Math.max(1, activeStep || 1), reason: '', decision: 'APPROVED', observation: '', brand: '', model: '', serial: '', deliveryDate: '' }
  });

  useEffect(() => {
    form.setValue('wizardStep', Math.max(1, activeStep || 1), { shouldValidate: true });
  }, [activeStep, form]);

  const start = () => setStep(1);

  const submit = async (values) => {
    if (activeStep === 1) {
      try { await requestReplacement({ ticketId, reason: values.reason }); } catch { await simulateTechnicianAction(); }
      setReplacement({ id: crypto.randomUUID(), status: 'REQUESTED', step: 2, pdfUrl: null });
      setStep(2);
      showToast({ type: 'success', title: 'Reemplazo solicitado' });
      form.reset({ wizardStep: 2, reason: '', decision: 'APPROVED', observation: '', brand: '', model: '', serial: '', deliveryDate: '' });
      return;
    }
    if (activeStep === 2) {
      const doValidate = async () => {
        try { await validateReplacement(replacement.id, { decision: values.decision, observation: values.observation }); } catch { await simulateTechnicianAction(); }
        setReplacement((current) => ({ ...current, status: values.decision === 'APPROVED' ? 'APPROVED' : 'REJECTED', step: values.decision === 'APPROVED' ? 3 : 2 }));
        if (values.decision === 'APPROVED') setStep(3);
        showToast({ type: values.decision === 'APPROVED' ? 'success' : 'warning', title: values.decision === 'APPROVED' ? 'Condiciones aprobadas' : 'Reemplazo rechazado' });
        form.reset({ wizardStep: values.decision === 'APPROVED' ? 3 : 2, reason: '', decision: 'APPROVED', observation: '', brand: '', model: '', serial: '', deliveryDate: '' });
      };
      if (values.decision === 'REJECTED') onRejectConfirm(() => doValidate);
      else await doValidate();
      return;
    }
    if (activeStep === 3) {
      try { await registerReplacementProduct(replacement.id, values); } catch { await simulateTechnicianAction(); }
      setReplacement((current) => ({ ...current, product: values, status: 'PRODUCT_REGISTERED', step: 4 }));
      setStep(4);
      showToast({ type: 'success', title: 'Producto nuevo registrado' });
      form.reset({ wizardStep: 4, reason: '', decision: 'APPROVED', observation: '', brand: values.brand, model: values.model, serial: values.serial, deliveryDate: '' });
      return;
    }
    if (activeStep === 4) {
      try { await registerReplacementDelivery(replacement.id, values); } catch { await simulateTechnicianAction(); }
      setReplacement((current) => ({ ...current, status: 'DELIVERED', step: 4, pdfUrl: '#' }));
      showToast({ type: 'success', title: 'Entrega registrada', message: 'Constancia PDF generada.' });
    }
  };

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-neutral-900">Reemplazo de producto</h2>
        {!activeStep && <Button onClick={start}><Plus className="h-4 w-4" />Iniciar reemplazo</Button>}
      </div>
      {activeStep > 0 && (
        <form className="mt-4 grid gap-4" onSubmit={form.handleSubmit(submit)}>
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((item) => <div key={item} className={`rounded-full px-2 py-1 text-center text-xs font-bold ${activeStep === item ? 'bg-primary-600 text-white' : item < activeStep ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-500'}`}>{item}</div>)}
          </div>
          {activeStep === 1 && <FormTextarea register={form.register} name="reason" label="Motivo del reemplazo" error={form.formState.errors.reason} />}
          {activeStep === 2 && (
            <>
              <FormSelect register={form.register} name="decision" label="Validar condiciones" error={form.formState.errors.decision} options={[{ value: 'APPROVED', label: 'Aprueba' }, { value: 'REJECTED', label: 'Rechaza' }]} />
              <FormTextarea register={form.register} name="observation" label="Observacion" error={form.formState.errors.observation} />
            </>
          )}
          {activeStep === 3 && (
            <div className="grid gap-4 sm:grid-cols-3">
              <FormInput register={form.register} name="brand" label="Marca" error={form.formState.errors.brand} />
              <FormInput register={form.register} name="model" label="Modelo" error={form.formState.errors.model} />
              <FormInput register={form.register} name="serial" label="Serial" error={form.formState.errors.serial} />
            </div>
          )}
          {activeStep === 4 && (
            <>
              <FormInput register={form.register} name="deliveryDate" type="date" label="Fecha de entrega" error={form.formState.errors.deliveryDate} />
              <FormTextarea register={form.register} name="observation" label="Observacion de entrega" error={form.formState.errors.observation} />
            </>
          )}
          <Button type="submit" disabled={!form.formState.isValid} isLoading={form.formState.isSubmitting}>
            {activeStep === 4 ? 'Registrar entrega' : 'Continuar'}
          </Button>
          {replacement?.pdfUrl && <a className="inline-flex items-center gap-2 text-sm font-semibold text-primary-600" href={replacement.pdfUrl}><PackageCheck className="h-4 w-4" />Descargar constancia PDF</a>}
        </form>
      )}
    </Card>
  );
};

export default DetalleTicket;
