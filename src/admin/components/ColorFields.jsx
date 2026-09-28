import ImageUploader from './ImageUploader.jsx';
import { Field, Input, Select } from './ui.jsx';
import { backgroundCss } from '../../lib/theme.js';

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

function toHex6(value) {
  if (!HEX.test(value || '')) return '#ffffff';
  if (value.length === 4) return `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`;
  return value;
}

// Color con selector visual + texto (acepta hex, rgb/rgba y nombres CSS).
export function ColorField({ label, value = '', onChange, allowEmpty, hint }) {
  return (
    <Field label={label} hint={hint} as="div">
      <span className="a-color">
        <span className="a-color__swatch" style={{ background: value || 'transparent' }}>
          <input type="color" value={toHex6(value)} onChange={(e) => onChange(e.target.value)} aria-label={`${label} (selector)`} />
        </span>
        <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={allowEmpty ? 'Usar color del tema' : '#000000'} spellCheck={false} />
        {allowEmpty && value && (
          <button type="button" className="a-color__clear" onClick={() => onChange('')} title="Usar color del tema">
            ×
          </button>
        )}
      </span>
    </Field>
  );
}

const BG_TYPES = [
  { value: 'theme', label: 'Transparente (fondo general)' },
  { value: 'section', label: 'Fondo de secciones del tema' },
  { value: 'footer', label: 'Color del footer del tema' },
  { value: 'solid', label: 'Color sólido' },
  { value: 'gradient', label: 'Degradado' },
  { value: 'image', label: 'Imagen de fondo' },
];

// Fondo: color sólido, degradado o imagen (con capa de color para legibilidad).
export function BackgroundField({ label = 'Fondo', value = {}, onChange, themeOptions = true, theme }) {
  const bg = { type: 'theme', angle: 180, overlay: 0, ...value };
  const set = (patch) => onChange({ ...bg, ...patch });
  const types = themeOptions ? BG_TYPES : BG_TYPES.filter((t) => ['solid', 'gradient', 'image'].includes(t.value));
  const preview = backgroundCss(bg, theme);

  return (
    <div className="a-bgfield">
      <div className="a-bgfield__head">
        <Field label={label}>
          <Select value={bg.type} onChange={(e) => set({ type: e.target.value })} options={types} />
        </Field>
        <span className="a-bgfield__preview" style={{ background: preview || 'repeating-conic-gradient(#eee 0 25%, #fff 0 50%) 0 0 / 14px 14px' }} />
      </div>

      {bg.type === 'solid' && <ColorField label="Color" value={bg.color} onChange={(color) => set({ color })} />}

      {bg.type === 'gradient' && (
        <div className="a-grid a-grid--3">
          <ColorField label="Desde" value={bg.from} onChange={(from) => set({ from })} />
          <ColorField label="Hasta" value={bg.to} onChange={(to) => set({ to })} />
          <Field label={`Ángulo (${bg.angle}°)`}>
            <input type="range" min="0" max="360" value={bg.angle} onChange={(e) => set({ angle: Number(e.target.value) })} className="a-range" />
          </Field>
        </div>
      )}

      {bg.type === 'image' && (
        <>
          <ImageUploader
            folder="fondos"
            value={bg.imageUrl ? { id: bg.imageId, url: bg.imageUrl } : null}
            onChange={(img) => set({ imageUrl: img?.url || '', imageId: img?.id || null })}
            compact
          />
          <div className="a-grid a-grid--2">
            <ColorField label="Color de la capa" value={bg.overlayColor || '#000000'} onChange={(overlayColor) => set({ overlayColor })} />
            <Field label={`Opacidad de la capa (${Math.round(Number(bg.overlay || 0) * 100)}%)`} hint="Oscurece o aclara la imagen para que el texto se lea bien.">
              <input type="range" min="0" max="0.9" step="0.05" value={bg.overlay || 0} onChange={(e) => set({ overlay: Number(e.target.value) })} className="a-range" />
            </Field>
          </div>
        </>
      )}
    </div>
  );
}
