import clsx from 'clsx';

const FormTextarea = ({ register, name, label, error, rows = 4, ...props }) => (
  <label className="grid gap-1.5 text-sm font-medium text-neutral-700" htmlFor={name}>
    {label && <span>{label}</span>}
    <textarea
      id={name}
      rows={rows}
      className={clsx(
        'rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100',
        error && 'border-danger focus:border-danger focus:ring-red-100'
      )}
      {...register(name)}
      {...props}
    />
    {error && <span className="text-xs font-medium text-danger">{error.message}</span>}
  </label>
);

export default FormTextarea;
