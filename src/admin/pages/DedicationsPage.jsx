import { useState } from 'react';
import { api } from '../../lib/api.js';
import { MODERATION_LABELS, dateTime, timeAgo } from '../../lib/format.js';
import { useApi } from '../hooks.js';
import { Badge, Button, Card, EmptyState, ErrorBox, Loading, PageHeader, Tabs, Toggle, useConfirm, useToast } from '../components/ui.jsx';

const TONE = { PENDING: 'amber', APPROVED: 'green', REJECTED: 'gray' };

export default function DedicationsPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const [status, setStatus] = useState('PENDING');
  const { data, error, loading, reload } = useApi(`/api/dedications${status ? `?status=${status}` : ''}`, { live: true });
  const settings = useApi('/api/settings');

  async function setDedicationStatus(d, value) {
    try {
      await api.patch(`/api/dedications/${d.id}`, { status: value });
      toast(value === 'APPROVED' ? 'Dedicatoria aprobada y publicada' : value === 'REJECTED' ? 'Dedicatoria rechazada' : 'Marcada como pendiente');
      reload();
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  async function remove(d) {
    if (!(await confirm(`Se eliminará la dedicatoria de ${d.name}.`, { confirmText: 'Eliminar' }))) return;
    try {
      await api.del(`/api/dedications/${d.id}`);
      toast('Dedicatoria eliminada');
      reload();
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  async function toggleEnabled(value) {
    const prev = settings.data.settings;
    settings.setData({ settings: { ...prev, dedicationsEnabled: value } });
    try {
      await api.put('/api/settings', { dedicationsEnabled: value });
    } catch (err) {
      toast(err.message, 'error');
      settings.setData({ settings: prev });
    }
  }

  const stats = data?.stats || {};

  return (
    <div className="a-page">
      <PageHeader title="Dedicatorias" description="Mensajes de los invitados. Solo se publican los aprobados." />
      {settings.data && (
        <Card>
          <Toggle checked={settings.data.settings.dedicationsEnabled} onChange={toggleEnabled} label="Permitir escribir dedicatorias" />
        </Card>
      )}
      <Tabs
        value={status}
        onChange={setStatus}
        tabs={[
          { value: 'PENDING', label: 'Pendientes', count: stats.PENDING },
          { value: 'APPROVED', label: 'Aprobadas', count: stats.APPROVED },
          { value: 'REJECTED', label: 'Rechazadas', count: stats.REJECTED },
          { value: '', label: 'Todas' },
        ]}
      />
      <ErrorBox error={error} onRetry={reload} />
      {loading ? (
        <Loading />
      ) : !data?.dedications.length ? (
        <Card>
          <EmptyState icon="message" title="No hay dedicatorias aquí" />
        </Card>
      ) : (
        <div className="a-dedications">
          {data.dedications.map((d) => (
            <article key={d.id} className="a-dedication">
              <header>
                <strong>{d.name}</strong>
                <Badge tone={TONE[d.status]}>{MODERATION_LABELS[d.status]}</Badge>
              </header>
              <p>{d.message}</p>
              <small className="a-muted" title={dateTime(d.createdAt)}>
                {timeAgo(d.createdAt)}
              </small>
              <div className="a-photo__actions">
                {d.status !== 'APPROVED' && (
                  <Button size="sm" variant="success" icon="check" onClick={() => setDedicationStatus(d, 'APPROVED')}>
                    Aprobar
                  </Button>
                )}
                {d.status !== 'REJECTED' && (
                  <Button size="sm" variant="ghost" icon="x" onClick={() => setDedicationStatus(d, 'REJECTED')}>
                    Rechazar
                  </Button>
                )}
                <Button size="sm" variant="ghost-danger" icon="trash" onClick={() => remove(d)}>
                  Eliminar
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
