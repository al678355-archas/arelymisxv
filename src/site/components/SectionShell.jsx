import { backgroundCss, resolveColor } from '../../lib/theme.js';
import { FloralBranch, Divider, Sparkles } from './Decorations.jsx';

// Contenedor común de las secciones: aplica el estilo editable desde el CMS.
// Solo se convierten valores conocidos (números, opciones y colores validados): nunca CSS libre.

const num = (v, min, max) => {
  if (v === '' || v === null || v === undefined) return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return Math.min(max, Math.max(min, n));
};

const MIN_HEIGHTS = { auto: null, '50vh': '50vh', '75vh': '75vh', '100vh': '100svh' };
const SHADOWS = {
  none: 'none',
  soft: '0 10px 30px -18px color-mix(in srgb, var(--c-text) 40%, transparent)',
  medium: '0 18px 44px -20px color-mix(in srgb, var(--c-primary) 55%, transparent)',
  strong: '0 28px 60px -22px color-mix(in srgb, var(--c-primary) 75%, transparent)',
};
const POSITIONS = { top: 'flex-start', center: 'center', bottom: 'flex-end' };
export const VISUAL_CLASSES = ['default', 'framed', 'glass', 'elevated', 'minimal'];

export function sectionStyleVars(style = {}, theme) {
  const vars = {};
  const bg = style.background;
  const bgCss = backgroundCss(bg, theme);
  if (bgCss && bg?.type !== 'image') vars['--s-bg'] = bgCss;
  const colors = { textColor: '--s-text', titleColor: '--s-title', accentColor: '--s-accent', cardBackground: '--s-card', borderColor: '--s-border' };
  for (const [key, cssVar] of Object.entries(colors)) {
    const value = resolveColor(style[key]);
    if (value) vars[cssVar] = value;
  }
  const px = (value, cssVar, min, max) => {
    const n = num(value, min, max);
    if (n !== null) vars[cssVar] = `${n}px`;
  };
  px(style.paddingY, '--s-pad', 0, 400);
  px(style.paddingTop, '--s-pad-top', 0, 400);
  px(style.paddingBottom, '--s-pad-bottom', 0, 400);
  px(style.paddingLeft, '--s-pad-left', 0, 200);
  px(style.paddingRight, '--s-pad-right', 0, 200);
  px(style.gap, '--s-gap', 0, 120);
  px(style.maxWidth, '--s-max', 280, 1920);
  px(style.cardRadius, '--radius', 0, 60);
  px(style.sectionRadius, '--s-radius', 0, 80);
  const bw = num(style.borderWidth, 0, 12);
  if (bw) {
    vars['--s-border-w'] = `${bw}px`;
    vars['--s-border-style'] = ['solid', 'dashed', 'double', 'dotted'].includes(style.borderStyle) ? style.borderStyle : 'solid';
  }
  if (['left', 'center', 'right'].includes(style.textAlign)) vars['--s-align'] = style.textAlign;
  if (style.animation && style.animation !== 'none') vars['--s-anim'] = style.animation;
  if (SHADOWS[style.shadow]) vars['--shadow-soft'] = SHADOWS[style.shadow];
  const opacity = num(style.opacity, 0.2, 1);
  if (opacity !== null && opacity < 1) vars['--s-opacity'] = String(opacity);
  if (MIN_HEIGHTS[style.minHeight]) vars['--s-min-h'] = MIN_HEIGHTS[style.minHeight];
  if (POSITIONS[style.contentPosition]) vars['--s-justify'] = POSITIONS[style.contentPosition];
  if (style.overflow === 'visible') vars['--s-overflow'] = 'visible';
  return vars;
}

export function sectionClasses(style = {}) {
  const classes = [];
  if (style.animation === 'none') classes.push('no-anim');
  if (VISUAL_CLASSES.includes(style.visualClass) && style.visualClass !== 'default') classes.push(`xv-look--${style.visualClass}`);
  if (MIN_HEIGHTS[style.minHeight] || POSITIONS[style.contentPosition]) classes.push('xv-section--sized');
  return classes.join(' ');
}

export function SectionHeading({ eyebrow, title, subtitle, reveal = 'section' }) {
  if (!eyebrow && !title && !subtitle) return null;
  return (
    <header className="s-heading">
      {eyebrow && (
        <p className="s-eyebrow" data-reveal="fadeInDown">
          {eyebrow}
        </p>
      )}
      {title && (
        <h2 className="s-title" data-reveal={reveal}>
          {title}
        </h2>
      )}
      <div data-reveal="scaleIn">
        <Divider />
      </div>
      {subtitle && (
        <p className="s-subtitle" data-reveal="fadeInUp" style={{ '--delay': '150ms' }}>
          {subtitle}
        </p>
      )}
    </header>
  );
}

export function SectionBackground({ bg, theme }) {
  if (bg?.type !== 'image' || !bg.imageUrl) return null;
  return (
    <div className="xv-section__bgimg" style={{ background: backgroundCss(bg, theme) }} aria-hidden="true">
      {Number(bg.overlay) > 0 && (
        <span className="xv-section__overlay" style={{ opacity: Math.min(0.95, Number(bg.overlay)), background: resolveColor(bg.overlayColor) || 'var(--c-text)' }} />
      )}
    </div>
  );
}

export default function SectionShell({ section, theme, className = '', children, heading = true, full = false }) {
  const { key, content = {}, style = {} } = section;
  const decorations = theme?.decorations !== false && style.decoration !== 'none';

  return (
    <section id={`s-${key}`} className={`xv-section xv-section--${key} ${sectionClasses(style)} ${className}`} style={sectionStyleVars(style, theme)} data-section={key}>
      <SectionBackground bg={style.background} theme={theme} />
      {decorations && style.decoration !== 'sparkles' && (
        <>
          <FloralBranch className="floral--tl" />
          <FloralBranch className="floral--br" />
        </>
      )}
      {decorations && style.decoration === 'sparkles' && <Sparkles count={14} />}
      <div className={full ? 'xv-full' : 'xv-container'}>
        {heading && <SectionHeading eyebrow={content.eyebrow} title={content.title} subtitle={content.subtitle} />}
        {children}
      </div>
    </section>
  );
}
