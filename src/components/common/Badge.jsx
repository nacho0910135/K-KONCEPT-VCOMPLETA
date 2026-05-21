import clsx from 'clsx';

const tones = {
  neutral: 'bg-neutral-100 text-neutral-700',
  primary: 'bg-primary-50 text-primary-700',
  success: 'bg-green-50 text-green-700',
  warning: 'bg-amber-50 text-amber-700',
  danger: 'bg-red-50 text-red-700',
  purple: 'bg-violet-50 text-violet-700'
};

const Badge = ({ children, tone = 'neutral', className }) => (
  <span className={clsx('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold', tones[tone], className)}>
    {children}
  </span>
);

export default Badge;
