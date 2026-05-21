import { Download } from 'lucide-react';
import { useState } from 'react';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import Drawer from '../../components/common/Drawer.jsx';
import JsonViewer from '../../components/common/JsonViewer.jsx';
import DataTable from '../../components/tables/DataTable.jsx';
import DateRangePicker from '../../components/forms/DateRangePicker.jsx';
import { useAdminResource } from '../../hooks/useAdminResource.js';
import { useToast } from '../../hooks/useToast.js';
import { auditLogs } from './adminMockData.js';
import { formatDateTime } from '../../utils/formatDate.js';

const Auditoria = () => {
  const { data, isLoading, error } = useAdminResource(() => auditLogs, []);
  const [selected, setSelected] = useState(null);
  const [filters, setFilters] = useState({ dateRange: { from: '', to: '' }, user: '', action: '', entity: '', result: '' });
  const { showToast } = useToast();

  const filtered = (data || []).filter((log) => (
    (!filters.user || log.user.toLowerCase().includes(filters.user.toLowerCase()))
    && (!filters.action || log.action === filters.action)
    && (!filters.entity || log.entity.toLowerCase().includes(filters.entity.toLowerCase()))
    && (!filters.result || log.result === filters.result)
  ));

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Auditoria</h1>
          <p className="mt-1 text-sm text-neutral-500">Trazabilidad de acciones, diffs, IP y user agent.</p>
        </div>
        <Button onClick={() => showToast({ type: 'success', title: 'CSV generado', message: 'Export aplicado con filtros activos.' })}><Download className="h-4 w-4" />Exportar a CSV</Button>
      </div>

      <Card className="grid gap-3 p-4 lg:grid-cols-5">
        <div className="lg:col-span-2"><DateRangePicker value={filters.dateRange} onChange={(dateRange) => setFilters({ ...filters, dateRange })} /></div>
        <input className="rounded-md border border-neutral-200 px-3 py-2 text-sm" placeholder="Usuario" value={filters.user} onChange={(event) => setFilters({ ...filters, user: event.target.value })} />
        <select className="rounded-md border border-neutral-200 px-3 py-2 text-sm" value={filters.action} onChange={(event) => setFilters({ ...filters, action: event.target.value })}>
          <option value="">Accion</option>
          {[...new Set(auditLogs.map((log) => log.action))].map((action) => <option key={action} value={action}>{action}</option>)}
        </select>
        <input className="rounded-md border border-neutral-200 px-3 py-2 text-sm" placeholder="Entidad" value={filters.entity} onChange={(event) => setFilters({ ...filters, entity: event.target.value })} />
        <select className="rounded-md border border-neutral-200 px-3 py-2 text-sm lg:col-start-5" value={filters.result} onChange={(event) => setFilters({ ...filters, result: event.target.value })}>
          <option value="">Resultado</option>
          <option value="SUCCESS">SUCCESS</option>
          <option value="FAILURE">FAILURE</option>
        </select>
      </Card>

      <DataTable
        data={filtered}
        loading={isLoading}
        error={error}
        onRowClick={setSelected}
        columns={[
          { key: 'createdAt', header: 'Fecha', render: (row) => formatDateTime(row.createdAt), sortable: true },
          { key: 'user', header: 'Usuario', sortable: true },
          { key: 'action', header: 'Accion', sortable: true },
          { key: 'entity', header: 'Entidad' },
          { key: 'entityId', header: 'ID' },
          { key: 'result', header: 'Resultado' }
        ]}
      />

      <Drawer isOpen={Boolean(selected)} title="Detalle de auditoria" onClose={() => setSelected(null)} width="max-w-3xl">
        {selected && (
          <div className="grid gap-5">
            <div className="grid gap-2 rounded-lg border border-neutral-200 p-4 text-sm">
              <p><span className="font-semibold">Usuario:</span> {selected.user}</p>
              <p><span className="font-semibold">Accion:</span> {selected.action}</p>
              <p><span className="font-semibold">IP:</span> {selected.ip}</p>
              <p><span className="font-semibold">User agent:</span> {selected.userAgent}</p>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-semibold text-neutral-900">Before</h3>
              <JsonViewer value={selected.before} />
            </div>
            <div>
              <h3 className="mb-2 text-sm font-semibold text-neutral-900">After</h3>
              <JsonViewer value={selected.after} />
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default Auditoria;
