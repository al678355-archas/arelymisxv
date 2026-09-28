// Editores reutilizables: evento/sedes, itinerario e historia. Todos con autoguardado.
import { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { useAutosave } from '../../hooks/useAutosave.js';
import { useApi } from '../hooks.js';
import ImageUploader from './ImageUploader.jsx';
import { ICON_NAMES, ICON_LABELS } from '../../site/components/Icon.jsx';
import { Button, Card, EmptyState, ErrorBox, Field, Icon, IconButton, Input, Loading, SaveStatus, Select, TextArea, useConfirm, useToast } from './ui.jsx';

// ─── Evento y sedes ─────────────────────────────────────────────────────

const EVENT_FIELDS = ['eventDate', 'eventTime', 'utcOffset', 'ceremonyName', 'ceremonyAddress', 'ceremonyTime', 'ceremonyMapUrl', 'ceremonyImageId', 'receptionName', 'receptionAddress', 'receptionTime', 'receptionMapUrl', 'receptionImageId'];

const OFFSETS = [
  { value: '-08:00', label: 'UTC −08:00 (Tijuana)' },
  { value: '-07:00', label: 'UTC −07:00 (Hermosillo, Chihuahua)' },
  { value: '-06:00', label: 'UTC −06:00 (Ciudad de México, Guadalajara, Monterrey)' },
  { value: '-05:00', label: 'UTC −05:00 (Cancún, Bogotá, Lima)' },
  { value: '-04:00', label: 'UTC −04:00' },
  { value: '-03:00', label: 'UTC −03:00 (Buenos Aires)' },
  { value: '+01:00', label: 'UTC +01:00 (Madrid, invierno)' },
  { value: '+02:00', label: 'UTC +02:00 (Madrid, verano)' },
];

export function useEventDraft() {
  const { data, error, reload } = useApi('/api/event');
  const [draft, setDraft] = useState(null);
  const [images, setImages] = useState({});

  useEffect(() => {
    if (data?.event && !draft) {
      setDraft(Object.fromEntries(EVENT_FIELDS.map((k) => [k, data.event[k] ?? (k.endsWith('ImageId') ? null : '')])));
      setImages({ ceremony: data.event.ceremonyImage, reception: data.event.receptionImage });
    }
  }, [data, draft]);

  const autosave = useAutosave(draft, (value) => api.put('/api/event', value));
  return { draft, setDraft, images, setImages, error, reload, autosave };
}

export function EventDateFields({ draft, set }) {
  return (
    <div className="a-grid a-grid--3">
      <Field label="Fecha del evento">
        <Input type="date" value={draft.eventDate} onChange={(e) => set({ eventDate: e.target.value })} required />
      </Field>
      <Field label="Hora de inicio" hint="Se usa en la cuenta regresiva.">
        <Input type="time" value={draft.eventTime} onChange={(e) => set({ eventTime: e.target.value })} required />
      </Field>
      <Field label="Zona horaria">
        <Select value={draft.utcOffset} onChange={(e) => set({ utcOffset: e.target.value })} options={OFFSETS.some((o) => o.value === draft.utcOffset) ? OFFSETS : [...OFFSETS, { value: draft.utcOffset, label: `UTC ${draft.utcOffset}` }]} />
      </Field>
    </div>
  );
}

export function VenueFields({ prefix, draft, set, image, onImage }) {
  const f = (name) => `${prefix}${name}`;
  return (
    <div className="a-form-stack">
      <div className="a-grid a-grid--2">
        <Field label={prefix === 'ceremony' ? 'Lugar (iglesia / sede)' : 'Salón'}>
          <Input value={draft[f('Name')]} onChange={(e) => set({ [f('Name')]: e.target.value })} />
        </Field>
        <Field label="Horario" hint="Texto libre, ej. 16:00 hrs">
          <Input value={draft[f('Time')]} onChange={(e) => set({ [f('Time')]: e.target.value })} />
        </Field>
      </div>
      <Field label="Dirección">
        <TextArea rows={2} value={draft[f('Address')]} onChange={(e) => set({ [f('Address')]: e.target.value })} />
      </Field>
      <Field label="Enlace de Google Maps" hint="Abre Google Maps, busca el lugar, toca “Compartir” y pega el enlace aquí.">
        <Input type="url" value={draft[f('MapUrl')]} onChange={(e) => set({ [f('MapUrl')]: e.target.value })} placeholder="https://maps.app.goo.gl/…" />
      </Field>
      <div className="a-field">
        <span className="a-field__label">Imagen</span>
        <ImageUploader
          folder="eventos"
          value={image}
          onChange={(img) => {
            onImage(img);
            set({ [f('ImageId')]: img?.id || null });
          }}
        />
      </div>
    </div>
  );
}

// Editor de una sola sede (dentro del editor de la sección Ceremonia/Recepción).
export function VenueEditor({ prefix, onDraft }) {
  const { draft, setDraft, images, setImages, error, reload, autosave } = useEventDraft();
  // Vista previa instantánea en el editor visual
  useEffect(() => {
    if (draft && onDraft) onDraft({ ...draft, ceremonyImage: images.ceremony || null, receptionImage: images.reception || null });
  }, [draft, images, onDraft]);
  if (error) return <ErrorBox error={error} onRetry={reload} />;
  if (!draft) return <Loading />;
  return (
    <Card title={prefix === 'ceremony' ? 'Datos de la ceremonia' : 'Datos de la recepción'} actions={<SaveStatus status={autosave.status} error={autosave.error} />}>
      <VenueFields prefix={prefix} draft={draft} set={(patch) => setDraft((d) => ({ ...d, ...patch }))} image={images[prefix]} onImage={(img) => setImages((i) => ({ ...i, [prefix]: img }))} />
    </Card>
  );
}

// ─── Listas ordenables (itinerario / historia) ──────────────────────────

function useOrderedList(path) {
  const toast = useToast();
  const confirm = useConfirm();
  const { data, setData, error, loading, reload } = useApi(path);
  const items = data?.items || [];
  const setItems = (next) => setData({ items: next });

  async function add(payload) {
    try {
      const res = await api.post(path, payload);
      setItems([...items, res.item]);
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  async function remove(item, label) {
    if (!(await confirm(`Se eliminará "${label}".`))) return;
    try {
      await api.del(`${path}/${item.id}`);
      setItems(items.filter((i) => i.id !== item.id));
      toast('Elemento eliminado');
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  async function move(index, dir) {
    const target = index + dir;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    setItems(next);
    try {
      const res = await api.put(`${path}/reorder`, { ids: next.map((i) => i.id) });
      setItems(res.items);
    } catch (err) {
      toast(err.message, 'error');
      reload();
    }
  }

  return { items, error, loading, reload, add, remove, move };
}

function RowShell({ index, total, onMove, onDelete, status, error, children }) {
  return (
    <div className="a-row-card">
      <div className="a-row-card__order">
        <IconButton icon="arrowUp" label="Subir" onClick={() => onMove(-1)} disabled={index === 0} />
        <span>{index + 1}</span>
        <IconButton icon="arrowDown" label="Bajar" onClick={() => onMove(1)} disabled={index === total - 1} />
      </div>
      <div className="a-row-card__body">{children}</div>
      <div className="a-row-card__side">
        <SaveStatus status={status} error={error} />
        <IconButton icon="trash" label="Eliminar" variant="danger" onClick={onDelete} />
      </div>
    </div>
  );
}

const ICON_OPTIONS = ICON_NAMES.filter((n) => ICON_LABELS[n]).map((n) => ({ value: n, label: ICON_LABELS[n] }));

function ItineraryRow({ item, index, total, onMove, onDelete }) {
  const [draft, setDraft] = useState({ time: item.time, title: item.title, description: item.description, icon: item.icon || 'sparkle' });
  const autosave = useAutosave(draft, (value) => api.put(`/api/itinerary/${item.id}`, value));
  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));
  return (
    <RowShell index={index} total={total} onMove={onMove} onDelete={onDelete} status={autosave.status} error={autosave.error}>
      <div className="a-grid a-itinerary-grid">
        <Field label="Hora">
          <Input value={draft.time} onChange={(e) => set({ time: e.target.value })} placeholder="19:30" maxLength={20} />
        </Field>
        <Field label="Actividad">
          <Input value={draft.title} onChange={(e) => set({ title: e.target.value })} maxLength={120} />
        </Field>
        <Field label="Ícono">
          <span className="a-icon-select">
            <Icon name={draft.icon} size={18} />
            <Select value={draft.icon} onChange={(e) => set({ icon: e.target.value })} options={ICON_OPTIONS} />
          </span>
        </Field>
      </div>
      <Field label="Descripción (opcional)">
        <Input value={draft.description} onChange={(e) => set({ description: e.target.value })} maxLength={400} />
      </Field>
    </RowShell>
  );
}

export function ItineraryManager() {
  const { items, error, loading, reload, add, remove, move } = useOrderedList('/api/itinerary');
  if (loading) return <Loading />;
  return (
    <div className="a-form-stack">
      <ErrorBox error={error} onRetry={reload} />
      {items.length === 0 && <EmptyState icon="list" title="El itinerario está vacío" />}
      {items.map((item, index) => (
        <ItineraryRow key={item.id} item={item} index={index} total={items.length} onMove={(dir) => move(index, dir)} onDelete={() => remove(item, `${item.time} ${item.title}`)} />
      ))}
      <Button icon="plus" variant="soft" onClick={() => add({ time: '00:00', title: 'Nueva actividad', icon: 'sparkle' })}>
        Agregar actividad
      </Button>
    </div>
  );
}

function StoryRow({ item, index, total, onMove, onDelete }) {
  const [draft, setDraft] = useState({ year: item.year, title: item.title, description: item.description, mediaId: item.mediaId ?? null });
  const [image, setImage] = useState(item.image);
  const autosave = useAutosave(draft, (value) => api.put(`/api/story/${item.id}`, value));
  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));
  return (
    <RowShell index={index} total={total} onMove={onMove} onDelete={onDelete} status={autosave.status} error={autosave.error}>
      <div className="a-story-row">
        <ImageUploader
          folder="historia"
          value={image}
          compact
          onChange={(img) => {
            setImage(img);
            set({ mediaId: img?.id || null });
          }}
        />
        <div className="a-form-stack">
          <div className="a-grid a-grid--year">
            <Field label="Año / etapa">
              <Input value={draft.year} onChange={(e) => set({ year: e.target.value })} maxLength={20} />
            </Field>
            <Field label="Título">
              <Input value={draft.title} onChange={(e) => set({ title: e.target.value })} maxLength={120} />
            </Field>
          </div>
          <Field label="Descripción">
            <TextArea rows={2} value={draft.description} onChange={(e) => set({ description: e.target.value })} maxLength={600} />
          </Field>
        </div>
      </div>
    </RowShell>
  );
}

export function StoryManager() {
  const { items, error, loading, reload, add, remove, move } = useOrderedList('/api/story');
  if (loading) return <Loading />;
  return (
    <div className="a-form-stack">
      <ErrorBox error={error} onRetry={reload} />
      {items.length === 0 && <EmptyState icon="heart" title="La historia está vacía" />}
      {items.map((item, index) => (
        <StoryRow key={item.id} item={item} index={index} total={items.length} onMove={(dir) => move(index, dir)} onDelete={() => remove(item, `${item.year} ${item.title}`)} />
      ))}
      <Button icon="plus" variant="soft" onClick={() => add({ year: String(new Date().getFullYear()), title: 'Nuevo momento' })}>
        Agregar momento
      </Button>
    </div>
  );
}
