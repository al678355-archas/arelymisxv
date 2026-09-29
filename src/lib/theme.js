// Convierte la configuración del tema (PostgreSQL) en variables CSS y carga las tipografías.
import { cld } from './image.js';

// ─── Paleta centralizada ─────────────────────────────────────────────────
// Cada color del tema se publica como variable CSS. Las secciones pueden guardar
// "theme:<clave>" en lugar de un color fijo, y así siguen a la paleta al cambiarla.

export const PALETTE_VARS = {
  primaryColor: '--c-primary',
  secondaryColor: '--c-secondary',
  accentColor: '--c-accent',
  backgroundColor: '--c-bg',
  sectionBackground: '--c-section',
  cardBackground: '--c-card',
  titleColor: '--c-title',
  textColor: '--c-text',
  textSecondaryColor: '--c-text-2',
  buttonColor: '--c-btn',
  buttonTextColor: '--c-btn-text',
  buttonHoverColor: '--c-btn-hover',
  borderColor: '--c-border',
  iconColor: '--c-icon',
  decorationColor: '--c-deco',
  animationColor: '--c-glow',
  navColor: '--c-nav',
  footerColor: '--c-footer',
};

export const PALETTE_LABELS = {
  primaryColor: 'Principal',
  secondaryColor: 'Secundario',
  accentColor: 'Acento',
  backgroundColor: 'Fondo',
  sectionBackground: 'Fondo alternativo',
  cardBackground: 'Tarjetas',
  titleColor: 'Títulos',
  textColor: 'Texto',
  textSecondaryColor: 'Texto secundario',
  buttonColor: 'Botones',
  buttonTextColor: 'Texto de botones',
  buttonHoverColor: 'Botones (hover)',
  borderColor: 'Bordes',
  iconColor: 'Iconos',
  decorationColor: 'Decoraciones',
  animationColor: 'Animaciones y brillos',
  navColor: 'Navegación',
  footerColor: 'Footer',
};

