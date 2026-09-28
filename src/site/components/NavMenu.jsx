import { useEffect, useState } from 'react';
import Icon from './Icon.jsx';

// Menú flotante con accesos a las secciones (usa el título editable de cada sección).
export default function NavMenu({ sections, name, visible, adminLabel }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > window.innerHeight * 0.6);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const links = sections.filter((s) => s.key !== 'cover' && s.key !== 'footer' && s.content?.title);
  if (!visible || links.length === 0) return null;

  return (
    <>
      <nav className={`nav ${scrolled ? 'is-visible' : ''} ${open ? 'is-open' : ''}`} aria-label="Secciones">
        <a href="#top" className="nav__brand" onClick={() => setOpen(false)}>
          {name}
        </a>
        <button type="button" className="nav__toggle" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-label="Menú">
          <Icon name={open ? 'close' : 'menu'} size={22} />
        </button>
      </nav>
      <div className={`nav-panel ${open ? 'is-open' : ''}`} onClick={() => setOpen(false)}>
        <ul>
          {links.map((s, i) => (
            <li key={s.key} style={{ '--i': i }}>
              <a href={`#s-${s.key}`}>{s.content.title}</a>
            </li>
          ))}
          {adminLabel && (
            <li className="nav-panel__admin" style={{ '--i': links.length }}>
              <a href="/admin/login">
                <Icon name="lock" size={15} /> {adminLabel}
              </a>
            </li>
          )}
        </ul>
      </div>
    </>
  );
}
