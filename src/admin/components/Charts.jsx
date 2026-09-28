// Gráficos ligeros en SVG/CSS (sin librerías).
import { SIDE_LABELS } from '../../lib/format.js';

const SEGMENTS = [
  { key: 'attending', label: 'Confirmados', color: 'var(--a-green)' },
  { key: 'pending', label: 'Pendientes', color: 'var(--a-amber)' },
  { key: 'notAttending', label: 'No asistirán', color: 'var(--a-gray)' },
];

export function Donut({ data, size = 170 }) {
  const total = SEGMENTS.reduce((s, seg) => s + (data[seg.key] || 0), 0);
  const r = 15.9155; // circunferencia = 100
  let offset = 25;
  return (
    <figure className="a-donut" style={{ width: size }}>
      <svg viewBox="0 0 42 42" role="img" aria-label="Gráfico de confirmaciones">
        <circle cx="21" cy="21" r={r} fill="none" stroke="var(--a-line)" strokeWidth="5" />
        {total > 0 &&
          SEGMENTS.map((seg) => {
            const value = ((data[seg.key] || 0) / total) * 100;
            const el = (
              <circle key={seg.key} className="a-donut__seg" cx="21" cy="21" r={r} fill="none" stroke={seg.color} strokeWidth="5" strokeDasharray={`${value} ${100 - value}`} strokeDashoffset={offset}>
                <title>{`${seg.label}: ${data[seg.key] || 0}`}</title>
              </circle>
            );
            offset -= value;
            return el;
          })}
      </svg>
      <figcaption>
        <strong>{total ? Math.round(((data.attending || 0) / total) * 100) : 0}%</strong>
        <span>confirmado</span>
      </figcaption>
    </figure>
  );
}

export function Legend({ data }) {
  return (
    <ul className="a-legend">
      {SEGMENTS.map((seg) => (
        <li key={seg.key}>
          <span className="a-legend__dot" style={{ background: seg.color }} />
          {seg.label}
          <strong>{data[seg.key] || 0}</strong>
        </li>
      ))}
    </ul>
  );
}

export function StackedBar({ data }) {
  const total = data.total || 0;
  return (
    <div className="a-stacked" role="img" aria-label={`${data.attending} confirmados, ${data.pending} pendientes, ${data.notAttending} no asistirán`}>
      {total === 0 ? (
        <span className="a-stacked__empty" />
      ) : (
        SEGMENTS.map((seg) => (data[seg.key] ? <span key={seg.key} style={{ width: `${(data[seg.key] / total) * 100}%`, background: seg.color }} title={`${seg.label}: ${data[seg.key]}`} /> : null))
      )}
    </div>
  );
}

export function GuestCharts({ stats }) {
  return (
    <div className="a-charts">
      <div className="a-charts__donut">
        <Donut data={stats.totals} />
        <Legend data={stats.totals} />
      </div>
      <div className="a-charts__sides">
        {Object.entries(stats.bySide).map(([side, data]) => (
          <div key={side} className="a-side-row">
            <div className="a-side-row__head">
              <strong>{SIDE_LABELS[side]}</strong>
              <span>
                {data.attending}/{data.total} confirmados · {data.families} familias
              </span>
            </div>
            <StackedBar data={data} />
          </div>
        ))}
      </div>
    </div>
  );
}
