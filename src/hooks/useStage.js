import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

// Navegación "una sección a la vez" con transiciones dominó.
// JavaScript solo decide el orden: numera las piezas visibles (--d) y pone
// data-stage="out" / "in" en la diapositiva; CSS hace toda la animación.

export const STAGE_VARIANTS = ['domino', 'cascade', 'flip', 'zoom', 'rise', 'swing'];
const PIECES = '[data-reveal], [data-piece]';
const OUT_MS = 480;
const IN_MS = 760;

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

export function variantFor(section, index) {
  const chosen = section?.style?.transition;
  if (chosen && chosen !== 'auto' && STAGE_VARIANTS.includes(chosen)) return chosen;
  return STAGE_VARIANTS[index % STAGE_VARIANTS.length];
}

// Numera las piezas en orden de lectura. Solo las visibles participan en la cascada;
// el resto se anima sin retraso para no alargar la transición.
function prepare(slide) {
  // Solo piezas de primer nivel: una pieza dentro de otra se mueve junto con su contenedor.
  const all = [...slide.querySelectorAll(PIECES)].filter((el) => !el.parentElement.closest(PIECES));
  slide.querySelectorAll('[data-stage-piece]').forEach((el) => el.removeAttribute('data-stage-piece'));
  all.forEach((el) => el.setAttribute('data-stage-piece', ''));
  const vh = window.innerHeight;
  const visible = all.filter((el) => {
    const r = el.getBoundingClientRect();
    return r.bottom > 0 && r.top < vh && r.width > 0;
  });
  const step = Math.max(35, Math.min(110, 650 / Math.max(1, visible.length)));
  all.forEach((el) => el.style.setProperty('--d', '0'));
  visible.forEach((el, i) => el.style.setProperty('--d', String(i)));
  slide.style.setProperty('--step', `${step}ms`);
  return step * Math.max(0, visible.length - 1);
}

export function useStage({ sections, enabled, animate }) {
  const [active, setActive] = useState(0);
  const [target, setTarget] = useState(0);
  const busy = useRef(false);
  const pending = useRef(null);
  const entering = useRef(null);
  const timers = useRef([]);
  const refs = useRef(new Map());

  const slideRef = useCallback(
    (key) => (el) => {
      if (el) refs.current.set(key, el);
      else refs.current.delete(key);
    },
    [],
  );

  const later = (fn, ms) => timers.current.push(setTimeout(fn, ms));
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // Si cambian las secciones (edición en vivo), mantener un índice válido.
  useEffect(() => {
    if (active >= sections.length && sections.length) {
      setActive(sections.length - 1);
      setTarget(sections.length - 1);
    }
  }, [sections.length, active]);

  const goTo = useCallback(
    (next) => {
      if (!enabled || next < 0 || next >= sections.length) return;
      if (busy.current) {
        pending.current = next;
        setTarget(next);
        return;
      }
      if (next === active) return;
      setTarget(next);
      const current = refs.current.get(sections[active]?.key);
      if (!animate || prefersReducedMotion() || !current) {
        setActive(next);
        return;
      }
      busy.current = true;
      const cascade = prepare(current);
      current.dataset.variant = variantFor(sections[active], active);
      current.dataset.stage = 'out';
      later(() => {
        delete current.dataset.stage;
        entering.current = next;
        setActive(next);
      }, OUT_MS + cascade);
    },
    [enabled, sections, active, animate],
  );

  // Al mostrarse la nueva diapositiva: subir al inicio y animar la entrada.
  useLayoutEffect(() => {
    if (entering.current !== active) return;
    entering.current = null;
    window.scrollTo({ top: 0, behavior: 'instant' });
    const slide = refs.current.get(sections[active]?.key);
    if (!slide) {
      busy.current = false;
      return;
    }
    const cascade = prepare(slide);
    slide.dataset.variant = variantFor(sections[active], active);
    slide.dataset.stage = 'in';
    later(() => {
      delete slide.dataset.stage;
      busy.current = false;
      if (pending.current !== null) {
        const queued = pending.current;
        pending.current = null;
        if (queued !== active) goTo(queued);
      }
    }, IN_MS + cascade);
  });

  // Enlace compartible: #s-clave
  useEffect(() => {
    if (!enabled || !sections[active]) return;
    const hash = `#s-${sections[active].key}`;
    if (window.location.hash !== hash) window.history.replaceState(null, '', hash);
  }, [enabled, active, sections]);

  const goToKey = useCallback((key) => goTo(sections.findIndex((s) => s.key === key)), [goTo, sections]);
  const next = useCallback(() => goTo(target + 1), [goTo, target]);
  const prev = useCallback(() => goTo(target - 1), [goTo, target]);
  // Mostrar una sección sin transición (p. ej. al abrir un enlace directo).
  const jump = useCallback((index) => {
    setActive(index);
    setTarget(index);
  }, []);

  return { active, target, goTo, goToKey, next, prev, jump, slideRef };
}
