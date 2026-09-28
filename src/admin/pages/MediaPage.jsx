import { useState } from 'react';
import { api } from '../../lib/api.js';
import { cld, formatBytes } from '../../lib/image.js';
import { dateTime } from '../../lib/format.js';
import { useApi } from '../hooks.js';
import ImageUploader from '../components/ImageUploader.jsx';
import { Card, EmptyState, ErrorBox, IconButton, Loading, PageHeader, Select, useConfirm, useToast, Icon } from '../components/ui.jsx';

const FOLDERS = [
  { value: '', label: 'Todas las carpetas' },
  { value: 'general', label: 'General' },
  { value: 'portada', label: 'Portada' },
  { value: 'secciones', label: 'Secciones' },
  { value: 'eventos', label: 'Ceremonia / recepción' },
  { value: 'historia', label: 'Historia' },
  { value: 'fondos', label: 'Fondos' },
  { value: 'recuerdos', label: 'Galería recuerdos' },
  { value: 'fiesta', label: 'Galería fiesta' },
  { value: 'favicon', label: 'Icono de la pestaña' },
];

export default function MediaPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const [folder, setFolder] = useState('');
  const [uploadFolder, setUploadFolder] = useState('general');
  const { data, setData, error, loading, reload } = useApi(`/api/media${folder ? `?folder=${folder}` : ''}`);

  async function remove(m) {
    const usedIn = m.galleryPhoto ? ' También se eliminará de la galería.' : ' Si se usa en alguna sección, se quitará de ahí.';
    if (!(await confirm(`La imagen se eliminará de Cloudinary y de la base de datos.${usedIn}`, { confirmText: 'Eliminar' }))) return;
    try {
      await api.del(`/api/media/${m.id}`);
      setData({ ...data, media: data.media.filter((x) => x.id !== m.id) });
      toast('Imagen eliminada');
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  async function copy(url) {
    try {
      await navigator.clipboard.writeText(url);
      toast('Enlace copiado');
    } catch {
      toast('No se pudo copiar', 'error');
    }
  }

  return (
    <div className="a-page">
      <PageHeader title="Multimedia" description="Todas las imágenes guardadas en Cloudinary. Se optimizan automáticamente (formato y calidad) al mostrarse." />
      {data && !data.cloudinaryConfigured && (
        <div className="a-notice a-notice--warn">
          <Icon name="image" size={18} /> Cloudinary no está configurado en el backend: todavía no se pueden subir imágenes.
        </div>
      )}

      <Card title="Subir imagen">
        <div className="a-grid a-grid--upload">
          <label className="a-field">
            <span className="a-field__label">Carpeta</span>
            <Select value={uploadFolder} onChange={(e) => setUploadFolder(e.target.value)} options={FOLDERS.filter((f) => f.value && !['recuerdos', 'fiesta'].includes(f.value))} />
          </label>
          <ImageUploader
            folder={uploadFolder}
            value={null}
            onChange={(img) => {
              if (img) {
                toast('Imagen subida');
                reload();
              }
            }}
          />
        </div>
      </Card>

      <Card
        title={`Biblioteca${data ? ` (${data.media.length})` : ''}`}
        actions={<Select value={folder} onChange={(e) => setFolder(e.target.value)} options={FOLDERS} />}
      >
        <ErrorBox error={error} onRetry={reload} />
        {loading ? (
          <Loading />
        ) : !data?.media.length ? (
          <EmptyState icon="image" title="No hay imágenes en esta carpeta" />
        ) : (
          <div className="a-media-grid">
            {data.media.map((m) => (
              <figure key={m.id} className="a-media-card">
                <a href={m.secureUrl} target="_blank" rel="noopener noreferrer">
                  <img src={cld(m.secureUrl, { w: 320, h: 240, crop: 'fill' })} alt={m.originalName} loading="lazy" />
                </a>
                <figcaption>
                  <strong title={m.originalName}>{m.originalName || m.publicId}</strong>
                  <span>
                    {m.width}×{m.height} · {formatBytes(m.bytes)} · {m.format?.toUpperCase()}
                  </span>
                  <span>
                    {FOLDERS.find((f) => f.value === m.folder)?.label || m.folder} · {dateTime(m.createdAt)}
                  </span>
                </figcaption>
                <div className="a-media-card__actions">
                  <IconButton icon="copy" label="Copiar enlace" onClick={() => copy(m.secureUrl)} />
                  <IconButton icon="trash" label="Eliminar" variant="danger" onClick={() => remove(m)} />
                </div>
              </figure>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
