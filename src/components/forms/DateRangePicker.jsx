import Input from '../common/Input.jsx';

const DateRangePicker = ({ value, onChange }) => (
  <div className="grid gap-3 sm:grid-cols-2">
    <Input label="Desde" type="date" value={value?.from || ''} onChange={(event) => onChange({ ...value, from: event.target.value })} />
    <Input label="Hasta" type="date" value={value?.to || ''} onChange={(event) => onChange({ ...value, to: event.target.value })} />
  </div>
);

export default DateRangePicker;
