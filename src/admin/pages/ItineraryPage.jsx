import { useState } from 'react';
import { ItineraryManager, StoryManager } from '../components/Managers.jsx';
import PreviewFrame from '../components/PreviewFrame.jsx';
import { Card, PageHeader, Tabs } from '../components/ui.jsx';

export default function ItineraryPage() {
  const [tab, setTab] = useState('itinerary');
  return (
    <div className="a-page a-page--with-preview">
      <div className="a-page__main">
        <PageHeader title="Itinerario" description="Agrega, edita, elimina y ordena las actividades. También puedes editar la historia (timeline con fotos)." />
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { value: 'itinerary', label: 'Itinerario' },
            { value: 'story', label: 'Historia' },
          ]}
        />
        <Card>{tab === 'itinerary' ? <ItineraryManager /> : <StoryManager />}</Card>
      </div>
      <PreviewFrame focusKey={tab === 'itinerary' ? 'itinerary' : 'story'} />
    </div>
  );
}