// Solo se aceptan formatos de color seguros: nunca CSS arbitrario.
const SAFE_COLOR = /^(#[0-9a-f]{3,8}|rgba?\(\s*[\d.\s,%]+\)|hsla?\(\s*[\d.\s,%deg]+\)|[a-z]{3,20})$/i;

export function resolveColor(value, theme) {
  if (!value || typeof value !== 'string') return undefined;
  const v = value.trim();
  if (v.startsWith('theme:')) {
    const key = v.slice(6);
    if (!PALETTE_VARS[key]) return undefined;
    // Con el tema a mano se resuelve el valor real (útil para vistas previas en el panel).
    return theme ? theme[key] || `var(${PALETTE_VARS[key]})` : `var(${PALETTE_VARS[key]})`;
  }
  return SAFE_COLOR.test(v) ? v : undefined;
}

export const PHOTO_RATIOS = { square: '1 / 1', landscape: '16 / 9', portrait: '9 / 16' };

// En la invitación los tokens se resuelven como variables CSS (cambian en vivo con la paleta).
const cssColor = (value) => resolveColor(value);

export function backgroundCss(bg, theme) {
  if (!bg) return undefined;
  switch (bg.type) {
    case 'solid':
      return cssColor(bg.color);
    case 'gradient':
      return `linear-gradient(${Number(bg.angle ?? 180) || 0}deg, ${cssColor(bg.from) || 'transparent'}, ${cssColor(bg.to) || 'transparent'})`;
    case 'image':
      return bg.imageUrl && /^https:\/\//.test(bg.imageUrl) ? `url("${cld(bg.imageUrl, { w: 2000 })}") center / cover no-repeat` : cssColor(bg.color);
    case 'section':
      return theme ? 'var(--c-section)' : undefined;
    case 'footer':
      return theme ? 'var(--c-footer)' : undefined;
    default:
      return undefined;
  }
}

export function themeVars(theme) {
  if (!theme) return {};
  const px = (v, fallback) => `${Number(v ?? fallback)}px`;
  const size = (obj, key, fallback) => px(obj?.[key], fallback);
  const vars = {};
  for (const [key, cssVar] of Object.entries(PALETTE_VARS)) vars[cssVar] = resolveColor(theme[key]) || undefined;
  // Colores nuevos con respaldo para temas antiguos
  vars['--c-title'] = vars['--c-title'] || 'var(--c-primary)';
  vars['--c-deco'] = vars['--c-deco'] || 'var(--c-primary)';
  vars['--c-glow'] = vars['--c-glow'] || 'var(--c-accent)';
  return {
    ...vars,
    // Alias legibles para cualquier componente
    '--color-primary': 'var(--c-primary)',
    '--color-secondary': 'var(--c-secondary)',
    '--color-accent': 'var(--c-accent)',
    '--color-animation': 'var(--c-glow)',
    '--color-glow': 'color-mix(in srgb, var(--c-glow) 55%, transparent)',
    '--color-danger': 'color-mix(in srgb, #c0394f 85%, var(--c-primary))',
    '--page-bg': backgroundCss(theme.pageBackground, theme) || 'var(--c-bg)',
    // Formato uniforme de las fotografías (cuadrado, 16:9 o 9:16)
    '--photo-ratio': PHOTO_RATIOS[theme.photoRatio] || PHOTO_RATIOS.square,
    '--f-title': fontStack(theme.fontTitle, 'serif'),
    '--f-script': fontStack(theme.fontScript, 'cursive'),
    '--f-subtitle': fontStack(theme.fontSubtitle, 'serif'),
    '--f-body': fontStack(theme.fontBody, 'sans-serif'),
    '--fs-base-d': size(theme.baseFontSize, 'desktop', 17),
    '--fs-base-t': size(theme.baseFontSize, 'tablet', 16),
    '--fs-base-m': size(theme.baseFontSize, 'mobile', 15),
    '--fs-title-d': size(theme.titleFontSize, 'desktop', 52),
    '--fs-title-t': size(theme.titleFontSize, 'tablet', 44),
    '--fs-title-m': size(theme.titleFontSize, 'mobile', 36),
    '--fs-script-d': size(theme.scriptFontSize, 'desktop', 96),
    '--fs-script-t': size(theme.scriptFontSize, 'tablet', 78),
    '--fs-script-m': size(theme.scriptFontSize, 'mobile', 62),
    '--space-d': size(theme.sectionSpacing, 'desktop', 110),
    '--space-t': size(theme.sectionSpacing, 'tablet', 90),
    '--space-m': size(theme.sectionSpacing, 'mobile', 70),
    '--radius': px(theme.borderRadius, 18),
    '--bw': px(theme.borderWidth, 1),
  };
}

function fontStack(name, generic) {
  return name ? `"${name.replace(/"/g, '')}", ${generic}` : generic;
}

const loaded = new Set();

// Carga cada familia desde Google Fonts. Si la familia no tiene todos los pesos,
// se reintenta sin pesos (la API responde 400 cuando falta alguno).
export function loadGoogleFonts(families = []) {
  for (const family of families) {
    if (!family || loaded.has(family)) continue;
    loaded.add(family);
    const encoded = encodeURIComponent(family).replace(/%20/g, '+');
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${encoded}:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap`;
    link.onerror = () => {
      link.onerror = null;
      link.href = `https://fonts.googleapis.com/css2?family=${encoded}&display=swap`;
    };
    document.head.appendChild(link);
  }
}

export const FONT_OPTIONS = {
  script: ['Great Vibes', 'Alex Brush', 'Parisienne', 'Pinyon Script', 'Allura', 'Tangerine', 'Italianno', 'Sacramento', 'Petit Formal Script', 'Rouge Script', 'Dancing Script', 'Mea Culpa', 'Monsieur La Doulaise', 'Imperial Script'],
  serif: ['Cormorant Garamond', 'Cormorant', 'Playfair Display', 'Cinzel', 'Cinzel Decorative', 'Marcellus', 'Libre Baskerville', 'Bodoni Moda', 'Lora', 'Prata', 'Italiana', 'Forum', 'Gilda Display', 'EB Garamond'],
  sans: ['Montserrat', 'Lato', 'Raleway', 'Poppins', 'Josefin Sans', 'Quicksand', 'Nunito', 'Jost', 'Work Sans', 'Open Sans'],
};
