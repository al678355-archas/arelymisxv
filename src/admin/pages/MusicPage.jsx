import { useEffect, useRef, useState } from 'react';
import { api } from '../../lib/api.js';
import { useApi } from '../hooks.js';
import { useAutosave } from '../../hooks/useAutosave.js';
import { playableAudioUrl } from '../../lib/format.js';
import { Button, Card, ErrorBox, Field, Input, Loading, PageHeader, SaveStatus, Toggle } from '../components/ui.jsx';

export default function MusicPage() {
  const { data, error, reload } = useApi('/api/music');
  const [draft, setDraft] = useState(null);
  const [testState, setTestState] = useState('');
  const audio = useRef(null);

  useEffect(() => {
    if (data?.music && !draft) {
      const { url, title, artist, volume, active, loop } = data.music;
      setDraft({ url, title, artist, volume, active, loop });
    }
  }, [data, draft]);

  const autosave = useAutosave(draft, (value) => api.put('/api/music', value));

  if (error) return <ErrorBox error={error} onRetry={reload} />;
  if (!draft) return <Loading />;
  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));
  const playable = draft.url ? playableAudioUrl(draft.url) : '';

  async function test() {
    if (!audio.current) return;
    if (!audio.current.paused) {
      audio.current.pause();
      setTestState('');
      return;
    }
    setTestState('Cargando…');
    audio.current.volume = draft.volume / 100;
    try {
      await audio.current.play();
      setTestState('Reproduciendo');
    } catch {
      setTestState('No se pudo reproducir. Revisa que el enlace sea público y apunte a un archivo de audio.');
    }
  }

  return (
    <div className="a-page">
      <PageHeader title="Música" description="La canción empieza al presionar “Abrir invitación”. Los invitados pueden pausarla con el botón flotante." actions={<SaveStatus status={autosave.status} error={autosave.error} />} />
      <Card>
        <div className="a-form-stack">
          <Toggle checked={draft.active} onChange={(active) => set({ active })} label="Música activa" description={draft.url ? 'Se mostrará el botón de música en la invitación.' : 'Agrega primero la URL de la canción.'} />
          <Field label="URL de la canción" hint="Enlace directo a un MP3 o enlace de Google Drive (el archivo debe estar compartido como “Cualquier persona con el enlace”).">
            <Input type="url" value={draft.url} onChange={(e) => set({ url: e.target.value.trim() })} placeholder="https://drive.google.com/file/d/…/view" />
          </Field>
          {playable && playable !== draft.url && <p className="a-field__hint">Se reproducirá desde: {playable}</p>}
          <div className="a-grid a-grid--2">
            <Field label="Título">
              <Input value={draft.title} onChange={(e) => set({ title: e.target.value })} maxLength={150} />
            </Field>
            <Field label="Artista">
              <Input value={draft.artist} onChange={(e) => set({ artist: e.target.value })} maxLength={150} />
            </Field>
          </div>
          <Field label={`Volumen inicial (${draft.volume}%)`}>
            <input type="range" className="a-range" min="0" max="100" value={draft.volume} onChange={(e) => set({ volume: Number(e.target.value) })} />
          </Field>
          <Toggle checked={draft.loop} onChange={(loop) => set({ loop })} label="Repetir al terminar" />
          {playable && (
            <div className="a-inline">
              <audio ref={audio} src={playable} preload="none" onEnded={() => setTestState('')} onError={() => setTestState('El enlace no apunta a un audio válido o no es público.')} />
              <Button variant="soft" icon="play" onClick={test}>
                Probar canción
              </Button>
              {testState && <span className="a-muted">{testState}</span>}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
