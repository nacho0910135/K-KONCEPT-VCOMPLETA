import clsx from 'clsx';

const Card = ({ children, className }) => (
  <section className={clsx('rounded-lg border border-neutral-200 bg-[#dedede] shadow-soft', className)}>{children}</section>
);

export default Card;
