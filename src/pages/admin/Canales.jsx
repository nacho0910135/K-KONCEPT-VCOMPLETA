import { Mail, MessageSquareText, MonitorSmartphone, Settings, Smartphone } from 'lucide-react';
import { useState } from 'react';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import Modal from '../../components/common/Modal.jsx';
import Input from '../../components/common/Input.jsx';
import Badge from '../../components/common/Badge.jsx';
import Toggle from '../../components/common/Toggle.jsx';
import { useAdminResource } from '../../hooks/useAdminResource.js';
import { useToast } from '../../hooks/useToast.js';
import { channels } from './adminMockData.js';
import { simulateAction } from './adminUtils.jsx';

const channelMeta = {
  EMAIL: { icon: Mail, label: 'Correo', description: 'Salidas SMTP para clientes y operaciones.' },
  SMS: { icon: Smartphone, label: 'SMS', description: 'Mensajes transaccionales con Twilio.' },
  PUSH: { icon: MonitorSmartphone, label: 'Push', description: 'Notificaciones FCM para dispositivos.' },
  IN_APP: { icon: MessageSquareText, label: 'En la plataforma', description: 'Bandeja interna dentro de la plataforma.' }
};

const fieldLabels = {
  retentionDays: 'Dias de retencion',
  smtpHost: 'SMTP host',
  smtpPort: 'SMTP port',
  smtpUser: 'SMTP user',
  twilioSid: 'Twilio SID',
  twilioToken: 'Twilio auth token',
  fromNumber: 'Numero origen',
  fcmKey: 'FCM server key',
  projectId: 'Firebase project ID'
};

const Canales = () => {
  const { data, setData, isLoading } = useAdminResource(() => channels, []);
  const [configuring, setConfiguring] = useState(null);
  const [configValues, setConfigValues] = useState({});
  const { showToast } = useToast();

  const toggle = async (channel) => {
    await simulateAction();
    setData((current) => current.map((item) => item.id === channel.id ? { ...item, enabled: !item.enabled } : item));
    showToast({ type: 'success', title: `${channelMeta[channel.id]?.label || channel.name} actualizado` });
  };

  const openConfig = (channel) => {
    setConfiguring(channel);
    setConfigValues(channel.config || {});
  };

  const saveConfig = async () => {
    await simulateAction();
    setData((current) => current.map((item) => item.id === configuring.id ? { ...item, config: configValues } : item));
    setConfiguring(null);
    showToast({ type: 'success', title: 'Configuracion guardada', message: `${channelMeta[configuring.id]?.label || configuring.name} quedo listo para operar.` });
  };

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Canales de notificacion</h1>
        <p className="mt-1 text-sm text-neutral-500">Activa canales de salida y configura el provider asociado.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {isLoading && Array.from({ length: 4 }, (_, index) => <div key={index} className="h-40 animate-pulse rounded-lg bg-neutral-100" />)}
        {(data || []).map((channel) => (
          <Card key={channel.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                {(() => {
                  const Icon = channelMeta[channel.id]?.icon || Settings;
                  return <Icon className="mb-3 h-6 w-6 text-primary-600" aria-hidden="true" />;
                })()}
                <h2 className="font-semibold text-neutral-900">{channelMeta[channel.id]?.label || channel.name}</h2>
                <p className="mt-1 min-h-10 text-sm text-neutral-500">{channelMeta[channel.id]?.description}</p>
              </div>
              <Badge tone={channel.enabled ? 'success' : 'neutral'}>{channel.enabled ? 'Activo' : 'Inactivo'}</Badge>
            </div>
            <div className="mt-5 grid gap-3">
              <Toggle
                checked={channel.enabled}
                onChange={() => toggle(channel)}
                label={channel.enabled ? 'Canal habilitado' : 'Canal deshabilitado'}
                description={channel.enabled ? 'Puede enviar notificaciones.' : 'No enviara mensajes.'}
              />
              <Button onClick={() => openConfig(channel)} disabled={!channel.enabled}>
                <Settings className="h-4 w-4" />
                Configurar
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Modal isOpen={Boolean(configuring)} title={`Configurar ${channelMeta[configuring?.id]?.label || configuring?.name || ''}`} onClose={() => setConfiguring(null)}>
        <div className="grid gap-4">
          <div className="rounded-lg border border-primary-100 bg-primary-50 px-4 py-3 text-sm text-primary-700">
            Los campos se ajustan al provider del canal seleccionado.
          </div>
          {(configuring?.fields || []).map((field) => (
            <Input
              key={field}
              label={fieldLabels[field] || field}
              type={field.toLowerCase().includes('token') || field.toLowerCase().includes('key') ? 'password' : 'text'}
              placeholder={`Valor de ${fieldLabels[field] || field}`}
              value={configValues[field] || ''}
              onChange={(event) => setConfigValues((current) => ({ ...current, [field]: event.target.value }))}
            />
          ))}
          <Button onClick={saveConfig}>Guardar configuracion</Button>
        </div>
      </Modal>
    </div>
  );
};

export default Canales;
