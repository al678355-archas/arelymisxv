import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import Icon from '../../site/components/Icon.jsx';

export { Icon };

export function Button({ variant = 'primary', icon, loading, children, className = '', size, ...props }) {
  return (
    <button type="button" className={`a-btn a-btn--${variant} ${size ? `a-btn--${size}` : ''} ${className}`} disabled={loading || props.disabled} {...props}>
      {loading ? <span className="a-spinner" aria-hidden="true" /> : icon && <Icon name={icon} size={17} />}
      {children && <span>{children}</span>}
    </button>
  );
}

export function IconButton({ icon, label, variant = 'ghost', className = '', ...props }) {
  return (
    <button type="button" className={`a-icon-btn a-icon-btn--${variant} ${className}`} aria-label={label} title={label} {...props}>
      <Icon name={icon} size={17} />
    </button>
  );
}

export function PageHeader({ title, description, actions, children }) {
  return (
    <header className="a-page-header">
      <div className="a-page-header__text">
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="a-page-header__actions">{actions}</div>}
      {children}
    </header>
  );
}

export function Card({ title, description, actions, children, className = '', padded = true }) {
  return (
    <section className={`a-card ${padded ? 'a-card--padded' : ''} ${className}`}>
      {(title || actions) && (
        <header className="a-card__header">
          <div>
            {title && <h2 className="a-card__title">{title}</h2>}
            {description && <p className="a-card__desc">{description}</p>}
          </div>
          {actions && <div className="a-card__actions">{actions}</div>}
        </header>
      )}
      {children}
    </section>
  );
}

export function Field({ label, hint, error, children, className = '', as: Tag = 'label' }) {
  return (
    <Tag className={`a-field ${className}`}>
      {label && <span className="a-field__label">{label}</span>}
      {children}
      {error ? <span className="a-field__error">{error}</span> : hint && <span className="a-field__hint">{hint}</span>}
    </Tag>
  );
}

export function Input({ className = '', ...props }) {
  return <input className={`a-input ${className}`} {...props} />;
}

export function TextArea({ className = '', maxLength, value = '', showCount, ...props }) {
  return (
    <span className="a-textarea-wrap">
      <textarea className={`a-input a-textarea ${className}`} maxLength={maxLength} value={value} {...props} />
      {showCount && maxLength && (
        <span className={`a-count ${String(value).length >= maxLength ? 'is-max' : ''}`}>
          {String(value).length}/{maxLength}
        </span>
      )}
    </span>
  );
}

export function Select({ options, className = '', ...props }) {
  return (
    <select className={`a-input a-select ${className}`} {...props}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function Toggle({ checked, onChange, label, description, disabled }) {
  return (
    <label className={`a-toggle ${disabled ? 'is-disabled' : ''}`}>
      <input type="checkbox" checked={Boolean(checked)} onChange={(e) => onChange(e.target.checked)} disabled={disabled} />
      <span className="a-toggle__track" aria-hidden="true">
        <span className="a-toggle__thumb" />
      </span>
      {(label || description) && (
        <span className="a-toggle__text">
          {label && <strong>{label}</strong>}
          {description && <small>{description}</small>}
        </span>
      )}
    </label>
  );
}

export function Checkbox({ checked, onChange, label }) {
  return (
    <label className="a-check">
      <input type="checkbox" checked={Boolean(checked)} onChange={(e) => onChange(e.target.checked)} />
      <span className="a-check__box" aria-hidden="true">
        <Icon name="check" size={13} strokeWidth={3} />
      </span>
      <span>{label}</span>
    </label>
  );
}

const SAVE_TEXT = { pending: 'Cambios sin guardar…', saving: 'Guardando…', saved: 'Guardado', error: 'Error al guardar' };

export function SaveStatus({ status, error }) {
  if (!status || status === 'idle') return <span className="a-save a-save--idle">Autoguardado activado</span>;
  return (
    <span className={`a-save a-save--${status}`} role="status" title={error || undefined}>
      {status === 'saving' && <span className="a-spinner" aria-hidden="true" />}
      {status === 'saved' && <Icon name="check" size={15} strokeWidth={2.5} />}
      {status === 'error' && <Icon name="x" size={15} strokeWidth={2.5} />}
      {SAVE_TEXT[status]}
      {status === 'error' && error ? `: ${error}` : ''}
    </span>
  );
}

export function Badge({ tone = 'neutral', children }) {
  return <span className={`a-badge a-badge--${tone}`}>{children}</span>;
}

export function StatCard({ label, value, icon, tone = 'rose', hint, to, onClick }) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag className={`a-stat a-stat--${tone}`} onClick={onClick} type={onClick ? 'button' : undefined}>
      <span className="a-stat__icon">
        <Icon name={icon} size={20} />
      </span>
      <span className="a-stat__value">{value ?? '—'}</span>
      <span className="a-stat__label">{label}</span>
      {hint && <span className="a-stat__hint">{hint}</span>}
      {to}
    </Tag>
  );
}

