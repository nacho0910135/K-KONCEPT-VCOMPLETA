import { ChevronLeft, ChevronRight } from 'lucide-react';
import Button from './Button.jsx';

const Pagination = ({ page, pageSize, total, onPageChange }) => {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-neutral-600">
      <span>
        Pagina {page} de {totalPages}
      </span>
      <div className="flex items-center gap-2">
        <Button variant="ghost" disabled={page <= 1} onClick={() => onPageChange(page - 1)} aria-label="Pagina anterior">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="ghost" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} aria-label="Pagina siguiente">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default Pagination;
