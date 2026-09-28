import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../hooks.js';
import { SIDE_LABELS, STATUS_LABELS, dateTime, timeAgo } from '../../lib/format.js';
import { Badge, Card, EmptyState, ErrorBox, Icon, Loading, PageHeader, Tabs } from '../components/ui.jsx';
import { STATUS_TONE } from './GuestsPage.jsx';

export default function ConfirmationsPage() {
  const [tab, setTab] = useState('history');
  const history = useApi('/api/rsvp', { live: true });
  const families = useApi('/api/families', { live: true });

  const pendingFamilies = (families.data?.families || []).filter((f) => f.stats.pending > 0);
  const answered = (families.data?.families || []).filter((f) => f.stats.total > 0 && f.stats.pending === 0);

  return (
    <div className="a-page">
      <PageHeader title="Confirmaciones" description="Historial de respuestas enviadas desde la invitación y familias que aún no confirman." />
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'history', label: 'Historial', count: history.data?.rsvps.length },
          { value: 'pending', label: 'Por confirmar', count: pendingFamilies.length },
          { value: 'done', label: 'Familias que ya respondieron', count: answered.length },
        ]}
      />

      {tab === 'history' && (
        <Card padded={false}>
          <ErrorBox error={history.error} onRetry={history.reload} />
          {history.loading ? (
            <Loading />
          ) : !history.data?.rsvps.length ? (
            <EmptyState icon="check" title="Aún no hay confirmaciones">
              Cuando una familia confirme desde la invitación aparecerá aquí al instante.
            </EmptyState>
          ) : (
            <ul className="a-rsvp-list">
              {history.data.rsvps.map((r) => (
                <li key={r.id} className="a-rsvp">
                  <div className="a-rsvp__head">
                    <Link to={`/admin/familias?open=${r.family.id}`} className="a-link">
                      <strong>Familia {r.family.surnames}</strong>
                    </Link>
                    <Badge>{SIDE_LABELS[r.family.side]}</Badge>
                    <span className="a-muted" title={dateTime(r.createdAt)}>
                      {timeAgo(r.createdAt)}
                    </span>
                  </div>
                  <ul className="a-rsvp__people">
                    {r.responses.map((p) => (
                      <li key={p.guestId}>
                        <span>{p.fullName}</span>
                        <Badge tone={STATUS_TONE[p.status]}>{STATUS_LABELS[p.status]}</Badge>
                      </li>
                    ))}
                  </ul>
                  {r.message && (
                    <p className="a-rsvp__msg">
                      <Icon name="message" size={15} /> “{r.message}”
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {tab !== 'history' && (
        <Card padded={false}>
          {families.loading ? (
            <Loading />
          ) : (tab === 'pending' ? pendingFamilies : answered).length === 0 ? (
            <EmptyState icon="users" title={tab === 'pending' ? '¡Todas las familias han respondido!' : 'Ninguna familia ha respondido todavía'} />
          ) : (
            <ul className="a-rsvp-list">
              {(tab === 'pending' ? pendingFamilies : answered).map((f) => (
                <li key={f.id} className="a-rsvp">
                  <div className="a-rsvp__head">
                    <Link to={`/admin/familias?open=${f.id}`} className="a-link">
                      <strong>Familia {f.surnames}</strong>
                    </Link>
                    <Badge>{SIDE_LABELS[f.side]}</Badge>
                    <span className="a-muted">
                      {f.stats.attending} confirmados · {f.stats.pending} pendientes · {f.stats.notAttending} no asistirán
                    </span>
                  </div>
                  <ul className="a-rsvp__people">
                    {f.guests.map((g) => (
                      <li key={g.id}>
                        <span>{g.fullName}</span>
                        <Badge tone={STATUS_TONE[g.status]}>{STATUS_LABELS[g.status]}</Badge>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
    </div>
  );
}
