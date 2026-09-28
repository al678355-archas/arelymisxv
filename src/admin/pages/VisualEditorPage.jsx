import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../../lib/api.js';
import { useApi } from '../hooks.js';
import { useAutosave } from '../../hooks/useAutosave.js';
import { useSortable } from '../useSortable.js';
import SectionProperties from '../components/SectionProperties.jsx';
import { Badge, Button, EmptyState, Icon, IconButton, Loading, SaveStatus, Toggle, useConfirm, useToast } from '../components/ui.jsx';

const DEVICES = [
  { key: 'phone', label: 'Celular', width: 390, icon: 'phone' },
  { key: 'tablet', label: 'Tablet', width: 768, icon: 'tablet' },
  { key: 'desktop', label: 'Escritorio', width: 1280, icon: 'monitor' },
];

// Vista previa real de la invitación en modo editor (secciones seleccionables).
function EditorPreview({ frameRef, onReady, device, setDevice }) {
  const box = useRef(null);
  const [scale, setScale] = useState(1);
  const width = DEVICES.find((d) => d.key === device).width;

  useEffect(() => {
    if (!box.current) return undefined;
    const ro = new ResizeObserver(([entry]) => setScale(Math.min(1, (entry.contentRect.width - 2) / width)));
    ro.observe(box.current);
    return () => ro.disconnect();
  }, [width]);

  return (
    <div className="a-editor__preview">
      <div className="a-editor__toolbar">
        <span className="a-editor__hint">
          <Icon name="sparkle" size={14} /> Pasa el mouse y haz clic en cualquier sección para editarla
        </span>
        <div className="a-preview__devices">
          {DEVICES.map((d) => (
            <IconButton key={d.key} icon={d.icon} label={d.label} variant={device === d.key ? 'active' : 'ghost'} onClick={() => setDevice(d.key)} />
          ))}
          <IconButton icon="refresh" label="Recargar vista previa" onClick={() => frameRef.current?.contentWindow?.location.reload()} />
          <a className="a-icon-btn a-icon-btn--ghost" href="/" target="_blank" rel="noopener noreferrer" title="Abrir la invitación en otra pestaña" aria-label="Abrir la invitación en otra pestaña">
            <Icon name="external" size={17} />
          </a>
        </div>
      </div>
      <div className="a-editor__viewport" ref={box}>
        <div className="a-preview__device" style={{ width, height: `${100 / scale}%`, transform: `scale(${scale})` }}>
          <iframe ref={frameRef} title="Invitación (editor visual)" src="/?preview=1&editor=1" onLoad={onReady} />
        </div>
      </div>
    </div>
  );
}

function SectionList({ sections, selectedId, onSelect, onToggle, onReorder }) {
  const { order, handleProps, itemProps, dragging } = useSortable(sections, { onDrop: onReorder });
  const byId = Object.fromEntries(sections.map((s) => [s.id, s]));
  return (
    <ul className={`a-editor-list ${dragging ? 'is-dragging' : ''}`}>
      {order.map((id, index) => {
        const s = byId[id];
        if (!s) return null;
        return (
          <li key={id} {...itemProps(id)} className={`a-editor-list__item ${selectedId === id ? 'is-selected' : ''} ${s.visible ? '' : 'is-hidden'}`}>
            <span className="a-editor-list__handle" {...handleProps(id)}>
              <Icon name="grip" size={18} strokeWidth={3} />
            </span>
            <button type="button" className="a-editor-list__name" onClick={() => onSelect(id)}>
              <span className="a-editor-list__num">{index + 1}</span>
              <span>
                <strong>{s.content?.navLabel || s.label}</strong>
                <small>{s.label}</small>
              </span>
            </button>
            <Toggle checked={s.visible} onChange={(v) => onToggle(s, v)} />
          </li>
        );
      })}
    </ul>
  );
}

