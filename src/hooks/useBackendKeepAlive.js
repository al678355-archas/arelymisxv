import { useEffect } from 'react';
import { API_URL } from '../lib/api.js';

// Evita que el backend en Render se duerma mientras alguien tenga la página abierta:
// un ping al cargar y luego cada 12 minutos. Nunca muestra mensajes ni rompe la página.
export const KEEP_ALIVE_MS = 12 * 60 * 1000; // 720000 ms

export function useBackendKeepAlive() {
  useEffect(() => {
    let cancelled = false;
    const ping = async () => {
      try {
        await fetch(`${API_URL}/api/health`, { method: 'GET', cache: 'no-store' });
      } catch (error) {
        if (!cancelled && import.meta.env.DEV) console.warn('[keep-alive] No se pudo contactar al backend:', error.message);
      }
    };

    ping();
    const interval = setInterval(ping, KEEP_ALIVE_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);
}
