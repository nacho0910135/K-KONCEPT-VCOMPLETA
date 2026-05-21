import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, MessageSquare, RotateCcw, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import Drawer from '../../components/common/Drawer.jsx';
import Modal from '../../components/common/Modal.jsx';
import Badge from '../../components/common/Badge.jsx';
import DataTable from '../../components/tables/DataTable.jsx';
import TicketTimeline from '../../components/tickets/TicketTimeline.jsx';
import FormSelect from '../../components/forms/FormSelect.jsx';
import FormTextarea from '../../components/forms/FormTextarea.jsx';
import { useToast } from '../../hooks/useToast.js';
import { useAdminResource } from '../../hooks/useAdminResource.js';
import { categories, priorities, statuses, technicians, ticketDetail, tickets } from './adminMockData.js';
import { optionize, PriorityBadge, simulateAction, StateBadge } from './adminUtils.jsx';
import { formatDate, formatDateTime } from '../../utils/formatDate.js';

const assignSchema = z.object({ technicianId: z.string().min(1, 'Selecciona un tecnico activo') });
const prioritySchema = z.object({ priority: z.string().min(1, 'Selecciona una prioridad') });
const commentSchema = z.object({ body: z.string().min(5, 'Escribe al menos 5 caracteres') });

const Tickets = () => {
  const { data, setData, isLoading, error } = useAdminResource(() => tickets, []);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [assignTicket, setAssignTicket] = useState(null);
  const [priorityTicket, setPriorityTicket] = useState(null);
  const [filters, setFilters] = useState({ status: '', priority: '', technician: '', category: '', date: '' });
  const { showToast } = useToast();

  const assignForm = useForm({ resolver: zodResolver(assignSchema), defaultValues: { technicianId: '' } });
  const priorityForm = useForm({ resolver: zodResolver(prioritySchema), defaultValues: { priority: '' } });
  const commentForm = useForm({ resolver: zodResolver(commentSchema), defaultValues: { body: '' } });

  const filteredTickets = (data || []).filter((ticket) => (
    (!filters.status || ticket.status === filters.status)
    && (!filters.priority || ticket.priority === filters.priority)
    && (!filters.technician || ticket.technicianId === filters.technician)
    && (!filters.category || ticket.category === filters.category)
    && (!filters.date || ticket.createdAt === filters.date)
  ));

  const assignTechnician = async ({ technicianId }) => {
    await simulateAction();
    const technician = technicians.find((item) => item.id === technicianId);
    setData((current) => current.map((ticket) => ticket.id === assignTicket.id ? { ...ticket, technicianId, technician: technician.name } : ticket));
    setAssignTicket(null);
    assignForm.reset();
    showToast({ type: 'success', title: 'Tecnico asignado', message: `Ticket ${assignTicket.code} actualizado.` });
  };

  const changePriority = async ({ priority }) => {
    await simulateAction();
    setData((current) => current.map((ticket) => ticket.id === priorityTicket.id ? { ...ticket, priority } : ticket));
    setPriorityTicket(null);
    priorityForm.reset();
    showToast({ type: 'success', title: 'Prioridad actualizada', message: `Ticket ${priorityTicket.code} ahora es ${priority}.` });
  };

  const addComment = async ({ body }) => {
    await simulateAction();
    commentForm.reset();
    showToast({ type: 'success', title: 'Respuesta agregada', message: body });
  };

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Supervision de tickets</h1>
          <p className="mt-1 text-sm text-neutral-500">Asignacion, prioridad, seguimiento, evidencias e historial.</p>
        </div>
      </div>

      <Card className="p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-neutral-900">
          <SlidersHorizontal className="h-4 w-4" /> Filtros
        </div>
        <div className="grid gap-3 md:grid-cols-5">
          <select className="rounded-md border border-neutral-200 px-3 py-2 text-sm" value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
            <option value="">Estado</option>
            {optionize(statuses).map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
          <select className="rounded-md border border-neutral-200 px-3 py-2 text-sm" value={filters.priority} onChange={(event) => setFilters({ ...filters, priority: event.target.value })}>
            <option value="">Prioridad</option>
            {optionize(priorities).map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
          <select className="rounded-md border border-neutral-200 px-3 py-2 text-sm" value={filters.technician} onChange={(event) => setFilters({ ...filters, technician: event.target.value })}>
            <option value="">Tecnico</option>
            {technicians.filter((tech) => tech.active).map((tech) => <option key={tech.id} value={tech.id}>{tech.name}</option>)}
          </select>
          <select className="rounded-md border border-neutral-200 px-3 py-2 text-sm" value={filters.category} onChange={(event) => setFilters({ ...filters, category: event.target.value })}>
            <option value="">Categoria</option>
            {categories.map((category) => <option key={category.id} value={category.name}>{category.name}</option>)}
          </select>
          <input className="rounded-md border border-neutral-200 px-3 py-2 text-sm" type="date" value={filters.date} onChange={(event) => setFilters({ ...filters, date: event.target.value })} />
        </div>
      </Card>

      <DataTable
        data={filteredTickets}
        loading={isLoading}
        error={error}
        searchPlaceholder="Buscar por codigo, cliente o titulo"
        onRowClick={setSelectedTicket}
        columns={[
          { key: 'code', header: 'Codigo', sortable: true },
          { key: 'title', header: 'Titulo', sortable: true },
          { key: 'client', header: 'Cliente', sortable: true },
          { key: 'status', header: 'Estado', render: (row) => <StateBadge value={row.status} /> },
          { key: 'priority', header: 'Prioridad', render: (row) => <PriorityBadge value={row.priority} /> },
          { key: 'technician', header: 'Tecnico', sortable: true },
          { key: 'createdAt', header: 'Fecha', render: (row) => formatDate(row.createdAt) },
          {
            key: 'actions',
            header: 'Acciones',
            render: (row) => (
              <div className="flex flex-wrap gap-2" onClick={(event) => event.stopPropagation()}>
                <Button variant="ghost" onClick={() => setSelectedTicket(row)}><Eye className="h-4 w-4" />Ver</Button>
                <Button variant="ghost" onClick={() => setAssignTicket(row)}><RotateCcw className="h-4 w-4" />Asignar</Button>
                <Button variant="ghost" onClick={() => setPriorityTicket(row)}>Prioridad</Button>
              </div>
            )
          }
        ]}
      />

      <Drawer isOpen={Boolean(selectedTicket)} title={selectedTicket ? `${selectedTicket.code} - ${selectedTicket.title}` : 'Detalle'} onClose={() => setSelectedTicket(null)} width="max-w-3xl">
        {selectedTicket && (
          <div className="grid gap-6">
            <div className="grid gap-3 rounded-lg border border-neutral-200 p-4 md:grid-cols-2">
              <p className="text-sm"><span className="font-semibold">Cliente:</span> {selectedTicket.client}</p>
              <p className="text-sm"><span className="font-semibold">Tecnico:</span> {selectedTicket.technician}</p>
              <p className="text-sm"><span className="font-semibold">Vence:</span> {formatDate(selectedTicket.dueAt)}</p>
              <p className="text-sm"><span className="font-semibold">SLA:</span> {selectedTicket.slaMet ? <Badge tone="success">Cumplido</Badge> : <Badge tone="danger">En riesgo</Badge>}</p>
              <p className="text-sm md:col-span-2">{ticketDetail.description}</p>
            </div>

            <section>
              <h3 className="mb-3 text-sm font-semibold text-neutral-900">Timeline</h3>
              <TicketTimeline events={ticketDetail.timeline} />
            </section>

            <section>
              <h3 className="mb-3 text-sm font-semibold text-neutral-900">Comentarios</h3>
              <div className="grid gap-3">
                {ticketDetail.comments.map((comment) => (
                  <div key={comment.id} className="rounded-lg border border-neutral-200 p-3">
                    <p className="text-sm font-semibold text-neutral-900">{comment.author}</p>
                    <p className="mt-1 text-sm text-neutral-600">{comment.body}</p>
                    <time className="mt-1 block text-xs text-neutral-500">{formatDateTime(comment.createdAt)}</time>
                  </div>
                ))}
              </div>
              <form className="mt-4 grid gap-3" onSubmit={commentForm.handleSubmit(addComment)}>
                <FormTextarea register={commentForm.register} name="body" label="Responder" error={commentForm.formState.errors.body} />
                <Button type="submit" isLoading={commentForm.formState.isSubmitting}><MessageSquare className="h-4 w-4" />Agregar respuesta</Button>
              </form>
            </section>

            <section className="grid gap-3">
              <h3 className="text-sm font-semibold text-neutral-900">Evidencias</h3>
              <div className="flex flex-wrap gap-2">{ticketDetail.evidence.map((item) => <Badge key={item}>{item}</Badge>)}</div>
            </section>
          </div>
        )}
      </Drawer>

      <Modal isOpen={Boolean(assignTicket)} title="Asignar o reasignar tecnico" onClose={() => setAssignTicket(null)}>
        <form className="grid gap-4" onSubmit={assignForm.handleSubmit(assignTechnician)}>
          <FormSelect register={assignForm.register} name="technicianId" label="Tecnico activo" error={assignForm.formState.errors.technicianId} options={technicians.filter((tech) => tech.active).map((tech) => ({ value: tech.id, label: tech.name }))} />
          <Button type="submit" isLoading={assignForm.formState.isSubmitting}>Guardar asignacion</Button>
        </form>
      </Modal>

      <Modal isOpen={Boolean(priorityTicket)} title="Cambiar prioridad" onClose={() => setPriorityTicket(null)}>
        <form className="grid gap-4" onSubmit={priorityForm.handleSubmit(changePriority)}>
          <FormSelect register={priorityForm.register} name="priority" label="Prioridad" error={priorityForm.formState.errors.priority} options={optionize(priorities)} />
          <Button type="submit" isLoading={priorityForm.formState.isSubmitting}>Actualizar prioridad</Button>
        </form>
      </Modal>
    </div>
  );
};

export default Tickets;
