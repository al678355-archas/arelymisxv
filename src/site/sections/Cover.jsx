import { cld, srcSet } from '../../lib/image.js';
import { coverDate } from '../../lib/format.js';
import { sectionStyleVars } from '../components/SectionShell.jsx';
import { backgroundCss } from '../../lib/theme.js';
import { Petals, Sparkles } from '../components/Decorations.jsx';
import Icon from '../components/Icon.jsx';

export default function Cover({ section, data, opened, onOpen }) {
  const { content = {}, style = {} } = section;
  const { theme, event, site } = data;
  const name = content.name || site?.quinceaneraName || '';
  const date = content.dateText || coverDate(event?.eventDate);
  const photo = content.photo;
  const layout = photo?.url ? content.layout || 'split' : 'centered';
  const bg = style.background;
  const decorations = theme?.decorations !== false;

  return (
    <section
      id="s-cover"
      className={`cover cover--${layout} cover--${content.photoShape || 'arch'} ${opened ? 'is-opened' : ''}`}
      style={sectionStyleVars(style, theme)}
      data-section="cover"
    >
      {bg?.type === 'image' && bg.imageUrl && (
        <div className="xv-section__bgimg cover__bgimg" style={{ background: backgroundCss(bg, theme) }} aria-hidden="true">
          {Number(bg.overlay) > 0 && <span className="xv-section__overlay" style={{ opacity: Number(bg.overlay), background: bg.overlayColor || '#000' }} />}
        </div>
      )}
      {layout === 'centered' && photo?.url && (
        <div className="cover__fullphoto" aria-hidden="true">
          <img src={cld(photo.url, { w: 1600 })} srcSet={srcSet(photo.url, 2000)} sizes="100vw" alt="" fetchpriority="high" />
        </div>
      )}

      {decorations && content.showPetals !== false && <Petals count={14} />}
      {decorations && content.showParticles !== false && <Sparkles count={22} />}
      <div className="cover__glow" aria-hidden="true" />

      <div className="cover__inner">
        {layout === 'split' && photo?.url && (
          <div className="cover__photo-wrap">
            <span className="cover__ring" aria-hidden="true" />
            <span className="cover__ring cover__ring--2" aria-hidden="true" />
            <figure className="cover__photo">
              <img
                src={cld(photo.url, { w: 900 })}
                srcSet={srcSet(photo.url, 1600)}
                sizes="(max-width: 860px) 78vw, 42vw"
                alt={name}
                width={photo.width}
                height={photo.height}
                fetchpriority="high"
              />
              <span className="cover__shine" aria-hidden="true" />
            </figure>
          </div>
        )}

        <div className="cover__text">
          {content.eyebrow && <p className="cover__eyebrow">{content.eyebrow}</p>}
          {name && (
            <h1 className="cover__name">
              <span>{name}</span>
            </h1>
          )}
          {date && (
            <p className="cover__date">
              <span className="cover__line" aria-hidden="true" />
              {date}
              <span className="cover__line" aria-hidden="true" />
            </p>
          )}
          {content.text && <p className="cover__lead">{content.text}</p>}

          <div className="cover__actions">
            {!opened ? (
              content.buttonText && (
                <button type="button" className="btn btn--glow cover__open" onClick={onOpen}>
                  <Icon name="heart" size={18} />
                  <span>{content.buttonText}</span>
                </button>
              )
            ) : (
              <a className="cover__scroll" href="#after-cover" aria-label={content.scrollHint || 'Continuar'}>
                {content.scrollHint && <span>{content.scrollHint}</span>}
                <Icon name="chevronDown" size={22} />
              </a>
            )}
          </div>
        </div>
      </div>
      <div className="cover__veil" aria-hidden="true" />
    </section>
  );
}
