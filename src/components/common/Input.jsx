import clsx from 'clsx';

const Input = ({ label, error, className, id, ...props }) => {
  const inputId = id || props.name;

  return (
    <label className="grid gap-1.5 text-sm font-medium text-neutral-700" htmlFor={inputId}>
      {label && <span>{label}</span>}
      <input
        id={inputId}
        className={clsx(
          'min-h-10 rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-500 focus:border-primary-500 focus:ring-4 focus:ring-primary-100',
          error && 'border-danger focus:border-danger focus:ring-red-100',
          className
        )}
        {...props}
      />
      {error && <span className="text-xs font-medium text-danger">{error}</span>}
    </label>
  );
};

export default Input;
