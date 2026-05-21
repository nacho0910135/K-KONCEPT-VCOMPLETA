import clsx from 'clsx';
import Card from './Card.jsx';

const StatCard = ({ title, value, helper, icon: Icon, tone = 'primary' }) => {
  const toneClass = {
    primary: 'bg-primary-50 text-primary-700',
    success: 'bg-green-50 text-green-700',
    warning: 'bg-amber-50 text-amber-700',
    danger: 'bg-red-50 text-red-700',
    neutral: 'bg-neutral-100 text-neutral-700'
  }[tone];

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-neutral-500">{title}</p>
          <p className="mt-2 text-2xl font-bold text-neutral-900">{value}</p>
          {helper && <p className="mt-1 text-xs text-neutral-500">{helper}</p>}
        </div>
        {Icon && (
          <span className={clsx('grid h-10 w-10 shrink-0 place-items-center rounded-lg', toneClass)}>
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
        )}
      </div>
    </Card>
  );
};

export default StatCard;
