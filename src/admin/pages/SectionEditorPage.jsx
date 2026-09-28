import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { useApi } from '../hooks.js';
import { useAutosave } from '../../hooks/useAutosave.js';
import { SECTION_SCHEMAS } from '../sectionSchemas.js';
import SectionProperties from '../components/SectionProperties.jsx';
import PreviewFrame from '../components/PreviewFrame.jsx';
import { Button, ErrorBox, Icon, Loading, PageHeader, SaveStatus, useConfirm, useToast } from '../components/ui.jsx';

export default function SectionEditorPage() {
  const { id } = useParams();
  const toast = useToast();
  const confirm = useConfirm();
  const { data, error, reload } = useApi(`/api/sections/${id}`);
  const [draft, setDraft] = useState(null);
  const [visible, setVisible] = useState(true);

  const editable = draft ? { label: draft.label, content: draft.content, style: draft.style } : null;
  const autosave = useAutosave(editable, (value) => api.put(`/api/sections/${draft.id}`, value), { delay: 700 });
  const resetAutosave = autosave.reset;

  useEffect(() => {
    if (data?.section && (!draft || data.section.id !== draft.id)) {
      const { id: sid, label, content, style } = data.section;
      resetAutosave({ label, content, style });
      setDraft({ id: sid, label, content, style });
      setVisible(data.section.visible);
    }
  }, [data, draft, resetAutosave]);

  if (error) return <ErrorBox error={error} onRetry={reload} />;
  if (!draft || draft.id !== id) return <Loading skeleton={6} />;
  const key = data.section.key;

  async function setSectionVisible(v) {
    setVisible(v);
    try {
      await api.put(`/api/sections/${id}`, { visible: v });
      toast(v ? 'Sección visible' : 'Sección oculta');
    } catch (err) {
      setVisible(!v);
      toast(err.message, 'error');
    }
  }

  async function reset() {
    if (!(await confirm('Se restaurarán los textos y el estilo originales de esta sección.', { confirmText: 'Restablecer' }))) return;
    try {
      const res = await api.post(`/api/sections/${id}/reset`);
      const { label, content, style } = res.section;
      resetAutosave({ label, content, style });
      setDraft({ id, label, content, style });
      toast('Sección restablecida');
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  return (
    <div className="a-page a-page--with-preview">
      <div className="a-page__main">
        <Link to="/admin/secciones" className="a-back">
          <Icon name="chevronLeft" size={16} /> Secciones
        </Link>
        <PageHeader
          title={draft.label}
          description={SECTION_SCHEMAS[key]?.note}
          actions={
            <>
              <SaveStatus status={autosave.status} error={autosave.error} />
              <Link to="/admin/invitacion" className="a-btn a-btn--soft a-btn--sm">
                <Icon name="edit" size={15} />
                <span>Abrir en editor visual</span>
              </Link>
            </>
          }
        />
        <SectionProperties sectionKey={key} draft={draft} setDraft={setDraft} visible={visible} onVisible={setSectionVisible} onReset={reset} />
        <Button variant="ghost" icon="chevronLeft" onClick={() => window.history.back()}>
          Volver
        </Button>
      </div>
      <PreviewFrame focusKey={key} />
    </div>
  );
}
