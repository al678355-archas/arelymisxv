// Convierte la configuración del tema (PostgreSQL) en variables CSS y carga las tipografías.
import { cld } from './image.js';

export function backgroundCss(bg, theme) {
  if (!bg) return undefined;
  switch (bg.type) {
    case 'solid':
      return bg.color || undefined;
    case 'gradient':
      return `linear-gradient(${Number(bg.angle ?? 180)}deg, ${bg.from || 'transparent'}, ${bg.to || 'transparent'})`;
    case 'image':
      return bg.imageUrl ? `url("${cld(bg.imageUrl, { w: 2000 })}") center / cover no-repeat` : bg.color || undefined;
    case 'section':
      return theme?.sectionBackground;
    case 'footer':
      return theme?.footerColor;
    default:
      return undefined;
  }
}

export function themeVars(theme) {
  if (!theme) return {};
  const px = (v, fallback) => `${Number(v ?? fallback)}px`;
  const size = (obj, key, fallback) => px(obj?.[key], fallback);
  return {
    '--c-primary': theme.primaryColor,
    '--c-secondary': theme.secondaryColor,
    '--c-accent': theme.accentColor,
    '--c-text': theme.textColor,
    '--c-text-2': theme.textSecondaryColor,
    '--c-bg': theme.backgroundColor,
    '--c-section': theme.sectionBackground,
    '--c-card': theme.cardBackground,
    '--c-btn': theme.buttonColor,
    '--c-btn-text': theme.buttonTextColor,
    '--c-btn-hover': theme.buttonHoverColor,
    '--c-border': theme.borderColor,
    '--c-icon': theme.iconColor,
    '--c-nav': theme.navColor,
    '--c-footer': theme.footerColor,
    '--page-bg': backgroundCss(theme.pageBackground, theme) || theme.backgroundColor,
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
