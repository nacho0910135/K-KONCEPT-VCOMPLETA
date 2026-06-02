import { zodResolver } from '@hookform/resolvers/zod';
import { Image as ImageIcon, MessageSquare, Star, UserRound } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useParams } from 'react-router-dom';
import { z } from 'zod';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import Modal from '../../components/common/Modal.jsx';
import Badge from '../../components/common/Badge.jsx';
import FormTextarea from '../../components/forms/FormTextarea.jsx';
import RatingStars from '../../components/tickets/RatingStars.jsx';
import { ClientPriorityBadge, ClientStatusBadge, warrantyTone } from './clientUtils.jsx';
import { formatDateTime } from '../../utils/formatDate.js';
import { useToast } from '../../hooks/useToast.js';
import { addComment as addTicketComment, confirmTicketSolution, getTicketById, rejectTicketSolution } from '../../services/tickets.service.js';
import { getErrorMessage } from '../../utils/errorHandler.js';

const commentSchema = z.object({ body: z.string().min(5, 'Escribe un comentario mas claro') });
const rejectSchema = z.object({ reason: z.string().min(10, 'Explica por que no fue solucionado') });
const getEvidenceUrl = (item) => item.fileUrl || item.url;
const getEvidenceName = (item) => item.fileName || item.name || 'Evidencia';

const DetailError = ({ message }) => (
  <Card className="mx-auto max-w-lg p-8 text-center">
    <h1 className="text-2xl font-bold text-neutral-900">Ticket no disponible</h1>
    <p className="mt-2 text-sm text-neutral-600">{message || 'No pudimos cargar este ticket.'}</p>
    <Link to="/client/tickets"><Button className="mt-5">Volver a mis tickets</Button></Link>
  </Card>
);

