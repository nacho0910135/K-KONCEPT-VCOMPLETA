import Button from './Button.jsx';

const IllustratedEmptyState = ({ title, description, actionLabel, onAction }) => (
  <div className="grid place-items-center rounded-lg border border-dashed border-neutral-200 bg-white px-6 py-10 text-center">
    <svg className="h-28 w-28 text-primary-100" viewBox="0 0 160 120" role="img" aria-label="Sin datos">
      <rect x="26" y="25" width="108" height="70" rx="10" fill="currentColor" />
      <path d="M45 48h70M45 64h46M45 80h58" stroke="#2563eb" strokeWidth="7" strokeLinecap="round" />
      <circle cx="120" cy="32" r="18" fill="#0f766e" opacity=".9" />
      <path d="m112 32 6 6 12-14" fill="none" stroke="white" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
    <h3 className="mt-3 text-base font-semibold text-neutral-900">{title}</h3>
    {description && <p className="mt-1 max-w-md text-sm text-neutral-500">{description}</p>}
    {actionLabel && <Button className="mt-5" onClick={onAction}>{actionLabel}</Button>}
  </div>
);

export default IllustratedEmptyState;