export default function VisualEditorPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const frameRef = useRef(null);
  const { data, setData, error, loading, reload } = useApi('/api/sections', { live: true });
  const sections = data?.sections || [];
  const [selectedId, setSelectedId] = useState(null);
  const [draft, setDraft] = useState(null);
  const [tab, setTab] = useState('content');
  const [mobileView, setMobileView] = useState('edit');
  const [device, setDevice] = useState('phone');
  const selected = sections.find((s) => s.id === selectedId) || null;

  const post = useCallback((msg) => frameRef.current?.contentWindow?.postMessage(msg, window.location.origin), []);

  // Autoguardado real en Neon (el estado "Guardado" solo aparece si la API respondió bien)
  const editable = draft && selected ? { label: draft.label, content: draft.content, style: draft.style } : null;
  const autosave = useAutosave(editable, (value) => api.put(`/api/sections/${selectedId}`, value), { delay: 650 });
  const resetAutosave = autosave.reset;

  const select = useCallback(
    (id, { fromPreview = false } = {}) => {
      const s = sections.find((x) => x.id === id);
      if (!s) return;
      autosave.flush();
      setSelectedId(id);
      const next = { label: s.label, content: s.content, style: s.style };
      resetAutosave(next);
      setDraft(next);
      if (!fromPreview) post({ type: 'xv:select', key: s.key });
      else setMobileView('edit');
    },
    [sections, autosave, resetAutosave, post],
  );

  // Cambios en vivo: cada modificación se envía de inmediato a la vista previa
  useEffect(() => {
    if (selected && draft) post({ type: 'xv:draft', key: selected.key, content: draft.content, style: draft.style });
  }, [draft, selected, post]);

  // Mensajes de la vista previa
  useEffect(() => {
    const onMessage = (e) => {
      if (e.origin !== window.location.origin) return;
      if (e.data?.type === 'xv:selected') {
        const s = sections.find((x) => x.key === e.data.key);
        if (s) select(s.id, { fromPreview: true });
      }
      if (e.data?.type === 'xv:ready' && selected) {
        post({ type: 'xv:select', key: selected.key });
        if (draft) post({ type: 'xv:draft', key: selected.key, content: draft.content, style: draft.style });
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [sections, select, selected, draft, post]);

  async function toggleVisible(s, visible) {
    setData({ sections: sections.map((x) => (x.id === s.id ? { ...x, visible } : x)) });
    try {
      await api.put(`/api/sections/${s.id}`, { visible });
      toast(`${s.label}: ${visible ? 'visible' : 'oculta'}`);
    } catch (err) {
      toast(err.message, 'error');
      reload();
    }
  }

  async function reorder(ids) {
    setData({ sections: ids.map((id) => sections.find((s) => s.id === id)) });
    try {
      const res = await api.put('/api/sections/reorder', { ids });
      setData(res);
      toast('Orden guardado');
    } catch (err) {
      toast(err.message, 'error');
      reload();
    }
  }

  function move(dir) {
    const ids = sections.map((s) => s.id);
    const i = ids.indexOf(selectedId);
    const j = i + dir;
    if (j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    reorder(ids);
  }

  async function resetSection() {
    if (!(await confirm('Se restaurarán los textos y el estilo originales de esta sección.', { confirmText: 'Restablecer' }))) return;
    try {
      const res = await api.post(`/api/sections/${selectedId}/reset`);
      const next = { label: res.section.label, content: res.section.content, style: res.section.style };
      resetAutosave(next);
      setDraft(next);
      toast('Sección restablecida');
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  const onEventDraft = useCallback((event) => post({ type: 'xv:event-draft', event }), [post]);

  if (loading) return <Loading skeleton={8} />;

  return (
    <div className={`a-editor a-editor--${mobileView}`}>
      <div className="a-editor__switch" role="tablist">
        <button type="button" className={mobileView === 'edit' ? 'is-active' : ''} onClick={() => setMobileView('edit')}>
          <Icon name="edit" size={15} /> Editar
        </button>
        <button type="button" className={mobileView === 'preview' ? 'is-active' : ''} onClick={() => setMobileView('preview')}>
          <Icon name="eye" size={15} /> Vista previa
        </button>
      </div>

      <aside className="a-editor__panel">
        {!selected ? (
          <>
            <header className="a-editor__head">
              <div>
                <h1>Editor visual</h1>
                <p className="a-muted">Elige una sección aquí o haz clic sobre ella en la vista previa. Arrastra ☰ para cambiar el orden.</p>
              </div>
            </header>
            {error && <EmptyState icon="x" title={error.message} />}
            <SectionList sections={sections} selectedId={selectedId} onSelect={(id) => select(id)} onToggle={toggleVisible} onReorder={reorder} />
          </>
        ) : (
          <>
            <header className="a-editor__head">
              <button type="button" className="a-back" onClick={() => setSelectedId(null)}>
                <Icon name="chevronLeft" size={16} /> Todas las secciones
              </button>
              <div className="a-editor__title">
                <div>
                  <p className="a-editor__eyebrow">Sección seleccionada</p>
                  <h1>{draft?.content?.navLabel || selected.label}</h1>
                </div>
                {!selected.visible && <Badge tone="gray">Oculta</Badge>}
              </div>
              <SaveStatus status={autosave.status} error={autosave.error} />
              {!selected.visible && <p className="a-field__hint">Las secciones ocultas no aparecen en la vista previa. Actívala en “Avanzado”.</p>}
            </header>
            {draft && (
              <SectionProperties
                sectionKey={selected.key}
                draft={draft}
                setDraft={setDraft}
                visible={selected.visible}
                onVisible={(v) => toggleVisible(selected, v)}
                onReset={resetSection}
                onEventDraft={onEventDraft}
                order={sections.findIndex((s) => s.id === selectedId)}
                total={sections.length}
                onMove={move}
                tab={tab}
                onTab={setTab}
              />
            )}
          </>
        )}
      </aside>

      <EditorPreview
        frameRef={frameRef}
        device={device}
        setDevice={setDevice}
        onReady={() => {
          if (selected) setTimeout(() => post({ type: 'xv:select', key: selected.key }), 500);
        }}
      />
      {selected && (
        <div className="a-editor__mobilebar">
          <Button variant="soft" size="sm" icon="eye" onClick={() => setMobileView(mobileView === 'edit' ? 'preview' : 'edit')}>
            {mobileView === 'edit' ? 'Ver cambios' : 'Seguir editando'}
          </Button>
        </div>
      )}
    </div>
  );
}
