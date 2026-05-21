import Badge from '../common/Badge.jsx';

const MultiSelect = ({ label, options = [], value = [], onChange }) => {
  const toggle = (nextValue) => {
    onChange(value.includes(nextValue) ? value.filter((item) => item !== nextValue) : [...value, nextValue]);
  };

  return (
    <div className="grid gap-2">
      {label && <p className="text-sm font-medium text-neutral-700">{label}</p>}
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = value.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              className="rounded-full focus:outline-none focus:ring-4 focus:ring-primary-100"
              onClick={() => toggle(option.value)}
            >
              <Badge tone={selected ? 'primary' : 'neutral'}>{option.label}</Badge>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MultiSelect;