export function EmptyState({ icon = 'sparkle', title, children }) {
  return (
    <div className="a-empty">
      <span className="a-empty__icon">
        <Icon name={icon} size={28} />
      </span>
      {title && <strong>{title}</strong>}
      {children && <p>{children}</p>}
    </div>
  );
}

export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="a-tabs" role="tablist">
      {tabs.map((t) => (
        <button key={t.value} type="button" role="tab" aria-selected={value === t.value} className={value === t.value ? 'is-active' : ''} onClick={() => onChange(t.value)}>
          {t.label}
          {t.count !== undefined && <span className="a-tabs__count">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function Modal({ open, title, onClose, children, footer, wide }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    ref.current?.querySelector('input, textarea, select, button')?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="a-modal" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`a-modal__box ${wide ? 'a-modal__box--wide' : ''}`} ref={ref}>
        <header className="a-modal__header">
          <h2>{title}</h2>
          <IconButton icon="close" label="Cerrar" onClick={onClose} />
        </header>
        <div className="a-modal__body">{children}</div>
        {footer && <footer className="a-modal__footer">{footer}</footer>}
      </div>
    </div>
  );
}

export function Loading({ label = 'Cargando…' }) {
  return (
    <div className="a-loading" role="status">
      <span className="a-spinner a-spinner--lg" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function ErrorBox({ error, onRetry }) {
  if (!error) return null;
  return (
    <div className="a-error" role="alert">
      <Icon name="x" size={18} />
      <span>{error.message || String(error)}</span>
      {onRetry && (
        <Button variant="ghost" size="sm" onClick={onRetry}>
          Reintentar
        </Button>
      )}
    </div>
  );
}

// ─── Notificaciones ─────────────────────────────────────────────────────

const ToastContext = createContext(() => {});

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((message, tone = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), tone === 'error' ? 6000 : 3200);
  }, []);
  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="a-toasts" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`a-toast a-toast--${t.tone}`}>
            <Icon name={t.tone === 'error' ? 'x' : 'check'} size={16} strokeWidth={2.5} />
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

// ─── Confirmación ───────────────────────────────────────────────────────

const ConfirmContext = createContext(async () => false);

export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null);
  const confirm = useCallback(
    (message, { title = '¿Estás segura(o)?', confirmText = 'Sí, continuar', danger = true } = {}) =>
      new Promise((resolve) => setState({ message, title, confirmText, danger, resolve })),
    [],
  );
  const close = (value) => {
    state?.resolve(value);
    setState(null);
  };
  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal
        open={Boolean(state)}
        title={state?.title}
        onClose={() => close(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => close(false)}>
              Cancelar
            </Button>
            <Button variant={state?.danger ? 'danger' : 'primary'} onClick={() => close(true)}>
              {state?.confirmText}
            </Button>
          </>
        }
      >
        <p className="a-confirm-text">{state?.message}</p>
      </Modal>
    </ConfirmContext.Provider>
  );
}

export const useConfirm = () => useContext(ConfirmContext);
