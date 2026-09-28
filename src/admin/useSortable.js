import { useCallback, useEffect, useRef, useState } from 'react';

// Ordenar arrastrando (mouse y pantallas táctiles) con Pointer Events.
//   const { order, handleProps, itemProps, dragging } = useSortable(items, { onDrop })
// - handleProps(id): se pone en el ícono ☰ que se agarra.
// - itemProps(id): se pone en cada fila (necesita un ref para medir).
// - onDrop(newIds): se llama al soltar si el orden cambió (ahí se guarda en la API).
export function useSortable(items, { onDrop, getId = (x) => x.id } = {}) {
  const [order, setOrder] = useState(() => items.map(getId));
  const [dragging, setDragging] = useState(null);
  const nodes = useRef(new Map());
  const state = useRef(null);
  const orderRef = useRef(order);
  orderRef.current = order;
  const dropRef = useRef(onDrop);
  dropRef.current = onDrop;

  // Mantener sincronizado con los datos cuando no se está arrastrando
  const key = items.map(getId).join('|');
  useEffect(() => {
    if (!state.current) setOrder(items.map(getId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const onMove = useCallback((e) => {
    const s = state.current;
    if (!s) return;
    e.preventDefault();
    const y = e.clientY;
    setOrder((current) => {
      const from = current.indexOf(s.id);
      let to = from;
      for (let i = 0; i < current.length; i += 1) {
        const node = nodes.current.get(current[i]);
        if (!node || current[i] === s.id) continue;
        const r = node.getBoundingClientRect();
        const mid = r.top + r.height / 2;
        if (i < from && y < mid) {
          to = i;
          break;
        }
        if (i > from && y > mid) to = i;
      }
      if (to === from) return current;
      const next = [...current];
      next.splice(from, 1);
      next.splice(to, 0, s.id);
      return next;
    });
    // Autodesplazamiento cerca de los bordes
    if (y < 80) window.scrollBy(0, -12);
    if (y > window.innerHeight - 80) window.scrollBy(0, 12);
  }, []);

  const onUp = useCallback(() => {
    const s = state.current;
    state.current = null;
    setDragging(null);
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('pointercancel', onUp);
    const current = orderRef.current;
    if (s && current.join('|') !== s.initial.join('|')) dropRef.current?.(current);
  }, [onMove]);

  const handleProps = (id) => ({
    onPointerDown: (e) => {
      if (e.button !== undefined && e.button !== 0) return;
      e.preventDefault();
      state.current = { id, initial: order };
      setDragging(id);
      window.addEventListener('pointermove', onMove, { passive: false });
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onUp);
    },
    style: { touchAction: 'none', cursor: dragging ? 'grabbing' : 'grab' },
    'aria-label': 'Arrastrar para ordenar',
    role: 'button',
    tabIndex: -1,
  });

  const itemProps = (id) => ({
    ref: (el) => {
      if (el) nodes.current.set(id, el);
      else nodes.current.delete(id);
    },
    'data-dragging': dragging === id ? '' : undefined,
  });

  useEffect(
    () => () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    },
    [onMove, onUp],
  );

  return { order, setOrder, handleProps, itemProps, dragging };
}
