import { useState } from 'react';
import SectionShell from '../components/SectionShell.jsx';
import PhotoUploadForm from '../components/PhotoUploadForm.jsx';
import Lightbox from '../components/Lightbox.jsx';
import Icon from '../components/Icon.jsx';
import { api } from '../../lib/api.js';
import { cld } from '../../lib/image.js';
import { longDate } from '../../lib/format.js';

// Galerías (recuerdos y fiesta)
export function Gallery({ section, data }) {
  const { content, key } = section;
  const isMemory = key === 'memories';
  const items = (isMemory ? data.gallery?.memories : data.gallery?.party) || [];
  const uploadsOpen = isMemory ? data.site?.memoryUploadsEnabled : data.site?.partyUploadsEnabled;
  const [open, setOpen] = useState(-1);
  const [showForm, setShowForm] = useState(false);

  return (
    <SectionShell section={section} theme={data.theme}>
      {items.length === 0 ? (
        content.emptyText && (
          <p className="empty-note" data-reveal="fadeIn">
            {content.emptyText}
          </p>
        )
      ) : (
        <div className="masonry">
          {items.map((item, i) => (
            <button
              type="button"
              key={item.id}
              className="masonry__item"
              onClick={() => setOpen(i)}
              data-reveal="scaleIn"
              style={{ '--delay': `${(i % 6) * 70}ms`, aspectRatio: item.image?.width ? `${item.image.width} / ${item.image.height}` : undefined }}
              aria-label={`Ver foto de ${item.uploaderName}`}
            >
              <img src={cld(item.image.url, { w: 600 })} alt={item.message || `Foto de ${item.uploaderName}`} loading="lazy" width={item.image.width} height={item.image.height} />
              <span className="masonry__caption">{item.uploaderName}</span>
            </button>
          ))}
        </div>
      )}

      {uploadsOpen ? (
        <div className="upload-block card" data-reveal="fadeInUp">
          <button type="button" className="upload-block__toggle" onClick={() => setShowForm((v) => !v)} aria-expanded={showForm}>
            <Icon name="camera" size={26} />
            <span>
              <strong>{content.uploadTitle}</strong>
              {content.uploadText && <small>{content.uploadText}</small>}
            </span>
            <Icon name="chevronDown" size={20} className={showForm ? 'rot-180' : ''} />
          </button>
          <div className={`collapse ${showForm ? 'is-open' : ''}`}>
            <div className="collapse__inner">{showForm && <PhotoUploadForm type={isMemory ? 'memory' : 'party'} content={content} />}</div>
          </div>
        </div>
      ) : (
        !isMemory &&
        content.closedText && (
          <p className="empty-note" data-reveal="fadeIn">
            {content.closedText}
          </p>
        )
      )}

      {open > -1 && <Lightbox items={items} index={open} onClose={() => setOpen(-1)} onIndex={setOpen} />}
    </SectionShell>
  );
}

