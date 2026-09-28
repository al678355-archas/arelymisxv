import { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { useApi } from '../hooks.js';
import { useAutosave } from '../../hooks/useAutosave.js';
import { FONT_OPTIONS, loadGoogleFonts } from '../../lib/theme.js';
import { ColorField, BackgroundField } from '../components/ColorFields.jsx';
import PreviewFrame from '../components/PreviewFrame.jsx';
import { Card, ErrorBox, Field, Input, Loading, PageHeader, SaveStatus, Toggle } from '../components/ui.jsx';

const COLORS = [
  ['primaryColor', 'Color primario', 'Títulos, nombre y detalles principales'],
  ['secondaryColor', 'Color secundario', 'Fondos suaves y degradados'],
  ['accentColor', 'Color de acento', 'Antetítulos, adornos y destellos'],
  ['textColor', 'Color del texto'],
  ['textSecondaryColor', 'Texto secundario'],
  ['backgroundColor', 'Fondo principal (color base)'],
  ['sectionBackground', 'Fondo de secciones'],
  ['cardBackground', 'Fondo de tarjetas'],
  ['buttonColor', 'Color de botones'],
  ['buttonTextColor', 'Texto de botones'],
  ['buttonHoverColor', 'Color hover de botones'],
  ['borderColor', 'Color de bordes'],
  ['iconColor', 'Color de iconos'],
  ['navColor', 'Color de navegación'],
  ['footerColor', 'Color del footer'],
];

const FONTS = [
  ['fontTitle', 'Fuente de títulos', 'serif'],
  ['fontScript', 'Fuente cursiva / decorativa', 'script'],
  ['fontSubtitle', 'Fuente de subtítulos', 'serif'],
  ['fontBody', 'Fuente general', 'sans'],
];

const SIZES = [
  ['baseFontSize', 'Texto general'],
  ['titleFontSize', 'Títulos de sección'],
  ['scriptFontSize', 'Nombre (portada)'],
  ['sectionSpacing', 'Espaciado vertical de secciones'],
];

function FontField({ label, value, onChange, group }) {
  const all = [...FONT_OPTIONS.script, ...FONT_OPTIONS.serif, ...FONT_OPTIONS.sans];
  const custom = value && !all.includes(value);
  const [editing, setEditing] = useState(custom);
  useEffect(() => loadGoogleFonts([value]), [value]);
  return (
    <div className="a-font-field">
      <Field label={label} hint="Cualquier fuente de Google Fonts">
        {editing ? (
          <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder="Nombre exacto en Google Fonts" onBlur={() => !value && setEditing(false)} />
        ) : (
          <select className="a-input a-select" value={value} onChange={(e) => (e.target.value === '__custom' ? setEditing(true) : onChange(e.target.value))}>
            {[group, ...Object.keys(FONT_OPTIONS).filter((g) => g !== group)].map((g) => (
              <optgroup key={g} label={{ script: 'Cursivas', serif: 'Serif / elegantes', sans: 'Sans serif' }[g]}>
                {FONT_OPTIONS[g].map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </optgroup>
            ))}
            <option value="__custom">Otra fuente…</option>
          </select>
        )}
      </Field>
      <p className="a-font-sample" style={{ fontFamily: `"${value}"` }}>
        Mis XV años · Aa Bb 123
      </p>
    </div>
  );
}

export default function DesignPage() {
  const { data, error, reload } = useApi('/api/theme');
  const [draft, setDraft] = useState(null);

  useEffect(() => {
    if (data?.theme && !draft) {
      const { id, updatedAt, ...rest } = data.theme;
      setDraft(rest);
    }
  }, [data, draft]);

  const autosave = useAutosave(draft, (value) => api.put('/api/theme', value), { delay: 600 });

  if (error) return <ErrorBox error={error} onRetry={reload} />;
  if (!draft) return <Loading />;
  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));

  return (
    <div className="a-page a-page--with-preview">
      <div className="a-page__main">
        <PageHeader title="Diseño" description="Colores, fondos, tipografías y tamaños de toda la invitación." actions={<SaveStatus status={autosave.status} error={autosave.error} />} />

        <Card title="Navegación de la invitación" description="Cómo recorren los invitados las secciones.">
          <div className="a-choice-cards">
            {[
              ['pages', 'Una sección a la vez', 'Menú siempre visible arriba. Al cambiar de sección el contenido se va y llega pieza por pieza (dominó, cascada, giro, zoom…).'],
              ['scroll', 'Desplazamiento continuo', 'Todas las secciones una debajo de otra; aparecen al bajar con el dedo o el mouse.'],
            ].map(([value, title, desc]) => (
              <button key={value} type="button" className={`a-choice-card ${(draft.navigationMode || 'pages') === value ? 'is-active' : ''}`} onClick={() => set({ navigationMode: value })}>
                <strong>{title}</strong>
                <span>{desc}</span>
              </button>
            ))}
          </div>
        </Card>

        <Card title="Colores">
          <div className="a-grid a-grid--colors">
            {COLORS.map(([key, label, hint]) => (
              <ColorField key={key} label={label} hint={hint} value={draft[key]} onChange={(v) => set({ [key]: v })} />
            ))}
          </div>
        </Card>

        <Card title="Fondo principal de la página" description="Color sólido, degradado o imagen detrás de todas las secciones.">
          <BackgroundField value={draft.pageBackground} onChange={(pageBackground) => set({ pageBackground })} themeOptions={false} theme={draft} />
        </Card>

        <Card title="Tipografías">
          <div className="a-grid a-grid--2">
            {FONTS.map(([key, label, group]) => (
              <FontField key={key} label={label} group={group} value={draft[key]} onChange={(v) => set({ [key]: v })} />
            ))}
          </div>
        </Card>

        <Card title="Tamaños (px)" description="Ajusta por tipo de pantalla.">
          <div className="a-sizes">
            <div className="a-sizes__head">
              <span />
              <span>Escritorio</span>
              <span>Tablet</span>
              <span>Celular</span>
            </div>
            {SIZES.map(([key, label]) => (
              <div key={key} className="a-sizes__row">
                <span>{label}</span>
                {['desktop', 'tablet', 'mobile'].map((device) => (
                  <Input
                    key={device}
                    type="number"
                    min={key === 'sectionSpacing' ? 0 : 8}
                    max={key === 'sectionSpacing' ? 400 : 300}
                    value={draft[key]?.[device] ?? ''}
                    onChange={(e) => set({ [key]: { ...draft[key], [device]: Number(e.target.value) } })}
                    aria-label={`${label} ${device}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </Card>

        <Card title="Bordes y efectos">
          <div className="a-grid a-grid--2">
            <Field label={`Redondeo de esquinas (${draft.borderRadius}px)`}>
              <input type="range" className="a-range" min="0" max="48" value={draft.borderRadius} onChange={(e) => set({ borderRadius: Number(e.target.value) })} />
            </Field>
            <Field label={`Grosor de bordes (${draft.borderWidth}px)`}>
              <input type="range" className="a-range" min="0" max="6" value={draft.borderWidth} onChange={(e) => set({ borderWidth: Number(e.target.value) })} />
            </Field>
          </div>
          <div className="a-form-stack">
            <Toggle checked={draft.decorations} onChange={(decorations) => set({ decorations })} label="Decoraciones" description="Flores, pétalos y partículas." />
            <Toggle checked={draft.animations} onChange={(animations) => set({ animations })} label="Animaciones al desplazarse" description="Las secciones aparecen suavemente al hacer scroll." />
          </div>
        </Card>
      </div>
      <PreviewFrame />
    </div>
  );
}
