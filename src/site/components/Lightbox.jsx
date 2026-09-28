import { useEffect } from 'react';
import { cld } from '../../lib/image.js';
import Icon from './Icon.jsx';

export default function Lightbox({ items, index, onClose, onIndex }) {
  const item = items[index];

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onIndex((index + 1) % items.length);
      if (e.key === 'ArrowLeft') onIndex((index - 1 + items.length) % items.length);
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [index, items.length, onClose, onIndex]);

  if (!item) return null;
  return (
    <div className="lightbox" role="dialog" aria-modal="true" onClick={onClose}>
      <button type="button" className="lightbox__close" onClick={onClose} aria-label="Cerrar">
        <Icon name="close" />
      </button>
      {items.length > 1 && (
        <>
          <button type="button" className="lightbox__nav lightbox__nav--prev" aria-label="Anterior" onClick={(e) => { e.stopPropagation(); onIndex((index - 1 + items.length) % items.length); }}>
            <Icon name="chevronLeft" />
          </button>
          <button type="button" className="lightbox__nav lightbox__nav--next" aria-label="Siguiente" onClick={(e) => { e.stopPropagation(); onIndex((index + 1) % items.length); }}>
            <Icon name="chevronRight" />
          </button>
        </>
      )}
      <figure className="lightbox__figure" onClick={(e) => e.stopPropagation()} key={item.id}>
        <img src={cld(item.image.url, { w: 1600, h: 1600 })} alt={item.message || `Foto de ${item.uploaderName}`} />
        {(item.uploaderName || item.message) && (
          <figcaption>
            {item.message && <span className="lightbox__msg">“{item.message}”</span>}
            {item.uploaderName && <span className="lightbox__by">— {item.uploaderName}</span>}
          </figcaption>
        )}
      </figure>
    </div>
  );
}
