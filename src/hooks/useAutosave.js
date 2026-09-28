import { useCallback, useEffect, useRef, useState } from 'react';

// Autoguardado con debounce. Devuelve el estado para mostrar "Guardando… / Guardado / Error al guardar".
//   const { status, error, flush } = useAutosave(draft, save, { delay: 700 })
// El primer valor recibido se toma como "ya guardado".
export function useAutosave(value, save, { delay = 700, enabled = true } = {}) {
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const lastSaved = useRef(undefined);
  const timer = useRef(null);
  const saveRef = useRef(save);
  const latest = useRef(value);
  const inFlight = useRef(false);
  const queued = useRef(false);
  saveRef.current = save;
  latest.current = value;

  const run = useCallback(async () => {
    const snapshot = latest.current;
    const serialized = JSON.stringify(snapshot);
    if (serialized === lastSaved.current) return;
    if (inFlight.current) {
      queued.current = true;
      return;
    }
    inFlight.current = true;
    setStatus('saving');
    setError('');
    try {
      await saveRef.current(snapshot);
      lastSaved.current = serialized;
      setStatus('saved');
    } catch (err) {
      setStatus('error');
      setError(err.message || 'Error al guardar');
    } finally {
      inFlight.current = false;
      if (queued.current) {
        queued.current = false;
        run();
      }
    }
  }, []);

  useEffect(() => {
    if (value === undefined || value === null) return undefined;
    const serialized = JSON.stringify(value);
    if (lastSaved.current === undefined) {
      lastSaved.current = serialized;
      return undefined;
    }
    if (!enabled || serialized === lastSaved.current) return undefined;
    setStatus('pending');
    clearTimeout(timer.current);
    timer.current = setTimeout(run, delay);
    return () => clearTimeout(timer.current);
  }, [value, delay, enabled, run]);

  // Guardar de inmediato (por ejemplo, botón "Guardar" o al salir).
  const flush = useCallback(() => {
    clearTimeout(timer.current);
    return run();
  }, [run]);

  // Reinicia la referencia cuando se carga un registro distinto.
  const reset = useCallback((next) => {
    clearTimeout(timer.current);
    lastSaved.current = JSON.stringify(next);
    setStatus('idle');
    setError('');
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  return { status, error, flush, reset };
}
