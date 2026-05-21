import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarClock, Download, Image as ImageIcon, MessageSquare, Play, Star, UserRound } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useParams } from 'react-router-dom';
import { z } from 'zod';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import Modal from '../../components/common/Modal.jsx';
import Badge from '../../components/common/Badge.jsx';
import FormTextarea from '../../components/forms/FormTextarea.jsx';
import FormInput from '../../components/forms/FormInput.jsx';
import RatingStars from '../../components/tickets/RatingStars.jsx';
import { clientProducts, clientTicketDetail, clientTickets, unavailableDates } from './clientMockData.js';
import { ClientPriorityBadge, ClientStatusBadge, currentClientId, simulateClientAction, warrantyTone } from './clientUtils.jsx';
import { formatDate, formatDateTime } from '../../utils/formatDate.js';
import { useToast } from '../../hooks/useToast.js';
import { confirmTicketSolution, rejectTicketSolution, requestTicketReschedule } from '../../services/tickets.service.js';

const commentSchema = z.object({ body: z.string().min(5, 'Escribe un comentario mas claro') });
const rejectSchema = z.object({ reason: z.string().min(10, 'Explica por que no fue solucionado') });
const rescheduleSchema = z.object({
  date: z.string().min(1, 'Selecciona una fecha'),
  reason: z.string().min(10, 'Indica el motivo')
}).refine((value) => !unavailableDates.includes(value.date), {
  path: ['date'],
  message: 'Fecha no disponible. Selecciona otra.'
});

const Detail403 = () => (
  <Card className="mx-auto max-w-lg p-8 text-center">
    <h1 className="text-2xl font-bold text-neutral-900">403</h1>
    <p className="mt-2 text-sm text-neutral-600">No tienes acceso a este ticket.</p>
    <Link to="/client/tickets"><Button className="mt-5">Volver a mis tickets</Button></Link>
  </Card>
);

