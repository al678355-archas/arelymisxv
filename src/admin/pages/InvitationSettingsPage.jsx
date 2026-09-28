import { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { useApi } from '../hooks.js';
import { useAutosave } from '../../hooks/useAutosave.js';
import { useEventDraft, EventDateFields, VenueFields } from '../components/Managers.jsx';
import { Card, ErrorBox, Field, Input, Loading, PageHeader, SaveStatus, TextArea } from '../components/ui.jsx';
import { coverDate, longDate } from '../../lib/format.js';
import FaviconEditor from '../components/FaviconEditor.jsx';

export default function InvitationSettingsPage() {
  const site = useApi('/api/settings');
  const [siteDraft, setSiteDraft] = useState(null);
  const [favicon, setFavicon] = useState(null);
  const siteSave = useAutosave(siteDraft, (value) => api.put('/api/settings', value));
  const { draft, setDraft, images, setImages, error, reload, autosave } = useEventDraft();

  useEffect(() => {
    if (site.data?.settings && !siteDraft) {
      const s = site.data.settings;
      setSiteDraft({ quinceaneraName: s.quinceaneraName, siteTitle: s.siteTitle, metaDescription: s.metaDescription, rsvpDeadline: s.rsvpDeadline, faviconId: s.faviconId ?? null });
      setFavicon(s.favicon);
    }
  }, [site.data, siteDraft]);

  if (site.error || error) return <ErrorBox error={site.error || error} onRetry={() => (site.reload(), reload())} />;
  if (!siteDraft || !draft) return <Loading />;

  const setSite = (patch) => setSiteDraft((d) => ({ ...d, ...patch }));
  const setEvent = (patch) => setDraft((d) => ({ ...d, ...patch }));

  return (
    <div className="a-page">
      <PageHeader title="Invitación" description="Datos principales: nombre, fecha, horarios y lugares. Los cambios se guardan solos y aparecen al instante en la invitación." />

      <Card title="Quinceañera" actions={<SaveStatus status={siteSave.status} error={siteSave.error} />}>
        <div className="a-grid a-grid--2">
          <Field label="Nombre de la quinceañera">
            <Input value={siteDraft.quinceaneraName} onChange={(e) => setSite({ quinceaneraName: e.target.value })} maxLength={80} />
          </Field>
          <Field label="Título de la pestaña del navegador">
            <Input value={siteDraft.siteTitle} onChange={(e) => setSite({ siteTitle: e.target.value })} maxLength={120} />
          </Field>
        </div>
        <Field label="Descripción (al compartir el enlace)">
          <TextArea rows={2} value={siteDraft.metaDescription} onChange={(e) => setSite({ metaDescription: e.target.value })} maxLength={300} showCount />
        </Field>
      </Card>

      <Card title="Icono de la pestaña" description="La imagen pequeña que aparece en la pestaña del navegador, en favoritos y al guardar la invitación en la pantalla del celular." actions={<SaveStatus status={siteSave.status} error={siteSave.error} />}>
        <FaviconEditor
          value={favicon}
          title={siteDraft.siteTitle}
          onChange={(img) => {
            setFavicon(img);
            setSite({ faviconId: img?.id || null });
          }}
        />
      </Card>

      <Card title="Fecha del evento" description={draft.eventDate ? `${longDate(draft.eventDate)} · ${coverDate(draft.eventDate)}` : ''} actions={<SaveStatus status={autosave.status} error={autosave.error} />}>
        <EventDateFields draft={draft} set={setEvent} />
        <Field label="Fecha límite para confirmar asistencia" hint="Se muestra en la sección de confirmación. Déjala vacía para no mostrarla.">
          <Input type="date" value={siteDraft.rsvpDeadline} onChange={(e) => setSite({ rsvpDeadline: e.target.value })} />
        </Field>
      </Card>

      <div className="a-grid a-grid--2 a-grid--top">
        <Card title="Ceremonia" actions={<SaveStatus status={autosave.status} error={autosave.error} />}>
          <VenueFields prefix="ceremony" draft={draft} set={setEvent} image={images.ceremony} onImage={(img) => setImages((i) => ({ ...i, ceremony: img }))} />
        </Card>
        <Card title="Recepción" actions={<SaveStatus status={autosave.status} error={autosave.error} />}>
          <VenueFields prefix="reception" draft={draft} set={setEvent} image={images.reception} onImage={(img) => setImages((i) => ({ ...i, reception: img }))} />
        </Card>
      </div>
    </div>
  );
}
