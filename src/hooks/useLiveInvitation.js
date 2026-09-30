import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../lib/api.js';
import { subscribe } from '../lib/live.js';

// Copia local de la última invitación: en visitas repetidas se muestra al instante
// (aunque el servidor esté despertando) y se reemplaza en cuanto llegan los datos frescos.
const CACHE_KEY = 'xv_invitation_cache_v1';

function readCache() {
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
    return cached?.sections ? cached : null;
  } catch {
    return null;
  }
}

function writeCache(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    /* almacenamiento lleno o no disponible: no pasa nada */
  }
}

// Carga la invitación y la mantiene actualizada en tiempo real (SSE).
export function useLiveInvitation() {
  const [data, setData] = useState(readCache);
  const [error, setError] = useState(null);
  const timer = useRef(null);
  const controller = useRef(null);

  const load = useCallback(async () => {
    controller.current?.abort();
    const ctrl = new AbortController();
    controller.current = ctrl;
    try {
      const next = await api.get('/api/public/invitation', { auth: false, signal: ctrl.signal });
      setData(next);
      setError(null);
      writeCache(next);
    } catch (err) {
      if (err.name !== 'AbortError') setError(err);
    }
  }, []);

  useEffect(() => {
    load();
    const refresh = () => {
      clearTimeout(timer.current);
      timer.current = setTimeout(load, 250);
    };
    let first = true;
    const offContent = subscribe('content', refresh);
    // Tras una reconexión se recarga para no perder cambios.
    const offHello = subscribe('hello', () => {
      if (first) first = false;
      else refresh();
    });
    const onVisible = () => document.visibilityState === 'visible' && refresh();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      offContent();
      offHello();
      clearTimeout(timer.current);
      controller.current?.abort();
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [load]);

  return { data, error, reload: load };
}
