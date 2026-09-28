import { useState } from 'react';
import { api } from '../../lib/api.js';
import { dateTime, timeAgo } from '../../lib/format.js';
import { useApi } from '../hooks.js';
import { useAuth } from '../AdminApp.jsx';
import { Badge, Button, Card, EmptyState, ErrorBox, Field, Icon, IconButton, Input, Loading, Modal, PageHeader, Toggle, useConfirm, useToast } from '../components/ui.jsx';

const EMPTY = { name: '', username: '', email: '', password: '', confirm: '', active: true };

function PasswordInputs({ form, setForm, required = true }) {
  const [show, setShow] = useState(false);
  const mismatch = form.confirm && form.password !== form.confirm;
  return (
    <div className="a-grid a-grid--2">
      <Field label="Contraseña" hint="Mínimo 8 caracteres">
        <span className="a-input-action">
          <Input type={show ? 'text' : 'password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} minLength={8} required={required} autoComplete="new-password" />
          <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? 'Ocultar' : 'Mostrar'}>
            <Icon name={show ? 'eyeOff' : 'eye'} size={17} />
          </button>
        </span>
      </Field>
      <Field label="Confirmar contraseña" error={mismatch ? 'Las contraseñas no coinciden' : ''}>
        <Input type={show ? 'text' : 'password'} value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} required={required} autoComplete="new-password" />
      </Field>
    </div>
  );
}

function AdminModal({ open, initial, onClose, onSaved }) {
  const toast = useToast();
  const editing = Boolean(initial?.id);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [prev, setPrev] = useState(null);
  if (open && prev !== initial) {
    setPrev(initial);
    setForm(editing ? { ...EMPTY, name: initial.name, username: initial.username, email: initial.email || '', active: initial.active } : EMPTY);
  }

  async function submit(e) {
    e.preventDefault();
    if (!editing && form.password !== form.confirm) return toast('Las contraseñas no coinciden', 'error');
    setBusy(true);
    try {
      const { name, username, email, active, password } = form;
      if (editing) await api.put(`/api/auth/admins/${initial.id}`, { name, username, email, active });
      else await api.post('/api/auth/admins', { name, username, email, active, password });
      toast(editing ? 'Administrador actualizado' : 'Administrador creado');
      onSaved();
      onClose();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? `Editar a ${initial.name}` : 'Nuevo administrador'}>
      <form className="a-form-stack" onSubmit={submit}>
        <Field label="Nombre">
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required minLength={2} maxLength={80} />
        </Field>
        <div className="a-grid a-grid--2">
          <Field label="Usuario" hint="Letras, números, punto o guion">
            <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase() })} required pattern="[a-z0-9._\-]{3,40}" autoComplete="off" />
          </Field>
          <Field label="Correo (opcional)">
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
        </div>
        {!editing && <PasswordInputs form={form} setForm={setForm} />}
        <Toggle checked={form.active} onChange={(active) => setForm({ ...form, active })} label="Estado" description={form.active ? 'Activo: puede iniciar sesión' : 'Inactivo: no puede iniciar sesión'} />
        <Button type="submit" icon="check" loading={busy}>
          {editing ? 'Guardar cambios' : 'Crear administrador'}
        </Button>
      </form>
    </Modal>
  );
}

function PasswordModal({ admin, isMe, onClose }) {
  const toast = useToast();
  const [form, setForm] = useState({ current: '', password: '', confirm: '' });
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (form.password !== form.confirm) return toast('Las contraseñas no coinciden', 'error');
    setBusy(true);
    try {
      if (isMe) await api.put('/api/auth/password', { currentPassword: form.current, newPassword: form.password });
      else await api.put(`/api/auth/admins/${admin.id}/password`, { password: form.password });
      toast('Contraseña actualizada');
      onClose();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={Boolean(admin)} onClose={onClose} title={isMe ? 'Cambiar mi contraseña' : `Nueva contraseña para ${admin?.name}`}>
      <form className="a-form-stack" onSubmit={submit}>
        {isMe && (
          <Field label="Contraseña actual">
            <Input type="password" value={form.current} onChange={(e) => setForm({ ...form, current: e.target.value })} required autoComplete="current-password" />
          </Field>
        )}
        <PasswordInputs form={form} setForm={setForm} />
        <p className="a-field__hint">La contraseña se envía al servidor solo para generar su hash seguro (bcrypt). Nunca se guarda en texto plano.</p>
        <Button type="submit" icon="lock" loading={busy} disabled={form.confirm !== form.password}>
          Actualizar contraseña
        </Button>
      </form>
    </Modal>
  );
}

