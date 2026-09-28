import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { SIDE_LABELS, STATUS_LABELS, dateTime } from '../../lib/format.js';
import { useApi } from '../hooks.js';
import { GuestCharts } from '../components/Charts.jsx';
import { Badge, Button, Card, EmptyState, ErrorBox, Field, IconButton, Input, Loading, Modal, PageHeader, Select, StatCard, useConfirm, useToast } from '../components/ui.jsx';

export const STATUS_OPTIONS = Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label }));
export const SIDE_OPTIONS = Object.entries(SIDE_LABELS).map(([value, label]) => ({ value, label }));
export const STATUS_TONE = { ATTENDING: 'green', NOT_ATTENDING: 'gray', PENDING: 'amber' };

function AddGuestModal({ open, onClose, onCreated }) {
  const toast = useToast();
  const { data } = useApi(open ? '/api/families' : null);
  const [form, setForm] = useState({ fullName: '', familyId: '', status: 'PENDING' });
  const [busy, setBusy] = useState(false);
  const families = data?.families || [];

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post('/api/guests', { ...form, familyId: form.familyId || families[0]?.id });
      toast('Invitado agregado');
      setForm({ fullName: '', familyId: form.familyId, status: 'PENDING' });
      onCreated();
      onClose();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Agregar invitado">
      {families.length === 0 && data ? (
        <EmptyState icon="home" title="Primero registra una familia">
          <Link to="/admin/familias">Ir a Familias</Link>
        </EmptyState>
      ) : (
        <form onSubmit={submit} className="a-form-stack">
          <Field label="Nombre completo">
            <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required minLength={2} maxLength={120} />
          </Field>
          <Field label="Familia">
            <Select value={form.familyId || families[0]?.id || ''} onChange={(e) => setForm({ ...form, familyId: e.target.value })} options={families.map((f) => ({ value: f.id, label: `Familia ${f.surnames}` }))} />
          </Field>
          <Field label="Estado">
            <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} options={STATUS_OPTIONS} />
          </Field>
          <Button type="submit" icon="plus" loading={busy}>
            Agregar
          </Button>
        </form>
      )}
    </Modal>
  );
}

export default function GuestsPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const [params, setParams] = useSearchParams();
  const status = params.get('status') || '';
  const side = params.get('side') || '';
  const [q, setQ] = useState('');
  const [adding, setAdding] = useState(false);
  const query = new URLSearchParams({ ...(status && { status }), ...(side && { side }), ...(q.trim() && { q: q.trim() }) }).toString();
  const list = useApi(`/api/guests${query ? `?${query}` : ''}`, { live: true });
  const stats = useApi('/api/guests/stats', { live: true });

  const setFilter = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  async function changeStatus(guest, value) {
    list.setData({ guests: list.data.guests.map((g) => (g.id === guest.id ? { ...g, status: value } : g)) });
    try {
      await api.put(`/api/guests/${guest.id}`, { status: value });
      toast(`${guest.fullName}: ${STATUS_LABELS[value]}`);
      stats.reload();
    } catch (err) {
      toast(err.message, 'error');
      list.reload();
    }
  }

  async function remove(guest) {
    if (!(await confirm(`Se eliminará a ${guest.fullName} de la lista de invitados.`, { confirmText: 'Eliminar' }))) return;
    try {
      await api.del(`/api/guests/${guest.id}`);
      toast('Invitado eliminado');
      list.reload();
      stats.reload();
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  const t = stats.data?.totals;

  return (
    <div className="a-page">
      <PageHeader
        title="Invitados"
        description="Estadísticas y lista completa. Cambia el estado de cualquier persona manualmente."
        actions={
          <Button icon="plus" onClick={() => setAdding(true)}>
            Agregar invitado
          </Button>
        }
      />

      <div className="a-stats a-stats--4">
        <StatCard label="Total invitados" value={t?.total} icon="users" tone="rose" onClick={() => setFilter('status', '')} />
        <StatCard label="Confirmados" value={t?.attending} icon="check" tone="green" onClick={() => setFilter('status', 'ATTENDING')} />
        <StatCard label="No asistirán" value={t?.notAttending} icon="x" tone="gray" onClick={() => setFilter('status', 'NOT_ATTENDING')} />
        <StatCard label="Pendientes" value={t?.pending} icon="clock" tone="amber" onClick={() => setFilter('status', 'PENDING')} />
      </div>

      {stats.data && (
        <>
          <div className="a-stats a-stats--4">
            {Object.entries(stats.data.bySide).map(([key, s]) => (
              <button key={key} type="button" className={`a-side-card ${side === key ? 'is-active' : ''}`} onClick={() => setFilter('side', side === key ? '' : key)}>
                <strong>{SIDE_LABELS[key]}</strong>
                <span className="a-side-card__total">{s.total}</span>
                <span className="a-side-card__detail">
                  <em className="t-green">{s.attending} confirmados</em> · <em className="t-amber">{s.pending} pendientes</em> · <em className="t-gray">{s.notAttending} no</em>
                </span>
              </button>
            ))}
          </div>
          <Card title="Gráficos">
            <GuestCharts stats={stats.data} />
          </Card>
        </>
      )}

      <Card
        title="Lista de invitados"
        actions={
          <div className="a-filters">
            <Input placeholder="Buscar por nombre…" value={q} onChange={(e) => setQ(e.target.value)} />
            <Select value={status} onChange={(e) => setFilter('status', e.target.value)} options={[{ value: '', label: 'Todos los estados' }, ...STATUS_OPTIONS]} />
            <Select value={side} onChange={(e) => setFilter('side', e.target.value)} options={[{ value: '', label: 'Todas las clasificaciones' }, ...SIDE_OPTIONS]} />
          </div>
        }
      >
        <ErrorBox error={list.error} onRetry={list.reload} />
        {list.loading ? (
          <Loading />
        ) : !list.data?.guests.length ? (
          <EmptyState icon="users" title="No hay invitados con estos filtros" />
        ) : (
          <div className="a-table-wrap">
            <table className="a-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Familia</th>
                  <th>Clasificación</th>
                  <th>Estado</th>
                  <th>Respondió</th>
                  <th aria-label="Acciones" />
                </tr>
              </thead>
              <tbody>
                {list.data.guests.map((g) => (
                  <tr key={g.id}>
                    <td data-label="Nombre">
                      <strong>{g.fullName}</strong>
                    </td>
                    <td data-label="Familia">
                      <Link to={`/admin/familias?open=${g.family.id}`} className="a-link">
                        {g.family.surnames}
                      </Link>
                    </td>
                    <td data-label="Clasificación">
                      <Badge>{SIDE_LABELS[g.family.side]}</Badge>
                    </td>
                    <td data-label="Estado">
                      <Select className={`a-status a-status--${STATUS_TONE[g.status]}`} value={g.status} onChange={(e) => changeStatus(g, e.target.value)} options={STATUS_OPTIONS} aria-label={`Estado de ${g.fullName}`} />
                    </td>
                    <td data-label="Respondió" className="a-muted">
                      {g.respondedAt ? dateTime(g.respondedAt) : '—'}
                    </td>
                    <td className="a-table__actions">
                      <IconButton icon="trash" label="Eliminar" variant="danger" onClick={() => remove(g)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <AddGuestModal
        open={adding}
        onClose={() => setAdding(false)}
        onCreated={() => {
          list.reload();
          stats.reload();
        }}
      />
    </div>
  );
}
