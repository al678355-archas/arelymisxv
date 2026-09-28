import SectionShell from '../components/SectionShell.jsx';
import { cld, srcSet } from '../../lib/image.js';
import { useCountdown } from '../../hooks/useCountdown.js';
import { eventInstant } from '../../lib/format.js';

function Paragraphs({ text, className = 'prose' }) {
  if (!text) return null;
  return (
    <div className={className}>
      {String(text)
        .split(/\n{2,}|\r\n\r\n/)
        .map((p, i) => (
          <p key={i} data-reveal="fadeInUp" style={{ '--delay': `${i * 120}ms` }}>
            {p}
          </p>
        ))}
    </div>
  );
}

function SideImage({ image, alt }) {
  if (!image?.url) return null;
  return (
    <figure className="side-image" data-reveal="scaleIn">
      <img src={cld(image.url, { w: 800 })} srcSet={srcSet(image.url, 1400)} sizes="(max-width: 860px) 90vw, 40vw" alt={alt || ''} loading="lazy" width={image.width} height={image.height} />
    </figure>
  );
}

// Presentación
export function Intro({ section, data }) {
  const { content } = section;
  return (
    <SectionShell section={section} theme={data.theme}>
      <div className={`split ${content.image?.url ? 'split--image' : ''}`}>
        <SideImage image={content.image} alt={content.title} />
        <div className="split__text">
          <blockquote className="quote" data-reveal="section">
            <Paragraphs text={content.text} className="quote__text" />
          </blockquote>
          {content.signature && (
            <p className="signature" data-reveal="fadeInUp">
              {content.signature}
            </p>
          )}
        </div>
      </div>
    </SectionShell>
  );
}

// Mensaje especial
export function Message({ section, data }) {
  const { content } = section;
  return (
    <SectionShell section={section} theme={data.theme}>
      <div className={`split split--reverse ${content.image?.url ? 'split--image' : ''}`}>
        <SideImage image={content.image} alt={content.title} />
        <div className="split__text">
          <div className="card card--letter" data-reveal="section">
            <Paragraphs text={content.text} />
            {content.signature && <p className="signature">{content.signature}</p>}
          </div>
        </div>
      </div>
    </SectionShell>
  );
}

// Padres y padrinos
export function People({ section, data }) {
  const { content } = section;
  const people = (content.people || []).filter((p) => p?.name || p?.role);
  return (
    <SectionShell section={section} theme={data.theme}>
      {content.text && <Paragraphs text={content.text} className="prose prose--center" />}
      <div className={`people people--${Math.min(people.length, 4)}`}>
        {people.map((person, i) => (
          <article key={i} className="people__card" data-reveal="section" style={{ '--delay': `${i * 120}ms` }}>
            {person.role && <p className="people__role">{person.role}</p>}
            <p className="people__name">{person.name}</p>
          </article>
        ))}
      </div>
    </SectionShell>
  );
}

// Cuenta regresiva
export function Countdown({ section, data }) {
  const { content } = section;
  const left = useCountdown(eventInstant(data.event));
  const units = [
    ['days', content.daysLabel],
    ['hours', content.hoursLabel],
    ['minutes', content.minutesLabel],
    ['seconds', content.secondsLabel],
  ];
  return (
    <SectionShell section={section} theme={data.theme}>
      {left?.done ? (
        <p className="countdown__done" data-reveal="scaleIn">
          {content.finishedText}
        </p>
      ) : (
        <div className="countdown" role="timer" aria-live="off">
          {units.map(([unit, label], i) => (
            <div key={unit} className="countdown__item" data-reveal="section" style={{ '--delay': `${i * 110}ms` }}>
              <span className="countdown__value" key={left?.[unit]}>
                {String(left?.[unit] ?? 0).padStart(2, '0')}
              </span>
              <span className="countdown__label">{label}</span>
            </div>
          ))}
        </div>
      )}
    </SectionShell>
  );
}
