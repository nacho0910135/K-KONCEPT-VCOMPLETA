import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, MessageSquare, Phone, Save } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useParams } from 'react-router-dom';
import { z } from 'zod';
import Badge from '../../components/common/Badge.jsx';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import FormSelect from '../../components/forms/FormSelect.jsx';
import FormTextarea from '../../components/forms/FormTextarea.jsx';
import { addComment, getTicketById, getTicketHistory, saveTicketDiagnosis, updateTicketStatus } from '../../services/tickets.service.js';
import { useToast } from '../../hooks/useToast.js';
import { PriorityBadge, TechnicianStatusBadge, technicianStatusLabels } from './technicianUtils.jsx';
import { formatDate, formatDateTime } from '../../utils/formatDate.js';
import { getErrorMessage } from '../../utils/errorHandler.js';

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
const allowedTransitions = {
  OPEN: ['PENDING', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'CANCELLED'],
  PENDING: ['IN_PROGRESS', 'WAITING_CUSTOMER', 'RESOLVED', 'CANCELLED'],
  IN_PROGRESS: ['WAITING_CUSTOMER', 'RESOLVED', 'CANCELLED'],
  WAITING_CUSTOMER: ['IN_PROGRESS', 'RESOLVED', 'CANCELLED'],
  REOPENED: ['IN_PROGRESS', 'WAITING_CUSTOMER', 'RESOLVED', 'CANCELLED']
};

