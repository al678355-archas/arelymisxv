import { backgroundCss } from '../../lib/theme.js';
import { FloralBranch, Divider, Sparkles } from './Decorations.jsx';

// Contenedor común de las secciones: aplica el estilo editable (fondo, colores, espaciado,
// alineación, ancho) y dibuja el encabezado (eyebrow, título, subtítulo).
export function sectionStyleVars(style = {}, theme) {
  const vars = {};
  const bg = style.background;
  const bgCss = backgroundCss(bg, theme);
  if (bgCss && bg?.type !== 'image') vars['--s-bg'] = bgCss;
  if (style.textColor) vars['--s-text'] = style.textColor;
  if (style.titleColor) vars['--s-title'] = style.titleColor;
  if (style.accentColor) vars['--s-accent'] = style.accentColor;
  if (style.cardBackground) vars['--s-card'] = style.cardBackground;
  if (style.borderColor) vars['--s-border'] = style.borderColor;
  if (style.paddingY !== '' && style.paddingY !== undefined && style.paddingY !== null) {
    vars['--s-pad'] = `${Number(style.paddingY)}px`;
  }
  if (style.maxWidth) vars['--s-max'] = `${Number(style.maxWidth)}px`;
  if (style.textAlign) vars['--s-align'] = style.textAlign;
  if (style.animation && style.animation !== 'none') vars['--s-anim'] = style.animation;
  return vars;
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

export default function SectionShell({ section, theme, className = '', children, heading = true, full = false }) {
  const { key, content = {}, style = {} } = section;
  const bg = style.background;
  const decorations = theme?.decorations !== false && style.decoration !== 'none';

  return (
    <section id={`s-${key}`} className={`xv-section xv-section--${key} ${style.animation === 'none' ? 'no-anim' : ''} ${className}`} style={sectionStyleVars(style, theme)} data-section={key}>
      {bg?.type === 'image' && bg.imageUrl && (
        <div className="xv-section__bgimg" style={{ background: backgroundCss(bg, theme) }} aria-hidden="true">
          {Number(bg.overlay) > 0 && (
            <span className="xv-section__overlay" style={{ opacity: Number(bg.overlay), background: bg.overlayColor || '#000' }} />
          )}
        </div>
      )}
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
