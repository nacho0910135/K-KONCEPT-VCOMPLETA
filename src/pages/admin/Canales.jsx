import { Settings } from 'lucide-react';
import { useState } from 'react';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import Modal from '../../components/common/Modal.jsx';
import Input from '../../components/common/Input.jsx';
import Badge from '../../components/common/Badge.jsx';
import { useAdminResource } from '../../hooks/useAdminResource.js';
import { useToast } from '../../hooks/useToast.js';
import { channels } from './adminMockData.js';
import { simulateAction } from './adminUtils.jsx';

const Canales = () => {
  const { data, setData, isLoading } = useAdminResource(() => channels, []);
  const [configuring, setConfiguring] = useState(null);
  const { showToast } = useToast();

  const toggle = async (channel) => {
    await simulateAction();
    setData((current) => current.map((item) => item.id === channel.id ? { ...item, enabled: !item.enabled } : item));
    showToast({ type: 'success', title: `${channel.name} actualizado` });
  };

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Canales de notificacion</h1>
        <p className="mt-1 text-sm text-neutral-500">Configuracion de IN_APP, EMAIL, SMS y PUSH.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {isLoading && Array.from({ length: 4 }, (_, index) => <div key={index} className="h-40 animate-pulse rounded-lg bg-neutral-100" />)}
        {(data || []).map((channel) => (
          <Card key={channel.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold text-neutral-900">{channel.name}</h2>
                <p className="mt-1 text-sm text-neutral-500">Canal {channel.enabled ? 'habilitado' : 'deshabilitado'}</p>
              </div>
              <Badge tone={channel.enabled ? 'success' : 'neutral'}>{channel.enabled ? 'Enabled' : 'Disabled'}</Badge>
            </div>
            <div className="mt-5 flex gap-2">
              <Button variant="ghost" onClick={() => toggle(channel)}>{channel.enabled ? 'Deshabilitar' : 'Habilitar'}</Button>
              <Button onClick={() => setConfiguring(channel)}><Settings className="h-4 w-4" />Configurar</Button>
            </div>
          </Card>
        ))}
      </div>

      <Modal isOpen={Boolean(configuring)} title={`Configurar ${configuring?.name || ''}`} onClose={() => setConfiguring(null)}>
        <div className="grid gap-4">
          {(configuring?.fields || []).map((field) => <Input key={field} label={field} placeholder={`Valor de ${field}`} />)}
          <Button onClick={() => { setConfiguring(null); showToast({ type: 'success', title: 'Configuracion guardada' }); }}>Guardar configuracion</Button>
        </div>
      </Modal>
    </div>
  );
};

export default Canales;
