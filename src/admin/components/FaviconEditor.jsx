import ImageUploader from './ImageUploader.jsx';
import { faviconUrl } from '../../lib/image.js';

// Editor del icono de la pestaña: subida de imagen + vista previa en pestaña, favoritos y celular.
export default function FaviconEditor({ value, title, onChange }) {
  const small = value?.url ? faviconUrl(value.url, 64) : '/favicon.svg';
  const large = value?.url ? faviconUrl(value.url, 180) : '/favicon.svg';

  return (
    <div className="a-favicon">
      <div className="a-favicon__upload">
        <ImageUploader folder="favicon" value={value} onChange={onChange} label="Icono de la pestaña" compact />
        <p className="a-field__hint">
          Usa una imagen cuadrada de al menos 512 × 512 px (por ejemplo, las iniciales o una flor). Se recorta en cuadrado automáticamente. Sin imagen se usa el
          icono “XV” predeterminado.
        </p>
      </div>

      <div className="a-favicon__previews" aria-label="Vista previa del icono">
        <div className="a-favicon__browser">
          <div className="a-favicon__tabs">
            <span className="a-favicon__tab is-active">
              <img src={small} alt="" width="16" height="16" />
              <span>{title || 'Mis XV años'}</span>
              <i aria-hidden="true">×</i>
            </span>
            <span className="a-favicon__tab">
              <span className="a-favicon__blank" />
              <span>Nueva pestaña</span>
            </span>
          </div>
          <div className="a-favicon__bar">{typeof window !== 'undefined' ? window.location.host : ''}</div>
        </div>

        <div className="a-favicon__sizes">
          {[16, 32, 48].map((size) => (
            <figure key={size}>
              <img src={small} alt="" width={size} height={size} />
              <figcaption>{size}px</figcaption>
            </figure>
          ))}
          <figure>
            <img src={large} alt="" width="60" height="60" className="a-favicon__app" />
            <figcaption>Celular</figcaption>
          </figure>
        </div>
      </div>
    </div>
  );
}
