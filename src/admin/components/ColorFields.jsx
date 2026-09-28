import { useState } from 'react';
import { usePalette, paletteSwatches, displayColor } from '../palette.jsx';
import { PALETTE_LABELS } from '../../lib/theme.js';
import ImageUploader from './ImageUploader.jsx';
import { Field, Input, Select } from './ui.jsx';
import { backgroundCss } from '../../lib/theme.js';

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

function toHex6(value) {
  if (!HEX.test(value || '')) return '#ffffff';
  if (value.length === 4) return `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`;
  return value;
}

// Color con selector visual + texto (hex, rgb/rgba o nombre CSS) y, si se desea,
// un color de la paleta (se guarda como "theme:clave" y cambia al cambiar la paleta).
export function ColorField({ label, value = '', onChange, allowEmpty, hint, tokens = true }) {
  const { theme } = usePalette();
  const [open, setOpen] = useState(false);
  const isToken = String(value).startsWith('theme:');
  const shown = displayColor(value, theme);
  const tokenLabel = isToken ? PALETTE_LABELS[value.slice(6)] : null;

  return (
    <Field label={label} hint={hint} as="div">
      <span className="a-color">
        <span className="a-color__swatch" style={{ background: shown }}>
          <input type="color" value={toHex6(isToken ? shown : value)} onChange={(e) => onChange(e.target.value)} aria-label={`${label} (selector)`} />
        </span>
        {isToken ? (
          <span className="a-color__token" title="Color vinculado a la paleta">
            <span aria-hidden="true">◈</span> Paleta: {tokenLabel || value}
          </span>
        ) : (
          <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={allowEmpty ? 'Usar color del tema' : '#000000'} spellCheck={false} />
        )}
        {tokens && theme && (
          <button type="button" className={`a-color__palette ${open ? 'is-open' : ''}`} onClick={() => setOpen((v) => !v)} title="Elegir un color de la paleta" aria-expanded={open}>
            ◈
          </button>
        )}
        {(isToken || (allowEmpty && value)) && (
          <button type="button" className="a-color__clear" onClick={() => onChange(allowEmpty ? '' : shown)} title={allowEmpty ? 'Usar color del tema' : 'Usar un color fijo'}>
            ×
          </button>
        )}
      </span>
      {open && theme && (
        <span className="a-color__tokens">
          {paletteSwatches(theme).map((s) => (
            <button
              key={s.key}
              type="button"
              className={value === s.token ? 'is-active' : ''}
              style={{ '--sw': s.color }}
              title={s.label}
              onClick={() => {
                onChange(s.token);
                setOpen(false);
              }}
            >
              <i />
              <span>{s.label}</span>
            </button>
          ))}
        </span>
      )}
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
// Vista previa del fondo con los colores reales de la paleta
function previewBackground(bg, theme) {
  const c = (v) => displayColor(v, theme);
  switch (bg.type) {
    case 'solid':
      return c(bg.color);
    case 'gradient':
      return 'linear-gradient(' + (Number(bg.angle) || 0) + 'deg, ' + c(bg.from) + ', ' + c(bg.to) + ')';
    case 'image':
      return backgroundCss(bg, theme);
    case 'section':
      return theme?.sectionBackground;
    case 'footer':
      return theme?.footerColor;
    default:
      return undefined;
  }
}

export function BackgroundField({ label = 'Fondo', value = {}, onChange, themeOptions = true, theme: themeProp }) {
  const { theme: paletteTheme } = usePalette();
  const theme = themeProp || paletteTheme;
  const bg = { type: 'theme', angle: 180, overlay: 0, ...value };
  const set = (patch) => onChange({ ...bg, ...patch });
  const types = themeOptions ? BG_TYPES : BG_TYPES.filter((t) => ['solid', 'gradient', 'image'].includes(t.value));
  const preview = previewBackground(bg, theme);

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
