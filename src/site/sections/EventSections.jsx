import SectionShell from '../components/SectionShell.jsx';
import Icon from '../components/Icon.jsx';
import { cld, srcSet } from '../../lib/image.js';
import { parseLocalDate, monthName, weekdayNames, longDate } from '../../lib/format.js';

// Calendario generado a partir de la fecha del evento.
export function Calendar({ section, data }) {
  const { content } = section;
  const date = parseLocalDate(data.event?.eventDate);
  if (!date) return null;
  const mondayFirst = content.weekStartsOn !== 'sunday';
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();
  const firstWeekday = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const offset = mondayFirst ? (firstWeekday + 6) % 7 : firstWeekday;
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const cells = [...Array(offset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  return (
    <SectionShell section={section} theme={data.theme}>
      <div className="calendar card" data-reveal="section">
        <p className="calendar__month">
          <span>{monthName(date)}</span> {year}
        </p>
        <div className="calendar__grid" role="grid" aria-label={`${monthName(date)} ${year}`}>
          {weekdayNames(mondayFirst).map((w) => (
            <span key={w} className="calendar__weekday" role="columnheader">
              {w}
            </span>
          ))}
          {cells.map((d, i) => (
            <span
              key={i}
              role="gridcell"
              className={`calendar__day ${d === day ? 'is-event' : ''} ${d ? '' : 'is-empty'}`}
              aria-current={d === day ? 'date' : undefined}
            >
              {d || ''}
            </span>
          ))}
        </div>
        <p className="calendar__long">{longDate(data.event.eventDate)}</p>
        {content.note && <p className="calendar__note">{content.note}</p>}
      </div>
    </SectionShell>
  );
}

// Ceremonia / Recepción: los datos viven en EventDetails, los textos en la sección.
export function Venue({ section, data }) {
  const { content, key } = section;
  const prefix = key === 'ceremony' ? 'ceremony' : 'reception';
  const e = data.event || {};
  const venue = {
    name: e[`${prefix}Name`],
    address: e[`${prefix}Address`],
    time: e[`${prefix}Time`],
    mapUrl: e[`${prefix}MapUrl`],
    image: e[`${prefix}Image`],
  };
  return (
    <SectionShell section={section} theme={data.theme}>
      <div className={`venue ${venue.image?.url ? 'venue--image' : ''} ${key === 'reception' ? 'venue--reverse' : ''}`}>
        {venue.image?.url && (
          <figure className="venue__image" data-reveal={key === 'reception' ? 'slideFromRight' : 'slideFromLeft'}>
            <img src={cld(venue.image.url, { w: 900 })} srcSet={srcSet(venue.image.url, 1600)} sizes="(max-width: 860px) 92vw, 46vw" alt={venue.name || content.title || ''} loading="lazy" width={venue.image.width} height={venue.image.height} />
          </figure>
        )}
        <div className="venue__info card" data-reveal="section">
          <span className="venue__icon">
            <Icon name={key === 'ceremony' ? 'church' : 'glass'} size={30} />
          </span>
          {venue.name && <h3 className="venue__name">{venue.name}</h3>}
          {venue.time && (
            <p className="venue__row">
              <Icon name="clock" size={18} />
              <span>
                {content.timeLabel && <strong>{content.timeLabel}: </strong>}
                {venue.time}
              </span>
            </p>
          )}
          {venue.address && (
            <p className="venue__row">
              <Icon name="pin" size={18} />
              <span>
                {content.addressLabel && <strong>{content.addressLabel}: </strong>}
                {venue.address}
              </span>
            </p>
          )}
          {venue.mapUrl && content.buttonText && (
            <a className="btn" href={venue.mapUrl} target="_blank" rel="noopener noreferrer">
              <Icon name="pin" size={18} />
              <span>{content.buttonText}</span>
            </a>
          )}
        </div>
      </div>
    </SectionShell>
  );
}

export function Itinerary({ section, data }) {
  const items = data.itinerary || [];
  return (
    <SectionShell section={section} theme={data.theme}>
      <ol className="timeline">
        {items.map((item, i) => (
          <li key={item.id} className="timeline__item" data-reveal={i % 2 ? 'slideFromRight' : 'slideFromLeft'}>
            <span className="timeline__dot">
              <Icon name={item.icon || 'sparkle'} size={20} />
            </span>
            <div className="timeline__card card">
              <p className="timeline__time">{item.time}</p>
              <h3 className="timeline__title">{item.title}</h3>
              {item.description && <p className="timeline__desc">{item.description}</p>}
            </div>
          </li>
        ))}
      </ol>
    </SectionShell>
  );
}

export function DressCode({ section, data }) {
  const { content } = section;
  const colors = (content.reservedColors || []).filter((c) => c?.color);
  return (
    <SectionShell section={section} theme={data.theme}>
      <div className={`split ${content.image?.url ? 'split--image' : ''}`}>
        {content.image?.url && (
          <figure className="side-image side-image--contain" data-reveal="scaleIn">
            <img src={cld(content.image.url, { w: 800 })} srcSet={srcSet(content.image.url, 1400)} sizes="(max-width: 860px) 90vw, 40vw" alt={content.title || ''} loading="lazy" width={content.image.width} height={content.image.height} />
          </figure>
        )}
        <div className="split__text">
          <span className="dress__icon" data-reveal="scaleIn">
            <Icon name="dress" size={40} strokeWidth={1.2} />
          </span>
          {content.description && (
            <p className="prose" data-reveal="section">
              {content.description}
            </p>
          )}
          {colors.length > 0 && (
            <div className="dress__reserved" data-reveal="fadeInUp">
              {content.reservedTitle && <p className="dress__reserved-title">{content.reservedTitle}</p>}
              <ul className="swatches">
                {colors.map((c, i) => (
                  <li key={i} className="swatch" style={{ '--swatch': c.color, '--delay': `${i * 90}ms` }}>
                    <span className="swatch__color" />
                    {c.name && <span className="swatch__name">{c.name}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {content.notes && (
            <p className="dress__notes" data-reveal="fadeInUp">
              {content.notes}
            </p>
          )}
        </div>
      </div>
    </SectionShell>
  );
}

export function Story({ section, data }) {
  const items = data.story || [];
  return (
    <SectionShell section={section} theme={data.theme}>
      <ol className="story">
        {items.map((item, i) => (
          <li key={item.id} className={`story__item ${i % 2 ? 'story__item--reverse' : ''}`}>
            {item.image?.url ? (
              <figure className="story__photo" data-reveal={i % 2 ? 'slideFromRight' : 'slideFromLeft'}>
                <img src={cld(item.image.url, { w: 700 })} srcSet={srcSet(item.image.url, 1200)} sizes="(max-width: 860px) 86vw, 38vw" alt={item.title} loading="lazy" width={item.image.width} height={item.image.height} />
              </figure>
            ) : (
              <div className="story__photo story__photo--empty" aria-hidden="true">
                <Icon name="heart" size={36} />
              </div>
            )}
            <div className="story__text" data-reveal={i % 2 ? 'slideFromLeft' : 'slideFromRight'}>
              <p className="story__year">{item.year}</p>
              <h3 className="story__title">{item.title}</h3>
              {item.description && <p className="story__desc">{item.description}</p>}
            </div>
          </li>
        ))}
      </ol>
    </SectionShell>
  );
}
