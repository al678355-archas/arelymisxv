import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { SIDE_LABELS, STATUS_LABELS } from '../../lib/format.js';
import { useApi } from '../hooks.js';
import { SIDE_OPTIONS, STATUS_OPTIONS, STATUS_TONE } from './GuestsPage.jsx';
import { Badge, Button, Card, EmptyState, ErrorBox, Field, Icon, IconButton, Input, Loading, Modal, PageHeader, Select, TextArea, useConfirm, useToast } from '../components/ui.jsx';

function NewFamilyModal({ open, onClose, onCreated }) {
  const toast = useToast();
  const [form, setForm] = useState({ surnames: '', side: 'PATERNAL', notes: '', names: '' });
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const guests = form.names
        .split('\n')
        .map((n) => n.trim())
        .filter((n) => n.length >= 2);
      const res = await api.post('/api/families', { surnames: form.surnames, side: form.side, notes: form.notes, guests });
      toast(`Familia ${res.family.surnames} registrada`);
      setForm({ surnames: '', side: form.side, notes: '', names: '' });
      onCreated(res.family);
      onClose();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Nueva familia">
      <form onSubmit={submit} className="a-form-stack">
        <Field label="Apellidos familiares" hint="Así la buscarán los invitados, ej. López Martínez">
          <Input value={form.surnames} onChange={(e) => setForm({ ...form, surnames: e.target.value })} required minLength={2} maxLength={120} />
        </Field>
        <Field label="Clasificación">
          <Select value={form.side} onChange={(e) => setForm({ ...form, side: e.target.value })} options={SIDE_OPTIONS} />
        </Field>
        <Field label="Integrantes" hint="Un nombre completo por línea.">
          <TextArea rows={5} value={form.names} onChange={(e) => setForm({ ...form, names: e.target.value })} placeholder={'Juan López Martínez\nMaría López Martínez'} />
        </Field>
        <Field label="Observaciones">
          <TextArea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} maxLength={1000} />
        </Field>
        <Button type="submit" icon="plus" loading={busy}>
          Registrar familia
        </Button>
      </form>
    </Modal>
  );
}

