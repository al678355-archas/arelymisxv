import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { useApi } from '../hooks.js';
import { useAutosave } from '../../hooks/useAutosave.js';
import { Card, ErrorBox, Field, Icon, Input, Loading, PageHeader, SaveStatus, TextArea, Toggle } from '../components/ui.jsx';

const TEXT_FIELDS = [
  ['loadingText', 'Texto de la pantalla de carga'],
  ['adminLinkText', 'Enlace discreto al panel (footer y menú)', 'text', 'Déjalo vacío para ocultarlo en la invitación.'],
  ['musicListenLabel', 'Botón cuando el navegador bloquea la música'],
  ['musicPlayLabel', 'Botón de música: reproducir (accesibilidad)'],
  ['musicPauseLabel', 'Botón de música: pausar (accesibilidad)'],
  ['uploadPageTitle', 'Página /subir-foto: título'],
  ['uploadPageSubtitle', 'Página /subir-foto: descripción', 'textarea'],
  ['uploadPartyTab', 'Página /subir-foto: pestaña fiesta'],
  ['uploadMemoryTab', 'Página /subir-foto: pestaña recuerdos'],
  ['uploadClosedText', 'Página /subir-foto: mensaje de cerrado', 'textarea'],
  ['uploadBackLink', 'Página /subir-foto: enlace a la invitación'],
];

const SHORTCUTS = [
  ['/admin/administrators', 'lock', 'Administradores', 'Cuentas, contraseñas y estado'],
  ['/admin/actividad', 'activity', 'Actividad', 'Todo lo que se ha modificado'],
  ['/admin/evento', 'calendar', 'Datos del evento', 'Nombre, fecha, lugares e icono'],
];

export default function SettingsPage() {
  const { data, error, reload } = useApi('/api/settings');
  const [draft, setDraft] = useState(null);

  useEffect(() => {
    if (data?.settings && !draft) {
      const s = data.settings;
      setDraft({
        publicUrl: s.publicUrl,
        rsvpEnabled: s.rsvpEnabled,
        dedicationsEnabled: s.dedicationsEnabled,
        memoryUploadsEnabled: s.memoryUploadsEnabled,
        partyUploadsEnabled: s.partyUploadsEnabled,
        texts: s.texts || {},
      });
    }
  }, [data, draft]);

  const autosave = useAutosave(draft, (value) => api.put('/api/settings', value));

  if (error) return <ErrorBox error={error} onRetry={reload} />;
  if (!draft) return <Loading skeleton={5} />;
  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));
  const setText = (key, value) => setDraft((d) => ({ ...d, texts: { ...d.texts, [key]: value } }));

  return (
    <div className="a-page">
      <PageHeader title="Configuración" description="Opciones generales y textos del sistema." actions={<SaveStatus status={autosave.status} error={autosave.error} />} />

      <div className="a-shortcuts">
        {SHORTCUTS.map(([to, icon, title, desc]) => (
          <Link key={to} to={to} className="a-shortcut">
            <Icon name={icon} size={20} />
            <span>
              <strong>{title}</strong>
              <small>{desc}</small>
            </span>
          </Link>
        ))}
      </div>

      <Card title="General">
        <div className="a-form-stack">
          <Field label="URL pública de la invitación" hint="La dirección final en Vercel (se usa para el QR). Ej. https://mis-xv-arely.vercel.app">
            <Input type="url" value={draft.publicUrl} onChange={(e) => set({ publicUrl: e.target.value.trim() })} placeholder="https://…" />
          </Field>
          <Toggle checked={draft.rsvpEnabled} onChange={(rsvpEnabled) => set({ rsvpEnabled })} label="Confirmación de asistencia abierta" />
          <Toggle checked={draft.dedicationsEnabled} onChange={(dedicationsEnabled) => set({ dedicationsEnabled })} label="Permitir dedicatorias" />
          <Toggle checked={draft.memoryUploadsEnabled} onChange={(memoryUploadsEnabled) => set({ memoryUploadsEnabled })} label="Permitir subir fotos de recuerdos" />
          <Toggle checked={draft.partyUploadsEnabled} onChange={(partyUploadsEnabled) => set({ partyUploadsEnabled })} label="Permitir subir fotos de la fiesta" />
        </div>
      </Card>

      <Card title="Textos del sistema" description="Textos que no pertenecen a una sección específica.">
        <div className="a-grid a-grid--2">
          {TEXT_FIELDS.map(([key, label, type, hint]) => (
            <Field key={key} label={label} hint={hint}>
              {type === 'textarea' ? (
                <TextArea rows={2} value={draft.texts[key] ?? ''} onChange={(e) => setText(key, e.target.value)} />
              ) : (
                <Input value={draft.texts[key] ?? ''} onChange={(e) => setText(key, e.target.value)} />
              )}
            </Field>
          ))}
        </div>
      </Card>
    </div>
  );
}
