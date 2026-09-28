import { useEffect, useRef, useState } from 'react';
import Icon from './Icon.jsx';

export function navLabel(section, siteName) {
  const c = section.content || {};
  return c.navLabel || c.title || (section.key === 'cover' ? siteName : '') || c.eyebrow || '';
}

// Menú siempre visible (barra superior con todas las secciones) + panel completo + controles anterior/siguiente.
export default function StageNav({ sections, current, onSelect, onPrev, onNext, name, adminLabel }) {
  const [open, setOpen] = useState(false);
  const listRef = useRef(null);

  // Mantener visible la sección activa dentro de la barra deslizable.
  useEffect(() => {
    const center = (smooth) => {
      const list = listRef.current;
      const el = list?.querySelector('[aria-current="true"]');
      if (!el) return;
      const left = el.offsetLeft - list.clientWidth / 2 + el.clientWidth / 2;
      list.scrollTo({ left, behavior: smooth ? 'smooth' : 'auto' });
    };
    center(true);
    const onResize = () => center(false);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [current]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const select = (i) => {
    setOpen(false);
    onSelect(i);
  };

  return (
    <>
      <nav className="stage-nav" aria-label="Secciones de la invitación">
        <button type="button" className="stage-nav__brand" onClick={() => select(0)}>
          {name}
        </button>
        <ul className="stage-nav__list" ref={listRef}>
          {sections.map((s, i) => (
            <li key={s.key}>
              <button type="button" className={`stage-nav__link ${i === current ? 'is-active' : ''}`} aria-current={i === current} onClick={() => select(i)}>
                {navLabel(s, name)}
              </button>
            </li>
          ))}
        </ul>
        <button type="button" className="stage-nav__menu" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-label="Ver todas las secciones">
          <Icon name={open ? 'close' : 'grid'} size={20} />
        </button>
      </nav>

      <div className={`stage-panel ${open ? 'is-open' : ''}`} onClick={() => setOpen(false)}>
        <ol className="stage-panel__grid" onClick={(e) => e.stopPropagation()}>
          {sections.map((s, i) => (
            <li key={s.key} style={{ '--i': i }}>
              <button type="button" className={i === current ? 'is-active' : ''} onClick={() => select(i)}>
                <span className="stage-panel__num">{String(i + 1).padStart(2, '0')}</span>
                <span>{navLabel(s, name)}</span>
              </button>
            </li>
          ))}
          {adminLabel && (
            <li className="stage-panel__admin" style={{ '--i': sections.length }}>
              <a href="/admin/login">
                <Icon name="lock" size={15} />
                <span>{adminLabel}</span>
              </a>
            </li>
          )}
        </ol>
      </div>

      <div className="stage-pager" role="group" aria-label="Navegación">
        <button type="button" onClick={onPrev} disabled={current === 0} aria-label="Sección anterior">
          <Icon name="chevronLeft" size={20} />
        </button>
        <span className="stage-pager__count">
          <strong>{current + 1}</strong> / {sections.length}
        </span>
        <button type="button" onClick={onNext} disabled={current === sections.length - 1} aria-label="Sección siguiente">
          <Icon name="chevronRight" size={20} />
        </button>
      </div>
    </>
  );
}
