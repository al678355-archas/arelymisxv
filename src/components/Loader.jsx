import { useEffect, useState } from 'react';
// Pantalla de carga animada (solo CSS). Los estilos viven en index.html para que se vea
// desde el primer instante, antes de que cargue JavaScript.

const CACHE_KEY = 'xv_loader';

function readCache() {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || 'null') || {};
  } catch {
    return {};
  }
}

// Guarda colores, nombre y fuente para personalizar la carga en la próxima visita.
export function rememberLoaderLook(data) {
  if (!data?.theme) return;
  const t = data.theme;
  const look = {
    primary: t.primaryColor,
    accent: t.animationColor || t.accentColor,
    bg: t.backgroundColor,
    bg2: t.secondaryColor,
    text: t.textSecondaryColor,
    fontScript: t.fontScript,
    name: data.site?.quinceaneraName || '',
    loadingText: data.site?.texts?.loadingText || '',
  };
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(look));
  } catch {
    /* almacenamiento no disponible */
  }
}

export default function Loader({ done = false, error = null, onRetry, showName = true }) {
  // Si tarda, avisar que el servidor está despertando (en vez de parecer congelado)
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    if (done || error) return undefined;
    const t = setTimeout(() => setSlow(true), 6000);
    return () => clearTimeout(t);
  }, [done, error]);
  const c = readCache();
  const style = {
    ...(c.primary && { '--l-primary': c.primary }),
    ...(c.accent && { '--l-accent': c.accent }),
    ...(c.bg && { '--l-bg': c.bg }),
    ...(c.bg2 && { '--l-bg2': c.bg2 }),
    ...(c.text && { '--l-text': c.text }),
    ...(c.fontScript && { '--l-script': `"${c.fontScript}", cursive` }),
  };
  const text = (c.loadingText || 'Cargando').replace(/[.…]+$/, '');

  return (
    <div className={`xv-loader ${done ? 'is-done' : ''}`} style={style} role="status" aria-live="polite" aria-busy={!done}>
      <div className="xv-loader__flower" aria-hidden="true">
        <span className="xv-loader__ring" />
        <span className="xv-loader__ring xv-loader__ring--2" />
        <span className="xv-loader__petals">
          {Array.from({ length: 8 }, (_, i) => (
            <i key={i} className="xv-loader__petal" style={{ '--i': i }} />
          ))}
        </span>
        {Array.from({ length: 5 }, (_, i) => (
          <b key={i} className="xv-loader__spark" />
        ))}
        <span className="xv-loader__core">
          <span>XV</span>
        </span>
      </div>
      <p className="xv-loader__name">{showName ? c.name || '' : ''}</p>
      {error ? (
        <div className="xv-loader__error" role="alert">
          <span>{error.message || String(error)}</span>
          {onRetry && (
            <button type="button" className="xv-loader__retry" onClick={onRetry}>
              Reintentar
            </button>
          )}
        </div>
      ) : (
        <>
          <p className="xv-loader__text">
            {text}
            <span className="xv-loader__dots">
              <i />
              <i />
              <i />
            </span>
          </p>
          <span className="xv-loader__bar" />
          {slow && <p className="xv-loader__slow">Estamos preparando todo, puede tardar unos segundos…</p>}
        </>
      )}
    </div>
  );
}
