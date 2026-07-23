import { MessageCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import Badge from '../../components/common/Badge.jsx';
import Card from '../../components/common/Card.jsx';
import { getChatUsers } from '../../services/chat.client.service.js';

const roleLabel = { ADMIN: 'Administradores', TECHNICIAN: 'Tecnicos' };

const ChatEmpresarial = () => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const rows = await getChatUsers();
      if (mounted) setUsers(rows);
    };
    load();
    const timer = setInterval(load, 10000);
    return () => { mounted = false; clearInterval(timer); };
  }, []);

  const grouped = useMemo(() => ({
    ADMIN: users.filter((user) => user.role === 'ADMIN'),
    TECHNICIAN: users.filter((user) => user.role === 'TECHNICIAN')
  }), [users]);

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Chat empresarial</h1>
        <p className="mt-1 text-sm text-neutral-500">Abre hasta 3 chats rapidos con administradores o tecnicos disponibles.</p>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {Object.entries(grouped).map(([role, rows]) => (
          <Card key={role} className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-neutral-900">{roleLabel[role]}</h2>
              <Badge tone="primary">{rows.filter((user) => user.online).length} online</Badge>
            </div>
            <div className="grid gap-2">
              {rows.length === 0 && <p className="text-sm text-neutral-500">No hay usuarios disponibles.</p>}
              {rows.map((person) => (
                <button
                  key={person.id}
                  className="flex items-center justify-between rounded-md border border-neutral-200 px-3 py-3 text-left transition hover:border-primary-200 hover:bg-primary-50"
                  type="button"
                  onClick={() => window.openEnterpriseChat?.(person.id)}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    {person.avatarUrl ? <img className="h-10 w-10 rounded-full object-cover" src={person.avatarUrl} alt={person.name} /> : <span className="grid h-10 w-10 place-items-center rounded-full bg-neutral-100 font-bold text-neutral-600">{person.name?.[0] || '?'}</span>}
                    <span className="min-w-0">
                      <span className="block truncate font-semibold text-neutral-900">{person.name}</span>
                      <span className="flex items-center gap-1 text-xs text-neutral-500">
                        <span className={`h-2 w-2 rounded-full ${person.online ? 'bg-green-500' : 'bg-neutral-300'}`} />
                        {person.online ? 'Online' : 'No activo'}
                      </span>
                    </span>
                  </span>
                  <MessageCircle className="h-5 w-5 text-primary-700" />
                </button>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ChatEmpresarial;
