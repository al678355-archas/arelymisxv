import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../AdminApp.jsx';
import { Button, Field, Input, Icon } from '../components/ui.jsx';

export default function LoginPage() {
  const { admin, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (admin) return <Navigate to={location.state?.from || '/admin'} replace />;

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(username.trim(), password);
      navigate(location.state?.from || '/admin', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="a-login">
      <div className="a-login__art" aria-hidden="true">
        <span className="a-login__ring" />
        <span className="a-login__ring a-login__ring--2" />
        <p>XV</p>
      </div>
      <form className="a-login__card" onSubmit={submit}>
        <span className="a-sidebar__logo a-login__logo">XV</span>
        <h1>Panel administrativo</h1>
        <p className="a-muted">Inicia sesión para editar la invitación.</p>
        <Field label="Usuario o correo">
          <Input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" autoFocus required />
        </Field>
        <Field label="Contraseña">
          <span className="a-input-action">
            <Input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
            <button type="button" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
              <Icon name={showPassword ? 'eyeOff' : 'eye'} size={17} />
            </button>
          </span>
        </Field>
        {error && (
          <p className="a-error" role="alert">
            {error}
          </p>
        )}
        <Button type="submit" loading={busy} icon="lock" className="a-btn--block">
          Iniciar sesión
        </Button>
        <a href="/" className="a-btn a-btn--ghost a-btn--block">
          <Icon name="chevronLeft" size={17} />
          <span>Volver al sitio</span>
        </a>
      </form>
    </div>
  );
}
