import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { useApi } from '../hooks.js';
import { SECTION_SCHEMAS, ANIMATION_OPTIONS, DECORATION_OPTIONS, ALIGN_OPTIONS, NAV_LABEL_FIELD, TRANSITION_OPTIONS } from '../sectionSchemas.js';
import SchemaFields, { SchemaField } from './SchemaFields.jsx';
import { BackgroundField, ColorField } from './ColorFields.jsx';
import ImageUploader from './ImageUploader.jsx';
import { VenueEditor, ItineraryManager, StoryManager } from './Managers.jsx';
import { Button, Card, EmptyState, Field, Icon, Input, Select, Tabs, Toggle, useToast } from './ui.jsx';

export const PROPERTY_TABS = [
  { value: 'content', label: 'Contenido' },
  { value: 'design', label: 'Diseño' },
  { value: 'background', label: 'Fondo' },
  { value: 'images', label: 'Imágenes' },
  { value: 'animation', label: 'Animación' },
  { value: 'spacing', label: 'Espaciado' },
  { value: 'advanced', label: 'Avanzado' },
];

const SHADOW_OPTIONS = [
  { value: '', label: 'Del tema' },
  { value: 'none', label: 'Sin sombra' },
  { value: 'soft', label: 'Suave' },
  { value: 'medium', label: 'Media' },
  { value: 'strong', label: 'Intensa' },
];
const BORDER_STYLES = [
  { value: 'solid', label: 'Continuo' },
  { value: 'dashed', label: 'Guiones' },
  { value: 'dotted', label: 'Puntos' },
  { value: 'double', label: 'Doble' },
];
const VISUAL_OPTIONS = [
  { value: 'default', label: 'Normal' },
  { value: 'framed', label: 'Enmarcada (doble marco)' },
  { value: 'glass', label: 'Cristal (fondo translúcido)' },
  { value: 'elevated', label: 'Tarjeta elevada' },
  { value: 'minimal', label: 'Minimalista (sin adornos)' },
];
const MIN_HEIGHT_OPTIONS = [
  { value: 'auto', label: 'Automática (según contenido)' },
  { value: '50vh', label: 'Media pantalla' },
  { value: '75vh', label: 'Tres cuartos de pantalla' },
  { value: '100vh', label: 'Pantalla completa' },
];
const POSITION_OPTIONS = [
  { value: '', label: 'Centrado (predeterminado)' },
  { value: 'top', label: 'Arriba' },
  { value: 'center', label: 'Centro' },
  { value: 'bottom', label: 'Abajo' },
];
const OVERFLOW_OPTIONS = [
  { value: 'hidden', label: 'Recortar decoraciones que sobresalen' },
  { value: 'visible', label: 'Permitir que sobresalgan' },
];

// Número con deslizador; vacío = usar el valor del tema.
export function RangeField({ label, value, onChange, min = 0, max = 200, step = 1, unit = 'px', emptyLabel = 'Del tema', hint }) {
  const empty = value === '' || value === null || value === undefined;
  return (
    <div className="a-field a-range-field">
      <span className="a-field__label">
        {label}
        <span className="a-range-field__value">{empty ? emptyLabel : `${value}${unit}`}</span>
      </span>
      <span className="a-range-field__row">
        <input type="range" className="a-range" min={min} max={max} step={step} value={empty ? min : value} onChange={(e) => onChange(Number(e.target.value))} aria-label={label} />
        <Input type="number" min={min} max={max} step={step} value={empty ? '' : value} placeholder="—" onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))} aria-label={`${label} (número)`} />
        {!empty && (
          <button type="button" className="a-range-field__reset" onClick={() => onChange('')} title={emptyLabel}>
            <Icon name="undo" size={14} />
          </button>
        )}
      </span>
      {hint && <span className="a-field__hint">{hint}</span>}
    </div>
  );
}

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

