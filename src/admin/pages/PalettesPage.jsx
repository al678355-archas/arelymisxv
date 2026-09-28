import { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { PALETTE_LABELS } from '../../lib/theme.js';
import { useApi } from '../hooks.js';
import { useAutosave } from '../../hooks/useAutosave.js';
import { usePalette } from '../palette.jsx';
import { ColorField } from '../components/ColorFields.jsx';
import PreviewFrame from '../components/PreviewFrame.jsx';
import { Badge, Button, Card, EmptyState, ErrorBox, Field, IconButton, Input, Loading, Modal, PageHeader, SaveStatus, useConfirm, useToast } from '../components/ui.jsx';

const KEYS = Object.keys(PALETTE_LABELS);
// Colores más representativos para la vista rápida de cada paleta
const PREVIEW_KEYS = ['primaryColor', 'secondaryColor', 'accentColor', 'backgroundColor', 'titleColor', 'decorationColor'];
const pick = (src) => Object.fromEntries(KEYS.map((k) => [k, src?.[k] || '']));

function PaletteChips({ colors }) {
  return (
    <span className="a-palette-chips" aria-hidden="true">
      {PREVIEW_KEYS.map((k) => (
        <i key={k} style={{ background: colors[k] }} title={PALETTE_LABELS[k]} />
      ))}
    </span>
  );
}

function PaletteModal({ open, initial, current, onClose, onSaved }) {
  const toast = useToast();
  const editing = Boolean(initial?.id);
  const [name, setName] = useState('');
  const [colors, setColors] = useState({});
  const [busy, setBusy] = useState(false);
  const [prev, setPrev] = useState(null);
  if (open && prev !== initial) {
    setPrev(initial);
    setName(editing ? initial.name : '');
    setColors(pick(editing ? initial.colors : current));
  }

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    try {
      if (editing) await api.put(`/api/palettes/${initial.id}`, { name, colors });
      else await api.post('/api/palettes', { name, colors });
      toast(editing ? 'Paleta actualizada' : 'Paleta guardada');
      onSaved();
      onClose();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? `Editar "${initial.name}"` : 'Crear paleta'} wide>
      <form className="a-form-stack" onSubmit={save}>
        <Field label="Nombre de la paleta">
          <Input value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={60} placeholder="Ej. Rosa y dorado" />
        </Field>
        <PaletteChips colors={colors} />
        <div className="a-grid a-grid--colors">
          {KEYS.map((k) => (
            <ColorField key={k} label={PALETTE_LABELS[k]} value={colors[k]} onChange={(v) => setColors((c) => ({ ...c, [k]: v }))} tokens={false} />
          ))}
        </div>
        <Button type="submit" icon="check" loading={busy}>
          {editing ? 'Guardar cambios' : 'Guardar paleta'}
        </Button>
      </form>
    </Modal>
  );
}

