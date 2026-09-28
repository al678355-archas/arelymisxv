import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from './AdminApp.jsx';
import { Icon } from './components/ui.jsx';
import { subscribe, isLiveConnected } from '../lib/live.js';
import { usePalette } from './palette.jsx';

export const NAV = [
  { to: '/admin', label: 'Dashboard', icon: 'grid', end: true },
  { group: 'Invitación' },
  { to: '/admin/invitacion', label: 'Editor visual', icon: 'edit' },
  { to: '/admin/secciones', label: 'Secciones', icon: 'layers' },
  { to: '/admin/evento', label: 'Datos del evento', icon: 'calendar' },
  { to: '/admin/diseno', label: 'Diseño', icon: 'type' },
  { to: '/admin/paletas', label: 'Paletas', icon: 'palette' },
  { to: '/admin/multimedia', label: 'Multimedia', icon: 'image' },
  { to: '/admin/musica', label: 'Música', icon: 'music' },
  { to: '/admin/itinerario', label: 'Itinerario e historia', icon: 'list' },
  { to: '/admin/galeria-recuerdos', label: 'Galerías', icon: 'camera', also: ['/admin/galeria-fiesta'] },
  { to: '/admin/dedicatorias', label: 'Dedicatorias', icon: 'message' },
  { to: '/admin/qr', label: 'QR de fotos', icon: 'qr' },
  { group: 'Invitados' },
  { to: '/admin/familias', label: 'Familias', icon: 'home' },
  { to: '/admin/invitados', label: 'Invitados', icon: 'users' },
  { to: '/admin/confirmaciones', label: 'Confirmaciones', icon: 'check' },
  { to: '/admin/padrinos', label: 'Padrinos y apoyos', icon: 'star' },
  { group: 'Sistema' },
  { to: '/admin/administrators', label: 'Administradores', icon: 'lock' },
  { to: '/admin/actividad', label: 'Actividad', icon: 'activity' },
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
  const { refresh: refreshPalette } = usePalette();
  useEffect(() => refreshPalette(), [refreshPalette]);

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
              <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => `a-nav-link ${isActive || item.also?.includes(location.pathname) ? 'is-active' : ''}`}>
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
