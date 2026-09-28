import { Link, useNavigate } from 'react-router-dom';
import { useApi } from '../hooks.js';
import { Card, ErrorBox, Icon, Loading, PageHeader, StatCard, EmptyState } from '../components/ui.jsx';
import { GuestCharts } from '../components/Charts.jsx';
import { timeAgo } from '../../lib/format.js';

const ACTIVITY_ICON = {
  RSVP: 'check',
  UPLOAD: 'camera',
  APPROVED: 'check',
  REJECTED: 'x',
  DELETE: 'trash',
  CREATE: 'plus',
  UPDATE: 'edit',
  SHOW: 'eye',
  HIDE: 'eyeOff',
  REORDER: 'list',
  RESET: 'refresh',
};

export function ActivityFeed({ items }) {
  if (!items?.length) return <EmptyState icon="activity" title="Sin actividad todavía" />;
  return (
    <ul className="a-feed">
      {items.map((a) => (
        <li key={a.id} className={`a-feed__item a-feed__item--${a.action.toLowerCase()}`}>
          <span className="a-feed__icon">
            <Icon name={ACTIVITY_ICON[a.action] || 'activity'} size={15} />
          </span>
          <div>
            <p>{a.description}</p>
            <small>
              {a.actorName} · {timeAgo(a.createdAt)}
            </small>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function DashboardPage() {
  const { data, error, loading, reload } = useApi('/api/admin/dashboard', { live: true });
  const navigate = useNavigate();

  if (loading) return <Loading />;
  if (error) return <ErrorBox error={error} onRetry={reload} />;
  const { guests, photos, dedications, sponsors, activity } = data;
  const t = guests.totals;

  return (
    <div className="a-page">
      <PageHeader title="Dashboard" description="Resumen general de la invitación. Se actualiza automáticamente." />

      {!data.cloudinaryConfigured && (
        <div className="a-notice a-notice--warn">
          <Icon name="image" size={18} />
          <span>
            Cloudinary aún no está configurado: las subidas de imágenes no funcionarán hasta agregar <code>CLOUDINARY_CLOUD_NAME</code>, <code>CLOUDINARY_API_KEY</code> y <code>CLOUDINARY_API_SECRET</code> en el backend.
          </span>
        </div>
      )}

      <div className="a-stats">
        <StatCard label="Total invitados" value={t.total} icon="users" tone="rose" onClick={() => navigate('/admin/invitados')} />
        <StatCard label="Confirmados" value={t.attending} icon="check" tone="green" onClick={() => navigate('/admin/invitados?status=ATTENDING')} />
        <StatCard label="Pendientes" value={t.pending} icon="clock" tone="amber" onClick={() => navigate('/admin/invitados?status=PENDING')} />
        <StatCard label="No asistirán" value={t.notAttending} icon="x" tone="gray" onClick={() => navigate('/admin/invitados?status=NOT_ATTENDING')} />
        <StatCard label="Familias registradas" value={t.families} icon="home" tone="violet" onClick={() => navigate('/admin/familias')} />
        <StatCard label="Fotos recuerdos" value={photos.memories} icon="camera" tone="rose" onClick={() => navigate('/admin/galeria-recuerdos')} />
        <StatCard label="Fotos fiesta" value={photos.party} icon="party" tone="violet" onClick={() => navigate('/admin/galeria-fiesta')} />
        <StatCard label="Fotos esperando aprobación" value={photos.pending} icon="image" tone={photos.pending ? 'amber' : 'gray'} onClick={() => navigate(photos.pendingParty > photos.pendingMemories ? '/admin/galeria-fiesta' : '/admin/galeria-recuerdos')} />
        <StatCard label="Dedicatorias pendientes" value={dedications.pending} icon="message" tone={dedications.pending ? 'amber' : 'gray'} onClick={() => navigate('/admin/dedicatorias')} />
        <StatCard label="Padrinos/apoyos confirmados" value={`${sponsors.confirmed}/${sponsors.total}`} icon="handshake" tone="green" onClick={() => navigate('/admin/padrinos')} />
      </div>

      <div className="a-grid a-grid--dash">
        <Card title="Confirmaciones" description="Distribución por estado y por lado de la familia." actions={<Link to="/admin/invitados" className="a-link">Ver invitados</Link>}>
          <GuestCharts stats={guests} />
        </Card>
        <Card title="Actividad reciente" actions={<span className="a-muted">{data.liveViewers} conectados ahora</span>}>
          <ActivityFeed items={activity} />
        </Card>
      </div>
    </div>
  );
}