export default function AdministratorsPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const { admin: me } = useAuth();
  const { data, error, loading, reload } = useApi('/api/auth/admins', { live: true });
  const [editing, setEditing] = useState(null);
  const [passwordFor, setPasswordFor] = useState(null);
  const admins = data?.admins || [];
  const activeCount = admins.filter((a) => a.active).length;

  async function toggleActive(a, active) {
    try {
      await api.put(`/api/auth/admins/${a.id}`, { active });
      toast(active ? `${a.name} activado` : `${a.name} desactivado`);
      reload();
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  async function remove(a) {
    if (!(await confirm(`Se eliminará la cuenta de ${a.name} (@${a.username}). Ya no podrá iniciar sesión.`, { title: '¿Eliminar administrador?', confirmText: 'Eliminar' }))) return;
    try {
      await api.del(`/api/auth/admins/${a.id}`);
      toast('Administrador eliminado');
      reload();
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  return (
    <div className="a-page">
      <PageHeader
        title="Administradores"
        description="Personas con acceso al panel. Las contraseñas se guardan cifradas (bcrypt) y nunca se muestran."
        actions={
          <>
            <Button variant="ghost" icon="lock" onClick={() => setPasswordFor(me)}>
              Cambiar mi contraseña
            </Button>
            <Button icon="plus" onClick={() => setEditing({})}>
              Nuevo administrador
            </Button>
          </>
        }
      />
      <ErrorBox error={error} onRetry={reload} />
      {loading ? (
        <Loading skeleton={4} />
      ) : admins.length === 0 ? (
        <Card>
          <EmptyState icon="lock" title="No hay administradores" />
        </Card>
      ) : (
        <div className="a-admin-cards">
          {admins.map((a) => {
            const isMe = a.id === me?.id;
            const lastActive = a.active && activeCount === 1;
            return (
              <article key={a.id} className={`a-admin-card ${a.active ? '' : 'is-inactive'}`}>
                <header>
                  <span className="a-avatar a-avatar--lg">{a.name[0]?.toUpperCase()}</span>
                  <div>
                    <strong>
                      {a.name} {isMe && <Badge tone="rose">Tú</Badge>}
                    </strong>
                    <small>@{a.username}</small>
                    {a.email && <small>{a.email}</small>}
                  </div>
                </header>
                <div className="a-admin-card__meta">
                  <Badge tone={a.active ? 'green' : 'gray'}>{a.active ? 'Activo' : 'Inactivo'}</Badge>
                  <span className="a-muted" title={a.lastLoginAt ? dateTime(a.lastLoginAt) : ''}>
                    Último acceso: {a.lastLoginAt ? timeAgo(a.lastLoginAt) : 'nunca'}
                  </span>
                </div>
                <footer>
                  <Toggle
                    checked={a.active}
                    onChange={(v) => toggleActive(a, v)}
                    disabled={isMe || lastActive}
                    label={a.active ? 'Activo' : 'Inactivo'}
                    description={isMe ? 'No puedes desactivarte' : lastActive ? 'Único administrador activo' : undefined}
                  />
                  <div className="a-inline">
                    <IconButton icon="edit" label="Editar" onClick={() => setEditing(a)} />
                    <IconButton icon="lock" label="Cambiar contraseña" onClick={() => setPasswordFor(a)} />
                    <IconButton icon="trash" label={isMe ? 'No puedes eliminar tu propia cuenta' : 'Eliminar'} variant="danger" disabled={isMe || lastActive} onClick={() => remove(a)} />
                  </div>
                </footer>
              </article>
            );
          })}
        </div>
      )}
      <AdminModal open={Boolean(editing)} initial={editing} onClose={() => setEditing(null)} onSaved={reload} />
      {passwordFor && <PasswordModal admin={passwordFor} isMe={passwordFor.id === me?.id} onClose={() => setPasswordFor(null)} />}
    </div>
  );
}
