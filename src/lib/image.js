// Optimización de imágenes con Cloudinary: formato y calidad automáticos y ancho adecuado.
export function cld(url, { w, h, crop = 'limit', gravity } = {}) {
  if (!url || !url.includes('res.cloudinary.com') || !url.includes('/upload/')) return url || '';
  const parts = ['f_auto', 'q_auto'];
  if (w || h) parts.push(`c_${crop}`);
  if (w) parts.push(`w_${Math.round(w)}`);
  if (h) parts.push(`h_${Math.round(h)}`);
  if (gravity) parts.push(`g_${gravity}`);
  return url.replace('/upload/', `/upload/${parts.join(',')}/`);
}

const WIDTHS = [360, 540, 720, 960, 1280, 1600, 2000];

export function srcSet(url, maxWidth = 2000, opts = {}) {
  if (!url || !url.includes('res.cloudinary.com')) return undefined;
  return WIDTHS.filter((w) => w <= maxWidth)
    .map((w) => `${cld(url, { ...opts, w, h: opts.h ? Math.round((opts.h / opts.w) * w) : undefined })} ${w}w`)
    .join(', ');
}

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif,.jpg,.jpeg,.png,.webp';

// Validación en el navegador (el servidor valida de nuevo).
export function validateImageFile(file) {
  if (!file) return 'Selecciona una imagen.';
  const type = (file.type || '').toLowerCase();
  const name = (file.name || '').toLowerCase();
  if (type.startsWith('video/')) return 'No se permiten videos, solo imágenes.';
  const okType = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif'].includes(type);
  const okExt = /\.(jpe?g|png|webp|heic|heif)$/.test(name);
  if (!okExt || (!okType && !/\.(heic|heif)$/.test(name))) {
    return 'Formato no permitido. Solo se aceptan imágenes JPG, JPEG, PNG, WEBP o HEIC.';
  }
  if (file.size > MAX_IMAGE_BYTES) return 'La imagen no puede superar los 10 MB.';
  return null;
}

export function isHeic(file) {
  return /\.(heic|heif)$/i.test(file?.name || '') || /heic|heif/i.test(file?.type || '');
}

export function formatBytes(bytes = 0) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
