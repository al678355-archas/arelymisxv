import { Link } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { useApi } from '../hooks.js';
import PreviewFrame from '../components/PreviewFrame.jsx';
import { Card, ErrorBox, Icon, IconButton, Loading, PageHeader, Toggle, useToast } from '../components/ui.jsx';

export default function SectionsPage() {
  const toast = useToast();
  const { data, setData, error, loading, reload } = useApi('/api/sections');
  const sections = data?.sections || [];

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

  async function move(index, dir) {
    const target = index + dir;
    if (target < 0 || target >= sections.length) return;
    const next = [...sections];
    [next[index], next[target]] = [next[target], next[index]];
    setData({ sections: next });
    try {
      const res = await api.put('/api/sections/reorder', { ids: next.map((s) => s.id) });
      setData(res);
    } catch (err) {
      toast(err.message, 'error');
      reload();
    }
  }

  if (loading) return <Loading />;

  return (
    <div className="a-page a-page--with-preview">
      <div className="a-page__main">
        <PageHeader title="Secciones" description="Activa, desactiva, ordena y edita cada sección de la invitación. Los cambios se reflejan en vivo." />
        <ErrorBox error={error} onRetry={reload} />
        <Card padded={false}>
          <ul className="a-sections">
            {sections.map((section, index) => (
              <li key={section.id} className={`a-sections__item ${section.visible ? '' : 'is-hidden'}`}>
                <Toggle checked={section.visible} onChange={(v) => toggle(section, v)} />
                <span className="a-sections__num">{index + 1}</span>
                <div className="a-sections__text">
                  <strong>{section.label}</strong>
                  <small>{section.content?.title || section.content?.eyebrow || (section.visible ? 'Visible' : 'Oculta')}</small>
                </div>
                <div className="a-sections__actions">
                  <Link to={`/admin/secciones/${section.id}`} className="a-btn a-btn--soft a-btn--sm">
                    <Icon name="edit" size={15} />
                    <span>Editar</span>
                  </Link>
                  <IconButton icon="arrowUp" label="Subir" onClick={() => move(index, -1)} disabled={index === 0} />
                  <IconButton icon="arrowDown" label="Bajar" onClick={() => move(index, 1)} disabled={index === sections.length - 1} />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
      <PreviewFrame />
    </div>
  );
}
