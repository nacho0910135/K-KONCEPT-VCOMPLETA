import clsx from 'clsx';

const Toggle = ({ checked = false, onChange, disabled = false, label, description }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    onClick={() => onChange?.(!checked)}
    className={clsx(
      'inline-flex items-center gap-3 rounded-md p-1 text-left transition focus:outline-none focus:ring-4 focus:ring-primary-100 disabled:cursor-not-allowed disabled:opacity-60',
      label && 'w-full justify-between'
    )}
  >
    {label && (
      <span className="grid gap-0.5">
        <span className="text-sm font-semibold text-neutral-900">{label}</span>
        {description && <span className="text-xs font-medium text-neutral-500">{description}</span>}
      </span>
    )}
    <span
      className={clsx(
        'relative h-6 w-11 shrink-0 rounded-full transition',
        checked ? 'bg-primary-600' : 'bg-neutral-300'
      )}
    >
      <span
        className={clsx(
          'absolute top-1 h-4 w-4 rounded-full bg-white shadow transition',
          checked ? 'left-6' : 'left-1'
        )}
      />
    </span>
  </button>
);

export default Toggle;