// Confirmación de asistencia por familia
export function Rsvp({ section, data }) {
  const { content } = section;
  const [query, setQuery] = useState('');
  const [state, setState] = useState('search'); // search | choose | family | done
  const [families, setFamilies] = useState([]);
  const [family, setFamily] = useState(null);
  const [answers, setAnswers] = useState({});
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const deadline = data.site?.rsvpDeadline ? longDate(data.site.rsvpDeadline) : '';

  function chooseFamily(f) {
    setFamily(f);
    setAnswers(Object.fromEntries(f.guests.map((g) => [g.id, g.status === 'PENDING' ? '' : g.status])));
    setState('family');
  }

  async function search(e) {
    e.preventDefault();
    setError('');
    if (query.trim().length < 3) return setError(content.notFoundText);
    setBusy(true);
    try {
      const res = await api.post('/api/public/rsvp/search', { surnames: query }, { auth: false });
      if (res.status === 'not_found') setError(content.notFoundText);
      else if (res.status === 'found') chooseFamily(res.families[0]);
      else {
        setFamilies(res.families);
        setState('choose');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function confirm(e) {
    e.preventDefault();
    setError('');
    const responses = Object.entries(answers)
      .filter(([, status]) => status)
      .map(([guestId, status]) => ({ guestId, status }));
    if (responses.length !== family.guests.length) return setError('Indica si asistirá cada persona de la lista.');
    setBusy(true);
    try {
      const res = await api.post(`/api/public/rsvp/${family.id}`, { responses, message }, { auth: false });
      setFamily(res.family);
      setState('done');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function restart() {
    setState('search');
    setFamily(null);
    setFamilies([]);
    setQuery('');
    setMessage('');
    setError('');
  }

  if (!data.site?.rsvpEnabled) {
    return (
      <SectionShell section={section} theme={data.theme}>
        <p className="empty-note">{content.closedText}</p>
      </SectionShell>
    );
  }

  return (
    <SectionShell section={section} theme={data.theme}>
      <div className="rsvp card" data-reveal="section">
        {state === 'search' && (
          <form className="rsvp__search" onSubmit={search}>
            <label className="field">
              <span className="field__label">{content.searchLabel}</span>
              <span className="input-icon">
                <Icon name="search" size={18} />
                <input className="input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={content.searchPlaceholder} maxLength={120} autoComplete="family-name" />
              </span>
            </label>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <button type="submit" className="btn" disabled={busy}>
              <Icon name="search" size={18} />
              <span>{busy ? '…' : content.searchButton}</span>
            </button>
            {deadline && content.deadlineText && (
              <p className="rsvp__deadline">
                {content.deadlineText} <strong>{deadline}</strong>
              </p>
            )}
          </form>
        )}

        {state === 'choose' && (
          <div className="rsvp__choose">
            <p>{content.multipleText}</p>
            <div className="rsvp__options">
              {families.map((f) => (
                <button key={f.id} type="button" className="btn btn--ghost" onClick={() => chooseFamily(f)}>
                  {content.familyPrefix} {f.surnames}
                </button>
              ))}
            </div>
            <button type="button" className="link-btn" onClick={restart}>
              {content.searchAgain}
            </button>
          </div>
        )}

        {state === 'family' && family && (
          <form className="rsvp__family" onSubmit={confirm}>
            <p className="rsvp__found">{content.foundTitle}</p>
            <h3 className="rsvp__family-name">
              {content.familyPrefix} {family.surnames}
            </h3>
            <ul className="rsvp__guests">
              {family.guests.map((g) => (
                <li key={g.id} className="rsvp__guest">
                  <span className="rsvp__guest-name">{g.fullName}</span>
                  <div className="choice" role="radiogroup" aria-label={g.fullName}>
                    {[
                      ['ATTENDING', content.attendingLabel, 'check'],
                      ['NOT_ATTENDING', content.notAttendingLabel, 'x'],
                    ].map(([value, label, icon]) => (
                      <label key={value} className={`choice__opt choice__opt--${value === 'ATTENDING' ? 'yes' : 'no'} ${answers[g.id] === value ? 'is-checked' : ''}`}>
                        <input type="radio" name={`g-${g.id}`} value={value} checked={answers[g.id] === value} onChange={() => setAnswers((a) => ({ ...a, [g.id]: value }))} />
                        <Icon name={icon} size={16} />
                        <span>{label}</span>
                      </label>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
            <label className="field">
              <span className="field__label">{content.messageLabel}</span>
              <textarea className="input" rows={3} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={600} />
            </label>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <div className="rsvp__actions">
              <button type="submit" className="btn" disabled={busy}>
                <Icon name="heart" size={18} />
                <span>{busy ? '…' : content.submitButton}</span>
              </button>
              <button type="button" className="link-btn" onClick={restart}>
                {content.searchAgain}
              </button>
            </div>
          </form>
        )}

        {state === 'done' && family && (
          <div className="rsvp__done" role="status">
            <span className="upload-form__check">
              <Icon name="heart" size={30} />
            </span>
            <h3>{content.successTitle}</h3>
            <ul className="rsvp__summary">
              {family.guests.map((g) => (
                <li key={g.id} className={g.status === 'ATTENDING' ? 'is-yes' : 'is-no'}>
                  <Icon name={g.status === 'ATTENDING' ? 'check' : 'x'} size={16} />
                  {g.fullName} — {g.status === 'ATTENDING' ? content.attendingLabel : content.notAttendingLabel}
                </li>
              ))}
            </ul>
            {content.successText && <p>{content.successText}</p>}
            <button type="button" className="link-btn" onClick={restart}>
              {content.searchAgain}
            </button>
          </div>
        )}
      </div>
    </SectionShell>
  );
}

// Dedicatorias
export function Dedications({ section, data }) {
  const { content } = section;
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const items = data.dedications || [];

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (name.trim().length < 2) return setError('Escribe tu nombre.');
    if (message.trim().length < 3) return setError('Escribe tu mensaje.');
    setBusy(true);
    try {
      await api.post('/api/public/dedications', { name, message }, { auth: false });
      setSent(true);
      setMessage('');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <SectionShell section={section} theme={data.theme}>
      {data.site?.dedicationsEnabled && (
        <div className="dedication-form card" data-reveal="section">
          {sent ? (
            <div className="rsvp__done" role="status">
              <span className="upload-form__check">
                <Icon name="message" size={28} />
              </span>
              <p>{content.successText}</p>
              <button type="button" className="link-btn" onClick={() => setSent(false)}>
                {content.buttonText}
              </button>
            </div>
          ) : (
            <form onSubmit={submit} noValidate>
              <label className="field">
                <span className="field__label">{content.nameLabel}</span>
                <input className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} autoComplete="name" />
              </label>
              <label className="field">
                <span className="field__label">{content.messageLabel}</span>
                <textarea className="input" rows={4} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={800} />
                <small className="field__hint">{message.length}/800</small>
              </label>
              {error && (
                <p className="form-error" role="alert">
                  {error}
                </p>
              )}
              <button type="submit" className="btn" disabled={busy}>
                <Icon name="message" size={18} />
                <span>{busy ? '…' : content.buttonText}</span>
              </button>
            </form>
          )}
        </div>
      )}

      {items.length === 0 ? (
        content.emptyText && <p className="empty-note">{content.emptyText}</p>
      ) : (
        <div className="dedications">
          {items.map((d, i) => (
            <blockquote key={d.id} className="dedication card" data-reveal="fadeInUp" style={{ '--delay': `${(i % 4) * 90}ms` }}>
              <p>{d.message}</p>
              <cite>— {d.name}</cite>
            </blockquote>
          ))}
        </div>
      )}
    </SectionShell>
  );
}

export function Footer({ section, data }) {
  const { content } = section;
  return (
    <SectionShell section={section} theme={data.theme} heading={false} className="xv-footer">
      <footer className="footer">
        {content.title && (
          <p className="footer__title" data-reveal="section">
            {content.title}
          </p>
        )}
        {content.text && (
          <p className="footer__text" data-reveal="fadeInUp">
            {content.text}
          </p>
        )}
        {content.signature && (
          <p className="footer__signature" data-reveal="fadeInUp">
            {content.signature}
          </p>
        )}
        {content.hashtag && (
          <p className="footer__hashtag" data-reveal="fadeInUp">
            {content.hashtag}
          </p>
        )}
        {content.credits && (
          <p className="footer__credits" data-reveal="fadeIn">
            {content.credits}
          </p>
        )}
      </footer>
    </SectionShell>
  );
}