const DetalleTicket = () => {
  const { id } = useParams();
  const [ticket, setTicket] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [lightbox, setLightbox] = useState(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const { showToast } = useToast();
  const commentForm = useForm({ resolver: zodResolver(commentSchema), defaultValues: { body: '' } });
  const rejectForm = useForm({ resolver: zodResolver(rejectSchema), defaultValues: { reason: '' } });

  const loadTicket = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await getTicketById(id);
      setTicket(response.ticket || response);
    } catch (err) {
      setError(getErrorMessage(err, 'No pudimos cargar el ticket.'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTicket();
  }, [id]);

  const product = useMemo(() => ticket?.product || null, [ticket]);
  const technician = ticket?.assignedTechnician || null;
  const evidences = ticket?.evidences || ticket?.evidence || [];
  const statusEvents = ticket?.statusHistories || [];
  const comments = ticket?.comments || [];
  const commentsDisabled = ['CLOSED', 'CANCELLED', 'RESOLVED'].includes(ticket?.status);

  const addComment = async ({ body }) => {
    try {
      await addTicketComment(ticket.id, { body });
      commentForm.reset();
      await loadTicket();
      showToast({ type: 'success', title: 'Comentario enviado' });
    } catch (err) {
      showToast({ type: 'error', title: 'No se pudo comentar', message: getErrorMessage(err) });
    }
  };

  const confirmSolution = async () => {
    if (rating < 1) {
      showToast({ type: 'warning', title: 'Calificacion obligatoria', message: 'Selecciona de 1 a 5 estrellas antes de cerrar.' });
      return;
    }

    try {
      await confirmTicketSolution(ticket.id, { rating, ratingComment });
      await loadTicket();
      showToast({ type: 'success', title: 'Solucion confirmada', message: 'El ticket fue cerrado correctamente.' });
    } catch (err) {
      showToast({ type: 'error', title: 'No se pudo cerrar', message: getErrorMessage(err) });
    }
  };

  const rejectSolution = async ({ reason }) => {
    try {
      await rejectTicketSolution(ticket.id, { reason });
      setRejectOpen(false);
      await loadTicket();
      showToast({ type: 'warning', title: 'Ticket reabierto', message: reason });
    } catch (err) {
      showToast({ type: 'error', title: 'No se pudo reabrir', message: getErrorMessage(err) });
    }
  };

  if (isLoading) return <div className="h-64 animate-pulse rounded-lg bg-neutral-100" />;
  if (error || !ticket) return <DetailError message={error} />;

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
      </div>

      {ticket.status === 'RESOLVED' && (
        <Card className="border-primary-200 bg-primary-50 p-5">
          <h2 className="text-lg font-bold text-primary-700">Confirma si la solucion funciono</h2>
          <p className="mt-1 text-sm text-primary-700">Para cerrar debes calificar la atencion.</p>
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
            {technician ? (
              <div className="mt-4 flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-primary-50 font-bold text-primary-700">{technician.name?.slice(0, 2).toUpperCase()}</span>
                <div>
                  <p className="font-semibold text-neutral-900">{technician.name}</p>
                  <p className="text-sm text-neutral-500">{technician.email}</p>
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
              <p className="text-sm text-neutral-500">{product.serialNumber || product.serial}</p>
              <Badge className="mt-3" tone={warrantyTone[product.warrantyStatus] || 'neutral'}>{product.warrantyStatus}</Badge>
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
            {evidences.length === 0 ? (
              <p className="mt-3 text-sm text-neutral-500">No hay evidencias adjuntas registradas.</p>
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {evidences.map((item) => (
                  <button key={item.id} className="rounded-lg border border-neutral-200 p-3 text-left hover:bg-neutral-50" onClick={() => getEvidenceUrl(item) ? setLightbox(item) : undefined}>
                    <p className="flex min-h-28 items-center justify-center gap-2 text-sm font-semibold">{getEvidenceName(item)}</p>
                  </button>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-5">
            <h2 className="text-sm font-semibold text-neutral-900">Timeline</h2>
            <ol className="mt-4 space-y-4">
              {(statusEvents.length ? statusEvents : [{ id: ticket.id, newStatus: ticket.status, comment: 'Solicitud registrada por el cliente.', createdAt: ticket.createdAt }]).map((event) => (
                <li key={event.id} className="relative border-l border-neutral-200 pl-5">
                  <span className="absolute -left-2 top-0 grid h-4 w-4 place-items-center rounded-full bg-primary-600"><ImageIcon className="h-2.5 w-2.5 text-white" /></span>
                  <p className="text-sm font-semibold text-neutral-900">{event.newStatus || 'Actualizacion'}</p>
                  <p className="mt-1 text-sm text-neutral-600">{event.comment}</p>
                  <p className="mt-1 text-xs text-neutral-500">{event.changedBy?.name ? `${event.changedBy.name} · ` : ''}{formatDateTime(event.createdAt)}</p>
                </li>
              ))}
            </ol>
          </Card>

          <Card className="p-5">
            <h2 className="text-sm font-semibold text-neutral-900">Comentarios</h2>
            <div className="mt-4 grid gap-3">
              {comments.length === 0 && <p className="text-sm text-neutral-500">Aun no hay comentarios registrados.</p>}
              {comments.map((comment) => (
                <div key={comment.id} className={`max-w-[85%] rounded-lg p-3 ${comment.user?.role === 'CLIENT' ? 'ml-auto bg-primary-600 text-white' : 'bg-neutral-100 text-neutral-800'}`}>
                  <p className="text-xs font-semibold opacity-80">{comment.user?.name || 'Usuario'}</p>
                  <p className="mt-1 text-sm">{comment.body}</p>
                </div>
              ))}
            </div>
            {commentsDisabled ? (
              <p className="mt-4 rounded-lg bg-neutral-50 p-3 text-sm text-neutral-600">Este ticket no admite nuevos comentarios en su estado actual.</p>
            ) : (
              <form className="mt-4 grid gap-3" onSubmit={commentForm.handleSubmit(addComment)}>
                <FormTextarea register={commentForm.register} name="body" label="Nuevo comentario" error={commentForm.formState.errors.body} />
                <Button type="submit" isLoading={commentForm.formState.isSubmitting}><MessageSquare className="h-4 w-4" />Enviar comentario</Button>
              </form>
            )}
          </Card>
        </div>
      </div>

      <Modal isOpen={Boolean(lightbox)} title={lightbox ? getEvidenceName(lightbox) : 'Evidencia'} onClose={() => setLightbox(null)}>
        {lightbox && getEvidenceUrl(lightbox) && <img className="max-h-[70vh] w-full rounded-lg object-contain" src={getEvidenceUrl(lightbox)} alt={getEvidenceName(lightbox)} />}
      </Modal>

      <Modal isOpen={rejectOpen} title="Motivo de rechazo" onClose={() => setRejectOpen(false)}>
        <form className="grid gap-4" onSubmit={rejectForm.handleSubmit(rejectSolution)}>
          <FormTextarea register={rejectForm.register} name="reason" label="Motivo obligatorio" error={rejectForm.formState.errors.reason} />
          <Button variant="danger" type="submit" isLoading={rejectForm.formState.isSubmitting}>Reabrir ticket</Button>
        </form>
      </Modal>
    </div>
  );
};

export default DetalleTicket;
