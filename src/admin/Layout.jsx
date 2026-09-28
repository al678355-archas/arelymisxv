import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from './AdminApp.jsx';
import { Icon } from './components/ui.jsx';
import { subscribe, isLiveConnected } from '../lib/live.js';

export const NAV = [
  { to: '/admin', label: 'Dashboard', icon: 'grid', end: true },
  { to: '/admin/invitacion', label: 'Invitación', icon: 'heart' },
  { to: '/admin/diseno', label: 'Diseño', icon: 'palette' },
  { to: '/admin/secciones', label: 'Secciones', icon: 'layers' },
  { to: '/admin/multimedia', label: 'Multimedia', icon: 'image' },
  { to: '/admin/musica', label: 'Música', icon: 'music' },
  { to: '/admin/itinerario', label: 'Itinerario', icon: 'list' },
  { group: 'Invitados' },
  { to: '/admin/invitados', label: 'Invitados', icon: 'users' },
  { to: '/admin/familias', label: 'Familias', icon: 'home' },
  { to: '/admin/confirmaciones', label: 'Confirmaciones', icon: 'check' },
  { to: '/admin/padrinos', label: 'Padrinos / Apoyos', icon: 'handshake' },
  { group: 'Interacción' },
  { to: '/admin/galeria-recuerdos', label: 'Galería recuerdos', icon: 'camera' },
  { to: '/admin/galeria-fiesta', label: 'Galería fiesta', icon: 'party' },
  { to: '/admin/dedicatorias', label: 'Dedicatorias', icon: 'message' },
  { to: '/admin/qr', label: 'QR', icon: 'qr' },
  { group: 'Sistema' },
  { to: '/admin/configuracion', label: 'Configuración', icon: 'settings' },
];

function LiveIndicator() {
  const [live, setLive] = useState(isLiveConnected());
  useEffect(() => subscribe('status', setLive), []);
  return (
    <span className={`a-live ${live ? 'is-on' : ''}`} title={live ? 'Conectado en tiempo real' : 'Reconectando…'}>
      <span className="a-live__dot" />
      {live ? 'En vivo' : 'Reconectando'}
    </span>
  );
}

export default function Layout({ children }) {
  const { admin, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => setOpen(false), [location.pathname]);

  return (
    <div className={`admin ${open ? 'is-nav-open' : ''}`}>
      <aside className="a-sidebar" aria-label="Menú principal">
        <div className="a-sidebar__brand">
          <span className="a-sidebar__logo">XV</span>
          <div>
            <strong>Mi invitación</strong>
            <small>Panel administrativo</small>
          </div>
        </div>
        <nav className="a-sidebar__nav">
          {NAV.map((item, i) =>
            item.group ? (
              <p key={`g-${i}`} className="a-sidebar__group">
                {item.group}
              </p>
            ) : (
              <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => `a-nav-link ${isActive ? 'is-active' : ''}`}>
                <Icon name={item.icon} size={18} />
                <span>{item.label}</span>
              </NavLink>
            ),
          )}
        </nav>
        <div className="a-sidebar__footer">
          <span className="a-avatar">{admin?.name?.[0]?.toUpperCase() || 'A'}</span>
          <div className="a-sidebar__user">
            <strong>{admin?.name}</strong>
            <small>@{admin?.username}</small>
          </div>
          <button type="button" className="a-icon-btn a-icon-btn--ghost" onClick={logout} aria-label="Cerrar sesión" title="Cerrar sesión">
            <Icon name="logout" size={17} />
          </button>
        </div>
      </aside>
      <button type="button" className="a-scrim" aria-label="Cerrar menú" onClick={() => setOpen(false)} />

      <div className="a-main">
        <header className="a-topbar">
          <button type="button" className="a-icon-btn a-topbar__menu" onClick={() => setOpen((v) => !v)} aria-label="Abrir menú">
            <Icon name="menu" size={20} />
          </button>
          <LiveIndicator />
          <div className="a-topbar__actions">
            <a className="a-btn a-btn--soft" href="/" target="_blank" rel="noopener noreferrer">
              <Icon name="external" size={16} />
              <span>Ver invitación</span>
            </a>
          </div>
        </header>
        <main className="a-content">{children}</main>
      </div>
    </div>
  );
}
