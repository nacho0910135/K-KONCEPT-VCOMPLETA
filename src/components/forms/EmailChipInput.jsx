import { X } from 'lucide-react';
import { useState } from 'react';
import Badge from '../common/Badge.jsx';
import Input from '../common/Input.jsx';

const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const EmailChipInput = ({ label, value = [], onChange, error }) => {
  const [draft, setDraft] = useState('');

  const addEmail = () => {
    const email = draft.trim().toLowerCase();
    if (!email || !isEmail(email) || value.includes(email)) return;
    onChange([...value, email]);
    setDraft('');
  };

  return (
    <div className="grid gap-2">
      <Input
        label={label}
        value={draft}
        error={error}
        placeholder="correo@empresa.com"
        onChange={(event) => setDraft(event.target.value)}
        onBlur={addEmail}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ',') {
            event.preventDefault();
            addEmail();
          }
        }}
      />
      <div className="flex flex-wrap gap-2">
        {value.map((email) => (
          <Badge key={email} tone="primary" className="gap-1">
            {email}
            <button type="button" onClick={() => onChange(value.filter((item) => item !== email))} aria-label={`Quitar ${email}`}>
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
    </div>
  );
};

export default EmailChipInput;
