import { useEffect, useRef, useState } from 'react';
import { uploadWithProgress } from '../../lib/api.js';
import { IMAGE_ACCEPT, validateImageFile, isHeic, formatBytes } from '../../lib/image.js';
import Icon from './Icon.jsx';

// Formulario público para subir fotografías (recuerdos o fiesta). Entran como PENDING.
export default function PhotoUploadForm({ type, content = {} }) {
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const [state, setState] = useState('idle');
  const inputRef = useRef(null);

  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);

  function pick(e) {
    const selected = e.target.files?.[0];
    setError('');
    if (!selected) return;
    const problem = validateImageFile(selected);
    if (problem) {
      setError(problem);
      e.target.value = '';
      return;
    }
    setFile(selected);
    setPreview(isHeic(selected) ? '' : URL.createObjectURL(selected));
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (name.trim().length < 2) return setError('Escribe tu nombre.');
    const problem = validateImageFile(file);
    if (problem) return setError(problem);

    const fd = new FormData();
    fd.append('name', name.trim());
    fd.append('message', message.trim());
    fd.append('photo', file);
    setState('uploading');
    setProgress(0);
    try {
      await uploadWithProgress(`/api/public/gallery/${type}`, fd, { auth: false, onProgress: setProgress });
      setState('done');
      setFile(null);
      setPreview('');
      setMessage('');
      if (inputRef.current) inputRef.current.value = '';
    } catch (err) {
      setError(err.message);
      setState('idle');
    }
  }

  if (state === 'done') {
    return (
      <div className="upload-form upload-form--done" role="status">
        <span className="upload-form__check">
          <Icon name="check" size={30} />
        </span>
        <p>{content.successText}</p>
        <button type="button" className="btn btn--ghost" onClick={() => setState('idle')}>
          <Icon name="camera" size={18} />
          <span>{content.buttonText}</span>
        </button>
      </div>
    );
  }

  return (
    <form className="upload-form" onSubmit={submit} noValidate>
      <label className="field">
        <span className="field__label">{content.nameLabel}</span>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} autoComplete="name" required />
      </label>

      <div className="field">
        <span className="field__label">{content.photoLabel}</span>
        <label className={`dropzone ${preview || file ? 'has-file' : ''}`}>
          <input ref={inputRef} type="file" accept={IMAGE_ACCEPT} onChange={pick} className="visually-hidden" />
          {preview ? (
            <img src={preview} alt="" className="dropzone__preview" />
          ) : file ? (
            <span className="dropzone__file">
              <Icon name="image" size={28} />
              {file.name}
            </span>
          ) : (
            <span className="dropzone__hint">
              <Icon name="upload" size={28} />
              <span>JPG · PNG · WEBP · HEIC — máx. 10 MB</span>
            </span>
          )}
        </label>
        {file && <small className="field__hint">{formatBytes(file.size)}</small>}
      </div>

      <label className="field">
        <span className="field__label">{content.messageLabel}</span>
        <textarea className="input" rows={3} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={300} />
      </label>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {state === 'uploading' && (
        <div className="progress" aria-label="Progreso de subida">
          <span style={{ width: `${progress}%` }} />
        </div>
      )}
      <button type="submit" className="btn" disabled={state === 'uploading'}>
        <Icon name="upload" size={18} />
        <span>{state === 'uploading' ? `${progress}%` : content.buttonText}</span>
      </button>
    </form>
  );
}
