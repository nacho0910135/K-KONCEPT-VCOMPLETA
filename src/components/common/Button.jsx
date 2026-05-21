import { Loader2 } from 'lucide-react';
import clsx from 'clsx';

const variants = {
  primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-200',
  secondary: 'bg-secondary-500 text-white hover:bg-secondary-600 focus:ring-secondary-50',
  ghost: 'bg-transparent text-neutral-700 hover:bg-neutral-100 focus:ring-neutral-200',
  danger: 'bg-danger text-white hover:bg-red-700 focus:ring-red-100'
};

const Button = ({ children, className, isLoading = false, variant = 'primary', type = 'button', ...props }) => (
  <button
    type={type}
    className={clsx(
      'inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60',
      variants[variant],
      className
    )}
    disabled={isLoading || props.disabled}
    {...props}
  >
    {isLoading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
    {children}
  </button>
);

export default Button;