function GuestRow({ guest, families, onChanged, onDeleted }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [name, setName] = useState(guest.fullName);
  useEffect(() => setName(guest.fullName), [guest.fullName]);

  async function save(patch, message) {
    try {
      await api.put(`/api/guests/${guest.id}`, patch);
      if (message) toast(message);
      onChanged();
    } catch (err) {
      toast(err.message, 'error');
      setName(guest.fullName);
    }
  }

  async function remove() {
    if (!(await confirm(`Se eliminará a ${guest.fullName}.`, { confirmText: 'Eliminar' }))) return;
    try {
      await api.del(`/api/guests/${guest.id}`);
      toast('Persona eliminada');
      onDeleted();
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  return (
    <li className="a-guest-row">
      <Input
        className="a-guest-row__name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={() => name.trim() !== guest.fullName && name.trim().length >= 2 && save({ fullName: name.trim() }, 'Nombre actualizado')}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        aria-label="Nombre completo"
      />
      <Select className={`a-status a-status--${STATUS_TONE[guest.status]}`} value={guest.status} onChange={(e) => save({ status: e.target.value }, `${guest.fullName}: ${STATUS_LABELS[e.target.value]}`)} options={STATUS_OPTIONS} aria-label="Estado" />
      <Select
        value={guest.familyId}
        onChange={(e) => save({ familyId: e.target.value }, 'Persona movida de familia')}
        options={families.map((f) => ({ value: f.id, label: `Familia ${f.surnames}` }))}
        aria-label="Cambiar familia"
        title="Cambiar de familia"
      />
      <IconButton icon="trash" label="Eliminar persona" variant="danger" onClick={remove} />
    </li>
  );
}

function FamilyAccordion({ family, families, open, onToggle, onChanged }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [newName, setNewName] = useState('');
  const [edit, setEdit] = useState({ surnames: family.surnames, side: family.side, notes: family.notes });
  const dirty = edit.surnames !== family.surnames || edit.side !== family.side || edit.notes !== family.notes;
  const s = family.stats;

  useEffect(() => setEdit({ surnames: family.surnames, side: family.side, notes: family.notes }), [family.surnames, family.side, family.notes]);

  async function addGuest(e) {
    e.preventDefault();
    if (newName.trim().length < 2) return;
    try {
      await api.post('/api/guests', { fullName: newName.trim(), familyId: family.id });
      setNewName('');
      onChanged();
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  async function saveFamily() {
    try {
      await api.put(`/api/families/${family.id}`, edit);
      toast('Familia actualizada');
      onChanged();
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  async function removeFamily() {
    if (!(await confirm(`Se eliminará la familia ${family.surnames} con sus ${s.total} integrantes y su historial de confirmaciones.`, { confirmText: 'Eliminar familia' }))) return;
    try {
      await api.del(`/api/families/${family.id}`);
      toast('Familia eliminada');
      onChanged();
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  return (
    <li className={`a-accordion ${open ? 'is-open' : ''}`} id={`family-${family.id}`}>
      <button type="button" className="a-accordion__head" onClick={onToggle} aria-expanded={open}>
        <span className="a-accordion__title">
          <strong>Familia {family.surnames}</strong>
          <span className="a-accordion__meta">
            <Badge>{SIDE_LABELS[family.side]}</Badge>
            {family.isSample && <Badge tone="violet">Ejemplo</Badge>}
          </span>
        </span>
        <span className="a-accordion__counts">
          <span>
            <span className="t-green">{s.attending}</span> / {s.total}
          </span>
          <small>confirmados</small>
        </span>
        <Icon name="chevronDown" size={20} className="a-accordion__chevron" />
      </button>
      <div className="a-accordion__panel">
        <div className="a-accordion__inner">
          {family.guests.length === 0 ? (
            <p className="a-muted">Esta familia aún no tiene integrantes.</p>
          ) : (
            <ul className="a-guest-list">
              {family.guests.map((g) => (
                <GuestRow key={g.id} guest={g} families={families} onChanged={onChanged} onDeleted={onChanged} />
              ))}
            </ul>
          )}
          <form className="a-inline a-add-guest" onSubmit={addGuest}>
            <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nombre completo de la nueva persona" maxLength={120} />
            <Button type="submit" variant="soft" icon="plus" disabled={newName.trim().length < 2}>
              Agregar persona
            </Button>
          </form>

          <details className="a-details">
            <summary>Editar datos de la familia</summary>
            <div className="a-form-stack">
              <div className="a-grid a-grid--2">
                <Field label="Apellidos familiares">
                  <Input value={edit.surnames} onChange={(e) => setEdit({ ...edit, surnames: e.target.value })} maxLength={120} />
                </Field>
                <Field label="Clasificación">
                  <Select value={edit.side} onChange={(e) => setEdit({ ...edit, side: e.target.value })} options={SIDE_OPTIONS} />
                </Field>
              </div>
              <Field label="Observaciones">
                <TextArea rows={2} value={edit.notes} onChange={(e) => setEdit({ ...edit, notes: e.target.value })} maxLength={1000} />
              </Field>
              <div className="a-inline a-inline--between">
                <Button icon="check" onClick={saveFamily} disabled={!dirty || edit.surnames.trim().length < 2}>
                  Guardar
                </Button>
                <Button variant="ghost-danger" icon="trash" onClick={removeFamily}>
                  Eliminar familia
                </Button>
              </div>
            </div>
          </details>
          {family.notes && <p className="a-family-notes">📝 {family.notes}</p>}
        </div>
      </div>
    </li>
  );
}

export default function FamiliesPage() {
  const [params] = useSearchParams();
  const [q, setQ] = useState('');
  const [side, setSide] = useState('');
  const [openIds, setOpenIds] = useState(() => new Set(params.get('open') ? [params.get('open')] : []));
  const [creating, setCreating] = useState(false);
  const query = new URLSearchParams({ ...(q.trim() && { q: q.trim() }), ...(side && { side }) }).toString();
  const { data, error, loading, reload } = useApi(`/api/families${query ? `?${query}` : ''}`, { live: true });
  const all = useApi('/api/families');
  const families = data?.families || [];

  useEffect(() => {
    const target = params.get('open');
    if (target && data) document.getElementById(`family-${target}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [data, params]);

  const toggle = (id) =>
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const refresh = () => {
    reload();
    all.reload();
  };

  return (
    <div className="a-page">
      <PageHeader
        title="Familias"
        description="Organiza a los invitados por familia. Los invitados buscan su invitación por los apellidos familiares."
        actions={
          <Button icon="plus" onClick={() => setCreating(true)}>
            Nueva familia
          </Button>
        }
      />
      <Card
        padded={false}
        title={`${families.length} familias`}
        actions={
          <div className="a-filters">
            <Input placeholder="Buscar familia o persona…" value={q} onChange={(e) => setQ(e.target.value)} />
            <Select value={side} onChange={(e) => setSide(e.target.value)} options={[{ value: '', label: 'Todas' }, ...SIDE_OPTIONS]} />
            <Button variant="ghost" size="sm" onClick={() => setOpenIds(openIds.size ? new Set() : new Set(families.map((f) => f.id)))}>
              {openIds.size ? 'Contraer todas' : 'Expandir todas'}
            </Button>
          </div>
        }
      >
        <ErrorBox error={error} onRetry={reload} />
        {loading ? (
          <Loading />
        ) : families.length === 0 ? (
          <EmptyState icon="home" title="No hay familias registradas">
            Crea la primera con “Nueva familia”.
          </EmptyState>
        ) : (
          <ul className="a-accordions">
            {families.map((f) => (
              <FamilyAccordion key={f.id} family={f} families={all.data?.families || families} open={openIds.has(f.id)} onToggle={() => toggle(f.id)} onChanged={refresh} />
            ))}
          </ul>
        )}
      </Card>
      <NewFamilyModal
        open={creating}
        onClose={() => setCreating(false)}
        onCreated={(family) => {
          setOpenIds((prev) => new Set(prev).add(family.id));
          refresh();
        }}
      />
    </div>
  );
}
