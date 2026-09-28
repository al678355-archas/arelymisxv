import { useEffect } from 'react';

// JavaScript solo detecta cuándo un elemento entra al viewport y le pone [data-shown];
// la animación la hace CSS (ver styles/animations.css).
export function useReveal(rootRef, deps = [], enabled = true) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root || !enabled) return undefined;

    const show = (el) => el.setAttribute('data-shown', '');
    if (typeof IntersectionObserver === 'undefined') {
      root.querySelectorAll('[data-reveal]').forEach(show);
      return undefined;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            show(entry.target);
            io.unobserve(entry.target);
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
    );

    const observeAll = (node) => {
      if (!(node instanceof Element)) return;
      if (node.matches('[data-reveal]:not([data-shown])')) io.observe(node);
      node.querySelectorAll('[data-reveal]:not([data-shown])').forEach((el) => io.observe(el));
    };
    observeAll(root);

    // Elementos agregados después (actualizaciones en vivo) también se animan.
    const mo = new MutationObserver((mutations) => mutations.forEach((m) => m.addedNodes.forEach(observeAll)));
    mo.observe(root, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
