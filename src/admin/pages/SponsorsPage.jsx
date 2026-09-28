import { useState } from 'react';
import { api } from '../../lib/api.js';
import { useApi } from '../hooks.js';
import { Badge, Button, Card, Checkbox, EmptyState, ErrorBox, Field, IconButton, Input, Loading, Modal, PageHeader, Tabs, TextArea, useConfirm, useToast } from '../components/ui.jsx';

const FILTERS = [
  { value: 'all', label: 'Todos' },
  { value: 'notInformed', label: 'Falta comentar' },
  { value: 'informed', label: 'Comentados' },
  { value: 'unconfirmed', label: 'Sin confirmar' },
  { value: 'confirmed', label: 'Confirmados' },
];

const EMPTY = { sponsorName: '', concept: '', description: '', informed: false, confirmed: false, notes: '' };

function SponsorModal({ open, initial, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState(initial || EMPTY);
  const [busy, setBusy] = useState(false);
  const [prevInitial, setPrevInitial] = useState(initial);
  if (initial !== prevInitial) {
    setPrevInitial(initial);
    setForm(initial || EMPTY);
  }

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const { sponsorName, concept, description, informed, confirmed, notes } = form;
      const payload = { sponsorName, concept, description, informed, confirmed, notes };
      if (initial?.id) await api.put(`/api/sponsors/${initial.id}`, payload);
      else await api.post('/api/sponsors', payload);
      toast(initial?.id ? 'Apoyo actualizado' : 'Apoyo registrado');
      onSaved();
      onClose();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={initial?.id ? 'Editar apoyo' : 'Nuevo apoyo'}>
      <form onSubmit={submit} className="a-form-stack">
        <Field label="Nombre del padrino">
          <Input value={form.sponsorName} onChange={(e) => setForm({ ...form, sponsorName: e.target.value })} required minLength={2} maxLength={120} />
        </Field>
        <Field label="Concepto / apoyo" hint="Texto libre: pastel, vestido, fotografía, sonido, transporte…">
          <Input value={form.concept} onChange={(e) => setForm({ ...form, concept: e.target.value })} required minLength={2} maxLength={120} />
        </Field>
        <Field label="Descripción">
          <TextArea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={200} showCount />
        </Field>
        <div className="a-inline">
          <Checkbox checked={form.informed} onChange={(informed) => setForm({ ...form, informed })} label="Ya se le comentó" />
          <Checkbox checked={form.confirmed} onChange={(confirmed) => setForm({ ...form, confirmed })} label="Confirmó que sí podrá" />
        </div>
        <Field label="Observaciones">
          <TextArea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} maxLength={1000} />
        </Field>
        <Button type="submit" icon="check" loading={busy}>
          Guardar
        </Button>
      </form>
    </Modal>
  );
}

export default function SponsorsPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const [filter, setFilter] = useState('all');
  const [editing, setEditing] = useState(null);
  const { data, setData, error, loading, reload } = useApi(`/api/sponsors?filter=${filter}`);

  async function toggleFlag(sponsor, field, value) {
    setData({ ...data, sponsors: data.sponsors.map((s) => (s.id === sponsor.id ? { ...s, [field]: value } : s)) });
    try {
      await api.put(`/api/sponsors/${sponsor.id}`, { [field]: value });
      reload();
    } catch (err) {
      toast(err.message, 'error');
      reload();
    }
  }

  async function remove(sponsor) {
    if (!(await confirm(`Se eliminará el apoyo "${sponsor.concept}" de ${sponsor.sponsorName}.`, { confirmText: 'Eliminar' }))) return;
    try {
      await api.del(`/api/sponsors/${sponsor.id}`);
      toast('Apoyo eliminado');
      reload();
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  const stats = data?.stats;

  return (
    <div className="a-page">
      <PageHeader
        title="Padrinos / Apoyos"
        description="Control interno de quién apoyará con cada cosa. Esta información NO aparece en la invitación."
        actions={
          <Button icon="plus" onClick={() => setEditing({})}>
            Nuevo apoyo
          </Button>
        }
      />

      {stats && (
        <div className="a-summary">
          <span>
            <strong>{stats.total}</strong> apoyos registrados
          </span>
          <span>
            <strong>{stats.informed}</strong> comentados
          </span>
          <span>
            <strong>{stats.confirmed}</strong> confirmados
          </span>
          <span className="a-summary__bar" aria-hidden="true">
            <i style={{ width: `${stats.total ? (stats.confirmed / stats.total) * 100 : 0}%` }} />
          </span>
        </div>
      )}

      <Tabs value={filter} onChange={setFilter} tabs={FILTERS} />

      <Card padded={false}>
        <ErrorBox error={error} onRetry={reload} />
        {loading ? (
          <Loading />
        ) : !data?.sponsors.length ? (
          <EmptyState icon="handshake" title="No hay apoyos en este filtro" />
        ) : (
          <ul className="a-sponsors">
            {data.sponsors.map((s) => (
              <li key={s.id} className={`a-sponsor ${s.confirmed ? 'is-confirmed' : ''}`}>
                <div className="a-sponsor__main">
                  <div className="a-sponsor__head">
                    <Badge tone="rose">{s.concept}</Badge>
                    {s.isSample && <Badge tone="violet">Ejemplo</Badge>}
                  </div>
                  <strong className="a-sponsor__name">{s.sponsorName}</strong>
                  {s.description && <p>{s.description}</p>}
                  {s.notes && <p className="a-muted">📝 {s.notes}</p>}
                </div>
                <div className="a-sponsor__checks">
                  <Checkbox checked={s.informed} onChange={(v) => toggleFlag(s, 'informed', v)} label="Ya se le comentó" />
                  <Checkbox checked={s.confirmed} onChange={(v) => toggleFlag(s, 'confirmed', v)} label="Confirmó" />
                </div>
                <div className="a-sponsor__actions">
                  <IconButton icon="edit" label="Editar" onClick={() => setEditing(s)} />
                  <IconButton icon="trash" label="Eliminar" variant="danger" onClick={() => remove(s)} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <SponsorModal open={Boolean(editing)} initial={editing?.id ? editing : null} onClose={() => setEditing(null)} onSaved={reload} />
    </div>
  );
}
