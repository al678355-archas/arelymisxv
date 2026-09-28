import { useEffect, useRef, useState } from 'react';
import { uploadWithProgress, api } from '../../lib/api.js';
import { cld, IMAGE_ACCEPT, validateImageFile, isHeic, formatBytes } from '../../lib/image.js';
import { Button, Modal, Loading, EmptyState, Icon } from './ui.jsx';

// Selector de imagen del CMS: seleccionar → vista previa → subir a Cloudinary.
// También permite elegir una imagen ya subida (biblioteca) o quitarla.
// value: { id, url, width, height } | null
export default function ImageUploader({ value, onChange, folder = 'general', label = 'Imagen', compact = false }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);

  function pick(e) {
    const selected = e.target.files?.[0];
    e.target.value = '';
    setError('');
    if (!selected) return;
    const problem = validateImageFile(selected);
    if (problem) {
      setError(problem);
      return;
    }
    setFile(selected);
    setPreview(isHeic(selected) ? '' : URL.createObjectURL(selected));
  }

  async function upload() {
    if (!file) return;
    setUploading(true);
    setProgress(0);
    setError('');
    try {
      const fd = new FormData();
      fd.append('folder', folder);
      fd.append('image', file);
      const res = await uploadWithProgress('/api/media', fd, { onProgress: setProgress });
      onChange(res.image);
      cancel();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  function cancel() {
    setFile(null);
    setPreview('');
  }

  const shown = file ? preview : value?.url ? cld(value.url, { w: 480 }) : '';

  return (
    <div className={`a-uploader ${compact ? 'a-uploader--compact' : ''}`}>
      <div className={`a-uploader__preview ${shown ? 'has-image' : ''} ${file ? 'is-local' : ''}`}>
        {shown ? (
          <img src={shown} alt={label} />
        ) : file ? (
          <span className="a-uploader__placeholder">
            <Icon name="image" size={26} />
            Vista previa no disponible (HEIC)
          </span>
        ) : (
          <span className="a-uploader__placeholder">
            <Icon name="image" size={26} />
            Sin imagen
          </span>
        )}
        {file && <span className="a-uploader__tag">Sin subir</span>}
      </div>

      <div className="a-uploader__body">
        <input ref={inputRef} type="file" accept={IMAGE_ACCEPT} onChange={pick} hidden />
        {file ? (
          <>
            <p className="a-uploader__file">
              <strong>{file.name}</strong>
              <span>{formatBytes(file.size)}</span>
            </p>
            {uploading && (
              <div className="a-progress">
                <span style={{ width: `${progress}%` }} />
              </div>
            )}
            <div className="a-uploader__actions">
              <Button icon="upload" onClick={upload} loading={uploading}>
                {uploading ? `Subiendo ${progress}%` : 'Subir imagen'}
              </Button>
              <Button variant="ghost" onClick={cancel} disabled={uploading}>
                Cancelar
              </Button>
            </div>
          </>
        ) : (
          <div className="a-uploader__actions">
            <Button variant="soft" icon="image" onClick={() => inputRef.current?.click()}>
              Seleccionar imagen
            </Button>
            <Button variant="ghost" icon="grid" onClick={() => setLibraryOpen(true)}>
              Biblioteca
            </Button>
            {value?.url && (
              <Button variant="ghost-danger" icon="trash" onClick={() => onChange(null)}>
                Quitar
              </Button>
            )}
          </div>
        )}
        {!file && <p className="a-field__hint">JPG, PNG, WEBP o HEIC · máximo 10 MB</p>}
        {error && <p className="a-field__error">{error}</p>}
      </div>

      <MediaPicker
        open={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        onSelect={(image) => {
          onChange(image);
          setLibraryOpen(false);
        }}
      />
    </div>
  );
}

export function MediaPicker({ open, onClose, onSelect }) {
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setItems(null);
    api
      .get('/api/media')
      .then((res) => setItems(res.media.filter((m) => !m.galleryPhoto)))
      .catch((err) => setError(err.message));
  }, [open]);

  return (
    <Modal open={open} onClose={onClose} title="Biblioteca de imágenes" wide>
      {error && <p className="a-field__error">{error}</p>}
      {!items ? (
        <Loading />
      ) : items.length === 0 ? (
        <EmptyState icon="image" title="Aún no hay imágenes">
          Sube una imagen con “Seleccionar imagen”.
        </EmptyState>
      ) : (
        <div className="a-media-grid a-media-grid--pick">
          {items.map((m) => (
            <button key={m.id} type="button" className="a-media-tile" onClick={() => onSelect({ id: m.id, url: m.secureUrl, width: m.width, height: m.height })}>
              <img src={cld(m.secureUrl, { w: 260, h: 260, crop: 'fill' })} alt={m.originalName} loading="lazy" />
              <span>{m.originalName || m.folder}</span>
            </button>
          ))}
        </div>
      )}
    </Modal>
  );
}
