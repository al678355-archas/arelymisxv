import { useState } from 'react';
import { api, uploadWithProgress } from '../../lib/api.js';
import { cld, formatBytes, IMAGE_ACCEPT, validateImageFile } from '../../lib/image.js';
import { MODERATION_LABELS, timeAgo, dateTime } from '../../lib/format.js';
import { useApi } from '../hooks.js';
import { Badge, Button, Card, EmptyState, ErrorBox, Icon, Loading, PageHeader, Tabs, Toggle, useConfirm, useToast } from '../components/ui.jsx';

const CONFIG = {
  memory: {
    title: 'Galería de recuerdos',
    description: 'Fotos anteriores a los XV. Los invitados pueden enviar las suyas; solo se publican las aprobadas.',
    toggle: 'memoryUploadsEnabled',
    toggleLabel: 'Permitir que los invitados suban recuerdos',
  },
  party: {
    title: 'Galería de la fiesta',
    description: 'Fotos tomadas durante el evento (QR → /subir-foto). Solo se publican las aprobadas.',
    toggle: 'partyUploadsEnabled',
    toggleLabel: 'Permitir subir fotos de la fiesta',
  },
};

const TONE = { PENDING: 'amber', APPROVED: 'green', REJECTED: 'gray' };

export default function GalleryPage({ type }) {
  const cfg = CONFIG[type];
  const toast = useToast();
  const confirm = useConfirm();
  const [status, setStatus] = useState('PENDING');
  const [uploading, setUploading] = useState('');
  const { data, error, loading, reload } = useApi(`/api/gallery?type=${type}${status ? `&status=${status}` : ''}`, { live: true });
  const settings = useApi('/api/settings');

  async function setPhotoStatus(photo, value) {
    try {
      await api.patch(`/api/gallery/${photo.id}`, { status: value });
      toast(value === 'APPROVED' ? 'Foto aprobada y publicada' : value === 'REJECTED' ? 'Foto rechazada' : 'Foto marcada como pendiente');
      reload();
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  async function remove(photo) {
    if (!(await confirm('La fotografía se eliminará definitivamente (también de Cloudinary).', { confirmText: 'Eliminar' }))) return;
    try {
      await api.del(`/api/gallery/${photo.id}`);
      toast('Foto eliminada');
      reload();
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  async function toggleUploads(value) {
    const prev = settings.data.settings;
    settings.setData({ settings: { ...prev, [cfg.toggle]: value } });
    try {
      await api.put('/api/settings', { [cfg.toggle]: value });
      toast(value ? 'Subida de fotos activada' : 'Subida de fotos desactivada');
    } catch (err) {
      toast(err.message, 'error');
      settings.setData({ settings: prev });
    }
  }

  async function adminUpload(e) {
    const files = [...(e.target.files || [])];
    e.target.value = '';
    for (const [i, file] of files.entries()) {
      const problem = validateImageFile(file);
      if (problem) {
        toast(`${file.name}: ${problem}`, 'error');
        continue;
      }
      const fd = new FormData();
      fd.append('type', type);
      fd.append('photo', file);
      try {
        await uploadWithProgress('/api/gallery', fd, { onProgress: (p) => setUploading(`Subiendo ${i + 1}/${files.length} · ${p}%`) });
      } catch (err) {
        toast(`${file.name}: ${err.message}`, 'error');
      }
    }
    setUploading('');
    reload();
    if (files.length) toast('Carga terminada');
  }

  const stats = data?.stats || {};

  return (
    <div className="a-page">
      <PageHeader
        title={cfg.title}
        description={cfg.description}
        actions={
          <label className={`a-btn a-btn--primary ${uploading ? 'is-busy' : ''}`}>
            <Icon name="upload" size={17} />
            <span>{uploading || 'Subir fotos (aprobadas)'}</span>
            <input type="file" accept={IMAGE_ACCEPT} multiple hidden onChange={adminUpload} disabled={Boolean(uploading)} />
          </label>
        }
      />

      {settings.data && (
        <Card>
          <Toggle checked={settings.data.settings[cfg.toggle]} onChange={toggleUploads} label={cfg.toggleLabel} description={settings.data.settings[cfg.toggle] ? 'ON — los invitados pueden subir fotos' : 'OFF — el formulario está cerrado'} />
        </Card>
      )}

      <Tabs
        value={status}
        onChange={setStatus}
        tabs={[
          { value: 'PENDING', label: 'Pendientes', count: stats.PENDING },
          { value: 'APPROVED', label: 'Aprobadas', count: stats.APPROVED },
          { value: 'REJECTED', label: 'Rechazadas', count: stats.REJECTED },
          { value: '', label: 'Todas' },
        ]}
      />

      <ErrorBox error={error} onRetry={reload} />
      {loading ? (
        <Loading />
      ) : !data?.photos.length ? (
        <Card>
          <EmptyState icon="camera" title="No hay fotos aquí" />
        </Card>
      ) : (
        <div className="a-photo-grid">
          {data.photos.map((p) => (
            <article key={p.id} className="a-photo">
              <a href={p.image?.url} target="_blank" rel="noopener noreferrer" className="a-photo__img">
                <img src={cld(p.image?.url, { w: 420, h: 420, crop: 'fill' })} alt={`Foto de ${p.uploaderName}`} loading="lazy" />
                <Badge tone={TONE[p.status]}>{MODERATION_LABELS[p.status]}</Badge>
              </a>
              <div className="a-photo__body">
                <strong>{p.uploaderName}</strong>
                {p.message && <p>“{p.message}”</p>}
                <small className="a-muted" title={dateTime(p.createdAt)}>
                  {timeAgo(p.createdAt)}
                  {p.bytes ? ` · ${formatBytes(p.bytes)}` : ''}
                  {p.uploadedByAdmin ? ' · subida por admin' : ''}
                </small>
              </div>
              <div className="a-photo__actions">
                {p.status !== 'APPROVED' && (
                  <Button size="sm" variant="success" icon="check" onClick={() => setPhotoStatus(p, 'APPROVED')}>
                    Aprobar
                  </Button>
                )}
                {p.status !== 'REJECTED' && (
                  <Button size="sm" variant="ghost" icon="x" onClick={() => setPhotoStatus(p, 'REJECTED')}>
                    Rechazar
                  </Button>
                )}
                <Button size="sm" variant="ghost-danger" icon="trash" onClick={() => remove(p)}>
                  Eliminar
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