export default function PalettesPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const { theme, setTheme } = usePalette();
  const presets = useApi('/api/palettes');
  const [draft, setDraft] = useState(null);
  const [modal, setModal] = useState(null);
  const [applying, setApplying] = useState('');

  useEffect(() => {
    if (theme && !draft) setDraft(pick(theme));
  }, [theme, draft]);

  const autosave = useAutosave(draft, (value) => api.put('/api/theme', value), { delay: 600 });
  const resetAutosave = autosave.reset;

  function loadTheme(next) {
    const colors = pick(next);
    resetAutosave(colors);
    setDraft(colors);
    setTheme(next);
  }

  async function apply(p) {
    setApplying(p.id);
    try {
      const res = await api.post(`/api/palettes/${p.id}/apply`);
      loadTheme(res.theme);
      toast(`Paleta "${p.name}" aplicada`);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setApplying('');
    }
  }

  async function restore() {
    if (!(await confirm('Los colores volverán a la paleta original del diseño. Tus paletas guardadas no se borran.', { title: '¿Restaurar la paleta original?', confirmText: 'Restaurar colores', danger: false }))) return;
    try {
      const res = await api.post('/api/theme/restore-colors');
      loadTheme(res.theme);
      toast('Colores originales restaurados');
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  async function remove(p) {
    if (!(await confirm(`Se eliminará la paleta "${p.name}". Los colores actuales no cambian.`, { confirmText: 'Eliminar' }))) return;
    try {
      await api.del(`/api/palettes/${p.id}`);
      toast('Paleta eliminada');
      presets.reload();
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  if (!draft) return <Loading skeleton={6} />;
  const palettes = presets.data?.palettes || [];
  const isCurrent = (p) => KEYS.every((k) => (p.colors[k] || '').toLowerCase() === (draft[k] || '').toLowerCase());

  return (
    <div className="a-page a-page--with-preview">
      <div className="a-page__main">
        <PageHeader
          title="Paletas de color"
          description="Todos los colores de la invitación —también brillos, partículas, botones, loaders y animaciones— salen de esta paleta."
          actions={<SaveStatus status={autosave.status} error={autosave.error} />}
        />

        <Card
          title="Paleta actual"
          description="Toca un color para cambiarlo; se aplica en vivo."
          actions={
            <>
              <Button variant="ghost" icon="undo" onClick={restore}>
                Restaurar colores originales
              </Button>
              <Button variant="soft" icon="plus" onClick={() => setModal({})}>
                Guardar como paleta
              </Button>
            </>
          }
        >
          <div className="a-current-palette">
            {KEYS.map((k) => (
              <ColorField key={k} label={PALETTE_LABELS[k]} value={draft[k]} onChange={(v) => setDraft((d) => ({ ...d, [k]: v }))} tokens={false} />
            ))}
          </div>
        </Card>

        <Card
          title="Paletas"
          description="Toca una paleta para aplicarla al instante."
          actions={
            <Button icon="plus" onClick={() => setModal({})}>
              Crear paleta
            </Button>
          }
        >
          <ErrorBox error={presets.error} onRetry={presets.reload} />
          {presets.loading ? (
            <Loading skeleton={3} />
          ) : palettes.length === 0 ? (
            <EmptyState icon="palette" title="Aún no hay paletas" />
          ) : (
            <div className="a-palettes">
              {palettes.map((p) => (
                <article key={p.id} className={`a-palette-card ${isCurrent(p) ? 'is-current' : ''}`}>
                  <button type="button" className="a-palette-card__apply" onClick={() => apply(p)} disabled={Boolean(applying)} aria-label={`Aplicar ${p.name}`}>
                    <span className="a-palette-card__hero" style={{ background: `linear-gradient(135deg, ${p.colors.backgroundColor} 0 40%, ${p.colors.secondaryColor} 40% 62%, ${p.colors.primaryColor} 62% 82%, ${p.colors.accentColor} 82%)` }}>
                      <span style={{ color: p.colors.titleColor, fontFamily: 'Georgia, serif' }}>XV</span>
                    </span>
                    <PaletteChips colors={p.colors} />
                    <strong>{p.name}</strong>
                    {isCurrent(p) ? <Badge tone="green">En uso</Badge> : <small>{applying === p.id ? 'Aplicando…' : 'Aplicar'}</small>}
                  </button>
                  {p.isSystem ? (
                    <span className="a-palette-card__tag">Predeterminada</span>
                  ) : (
                    <span className="a-palette-card__actions">
                      <IconButton icon="edit" label="Editar" onClick={() => setModal(p)} />
                      <IconButton icon="trash" label="Eliminar" variant="danger" onClick={() => remove(p)} />
                    </span>
                  )}
                </article>
              ))}
            </div>
          )}
        </Card>
      </div>
      <PreviewFrame />
      <PaletteModal open={Boolean(modal)} initial={modal} current={draft} onClose={() => setModal(null)} onSaved={presets.reload} />
    </div>
  );
}
