import { Star } from 'lucide-react';
import clsx from 'clsx';

const RatingStars = ({ value = 0, onChange, max = 5 }) => (
  <div className="flex items-center gap-1" role="radiogroup" aria-label="Calificacion">
    {Array.from({ length: max }, (_, index) => {
      const rating = index + 1;
      const active = rating <= value;

      return (
        <button
          key={rating}
          type="button"
          className="rounded p-0.5 focus:outline-none focus:ring-2 focus:ring-primary-200"
          onClick={() => onChange?.(rating)}
          aria-label={`${rating} estrellas`}
        >
          <Star className={clsx('h-5 w-5', active ? 'fill-warning text-warning' : 'text-neutral-300')} />
        </button>
      );
    })}
  </div>
);

export default RatingStars;