const DetalleTicket = () => {
  const { id } = useParams();
  const [ticket, setTicket] = useState(null);
  const [history, setHistory] = useState({ statuses: [], comments: [], evidence: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const { showToast } = useToast();
  const statusForm = useForm({ mode: 'onChange', resolver: zodResolver(statusSchema), defaultValues: { status: '', comment: '', closeType: '', diagnosis: '', solution: '', closeJustification: '' } });
  const diagnosisForm = useForm({ resolver: zodResolver(diagnosisSchema), defaultValues: { diagnosis: '' } });
  const commentForm = useForm({ resolver: zodResolver(commentSchema), defaultValues: { body: '' } });
  const watchedStatus = useWatch({ control: statusForm.control, name: 'status' });
  const watchedCloseType = useWatch({ control: statusForm.control, name: 'closeType' });

  const load = async () => {
    setIsLoading(true);
    setError('');
    try {
      const [ticketResponse, historyResponse] = await Promise.all([
        getTicketById(id),
        getTicketHistory(id).catch(() => ({ statuses: [], comments: [], evidence: [] }))
      ]);
      const nextTicket = ticketResponse.ticket || ticketResponse;
      setTicket(nextTicket);
      setHistory(historyResponse);
      diagnosisForm.reset({ diagnosis: nextTicket.diagnosis || '' });
    } catch (err) {
      setError(getErrorMessage(err, 'No pudimos cargar el ticket.'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const transitionOptions = useMemo(() => (allowedTransitions[ticket?.status] || [])
    .map((status) => ({ value: status, label: technicianStatusLabels[status] || status })), [ticket?.status]);

  const saveStatus = async (values) => {
    try {
      await updateTicketStatus(ticket.id, values);
      statusForm.reset();
      await load();
      showToast({ type: 'success', title: 'Estado actualizado', message: values.status === 'RESOLVED' ? 'El cliente debera confirmar y calificar para cerrar.' : undefined });
    } catch (err) {
      showToast({ type: 'error', title: 'No se pudo actualizar', message: getErrorMessage(err) });
    }
  };

  const saveDiagnosis = async ({ diagnosis }) => {
    try {
      await saveTicketDiagnosis(ticket.id, { diagnosis });
      await load();
      showToast({ type: 'success', title: 'Diagnostico guardado' });
    } catch (err) {
      showToast({ type: 'error', title: 'No se pudo guardar', message: getErrorMessage(err) });
    }
  };

  const publishComment = async ({ body }) => {
    try {
      await addComment(ticket.id, { body });
      commentForm.reset();
      await load();
      showToast({ type: 'success', title: 'Comentario publicado' });
    } catch (err) {
      showToast({ type: 'error', title: 'No se pudo comentar', message: getErrorMessage(err) });
    }
  };

  if (isLoading) return <div className="h-64 animate-pulse rounded-lg bg-neutral-100" />;
  if (error || !ticket) return <Card className="p-6 text-sm font-semibold text-danger">{error || 'Ticket no encontrado'}</Card>;

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
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[.95fr_1.05fr]">
        <div className="grid content-start gap-6">
          <Card className="p-5">
            <h2 className="text-sm font-semibold text-neutral-900">Informacion del caso</h2>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div><dt className="font-semibold">Codigo</dt><dd>{ticket.code}</dd></div>
              <div><dt className="font-semibold">Fecha</dt><dd>{formatDate(ticket.createdAt)}</dd></div>
              <div><dt className="font-semibold">Categoria</dt><dd>{ticket.category?.name || 'Sin categoria'}</dd></div>
              <div><dt className="font-semibold">Subcategoria</dt><dd>{ticket.subcategory?.name || 'Sin subcategoria'}</dd></div>
              <div className="sm:col-span-2"><dt className="font-semibold">Descripcion</dt><dd className="mt-1 text-neutral-600">{ticket.description}</dd></div>
            </dl>
          </Card>

          <Card className="p-5">
            <h2 className="text-sm font-semibold text-neutral-900">Informacion del cliente</h2>
            <div className="mt-4 grid gap-2 text-sm text-neutral-700">
              <p className="font-semibold text-neutral-900">{ticket.client?.name}</p>
              <p>{ticket.client?.company}</p>
              <div className="flex flex-wrap gap-2">
                {ticket.client?.phone && <a className="inline-flex items-center gap-1 rounded-md bg-neutral-100 px-3 py-2 font-semibold hover:bg-neutral-200" href={`tel:${ticket.client.phone}`}><Phone className="h-4 w-4" />{ticket.client.phone}</a>}
                {ticket.client?.email && <a className="inline-flex items-center gap-1 rounded-md bg-neutral-100 px-3 py-2 font-semibold hover:bg-neutral-200" href={`mailto:${ticket.client.email}`}><Mail className="h-4 w-4" />Correo</a>}
              </div>
            </div>
          </Card>

          {ticket.product && (
            <Card className="p-5">
              <h2 className="text-sm font-semibold text-neutral-900">Producto</h2>
              <p className="mt-3 font-semibold text-neutral-900">{ticket.product.brand || ticket.product.name} {ticket.product.model}</p>
              <p className="text-sm text-neutral-500">{ticket.product.serialNumber || ticket.product.serial}</p>
              <Badge className="mt-3" tone="neutral">{ticket.warrantyStatusAtCreation || 'Sin garantia asociada'}</Badge>
            </Card>
          )}
        </div>

        <div className="grid content-start gap-6">
          <Card className="p-5">
            <h2 className="text-sm font-semibold text-neutral-900">Actualizar estado</h2>
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
                      { value: 'WITHOUT_SOLUTION', label: 'Sin solucion' }
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
            </form>
          </Card>

          <Card className="p-5">
            <h2 className="text-sm font-semibold text-neutral-900">Diagnostico</h2>
            <form className="mt-4 grid gap-3" onSubmit={diagnosisForm.handleSubmit(saveDiagnosis)}>
              <FormTextarea register={diagnosisForm.register} name="diagnosis" label="Diagnostico actual" error={diagnosisForm.formState.errors.diagnosis} rows={5} />
              <Button type="submit" isLoading={diagnosisForm.formState.isSubmitting}><Save className="h-4 w-4" />Guardar diagnostico</Button>
            </form>
          </Card>

          <Card className="p-5">
            <h2 className="text-sm font-semibold text-neutral-900">Comentarios</h2>
            <div className="mt-4 grid gap-3">
              {history.comments?.length === 0 && <p className="text-sm text-neutral-500">Aun no hay comentarios registrados.</p>}
              {history.comments?.map((comment) => (
                <div key={comment.id} className="rounded-lg border border-neutral-200 p-3">
                  <p className="text-sm font-semibold text-neutral-900">{comment.user?.name || 'Usuario'}</p>
                  <p className="mt-2 text-sm text-neutral-600">{comment.body}</p>
                  <p className="mt-1 text-xs text-neutral-500">{formatDateTime(comment.createdAt)}</p>
                </div>
              ))}
            </div>
            <form className="mt-4 grid gap-3" onSubmit={commentForm.handleSubmit(publishComment)}>
              <FormTextarea register={commentForm.register} name="body" label="Nuevo comentario" error={commentForm.formState.errors.body} />
              <Button type="submit" isLoading={commentForm.formState.isSubmitting}><MessageSquare className="h-4 w-4" />Publicar</Button>
            </form>
          </Card>

          <Card className="p-5">
            <h2 className="text-sm font-semibold text-neutral-900">Historial</h2>
            <ol className="mt-4 space-y-4">
              {(history.statuses || []).map((event) => (
                <li key={event.id} className="relative border-l border-neutral-200 pl-4">
                  <span className="absolute -left-1.5 top-1 h-3 w-3 rounded-full bg-primary-600" />
                  <p className="text-sm font-semibold text-neutral-900">{event.previousStatus || 'Nuevo'} {'->'} {event.newStatus}</p>
                  <p className="text-sm text-neutral-600">{event.comment}</p>
                  <p className="text-xs text-neutral-500">{event.changedBy?.name ? `${event.changedBy.name} · ` : ''}{formatDateTime(event.createdAt)}</p>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DetalleTicket;
