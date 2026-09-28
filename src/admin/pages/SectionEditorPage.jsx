import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { useApi } from '../hooks.js';
import { useAutosave } from '../../hooks/useAutosave.js';
import { SECTION_SCHEMAS, ANIMATION_OPTIONS, DECORATION_OPTIONS, ALIGN_OPTIONS } from '../sectionSchemas.js';
import SchemaFields from '../components/SchemaFields.jsx';
import { BackgroundField, ColorField } from '../components/ColorFields.jsx';
import { VenueEditor, ItineraryManager, StoryManager } from '../components/Managers.jsx';
import PreviewFrame from '../components/PreviewFrame.jsx';
import { Button, Card, ErrorBox, Field, Icon, Input, Loading, PageHeader, SaveStatus, Select, Tabs, Toggle, useConfirm, useToast } from '../components/ui.jsx';

function SiteToggle({ name, label }) {
  const toast = useToast();
  const { data, setData } = useApi('/api/settings');
  if (!data) return null;
  const value = data.settings[name];
  return (
    <Card>
      <Toggle
        checked={value}
        label={label}
        description={value ? 'Activado' : 'Desactivado'}
        onChange={async (v) => {
          setData({ settings: { ...data.settings, [name]: v } });
          try {
            await api.put('/api/settings', { [name]: v });
            toast(v ? 'Activado' : 'Desactivado');
          } catch (err) {
            toast(err.message, 'error');
            setData({ settings: { ...data.settings, [name]: value } });
          }
        }}
      />
    </Card>
  );
}

function StyleEditor({ style, onChange, theme }) {
  const set = (patch) => onChange({ ...style, ...patch });
  return (
    <div className="a-form-stack">
      <Card title="Fondo">
        <BackgroundField value={style.background} onChange={(background) => set({ background })} theme={theme} />
      </Card>
      <Card title="Colores de la sección" description="Déjalos vacíos para usar los colores del tema.">
        <div className="a-grid a-grid--2">
          <ColorField label="Texto" value={style.textColor} onChange={(textColor) => set({ textColor })} allowEmpty />
          <ColorField label="Títulos" value={style.titleColor} onChange={(titleColor) => set({ titleColor })} allowEmpty />
          <ColorField label="Acento / adornos" value={style.accentColor} onChange={(accentColor) => set({ accentColor })} allowEmpty />
          <ColorField label="Fondo de tarjetas" value={style.cardBackground} onChange={(cardBackground) => set({ cardBackground })} allowEmpty />
          <ColorField label="Bordes" value={style.borderColor} onChange={(borderColor) => set({ borderColor })} allowEmpty />
        </div>
      </Card>
      <Card title="Espaciado y distribución">
        <div className="a-grid a-grid--3">
          <Field label="Espaciado vertical (px)" hint="Vacío = el del tema">
            <Input type="number" min="0" max="400" value={style.paddingY ?? ''} onChange={(e) => set({ paddingY: e.target.value === '' ? '' : Number(e.target.value) })} />
          </Field>
          <Field label="Ancho máximo del contenido (px)">
            <Input type="number" min="320" max="1920" value={style.maxWidth ?? ''} onChange={(e) => set({ maxWidth: e.target.value === '' ? '' : Number(e.target.value) })} />
          </Field>
          <Field label="Alineación del texto">
            <Select value={style.textAlign || 'center'} onChange={(e) => set({ textAlign: e.target.value })} options={ALIGN_OPTIONS} />
          </Field>
        </div>
      </Card>
      <Card title="Animación y decoración">
        <div className="a-grid a-grid--2">
          <Field label="Animación de entrada">
            <Select value={style.animation || 'fadeInUp'} onChange={(e) => set({ animation: e.target.value })} options={ANIMATION_OPTIONS} />
          </Field>
          <Field label="Decoración">
            <Select value={style.decoration || 'flowers'} onChange={(e) => set({ decoration: e.target.value })} options={DECORATION_OPTIONS} />
          </Field>
        </div>
      </Card>
    </div>
  );
}

