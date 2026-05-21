import { ArrowDownUp, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import EmptyState from '../common/EmptyState.jsx';
import Input from '../common/Input.jsx';
import Pagination from '../common/Pagination.jsx';

const SkeletonRows = ({ columns, pageSize }) => (
  <>
    {Array.from({ length: Math.min(pageSize, 6) }, (_, rowIndex) => (
      <tr key={rowIndex}>
        {columns.map((column) => (
          <td key={column.key} className="px-4 py-3">
            <div className="h-4 w-full max-w-32 animate-pulse rounded bg-neutral-100" />
          </td>
        ))}
      </tr>
    ))}
  </>
);

const DataTable = ({
  columns,
  data = [],
  pageSize = 10,
  searchable = true,
  searchPlaceholder = 'Buscar...',
  loading = false,
  error = null,
  emptyTitle = 'Sin resultados',
  emptyDescription = 'No encontramos datos para los filtros actuales.',
  onRowClick
}) => {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState({ key: null, direction: 'asc' });

  const filteredData = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return data;

    return data.filter((row) => JSON.stringify(row).toLowerCase().includes(normalized));
  }, [data, query]);

  const sortedData = useMemo(() => {
    if (!sort.key) return filteredData;
    return [...filteredData].sort((a, b) => {
      const left = a[sort.key] ?? '';
      const right = b[sort.key] ?? '';
      const result = String(left).localeCompare(String(right), 'es', { numeric: true });
      return sort.direction === 'asc' ? result : -result;
    });
  }, [filteredData, sort]);

  const pageData = sortedData.slice((page - 1) * pageSize, page * pageSize);

  const toggleSort = (key) => {
    setSort((current) => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  return (
    <div className="grid gap-4">
      {searchable && (
        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-5 w-5 text-neutral-400" />
          <Input className="pl-10" placeholder={searchPlaceholder} value={query} onChange={(event) => setQuery(event.target.value)} />
        </div>
      )}
      {error && <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-danger">{error}</div>}
      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200 text-sm">
            <thead className="bg-neutral-50">
              <tr>
                {columns.map((column) => (
                  <th key={column.key} className="px-4 py-3 text-left font-semibold text-neutral-700">
                    <button className="inline-flex items-center gap-2" type="button" onClick={() => column.sortable && toggleSort(column.key)}>
                      {column.header}
                      {column.sortable && <ArrowDownUp className="h-4 w-4 text-neutral-400" />}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading ? (
                <SkeletonRows columns={columns} pageSize={pageSize} />
              ) : pageData.map((row, index) => (
                <tr
                  key={row.id || index}
                  className={onRowClick ? 'cursor-pointer hover:bg-neutral-50' : 'hover:bg-neutral-50'}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((column) => (
                    <td key={column.key} className="px-4 py-3 text-neutral-700">
                      {column.render ? column.render(row) : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {!loading && sortedData.length === 0 && <EmptyState title={emptyTitle} description={emptyDescription} />}
      {!loading && sortedData.length > 0 && <Pagination page={page} pageSize={pageSize} total={sortedData.length} onPageChange={setPage} />}
    </div>
  );
};

export default DataTable;