const DetalleTicket = () => {
  const { id } = useParams();
  const [tickets, setTickets] = useState(clientTickets);
  const ticket = tickets.find((item) => item.id === id || item.code === id);
  const [lightbox, setLightbox] = useState(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const { showToast } = useToast();
  const commentForm = useForm({ resolver: zodResolver(commentSchema), defaultValues: { body: '' } });
  const rejectForm = useForm({ resolver: zodResolver(rejectSchema), defaultValues: { reason: '' } });
  const rescheduleForm = useForm({ resolver: zodResolver(rescheduleSchema), defaultValues: { date: '', reason: '' } });

  const product = useMemo(() => clientProducts.find((item) => item.id === ticket?.productId), [ticket]);
  const commentsDisabled = ticket?.status === 'CLOSED' || ticket?.status === 'CANCELLED' || ticket?.status === 'RESOLVED';
  const canReschedule = ticket && ['OPEN', 'IN_PROGRESS', 'WAITING_CUSTOMER'].includes(ticket.status);

  if (!ticket || ticket.ownerId !== currentClientId) return <Detail403 />;

  const addComment = async () => {
    await simulateClientAction();
    commentForm.reset();
    showToast({ type: 'success', title: 'Comentario enviado' });
  };

  const confirmSolution = async () => {
    if (rating < 1) {
      showToast({ type: 'warning', title: 'Calificacion obligatoria', message: 'Selecciona de 1 a 5 estrellas antes de cerrar.' });
      return;
    }
    try {
      await confirmTicketSolution(ticket.id, { rating, comment: ratingComment });
    } catch {
      await simulateClientAction();
    }
    setTickets((current) => current.map((item) => item.id === ticket.id ? { ...item, status: 'CLOSED' } : item));
    showToast({ type: 'success', title: 'Solucion confirmada', message: 'El ticket fue cerrado correctamente.' });
  };

  const rejectSolution = async ({ reason }) => {
    try {
      await rejectTicketSolution(ticket.id, { reason });
    } catch {
      await simulateClientAction();
    }
    setTickets((current) => current.map((item) => item.id === ticket.id ? { ...item, status: 'REOPENED' } : item));
    setRejectOpen(false);
    showToast({ type: 'warning', title: 'Ticket reabierto', message: reason });
  };

  const requestReschedule = async ({ date }) => {
    try {
      await requestTicketReschedule(ticket.id, { date, reason: rescheduleForm.getValues('reason') });
    } catch {
      await simulateClientAction();
    }
    setRescheduleOpen(false);
    rescheduleForm.reset();
    showToast({ type: 'success', title: 'Reprogramacion solicitada', message: `Nueva fecha solicitada: ${formatDate(date)}` });
  };

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase text-neutral-500">{ticket.code}</p>
          <h1 className="mt-1 text-2xl font-bold text-neutral-900">{ticket.title}</h1>
          <div className="mt-3 flex flex-wrap gap-2">
            <ClientStatusBadge status={ticket.status} />
            <ClientPriorityBadge priority={ticket.priority} />
          </div>
        </div>
        {canReschedule && <Button variant="secondary" onClick={() => setRescheduleOpen(true)}><CalendarClock className="h-4 w-4" />Solicitar nueva fecha</Button>}
      </div>

      {ticket.status === 'RESOLVED' && (
        <Card className="border-primary-200 bg-primary-50 p-5">
          <h2 className="text-lg font-bold text-primary-700">Confirma si la solucion funciono</h2>
          <p className="mt-1 text-sm text-primary-700">El chat comun queda inhabilitado. Para cerrar debes calificar la atencion.</p>
          <div className="mt-4 grid gap-3">
            <RatingStars value={rating} onChange={setRating} />
            <textarea className="min-h-24 rounded-md border border-primary-100 bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-primary-100" placeholder="Comentario sobre la solucion" value={ratingComment} onChange={(event) => setRatingComment(event.target.value)} />
            <div className="flex flex-wrap gap-3">
              <Button onClick={confirmSolution}><Star className="h-4 w-4" />Confirmar solucion</Button>
              <Button variant="danger" onClick={() => setRejectOpen(true)}>No, no fue solucionado</Button>
            </div>
          </div>
        </Card>
      )}

      <div className="grid gap-6 xl:grid-cols-[.8fr_1.2fr]">
        <div className="grid gap-6">
          <Card className="p-5">
            <h2 className="text-sm font-semibold text-neutral-900">Tecnico asignado</h2>
            {ticket.technician ? (
              <div className="mt-4 flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-primary-50 font-bold text-primary-700">{ticket.technician.avatar}</span>
                <div>
                  <p className="font-semibold text-neutral-900">{ticket.technician.name}</p>
                  <p className="text-sm text-neutral-500">Tecnico de campo</p>
                </div>
              </div>
            ) : (
              <div className="mt-4 flex items-center gap-2 text-sm text-neutral-500"><UserRound className="h-5 w-5" />Sin asignar</div>
            )}
          </Card>

          {product && (
            <Card className="p-5">
              <h2 className="text-sm font-semibold text-neutral-900">Informacion del producto</h2>
              <p className="mt-3 font-semibold text-neutral-900">{product.name}</p>
              <p className="text-sm text-neutral-500">{product.serial}</p>
              <Badge className="mt-3" tone={warrantyTone[product.warrantyStatus]}>{product.warrantyStatus}</Badge>
            </Card>
          )}
        </div>

        <div className="grid gap-6">
          <Card className="p-5">
            <h2 className="text-sm font-semibold text-neutral-900">Descripcion</h2>
            <p className="mt-3 text-sm leading-6 text-neutral-600">{ticket.description}</p>
          </Card>

          <Card className="p-5">
            <h2 className="text-sm font-semibold text-neutral-900">Evidencias adjuntas</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {clientTicketDetail.evidences.map((item) => (
                <button key={item.id} className="rounded-lg border border-neutral-200 p-3 text-left hover:bg-neutral-50" onClick={() => item.type === 'image' ? setLightbox(item) : undefined}>
                  {item.type === 'image' && <><img className="h-28 w-full rounded-md object-cover" src={item.url} alt={item.name} /><p className="mt-2 text-sm font-semibold">{item.name}</p></>}
                  {item.type === 'video' && <><video className="h-28 w-full rounded-md object-cover" src={item.url} controls /><p className="mt-2 flex items-center gap-1 text-sm font-semibold"><Play className="h-4 w-4" />{item.name}</p></>}
                  {item.type === 'pdf' && <p className="flex min-h-28 items-center justify-center gap-2 text-sm font-semibold"><Download className="h-4 w-4" />{item.name}</p>}
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="text-sm font-semibold text-neutral-900">Timeline</h2>
            <ol className="mt-4 space-y-4">
              {clientTicketDetail.timeline.map((event) => (
                <li key={event.id} className="relative border-l border-neutral-200 pl-5">
                  <span className="absolute -left-2 top-0 grid h-4 w-4 place-items-center rounded-full bg-primary-600"><ImageIcon className="h-2.5 w-2.5 text-white" /></span>
                  <p className="text-sm font-semibold text-neutral-900">{event.title}</p>
                  <p className="mt-1 text-sm text-neutral-600">{event.comment}</p>
                  <p className="mt-1 text-xs text-neutral-500">{event.user} · {formatDateTime(event.createdAt)}</p>
                </li>
              ))}
            </ol>
          </Card>

          <Card className="p-5">
            <h2 className="text-sm font-semibold text-neutral-900">Comentarios</h2>
            <div className="mt-4 grid gap-3">
              {clientTicketDetail.comments.map((comment) => (
                <div key={comment.id} className={`max-w-[85%] rounded-lg p-3 ${comment.fromClient ? 'ml-auto bg-primary-600 text-white' : 'bg-neutral-100 text-neutral-800'}`}>
                  <p className="text-xs font-semibold opacity-80">{comment.author}</p>
                  <p className="mt-1 text-sm">{comment.body}</p>
                </div>
              ))}
            </div>
            {commentsDisabled ? (
              <p className="mt-4 rounded-lg bg-neutral-50 p-3 text-sm text-neutral-600">Reabrir o crear nuevo ticket.</p>
            ) : (
              <form className="mt-4 grid gap-3" onSubmit={commentForm.handleSubmit(addComment)}>
                <FormTextarea register={commentForm.register} name="body" label="Nuevo comentario" error={commentForm.formState.errors.body} />
                <Button type="submit" isLoading={commentForm.formState.isSubmitting}><MessageSquare className="h-4 w-4" />Enviar comentario</Button>
              </form>
            )}
          </Card>
        </div>
      </div>

      <Modal isOpen={Boolean(lightbox)} title={lightbox?.name} onClose={() => setLightbox(null)}>
        {lightbox && <img className="max-h-[70vh] w-full rounded-lg object-contain" src={lightbox.url} alt={lightbox.name} />}
      </Modal>

      <Modal isOpen={rejectOpen} title="Motivo de rechazo" onClose={() => setRejectOpen(false)}>
        <form className="grid gap-4" onSubmit={rejectForm.handleSubmit(rejectSolution)}>
          <FormTextarea register={rejectForm.register} name="reason" label="Motivo obligatorio" error={rejectForm.formState.errors.reason} />
          <Button variant="danger" type="submit" isLoading={rejectForm.formState.isSubmitting}>Reabrir ticket</Button>
        </form>
      </Modal>

      <Modal isOpen={rescheduleOpen} title="Solicitar reprogramacion" onClose={() => setRescheduleOpen(false)}>
        <form className="grid gap-4" onSubmit={rescheduleForm.handleSubmit(requestReschedule)}>
          <FormInput register={rescheduleForm.register} name="date" label="Fecha solicitada" type="date" error={rescheduleForm.formState.errors.date} />
          <FormTextarea register={rescheduleForm.register} name="reason" label="Motivo" error={rescheduleForm.formState.errors.reason} />
          <p className="text-xs text-neutral-500">Fechas no disponibles: {unavailableDates.join(', ')}</p>
          <Button type="submit" isLoading={rescheduleForm.formState.isSubmitting}>Confirmar solicitud</Button>
        </form>
      </Modal>
    </div>
  );
};

export default DetalleTicket;