export default function SectionEditorPage() {
  const { id } = useParams();
  const toast = useToast();
  const confirm = useConfirm();
  const { data, error, reload } = useApi(`/api/sections/${id}`);
  const theme = useApi('/api/theme');
  const [draft, setDraft] = useState(null);
  const [tab, setTab] = useState('content');

  useEffect(() => {
    setDraft(null);
  }, [id]);

  // Solo textos/estilo se autoguardan; la visibilidad tiene su propio interruptor.
  const editable = draft ? { label: draft.label, content: draft.content, style: draft.style } : null;
  const autosave = useAutosave(editable, (value) => api.put(`/api/sections/${draft.id}`, value), { delay: 700 });
  const resetAutosave = autosave.reset;

  useEffect(() => {
    if (data?.section && (!draft || data.section.id !== draft.id)) {
      const { id: sid, label, visible, content, style } = data.section;
      resetAutosave({ label, content, style });
      setDraft({ id: sid, label, visible, content, style });
    }
  }, [data, draft, resetAutosave]);

  if (error) return <ErrorBox error={error} onRetry={reload} />;
  if (!draft || draft.id !== id) return <Loading />;

  const key = data.section.key;
  const schema = SECTION_SCHEMAS[key] || { fields: [] };

  async function setVisible(visible) {
    setDraft((d) => ({ ...d, visible }));
    try {
      await api.put(`/api/sections/${id}`, { visible });
      toast(visible ? 'Sección visible' : 'Sección oculta');
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  async function resetSection() {
    if (!(await confirm('Se restaurarán los textos y el estilo originales de esta sección.', { confirmText: 'Restablecer' }))) return;
    try {
      const res = await api.post(`/api/sections/${id}/reset`);
      const { label, visible, content, style } = res.section;
      autosave.reset({ label, content, style });
      setDraft({ id, label, visible, content, style });
      toast('Sección restablecida');
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  const hasData = schema.venue || schema.manager;

  return (
    <div className="a-page a-page--with-preview">
      <div className="a-page__main">
        <Link to="/admin/secciones" className="a-back">
          <Icon name="chevronLeft" size={16} /> Secciones
        </Link>
        <PageHeader title={draft.label} description={schema.note} actions={<SaveStatus status={autosave.status} error={autosave.error} />} />

        <Card>
          <div className="a-section-meta">
            <Toggle checked={draft.visible} onChange={setVisible} label="Visible en la invitación" />
            <Field label="Nombre interno en el panel" className="a-section-meta__name">
              <Input value={draft.label} onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))} maxLength={80} />
            </Field>
            <Button variant="ghost" icon="refresh" onClick={resetSection}>
              Restablecer
            </Button>
          </div>
        </Card>

        {schema.siteToggle && <SiteToggle name={schema.siteToggle} label={schema.siteToggleLabel} />}
        {schema.galleryLink && (
          <Link to={schema.galleryLink} className="a-notice">
            <Icon name="external" size={16} /> Moderar publicaciones de esta sección
          </Link>
        )}

        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { value: 'content', label: 'Textos e imágenes' },
            ...(hasData ? [{ value: 'data', label: schema.venue ? 'Lugar y horario' : schema.manager === 'itinerary' ? 'Actividades' : 'Momentos' }] : []),
            { value: 'style', label: 'Estilo' },
          ]}
        />

        {tab === 'content' && (
          <Card>
            <SchemaFields fields={schema.fields} values={draft.content} onChange={(content) => setDraft((d) => ({ ...d, content }))} />
          </Card>
        )}
        {tab === 'data' && schema.venue && <VenueEditor prefix={schema.venue} />}
        {tab === 'data' && schema.manager === 'itinerary' && <ItineraryManager />}
        {tab === 'data' && schema.manager === 'story' && <StoryManager />}
        {tab === 'style' && <StyleEditor style={draft.style || {}} onChange={(style) => setDraft((d) => ({ ...d, style }))} theme={theme.data?.theme} />}
      </div>
      <PreviewFrame focusKey={key} />
    </div>
  );
}
