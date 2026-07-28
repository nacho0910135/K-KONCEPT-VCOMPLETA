import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, RotateCcw, SlidersHorizontal } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import Drawer from '../../components/common/Drawer.jsx';
import Modal from '../../components/common/Modal.jsx';
import Badge from '../../components/common/Badge.jsx';
import Toggle from '../../components/common/Toggle.jsx';
import DataTable from '../../components/tables/DataTable.jsx';
import EvidenceGallery from '../../components/tickets/EvidenceGallery.jsx';
import FormSelect from '../../components/forms/FormSelect.jsx';
import { useToast } from '../../hooks/useToast.js';
import { assignTicketTechnician, getTicketAssignmentSettings, getTickets, updateTicketAssignmentSettings, updateTicketPriority } from '../../services/tickets.service.js';
import { getUsers } from '../../services/users.service.js';
import { PriorityBadge, StateBadge, priorityLabel, statusLabel } from './adminUtils.jsx';
import { formatDate } from '../../utils/formatDate.js';
import { getErrorMessage } from '../../utils/errorHandler.js';

const statuses = ['OPEN', 'PENDING', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'RESOLVED', 'CLOSED', 'CANCELLED', 'REOPENED'];
const priorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const historicalStatuses = ['RESOLVED', 'CLOSED', 'CANCELLED'];
const activeStatuses = ['OPEN', 'PENDING', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'REOPENED'];
const activeAppeal = (ticket) => Boolean(ticket.appealedAt) && activeStatuses.includes(ticket.status);
const optionize = (items, labels = {}) => items.map((item) => ({ value: item, label: labels[item] || item }));
const isSlaRisk = (ticket) => {
  if (!activeStatuses.includes(ticket.status)) return false;
  if (ticket.slaBreached) return true;
  if (!ticket.slaDeadline) return false;
  return new Date(ticket.slaDeadline) <= new Date(Date.now() + 24 * 60 * 60 * 1000);
};
const isAdminAttention = (ticket) => (
  !historicalStatuses.includes(ticket.status)
);
const matchesSearch = (ticket, query) => JSON.stringify(ticket).toLowerCase().includes(query.trim().toLowerCase());
const matchesFilters = (ticket, filters) => (
  (!filters.status || ticket.status === filters.status)
  && (!filters.priority || ticket.priority === filters.priority)
  && (!filters.technicianId || ticket.assignedTechnicianId === filters.technicianId)
);
const caseTypeMatches = (ticket, type) => {
  if (!type) return true;
  if (type === 'refund') return (ticket.refunds || []).length > 0;
  if (type === 'replacement') return (ticket.replacements || []).length > 0;
  if (type === 'appeal') return Boolean(ticket.appealedAt);
  if (type === 'cancelled') return ticket.status === 'CANCELLED';
  return true;
};
const assignSchema = z.object({ technicianId: z.string().min(1, 'Selecciona un tecnico activo') });
const prioritySchema = z.object({ priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']) });
const Tickets = () => {
  const [tickets, setTickets] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [assignTicket, setAssignTicket] = useState(null);
  const [priorityTicket, setPriorityTicket] = useState(null);
  const [assignmentSettings, setAssignmentSettings] = useState({ automatic: true, mode: 'AUTOMATIC', onlineOnly: true });
  const [isSavingAssignmentMode, setIsSavingAssignmentMode] = useState(false);
  const [quickFilter, setQuickFilter] = useState('attention');
  const [filters, setFilters] = useState({ status: '', priority: '', technicianId: '' });
  const [caseType, setCaseType] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const { showToast } = useToast();
  const navigate = useNavigate();
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

  useEffect(() => {
    getTicketAssignmentSettings()
      .then((settings) => setAssignmentSettings(settings))
      .catch(() => {});
  }, []);

  const quickTabs = useMemo(() => {
    const by = (predicate) => tickets.filter(predicate).length;
    return [
      { key: 'attention', label: 'Atencion Admin', count: by(isAdminAttention), predicate: isAdminAttention },
      { key: 'appeals', label: 'Apelaciones', count: by(activeAppeal), predicate: activeAppeal },
      { key: 'unassigned', label: 'Sin asignar', count: by((ticket) => !ticket.assignedTechnicianId && activeStatuses.includes(ticket.status)), predicate: (ticket) => !ticket.assignedTechnicianId && activeStatuses.includes(ticket.status) },
      { key: 'sla', label: 'SLA en riesgo / vencidos', count: by(isSlaRisk), predicate: isSlaRisk },
      { key: 'history', label: 'Historico / resueltos', count: by((ticket) => historicalStatuses.includes(ticket.status)), predicate: (ticket) => historicalStatuses.includes(ticket.status) }
    ];
  }, [tickets]);

  const filteredTickets = useMemo(() => {
    const tab = quickTabs.find((item) => item.key === quickFilter) || quickTabs[0];
    return tickets.filter((ticket) => (
      tab.predicate(ticket)
      && matchesFilters(ticket, filters)
      && (quickFilter !== 'history' || caseTypeMatches(ticket, caseType))
    ));
  }, [tickets, filters, quickFilter, quickTabs, caseType]);

  useEffect(() => {
    const normalized = searchTerm.trim();
    const activeTab = quickTabs.find((item) => item.key === quickFilter) || quickTabs[0];
    if (!normalized || tickets.some((ticket) => activeTab.predicate(ticket) && matchesFilters(ticket, filters) && matchesSearch(ticket, normalized))) return;

    const nextTab = quickTabs.find((tab) => tickets.some((ticket) => tab.predicate(ticket) && matchesFilters(ticket, filters) && matchesSearch(ticket, normalized)));
    if (nextTab) setQuickFilter(nextTab.key);
  }, [filters, quickFilter, quickTabs, searchTerm, tickets]);

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
      showToast({ type: 'success', title: 'Prioridad actualizada', message: `Ticket ${priorityTicket.code} ahora es ${priorityLabel[priority] || priority}.` });
    } catch (err) {
      showToast({ type: 'error', title: 'No se pudo actualizar', message: getErrorMessage(err) });
    }
  };

  const saveAssignmentSettings = async (nextSettings) => {
    setIsSavingAssignmentMode(true);
    try {
      const settings = await updateTicketAssignmentSettings(nextSettings);
      setAssignmentSettings(settings);
      showToast({
        type: 'success',
        title: settings.automatic ? 'Asignacion automatica activada' : 'Asignacion manual activada',
        message: settings.automatic ? 'Los casos nuevos se asignaran al tecnico con menor carga.' : 'El admin asignara los casos manualmente.'
      });
    } catch (err) {
      showToast({ type: 'error', title: 'No se pudo cambiar el modo', message: getErrorMessage(err) });
    } finally {
      setIsSavingAssignmentMode(false);
    }
  };
  const toggleAssignmentMode = (automatic) => saveAssignmentSettings({ automatic, onlineOnly: assignmentSettings.onlineOnly });
  const changeAssignmentScope = (onlineOnly) => saveAssignmentSettings({ automatic: assignmentSettings.automatic, onlineOnly });

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Supervision de tickets</h1>
        <p className="mt-1 text-sm text-neutral-500">Asignacion, prioridad y seguimiento real de solicitudes.</p>
      </div>

      <Card className="p-4">
        <div className="mb-3 flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
            <SlidersHorizontal className="h-4 w-4" /> Filtros
          </div>
          <div className="grid gap-2 rounded-md border border-neutral-200 px-3 py-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-neutral-900">Asignar casos automaticamente</span>
              <Badge tone={assignmentSettings.automatic ? 'success' : 'warning'}>{assignmentSettings.automatic ? 'Automatico' : 'Manual'}</Badge>
            </div>
            <Toggle
              checked={Boolean(assignmentSettings.automatic)}
              onChange={toggleAssignmentMode}
              disabled={isSavingAssignmentMode}
              label={assignmentSettings.automatic ? 'Modo automatico activo' : 'Modo manual activo'}
              description={assignmentSettings.automatic ? 'Los casos nuevos se asignan al tecnico con menor carga.' : 'El admin asigna cada caso con el boton Asignar.'}
            />
            {assignmentSettings.automatic && (
              <select className="rounded-md border border-neutral-200 px-3 py-2 text-sm" value={assignmentSettings.onlineOnly ? 'online' : 'all'} onChange={(event) => changeAssignmentScope(event.target.value === 'online')} disabled={isSavingAssignmentMode}>
                <option value="online">Solo tecnicos online</option>
                <option value="all">Online y offline</option>
              </select>
            )}
          </div>
        </div>
        <div className={`grid gap-3 ${quickFilter === 'history' ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}>
          <select className="rounded-md border border-neutral-200 px-3 py-2 text-sm" value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
            <option value="">Estado</option>
            {statuses.map((item) => <option key={item} value={item}>{statusLabel[item] || item}</option>)}
          </select>
          <select className="rounded-md border border-neutral-200 px-3 py-2 text-sm" value={filters.priority} onChange={(event) => setFilters({ ...filters, priority: event.target.value })}>
            <option value="">Prioridad</option>
            {priorities.map((item) => <option key={item} value={item}>{priorityLabel[item] || item}</option>)}
          </select>
          <select className="rounded-md border border-neutral-200 px-3 py-2 text-sm" value={filters.technicianId} onChange={(event) => setFilters({ ...filters, technicianId: event.target.value })}>
            <option value="">Tecnico</option>
            {technicians.map((tech) => <option key={tech.id} value={tech.id}>{tech.name}</option>)}
          </select>
          {quickFilter === 'history' && (
            <select className="rounded-md border border-neutral-200 px-3 py-2 text-sm" value={caseType} onChange={(event) => setCaseType(event.target.value)}>
              <option value="">Todos los resueltos</option>
              <option value="refund">Reembolso</option>
              <option value="replacement">Reemplazo</option>
              <option value="appeal">Apelacion</option>
              <option value="cancelled">Cancelado</option>
            </select>
          )}
        </div>
      </Card>

      <Card className="flex flex-wrap gap-2 p-2">
        {quickTabs.map((tab) => (
          <button
            key={tab.key}
            className={`rounded-md px-4 py-2 text-sm font-semibold transition ${quickFilter === tab.key ? 'bg-primary-600 text-white shadow-soft' : 'text-neutral-600 hover:bg-neutral-100'}`}
            type="button"
            onClick={() => setQuickFilter(tab.key)}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </Card>

      <DataTable
        data={filteredTickets}
        loading={isLoading}
        error={error}
        searchPlaceholder="Buscar por codigo, cliente o titulo"
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        onRowClick={setSelectedTicket}
        columns={[
          { key: 'code', header: 'Codigo', sortable: true },
          { key: 'title', header: 'Titulo', render: (row) => <span className="inline-flex items-center gap-2">{row.title} {row.appealedAt && <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">Apelacion</span>}</span>, sortable: true },
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
                <Button variant="ghost" disabled={assignmentSettings.automatic} onClick={() => setAssignTicket(row)}><RotateCcw className="h-4 w-4" />Asignar</Button>
                <Button variant="ghost" onClick={() => setPriorityTicket(row)}>Prioridad</Button>
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
            {selectedTicket.appealedAt && <p className="text-sm"><span className="font-semibold">Apelacion:</span> {selectedTicket.appealReason}</p>}
            <p className="text-sm"><span className="font-semibold">Categoria:</span> {selectedTicket.category?.name || 'Sin categoria'}</p>
            <p className="text-sm"><span className="font-semibold">Descripcion:</span> {selectedTicket.description}</p>
            <div>
              <Button onClick={() => navigate(`/admin/tickets/${selectedTicket.id}`)}><Eye className="h-4 w-4" />Gestionar caso</Button>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-neutral-900">Evidencias</h3>
              <EvidenceGallery evidences={selectedTicket.evidence || []} emptyText="No hay evidencias adjuntas." />
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
          <FormSelect register={priorityForm.register} name="priority" label="Prioridad" error={priorityForm.formState.errors.priority} options={optionize(priorities, priorityLabel)} />
          <Button type="submit" isLoading={priorityForm.formState.isSubmitting}>Actualizar prioridad</Button>
        </form>
      </Modal>
    </div>
  );
};

export default Tickets;