export default function SectionProperties({ sectionKey, draft, setDraft, visible, onVisible, onReset, onEventDraft, order, total, onMove, tab: controlledTab, onTab }) {
  const [localTab, setLocalTab] = useState('content');
  const tab = controlledTab || localTab;
  const setTab = onTab || setLocalTab;
  const schema = SECTION_SCHEMAS[sectionKey] || { fields: [] };
  const style = draft.style || {};
  const content = draft.content || {};
  const setStyle = (patch) => setDraft((d) => ({ ...d, style: { ...d.style, ...patch } }));
  const setContent = (next) => setDraft((d) => ({ ...d, content: next }));
  const imageFields = schema.fields.filter((f) => f.type === 'image');
  const textFields = [NAV_LABEL_FIELD, ...schema.fields.filter((f) => f.type !== 'image')];

  return (
    <div className="a-props">
      <Tabs value={tab} onChange={setTab} tabs={PROPERTY_TABS} />

      {tab === 'content' && (
        <div className="a-form-stack">
          {schema.note && (
            <p className="a-notice">
              <Icon name="sparkle" size={16} /> {schema.note}
            </p>
          )}
          {schema.siteToggle && <SiteToggle name={schema.siteToggle} label={schema.siteToggleLabel} />}
          {schema.galleryLink && (
            <Link to={schema.galleryLink} className="a-notice">
              <Icon name="external" size={16} /> Moderar publicaciones de esta sección
            </Link>
          )}
          <Card>
            <SchemaFields fields={textFields} values={content} onChange={setContent} />
          </Card>
          {schema.venue && <VenueEditor prefix={schema.venue} onDraft={onEventDraft} />}
          {schema.manager === 'itinerary' && (
            <Card title="Actividades del itinerario">
              <ItineraryManager />
            </Card>
          )}
          {schema.manager === 'story' && (
            <Card title="Momentos de la historia">
              <StoryManager />
            </Card>
          )}
        </div>
      )}

      {tab === 'design' && (
        <div className="a-form-stack">
          <Card title="Colores" description="Vacío = color de la paleta. Con ◈ eliges un color de la paleta (cambia si cambias de paleta).">
            <div className="a-grid a-grid--2">
              <ColorField label="Texto" value={style.textColor} onChange={(textColor) => setStyle({ textColor })} allowEmpty />
              <ColorField label="Títulos" value={style.titleColor} onChange={(titleColor) => setStyle({ titleColor })} allowEmpty />
              <ColorField label="Color secundario (antetítulos y adornos)" value={style.accentColor} onChange={(accentColor) => setStyle({ accentColor })} allowEmpty />
              <ColorField label="Fondo de tarjetas" value={style.cardBackground} onChange={(cardBackground) => setStyle({ cardBackground })} allowEmpty />
            </div>
          </Card>
          <Card title="Distribución">
            <div className="a-grid a-grid--2">
              <Field label="Alineación del texto">
                <Select value={style.textAlign || 'center'} onChange={(e) => setStyle({ textAlign: e.target.value })} options={ALIGN_OPTIONS} />
              </Field>
              <Field label="Estilo visual">
                <Select value={style.visualClass || 'default'} onChange={(e) => setStyle({ visualClass: e.target.value })} options={VISUAL_OPTIONS} />
              </Field>
            </div>
            <RangeField label="Ancho máximo del contenido" value={style.maxWidth} onChange={(maxWidth) => setStyle({ maxWidth })} min={320} max={1600} step={10} emptyLabel="1100px (tema)" />
            <RangeField label="Opacidad del contenido" value={style.opacity === undefined || style.opacity === '' ? '' : Math.round(Number(style.opacity) * 100)} onChange={(v) => setStyle({ opacity: v === '' ? '' : v / 100 })} min={20} max={100} step={5} unit="%" emptyLabel="100%" />
          </Card>
          <Card title="Bordes y sombra">
            <div className="a-grid a-grid--2">
              <RangeField label="Redondeo de tarjetas" value={style.cardRadius} onChange={(cardRadius) => setStyle({ cardRadius })} max={48} />
              <RangeField label="Redondeo de la sección" value={style.sectionRadius} onChange={(sectionRadius) => setStyle({ sectionRadius })} max={60} emptyLabel="Sin redondeo" />
              <RangeField label="Grosor del borde de la sección" value={style.borderWidth} onChange={(borderWidth) => setStyle({ borderWidth })} max={8} emptyLabel="Sin borde" />
              <Field label="Tipo de borde">
                <Select value={style.borderStyle || 'solid'} onChange={(e) => setStyle({ borderStyle: e.target.value })} options={BORDER_STYLES} />
              </Field>
              <ColorField label="Color de bordes" value={style.borderColor} onChange={(borderColor) => setStyle({ borderColor })} allowEmpty />
              <Field label="Sombra de tarjetas">
                <Select value={style.shadow || ''} onChange={(e) => setStyle({ shadow: e.target.value })} options={SHADOW_OPTIONS} />
              </Field>
            </div>
          </Card>
          <Card title="Decoración">
            <Field label="Adornos de la sección">
              <Select value={style.decoration || 'flowers'} onChange={(e) => setStyle({ decoration: e.target.value })} options={DECORATION_OPTIONS} />
            </Field>
          </Card>
        </div>
      )}

      {tab === 'background' && (
        <Card title="Fondo de la sección" description="Color sólido, degradado o imagen. Los colores ◈ siguen a la paleta.">
          <BackgroundField value={style.background} onChange={(background) => setStyle({ background })} />
        </Card>
      )}

      {tab === 'images' && (
        <div className="a-form-stack">
          {imageFields.length === 0 && !schema.venue && !schema.manager && (
            <Card>
              <EmptyState icon="image" title="Esta sección no tiene fotografías propias">
                Puedes ponerle una imagen de fondo en la pestaña “Fondo”.
              </EmptyState>
            </Card>
          )}
          {imageFields.map((f) => (
            <Card key={f.name} title={f.label}>
              <SchemaField field={{ ...f, label: 'Subir, reemplazar o quitar' }} value={content[f.name]} onChange={(v) => setContent({ ...content, [f.name]: v })} />
            </Card>
          ))}
          {schema.venue && <p className="a-notice">La fotografía del lugar se cambia en Contenido → Datos del lugar.</p>}
          {schema.manager === 'story' && <p className="a-notice">Las fotos de cada momento se cambian en Contenido → Momentos de la historia.</p>}
          {style.background?.type === 'image' && (
            <Card title="Imagen de fondo">
              <ImageUploader
                folder="fondos"
                value={style.background.imageUrl ? { id: style.background.imageId, url: style.background.imageUrl } : null}
                onChange={(img) => setStyle({ background: { ...style.background, imageUrl: img?.url || '', imageId: img?.id || null } })}
              />
            </Card>
          )}
        </div>
      )}

      {tab === 'animation' && (
        <Card>
          <div className="a-form-stack">
            <Field label="Transición al entrar y salir (modo por secciones)" hint="Cómo desaparecen y aparecen las piezas, una tras otra, al navegar con el menú.">
              <Select value={style.transition || 'auto'} onChange={(e) => setStyle({ transition: e.target.value })} options={TRANSITION_OPTIONS} />
            </Field>
            <Field label="Animación al aparecer (modo continuo)">
              <Select value={style.animation || 'fadeInUp'} onChange={(e) => setStyle({ animation: e.target.value })} options={ANIMATION_OPTIONS} />
            </Field>
            {sectionKey === 'cover' && (
              <div className="a-grid a-grid--2">
                <SchemaField field={{ name: 'showPetals', label: 'Pétalos flotantes', type: 'toggle' }} value={content.showPetals} onChange={(v) => setContent({ ...content, showPetals: v })} />
                <SchemaField field={{ name: 'showParticles', label: 'Partículas brillantes', type: 'toggle' }} value={content.showParticles} onChange={(v) => setContent({ ...content, showParticles: v })} />
              </div>
            )}
          </div>
        </Card>
      )}

      {tab === 'spacing' && (
        <Card title="Espaciado interno" description="Vacío = espaciado del tema (Diseño → Tamaños).">
          <div className="a-grid a-grid--2">
            <RangeField label="Arriba" value={style.paddingTop ?? style.paddingY} onChange={(paddingTop) => setStyle({ paddingTop })} max={300} />
            <RangeField label="Abajo" value={style.paddingBottom ?? style.paddingY} onChange={(paddingBottom) => setStyle({ paddingBottom })} max={300} />
            <RangeField label="Izquierda" value={style.paddingLeft} onChange={(paddingLeft) => setStyle({ paddingLeft })} max={160} />
            <RangeField label="Derecha" value={style.paddingRight} onChange={(paddingRight) => setStyle({ paddingRight })} max={160} />
            <RangeField label="Separación entre elementos (gap)" value={style.gap} onChange={(gap) => setStyle({ gap })} max={100} hint="Tarjetas, fotos, colores y listas de la sección." />
          </div>
        </Card>
      )}

      {tab === 'advanced' && (
        <div className="a-form-stack">
          <Card>
            <div className="a-form-stack">
              <Toggle checked={visible} onChange={onVisible} label="Visible en la invitación" description={visible ? 'La sección se muestra' : 'La sección está oculta'} />
              {onMove && (
                <div className="a-inline">
                  <span className="a-muted">
                    Posición {order + 1} de {total}
                  </span>
                  <Button size="sm" variant="ghost" icon="arrowUp" onClick={() => onMove(-1)} disabled={order === 0}>
                    Subir
                  </Button>
                  <Button size="sm" variant="ghost" icon="arrowDown" onClick={() => onMove(1)} disabled={order === total - 1}>
                    Bajar
                  </Button>
                </div>
              )}
              <Field label="Nombre interno en el panel">
                <Input value={draft.label} onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))} maxLength={80} />
              </Field>
            </div>
          </Card>
          <Card title="Tamaño y posición">
            <div className="a-grid a-grid--2">
              <Field label="Altura mínima">
                <Select value={style.minHeight || 'auto'} onChange={(e) => setStyle({ minHeight: e.target.value })} options={MIN_HEIGHT_OPTIONS} />
              </Field>
              <Field label="Posición vertical del contenido">
                <Select value={style.contentPosition || ''} onChange={(e) => setStyle({ contentPosition: e.target.value })} options={POSITION_OPTIONS} />
              </Field>
              <Field label="Desbordamiento (overflow)">
                <Select value={style.overflow || 'hidden'} onChange={(e) => setStyle({ overflow: e.target.value })} options={OVERFLOW_OPTIONS} />
              </Field>
              <Field label="Clase visual">
                <Select value={style.visualClass || 'default'} onChange={(e) => setStyle({ visualClass: e.target.value })} options={VISUAL_OPTIONS} />
              </Field>
            </div>
            <p className="a-field__hint">Por seguridad no se permite escribir CSS: solo se eligen opciones predefinidas.</p>
          </Card>
          {onReset && (
            <Card>
              <Button variant="ghost-danger" icon="refresh" onClick={onReset}>
                Restablecer textos y estilo originales
              </Button>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
