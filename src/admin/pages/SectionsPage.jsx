import { Link } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { useApi } from '../hooks.js';
import { useSortable } from '../useSortable.js';
import PreviewFrame from '../components/PreviewFrame.jsx';
import { Card, ErrorBox, Icon, IconButton, Loading, PageHeader, Toggle, useToast } from '../components/ui.jsx';

export default function SectionsPage() {
  const toast = useToast();
  const { data, setData, error, loading, reload } = useApi('/api/sections', { live: true });
  const sections = data?.sections || [];

  async function saveOrder(ids) {
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

  const { order, handleProps, itemProps, dragging } = useSortable(sections, { onDrop: saveOrder });
  const byId = Object.fromEntries(sections.map((s) => [s.id, s]));

  async function toggle(section, visible) {
    setData({ sections: sections.map((s) => (s.id === section.id ? { ...s, visible } : s)) });
    try {
      await api.put(`/api/sections/${section.id}`, { visible });
      toast(`${section.label}: ${visible ? 'visible' : 'oculta'}`);
    } catch (err) {
      toast(err.message, 'error');
      reload();
    }
  }

  function move(index, dir) {
    const target = index + dir;
    if (target < 0 || target >= order.length) return;
    const next = [...order];
    [next[index], next[target]] = [next[target], next[index]];
    saveOrder(next);
  }

  if (loading) return <Loading skeleton={8} />;

  return (
    <div className="a-page a-page--with-preview">
      <div className="a-page__main">
        <PageHeader
          title="Secciones"
          description="Arrastra ☰ para ordenar, activa o desactiva y edita cada sección. Todo se guarda en Neon y la invitación cambia en vivo."
          actions={
            <Link to="/admin/invitacion" className="a-btn a-btn--primary">
              <Icon name="edit" size={16} />
              <span>Editor visual</span>
            </Link>
          }
        />
        <ErrorBox error={error} onRetry={reload} />
        <Card padded={false}>
          <ul className={`a-sections ${dragging ? 'is-dragging' : ''}`}>
            {order.map((id, index) => {
              const section = byId[id];
              if (!section) return null;
              return (
                <li key={id} {...itemProps(id)} className={`a-sections__item ${section.visible ? '' : 'is-hidden'}`}>
                  <span className="a-editor-list__handle" {...handleProps(id)}>
                    <Icon name="grip" size={18} strokeWidth={3} />
                  </span>
                  <Toggle checked={section.visible} onChange={(v) => toggle(section, v)} />
                  <span className="a-sections__num">{index + 1}</span>
                  <div className="a-sections__text">
                    <strong>{section.content?.navLabel || section.label}</strong>
                    <small>{section.content?.title || section.content?.eyebrow || (section.visible ? 'Visible' : 'Oculta')}</small>
                  </div>
                  <div className="a-sections__actions">
                    <Link to={`/admin/secciones/${section.id}`} className="a-btn a-btn--soft a-btn--sm">
                      <Icon name="edit" size={15} />
                      <span>Editar</span>
                    </Link>
                    <IconButton icon="arrowUp" label="Subir" onClick={() => move(index, -1)} disabled={index === 0} />
                    <IconButton icon="arrowDown" label="Bajar" onClick={() => move(index, 1)} disabled={index === order.length - 1} />
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>
      <PreviewFrame />
    </div>
  );
}
