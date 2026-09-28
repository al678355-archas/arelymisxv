import { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { dateTime } from '../../lib/format.js';
import { useApi } from '../hooks.js';
import { useAutosave } from '../../hooks/useAutosave.js';
import { useAuth } from '../AdminApp.jsx';
import { ActivityFeed } from './DashboardPage.jsx';
import { Badge, Button, Card, ErrorBox, Field, Input, Loading, PageHeader, SaveStatus, TextArea, Toggle, useToast } from '../components/ui.jsx';

const TEXT_FIELDS = [
  ['loadingText', 'Texto de la pantalla de carga'],
  ['uploadPageTitle', 'Página /subir-foto: título'],
  ['uploadPageSubtitle', 'Página /subir-foto: descripción', 'textarea'],
  ['uploadPartyTab', 'Página /subir-foto: pestaña fiesta'],
  ['uploadMemoryTab', 'Página /subir-foto: pestaña recuerdos'],
  ['uploadClosedText', 'Página /subir-foto: mensaje de cerrado', 'textarea'],
  ['uploadBackLink', 'Página /subir-foto: enlace a la invitación'],
  ['musicPlayLabel', 'Botón de música: reproducir (accesibilidad)'],
  ['musicPauseLabel', 'Botón de música: pausar (accesibilidad)'],
];

function PasswordCard() {
  const toast = useToast();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [busy, setBusy] = useState(false);
  const mismatch = form.confirm && form.newPassword !== form.confirm;

  async function submit(e) {
    e.preventDefault();
    if (mismatch) return;
    setBusy(true);
    try {
      await api.put('/api/auth/password', { currentPassword: form.currentPassword, newPassword: form.newPassword });
      toast('Contraseña actualizada');
      setForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card title="Cambiar mi contraseña">
      <form className="a-form-stack" onSubmit={submit}>
        <Field label="Contraseña actual">
          <Input type="password" autoComplete="current-password" value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} required />
        </Field>
        <div className="a-grid a-grid--2">
          <Field label="Nueva contraseña" hint="Mínimo 8 caracteres">
            <Input type="password" autoComplete="new-password" minLength={8} value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} required />
          </Field>
          <Field label="Confirmar nueva contraseña" error={mismatch ? 'No coincide' : ''}>
            <Input type="password" autoComplete="new-password" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} required />
          </Field>
        </div>
        <Button type="submit" icon="lock" loading={busy} disabled={mismatch}>
          Actualizar contraseña
        </Button>
      </form>
    </Card>
  );
}

function AdminsCard() {
  const toast = useToast();
  const { admin: me } = useAuth();
  const { data, reload } = useApi('/api/auth/admins');
  const [form, setForm] = useState({ name: '', username: '', email: '', password: '' });
  const [busy, setBusy] = useState(false);

  async function create(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post('/api/auth/admins', form);
      toast('Administrador creado');
      setForm({ name: '', username: '', email: '', password: '' });
      reload();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  async function setActive(admin, active) {
    try {
      await api.patch(`/api/auth/admins/${admin.id}`, { active });
      reload();
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  return (
    <Card title="Administradores" description="Todas las cuentas tienen el rol ADMIN.">
      <ul className="a-admins">
        {data?.admins.map((a) => (
          <li key={a.id}>
            <span className="a-avatar">{a.name[0]?.toUpperCase()}</span>
            <div>
              <strong>
                {a.name} {a.id === me?.id && <Badge tone="rose">Tú</Badge>}
              </strong>
              <small className="a-muted">
                @{a.username} · último acceso: {a.lastLoginAt ? dateTime(a.lastLoginAt) : 'nunca'}
              </small>
            </div>
            <Toggle checked={a.active} onChange={(v) => setActive(a, v)} disabled={a.id === me?.id} label={a.active ? 'Activo' : 'Inactivo'} />
          </li>
        ))}
      </ul>
      <form className="a-form-stack a-admins__new" onSubmit={create}>
        <h3 className="a-form-group">Nuevo administrador</h3>
        <div className="a-grid a-grid--2">
          <Field label="Nombre">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required minLength={2} />
          </Field>
          <Field label="Usuario">
            <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase() })} required pattern="[a-z0-9._\-]{3,40}" autoComplete="off" />
          </Field>
          <Field label="Correo (opcional)">
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
          <Field label="Contraseña" hint="Mínimo 8 caracteres">
            <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} autoComplete="new-password" />
          </Field>
        </div>
        <Button type="submit" icon="plus" loading={busy}>
          Crear administrador
        </Button>
      </form>
    </Card>
  );
}

export default function SettingsPage() {
  const { data, error, reload } = useApi('/api/settings');
  const activity = useApi('/api/activity?limit=80', { live: true });
  const [draft, setDraft] = useState(null);

  useEffect(() => {
    if (data?.settings && !draft) {
      const s = data.settings;
      setDraft({ publicUrl: s.publicUrl, rsvpEnabled: s.rsvpEnabled, dedicationsEnabled: s.dedicationsEnabled, memoryUploadsEnabled: s.memoryUploadsEnabled, partyUploadsEnabled: s.partyUploadsEnabled, texts: s.texts || {} });
    }
  }, [data, draft]);

  const autosave = useAutosave(draft, (value) => api.put('/api/settings', value));

  if (error) return <ErrorBox error={error} onRetry={reload} />;
  if (!draft) return <Loading />;
  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));
  const setText = (key, value) => setDraft((d) => ({ ...d, texts: { ...d.texts, [key]: value } }));

  return (
    <div className="a-page">
      <PageHeader title="Configuración" description="Opciones generales, textos del sistema, cuentas y registro de actividad." actions={<SaveStatus status={autosave.status} error={autosave.error} />} />

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
          {TEXT_FIELDS.map(([key, label, type]) => (
            <Field key={key} label={label}>
              {type === 'textarea' ? <TextArea rows={2} value={draft.texts[key] ?? ''} onChange={(e) => setText(key, e.target.value)} /> : <Input value={draft.texts[key] ?? ''} onChange={(e) => setText(key, e.target.value)} />}
            </Field>
          ))}
        </div>
      </Card>

      <div className="a-grid a-grid--2 a-grid--top">
        <PasswordCard />
        <AdminsCard />
      </div>

      <Card title="Registro de actividad" description="Acciones importantes realizadas en el panel y por los invitados.">
        {activity.data ? <ActivityFeed items={activity.data.activity} /> : <Loading />}
      </Card>
    </div>
  );
}
