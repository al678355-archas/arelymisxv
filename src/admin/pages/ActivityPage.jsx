import { useMemo, useState } from 'react';
import { useApi } from '../hooks.js';
import { ActivityFeed } from './DashboardPage.jsx';
import { Card, ErrorBox, Input, Loading, PageHeader, Select } from '../components/ui.jsx';

const ENTITIES = [
  { value: '', label: 'Todo' },
  { value: 'Section', label: 'Secciones' },
  { value: 'ThemeSettings', label: 'Diseño y paleta' },
  { value: 'MusicSettings', label: 'Música' },
  { value: 'Family', label: 'Familias y confirmaciones' },
  { value: 'Guest', label: 'Invitados' },
  { value: 'GalleryPhoto', label: 'Fotografías' },
  { value: 'Dedication', label: 'Dedicatorias' },
  { value: 'PlanningTask', label: 'Tareas' },
  { value: 'ChecklistItem', label: 'Checklist' },
  { value: 'BudgetItem', label: 'Presupuesto' },
  { value: 'Vendor', label: 'Proveedores' },
  { value: 'SeatingTable', label: 'Mesas' },
  { value: 'Admin', label: 'Administradores' },
];

export default function ActivityPage() {
  const [entity, setEntity] = useState('');
  const [q, setQ] = useState('');
  const { data, error, loading, reload } = useApi(`/api/activity?limit=300${entity ? `&entity=${entity}` : ''}`, { live: true });
  const items = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (data?.activity || []).filter((a) => !term || a.description.toLowerCase().includes(term) || a.actorName.toLowerCase().includes(term));
  }, [data, q]);

  return (
    <div className="a-page">
      <PageHeader title="Actividad" description="Registro de todo lo importante que ocurre en el panel y en la invitación. Se actualiza en vivo." />
      <Card
        title={`${items.length} registros`}
        actions={
          <div className="a-filters">
            <Input placeholder="Buscar…" value={q} onChange={(e) => setQ(e.target.value)} />
            <Select value={entity} onChange={(e) => setEntity(e.target.value)} options={ENTITIES} />
          </div>
        }
      >
        <ErrorBox error={error} onRetry={reload} />
        {loading ? <Loading skeleton={6} /> : <ActivityFeed items={items} />}
      </Card>
    </div>
  );
}
