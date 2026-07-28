import { zodResolver } from '@hookform/resolvers/zod';
import { Gavel } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import FileDropzone from '../../components/forms/FileDropzone.jsx';
import FormTextarea from '../../components/forms/FormTextarea.jsx';
import Modal from '../../components/common/Modal.jsx';
import { uploadTicketEvidence } from '../../services/evidence.client.service.js';
import { appealTicket, getMyTickets } from '../../services/tickets.service.js';
import { formatDate } from '../../utils/formatDate.js';
import { getErrorMessage } from '../../utils/errorHandler.js';
import { useToast } from '../../hooks/useToast.js';

const schema = z.object({ reason: z.string().min(15, 'Explica mejor por que tienes razon') });
const isAppealable = (ticket) => (
  ['RESOLVED', 'CLOSED', 'CANCELLED'].includes(ticket.status)
  && (ticket.status === 'CANCELLED' || ticket.closeType === 'WITHOUT_SOLUTION')
  && !ticket.appealedAt
  && !(ticket.refunds || []).length
  && !(ticket.replacements || []).length
);

const Apelaciones = () => {
  const [tickets, setTickets] = useState([]);
  const [selected, setSelected] = useState(null);
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const { showToast } = useToast();
  const form = useForm({ resolver: zodResolver(schema), defaultValues: { reason: '' } });
  const rows = useMemo(() => tickets.filter(isAppealable), [tickets]);

  const load = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await getMyTickets({ limit: 100, sortBy: 'createdAt', sortOrder: 'desc' });
      setTickets(response.data || []);
    } catch (err) {
      setError(getErrorMessage(err, 'No pudimos cargar apelaciones.'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const open = (ticket) => {
    setSelected(ticket);
    setFiles([]);
    form.reset({ reason: '' });
  };

  const submit = async ({ reason }) => {
    try {
      await appealTicket(selected.id, { reason });
      if (files.length) {
        await uploadTicketEvidence(selected.id, files).catch((err) => {
          showToast({ type: 'warning', title: 'Apelacion abierta sin adjuntos', message: getErrorMessage(err) });
        });
      }
      setSelected(null);
      await load();
      showToast({ type: 'success', title: 'Apelacion abierta', message: 'El caso fue reabierto para revision.' });
    } catch (err) {
      showToast({ type: 'error', title: 'No se pudo apelar', message: getErrorMessage(err) });
    }
  };

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Apelaciones</h1>
        <p className="mt-1 text-sm text-neutral-500">Casos finalizados sin reembolso ni reemplazo.</p>
      </div>

      {error && <Card className="border-danger bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</Card>}
      {isLoading ? (
        <div className="h-40 animate-pulse rounded-lg bg-neutral-100" />
      ) : rows.length === 0 ? (
        <EmptyState title="Sin casos para apelar" description="Aqui apareceran tickets finalizados sin respuesta favorable y sin apelacion previa." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((ticket) => (
            <Card key={ticket.id} className="p-4">
              <p className="text-xs font-bold uppercase text-neutral-500">{ticket.code}</p>
              <h2 className="mt-1 font-semibold text-neutral-900">{ticket.title}</h2>
              <p className="mt-2 text-sm text-neutral-500">{formatDate(ticket.createdAt)}</p>
              <p className="mt-2 line-clamp-2 text-sm text-neutral-600">{ticket.closeJustification || ticket.description}</p>
              <Button className="mt-4" variant="danger" onClick={() => open(ticket)}><Gavel className="h-4 w-4" />Apelar</Button>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={Boolean(selected)} title="Abrir apelacion" onClose={() => setSelected(null)}>
        <form className="grid gap-4" onSubmit={form.handleSubmit(submit)}>
          <FormTextarea register={form.register} name="reason" label="Por que crees que tienes razon" error={form.formState.errors.reason} />
          <FileDropzone value={files} onChange={setFiles} />
          <Button variant="danger" type="submit" isLoading={form.formState.isSubmitting}>Enviar apelacion</Button>
        </form>
      </Modal>
    </div>
  );
};

export default Apelaciones;
