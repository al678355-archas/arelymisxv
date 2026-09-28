import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { subscribe } from '../lib/live.js';
import { PALETTE_LABELS, resolveColor } from '../lib/theme.js';

// Paleta actual disponible en todo el panel: permite elegir "colores de la paleta"
// (tokens theme:*) y mostrarlos con su color real.
const PaletteContext = createContext({ theme: null, refresh: () => {} });

export function PaletteProvider({ children }) {
  const [theme, setTheme] = useState(null);
  const refresh = useCallback(() => {
    api
      .get('/api/theme')
      .then((res) => setTheme(res.theme))
      .catch(() => {});
  }, []);

  useEffect(() => {
    let t;
    const off = subscribe('content', (msg) => {
      if (msg?.scopes && !msg.scopes.some((s) => s === 'theme' || s === 'all')) return;
      clearTimeout(t);
      t = setTimeout(refresh, 250);
    });
    return () => {
      off();
      clearTimeout(t);
    };
  }, [refresh]);

  return <PaletteContext.Provider value={{ theme, refresh, setTheme }}>{children}</PaletteContext.Provider>;
}

export const usePalette = () => useContext(PaletteContext);

// Colores de la paleta para mostrar como muestras seleccionables
export function paletteSwatches(theme) {
  return Object.keys(PALETTE_LABELS).map((key) => ({ key, token: `theme:${key}`, label: PALETTE_LABELS[key], color: theme?.[key] }));
}

export function displayColor(value, theme) {
  return resolveColor(value, theme) || value || 'transparent';
}
