import { useEffect, useMemo, useState } from 'react';

// Comunicación entre el editor visual del CMS (ventana padre) y la vista previa (iframe).
//  padre → vista previa:  xv:select {key} · xv:draft {key, content, style} · xv:theme-draft {theme} · xv:event-draft {event}
//  vista previa → padre:  xv:selected {key} · xv:ready
// Los borradores se aplican al instante (antes de guardarse); al llegar los datos guardados
// por tiempo real se ven exactamente igual, así que no hay saltos.
export function useEditorBridge(data, enabled, rootRef) {
  const [drafts, setDrafts] = useState({});
  const [themeDraft, setThemeDraft] = useState(null);
  const [eventDraft, setEventDraft] = useState(null);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (!enabled) return undefined;
    const parent = window.parent;
    const onMessage = (e) => {
      if (e.origin !== window.location.origin || !e.data?.type) return;
      const msg = e.data;
      if (msg.type === 'xv:select') {
        setSelected(msg.key);
        if (msg.scroll !== false) {
          requestAnimationFrame(() => document.getElementById(`s-${msg.key}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
        }
      }
      if (msg.type === 'xv:draft' && msg.key) setDrafts((d) => ({ ...d, [msg.key]: { content: msg.content, style: msg.style } }));
      if (msg.type === 'xv:theme-draft') setThemeDraft(msg.theme || null);
      if (msg.type === 'xv:event-draft') setEventDraft(msg.event || null);
      if (msg.type === 'xv:clear-drafts') {
        setDrafts({});
        setThemeDraft(null);
        setEventDraft(null);
      }
    };
    window.addEventListener('message', onMessage);
    parent.postMessage({ type: 'xv:ready' }, window.location.origin);
    return () => window.removeEventListener('message', onMessage);
  }, [enabled]);

  // Clic en cualquier parte de una sección = seleccionarla (sin activar botones ni enlaces).
  useEffect(() => {
    const root = rootRef.current;
    if (!enabled || !root) return undefined;
    const onClick = (e) => {
      const el = e.target.closest?.('[data-section]');
      if (!el) return;
      e.preventDefault();
      e.stopPropagation();
      setSelected(el.dataset.section);
      window.parent.postMessage({ type: 'xv:selected', key: el.dataset.section }, window.location.origin);
    };
    root.addEventListener('click', onClick, true);
    return () => root.removeEventListener('click', onClick, true);
  }, [enabled, rootRef, data]);

  // Etiquetas visibles y marca de selección
  useEffect(() => {
    const root = rootRef.current;
    if (!enabled || !root || !data) return;
    const labels = Object.fromEntries(data.sections.map((s) => [s.key, s.content?.navLabel || s.content?.title || s.key]));
    root.querySelectorAll('[data-section]').forEach((el) => {
      el.dataset.label = labels[el.dataset.section] || el.dataset.section;
      if (el.dataset.section === selected) el.setAttribute('data-selected', '');
      else el.removeAttribute('data-selected');
    });
  });

  const merged = useMemo(() => {
    if (!enabled || !data) return data;
    return {
      ...data,
      theme: themeDraft ? { ...data.theme, ...themeDraft } : data.theme,
      event: eventDraft ? { ...data.event, ...eventDraft } : data.event,
      sections: data.sections.map((s) => (drafts[s.key] ? { ...s, content: drafts[s.key].content ?? s.content, style: drafts[s.key].style ?? s.style } : s)),
    };
  }, [enabled, data, drafts, themeDraft, eventDraft]);

  return { data: merged, selected };
}
