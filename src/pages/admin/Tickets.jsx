import { zodResolver } from '@hookform/resolvers/zod';
import { ExternalLink, Eye, Image as ImageIcon, RotateCcw, SlidersHorizontal, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import Drawer from '../../components/common/Drawer.jsx';
import Modal from '../../components/common/Modal.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import DataTable from '../../components/tables/DataTable.jsx';
import FormSelect from '../../components/forms/FormSelect.jsx';
import { useToast } from '../../hooks/useToast.js';
import { assignTicketTechnician, deleteTicket, getTickets, updateTicketPriority } from '../../services/tickets.service.js';
import { getUsers } from '../../services/users.service.js';
import { PriorityBadge, StateBadge } from './adminUtils.jsx';
import { formatDate } from '../../utils/formatDate.js';
import { getErrorMessage } from '../../utils/errorHandler.js';

const statuses = ['OPEN', 'PENDING', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'RESOLVED', 'CLOSED', 'CANCELLED', 'REOPENED'];
const priorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const optionize = (items) => items.map((item) => ({ value: item, label: item }));
const assignSchema = z.object({ technicianId: z.string().min(1, 'Selecciona un tecnico activo') });
const prioritySchema = z.object({ priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']) });
const getEvidenceUrl = (item) => item.fileUrl || item.url;
const getEvidenceName = (item) => item.fileName || item.name || 'Evidencia';
const isImageEvidence = (item) => item.fileType === 'IMAGE' || item.mimeType?.startsWith('image/');

const Tickets = () => {
  const [tickets, setTickets] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [assignTicket, setAssignTicket] = useState(null);
  const [priorityTicket, setPriorityTicket] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [filters, setFilters] = useState({ status: '', priority: '', technicianId: '' });
  const { showToast } = useToast();
  const assignForm = useForm({ resolver: zodResolver(assignSchema), defaultValues: { technicianId: '' } });
  const priorityForm = useForm({ resolver: zodResolver(prioritySchema), defaultValues: { priority: '' } });

  const load = async () => {
    setIsLoading(true);
    setError('');
    try {
      const [ticketResponse, userResponse] = await Promise.all([
        getTickets({ limit: 100, sortBy: 'createdAt', sortOrder: 'desc' }),
        getUsers({ role: 'TECHNICIAN', active: true, limit: 100 })
      ]);
      const userData = userResponse.data?.users || userResponse.data || [];
      setTickets(ticketResponse.data || []);
      setTechnicians(Array.isArray(userData) ? userData : []);
    } catch (err) {
      setError(getErrorMessage(err, 'No pudimos cargar los tickets.'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filteredTickets = useMemo(() => tickets.filter((ticket) => (
    (!filters.status || ticket.status === filters.status)
    && (!filters.priority || ticket.priority === filters.priority)
    && (!filters.technicianId || ticket.assignedTechnicianId === filters.technicianId)
  )), [tickets, filters]);

  const assignTechnician = async ({ technicianId }) => {
    try {
      await assignTicketTechnician(assignTicket.id, { technicianId });
      setAssignTicket(null);
      assignForm.reset();
      await load();
      showToast({ type: 'success', title: 'Tecnico asignado', message: `Ticket ${assignTicket.code} actualizado.` });
    } catch (err) {
      showToast({ type: 'error', title: 'No se pudo asignar', message: getErrorMessage(err) });
    }
  };

  const changePriority = async ({ priority }) => {
    try {
      await updateTicketPriority(priorityTicket.id, { priority });
      setPriorityTicket(null);
      priorityForm.reset();
      await load();
      showToast({ type: 'success', title: 'Prioridad actualizada', message: `Ticket ${priorityTicket.code} ahora es ${priority}.` });
    } catch (err) {
      showToast({ type: 'error', title: 'No se pudo actualizar', message: getErrorMessage(err) });
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteTicket(deleteTarget.id);
      setTickets((current) => current.filter((ticket) => ticket.id !== deleteTarget.id));
      if (selectedTicket?.id === deleteTarget.id) setSelectedTicket(null);
      showToast({ type: 'success', title: 'Caso eliminado', message: `El ticket ${deleteTarget.code} fue eliminado.` });
      setDeleteTarget(null);
    } catch (err) {
      showToast({ type: 'error', title: 'No se pudo eliminar', message: getErrorMessage(err) });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Supervision de tickets</h1>
        <p className="mt-1 text-sm text-neutral-500">Asignacion, prioridad y seguimiento real de solicitudes.</p>
      </div>

      <Card className="p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-neutral-900">
          <SlidersHorizontal className="h-4 w-4" /> Filtros
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <select className="rounded-md border border-neutral-200 px-3 py-2 text-sm" value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
            <option value="">Estado</option>
            {statuses.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <select className="rounded-md border border-neutral-200 px-3 py-2 text-sm" value={filters.priority} onChange={(event) => setFilters({ ...filters, priority: event.target.value })}>
            <option value="">Prioridad</option>
            {priorities.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <select className="rounded-md border border-neutral-200 px-3 py-2 text-sm" value={filters.technicianId} onChange={(event) => setFilters({ ...filters, technicianId: event.target.value })}>
            <option value="">Tecnico</option>
            {technicians.map((tech) => <option key={tech.id} value={tech.id}>{tech.name}</option>)}
          </select>
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
          { key: 'client', header: 'Cliente', render: (row) => row.client?.name || row.client?.email || 'Cliente', sortable: true },
          { key: 'status', header: 'Estado', render: (row) => <StateBadge value={row.status} /> },
          { key: 'priority', header: 'Prioridad', render: (row) => <PriorityBadge value={row.priority} /> },
          { key: 'technician', header: 'Tecnico', render: (row) => row.assignedTechnician?.name || 'Sin asignar', sortable: true },
          { key: 'createdAt', header: 'Fecha', render: (row) => formatDate(row.createdAt) },
          {
            key: 'actions',
            header: 'Acciones',
            render: (row) => (
              <div className="flex flex-wrap gap-2" onClick={(event) => event.stopPropagation()}>
                <Button variant="ghost" onClick={() => setSelectedTicket(row)}><Eye className="h-4 w-4" />Ver</Button>
                <Button variant="ghost" onClick={() => setAssignTicket(row)}><RotateCcw className="h-4 w-4" />Asignar</Button>
                <Button variant="ghost" onClick={() => setPriorityTicket(row)}>Prioridad</Button>
                <Button variant="danger" onClick={() => setDeleteTarget(row)}><Trash2 className="h-4 w-4" />Eliminar</Button>
              </div>
            )
          }
        ]}
      />

      <Drawer isOpen={Boolean(selectedTicket)} title={selectedTicket ? `${selectedTicket.code} - ${selectedTicket.title}` : 'Detalle'} onClose={() => setSelectedTicket(null)} width="max-w-3xl">
        {selectedTicket && (
          <div className="grid gap-4">
            <p className="text-sm"><span className="font-semibold">Cliente:</span> {selectedTicket.client?.name || selectedTicket.client?.email}</p>
            <p className="text-sm"><span className="font-semibold">Tecnico:</span> {selectedTicket.assignedTechnician?.name || 'Sin asignar'}</p>
            <p className="text-sm"><span className="font-semibold">Categoria:</span> {selectedTicket.category?.name || 'Sin categoria'}</p>
            <p className="text-sm"><span className="font-semibold">Descripcion:</span> {selectedTicket.description}</p>
            <div>
              <h3 className="text-sm font-semibold text-neutral-900">Evidencias</h3>
              {(selectedTicket.evidence || []).length === 0 ? (
                <p className="mt-2 text-sm text-neutral-500">No hay evidencias adjuntas.</p>
              ) : (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {selectedTicket.evidence.map((item) => (
                    <a key={item.id} className="rounded-lg border border-neutral-200 p-3 hover:bg-neutral-50" href={getEvidenceUrl(item)} target="_blank" rel="noreferrer">
                      {isImageEvidence(item) && getEvidenceUrl(item) ? (
                        <img className="h-36 w-full rounded-md object-cover" src={getEvidenceUrl(item)} alt={getEvidenceName(item)} />
                      ) : (
                        <div className="grid h-36 place-items-center rounded-md bg-neutral-100 text-neutral-500"><ImageIcon className="h-8 w-8" /></div>
                      )}
                      <p className="mt-2 flex items-center gap-2 truncate text-sm font-semibold text-neutral-800">{getEvidenceName(item)} <ExternalLink className="h-3.5 w-3.5" /></p>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Drawer>

      <Modal isOpen={Boolean(assignTicket)} title="Asignar o reasignar tecnico" onClose={() => setAssignTicket(null)}>
        <form className="grid gap-4" onSubmit={assignForm.handleSubmit(assignTechnician)}>
          <FormSelect register={assignForm.register} name="technicianId" label="Tecnico activo" error={assignForm.formState.errors.technicianId} options={technicians.map((tech) => ({ value: tech.id, label: tech.name }))} />
          <Button type="submit" isLoading={assignForm.formState.isSubmitting}>Guardar asignacion</Button>
        </form>
      </Modal>

      <Modal isOpen={Boolean(priorityTicket)} title="Cambiar prioridad" onClose={() => setPriorityTicket(null)}>
        <form className="grid gap-4" onSubmit={priorityForm.handleSubmit(changePriority)}>
          <FormSelect register={priorityForm.register} name="priority" label="Prioridad" error={priorityForm.formState.errors.priority} options={optionize(priorities)} />
          <Button type="submit" isLoading={priorityForm.formState.isSubmitting}>Actualizar prioridad</Button>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Eliminar caso"
        message={`Confirma que deseas eliminar el caso ${deleteTarget?.code || ''}. Esta accion eliminara tambien comentarios, historial y evidencias asociadas.`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default Tickets;
