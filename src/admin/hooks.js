import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../lib/api.js';
import { subscribe } from '../lib/live.js';

// Carga datos de la API con estado de carga/error y recarga manual.
// Cada carga o modificación local incrementa una versión: si una respuesta llega
// después de un cambio más reciente, se descarta para no pisar datos nuevos con viejos.
export function useApi(path, { live = false } = {}) {
  const [data, setDataState] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const pathRef = useRef(path);
  const version = useRef(0);
  pathRef.current = path;

  const setData = useCallback((next) => {
    version.current += 1;
    setDataState(next);
  }, []);

  const reload = useCallback(async () => {
    if (!pathRef.current) return;
    const mine = ++version.current;
    try {
      const res = await api.get(pathRef.current);
      if (mine !== version.current) return;
      setDataState(res);
      setError(null);
    } catch (err) {
      if (mine === version.current) setError(err);
    } finally {
      if (mine === version.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    reload();
  }, [path, reload]);

  // Actualiza en vivo cuando hay actividad de invitados (confirmaciones, fotos, dedicatorias…)
  useEffect(() => {
    if (!live) return undefined;
    let t;
    const off = subscribe('activity', () => {
      clearTimeout(t);
      t = setTimeout(reload, 400);
    });
    return () => {
      off();
      clearTimeout(t);
    };
  }, [live, reload]);

  return { data, setData, error, loading, reload };
}

// Ejecuta una acción mostrando notificaciones de éxito/error.
export function useAction(toast) {
  const [busy, setBusy] = useState(false);
  const run = useCallback(
    async (fn, successMessage) => {
      setBusy(true);
      try {
        const result = await fn();
        if (successMessage) toast(successMessage);
        return result;
      } catch (err) {
        toast(err.message, 'error');
        return undefined;
      } finally {
        setBusy(false);
      }
    },
    [toast],
  );
  return { run, busy };
}
