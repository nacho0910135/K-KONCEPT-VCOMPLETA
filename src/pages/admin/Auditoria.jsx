import { useMemo, useState } from 'react';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import Drawer from '../../components/common/Drawer.jsx';
import JsonViewer from '../../components/common/JsonViewer.jsx';
import DataTable from '../../components/tables/DataTable.jsx';
import DateRangePicker from '../../components/forms/DateRangePicker.jsx';
import { useAdminResource } from '../../hooks/useAdminResource.js';
import { listAuditLogs } from '../../services/admin.client.service.js';
import { formatDateTime } from '../../utils/formatDate.js';
import { eventLabel, resultLabel } from './adminUtils.jsx';

const Auditoria = () => {
  const [selected, setSelected] = useState(null);
  const [filters, setFilters] = useState({ dateRange: { from: '', to: '' }, action: '', entity: '', result: '' });
  const { data, isLoading, error } = useAdminResource(async () => {
    const response = await listAuditLogs({ limit: 100 });
    return response.data?.items || response.data || [];
  }, []);

  const filtered = useMemo(() => (data || []).filter((log) => (
    (!filters.action || log.action === filters.action)
    && (!filters.entity || log.entity?.toLowerCase().includes(filters.entity.toLowerCase()))
    && (!filters.result || log.result === filters.result)
  )), [data, filters]);

  const actions = [...new Set((data || []).map((log) => log.action).filter(Boolean))];

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Auditoria</h1>
        <p className="mt-1 text-sm text-neutral-500">Trazabilidad real de acciones, IP y user agent.</p>
      </div>

      <Card className="grid gap-3 p-4 lg:grid-cols-5">
        <div className="lg:col-span-2"><DateRangePicker value={filters.dateRange} onChange={(dateRange) => setFilters({ ...filters, dateRange })} /></div>
        <select className="rounded-md border border-neutral-200 px-3 py-2 text-sm" value={filters.action} onChange={(event) => setFilters({ ...filters, action: event.target.value })}>
          <option value="">Accion</option>
          {actions.map((action) => <option key={action} value={action}>{eventLabel[action] || action}</option>)}
        </select>
        <input className="rounded-md border border-neutral-200 px-3 py-2 text-sm" placeholder="Entidad" value={filters.entity} onChange={(event) => setFilters({ ...filters, entity: event.target.value })} />
        <select className="rounded-md border border-neutral-200 px-3 py-2 text-sm" value={filters.result} onChange={(event) => setFilters({ ...filters, result: event.target.value })}>
          <option value="">Resultado</option>
          <option value="SUCCESS">Exito</option>
          <option value="FAILURE">Error</option>
        </select>
      </Card>

      <DataTable
        data={filtered}
        loading={isLoading}
        error={error}
        onRowClick={setSelected}
        columns={[
          { key: 'createdAt', header: 'Fecha', render: (row) => formatDateTime(row.createdAt), sortable: true },
          { key: 'user', header: 'Usuario', render: (row) => row.user?.email || row.user?.name || row.userId || 'Sistema' },
          { key: 'action', header: 'Accion', sortable: true, render: (row) => eventLabel[row.action] || row.action },
          { key: 'entity', header: 'Entidad' },
          { key: 'entityId', header: 'ID' },
          { key: 'result', header: 'Resultado', render: (row) => resultLabel[row.result] || row.result }
        ]}
      />

      <Drawer isOpen={Boolean(selected)} title="Detalle de auditoria" onClose={() => setSelected(null)} width="max-w-3xl">
        {selected && (
          <div className="grid gap-5">
            <div className="grid gap-2 rounded-lg border border-neutral-200 p-4 text-sm">
              <p><span className="font-semibold">Usuario:</span> {selected.user?.email || selected.user?.name || selected.userId || 'Sistema'}</p>
              <p><span className="font-semibold">Accion:</span> {eventLabel[selected.action] || selected.action}</p>
              <p><span className="font-semibold">IP:</span> {selected.ipAddress || 'No registrada'}</p>
              <p><span className="font-semibold">Navegador:</span> {selected.userAgent || 'No registrado'}</p>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-semibold text-neutral-900">Detalle</h3>
              <JsonViewer value={selected.details || selected.newValue || selected.previousValue || selected} />
            </div>
            <Button variant="ghost" onClick={() => setSelected(null)}>Cerrar</Button>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default Auditoria;
