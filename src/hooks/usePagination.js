import { useMemo, useState } from 'react';

export const usePagination = (items = [], pageSize = 10) => {
  const [page, setPage] = useState(1);
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const pageItems = useMemo(() => items.slice((page - 1) * pageSize, page * pageSize), [items, page, pageSize]);

  return { page, setPage, pageSize, total, totalPages, pageItems };
};
