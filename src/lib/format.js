const LOCALE = 'es-MX';

// Fecha local "YYYY-MM-DD" → Date a mediodía UTC (evita desfases de día por zona horaria).
export function parseLocalDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return null;
  const [y, m, d] = value.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12));
}

// Instante exacto del evento para la cuenta regresiva.
export function eventInstant(event) {
  if (!event?.eventDate) return null;
  const time = /^\d{2}:\d{2}$/.test(event.eventTime || '') ? event.eventTime : '00:00';
  const offset = /^[+-]\d{2}:\d{2}$/.test(event.utcOffset || '') ? event.utcOffset : '-06:00';
  const date = new Date(`${event.eventDate}T${time}:00${offset}`);
  return Number.isNaN(date.getTime()) ? null : date;
}

// "19 • SEPTIEMBRE • 2027"
export function coverDate(value) {
  const date = parseLocalDate(value);
  if (!date) return '';
  const month = new Intl.DateTimeFormat(LOCALE, { month: 'long', timeZone: 'UTC' }).format(date);
  return `${date.getUTCDate()} • ${month.toUpperCase()} • ${date.getUTCFullYear()}`;
}

// "domingo, 19 de septiembre de 2027"
export function longDate(value) {
  const date = parseLocalDate(value);
  if (!date) return '';
  return new Intl.DateTimeFormat(LOCALE, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(date);
}

export function monthName(date) {
  return new Intl.DateTimeFormat(LOCALE, { month: 'long', timeZone: 'UTC' }).format(date);
}

export function weekdayNames(startsOnMonday = true) {
  // 2023-01-01 fue domingo
  const names = Array.from({ length: 7 }, (_, i) =>
    new Intl.DateTimeFormat(LOCALE, { weekday: 'short', timeZone: 'UTC' }).format(new Date(Date.UTC(2023, 0, 1 + i, 12))),
  ).map((n) => n.replace('.', '').slice(0, 3));
  return startsOnMonday ? [...names.slice(1), names[0]] : names;
}

export function dateTime(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat(LOCALE, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export function timeAgo(value) {
  const diff = (Date.now() - new Date(value).getTime()) / 1000;
  const rtf = new Intl.RelativeTimeFormat(LOCALE, { numeric: 'auto' });
  if (diff < 60) return 'hace un momento';
  if (diff < 3600) return rtf.format(-Math.round(diff / 60), 'minute');
  if (diff < 86400) return rtf.format(-Math.round(diff / 3600), 'hour');
  if (diff < 86400 * 7) return rtf.format(-Math.round(diff / 86400), 'day');
  return dateTime(value);
}

// Convierte enlaces para compartir de Google Drive / Dropbox en enlaces de descarga directa.
export function playableAudioUrl(url = '') {
  const drive = url.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:export=\w+&)?id=)([\w-]{10,})/);
  if (drive) return `https://drive.google.com/uc?export=download&id=${drive[1]}`;
  if (/dropbox\.com/.test(url)) {
    try {
      const u = new URL(url);
      u.searchParams.delete('dl');
      u.searchParams.set('raw', '1');
      return u.toString();
    } catch {
      return url;
    }
  }
  return url;
}

export const SIDE_LABELS = { PATERNAL: 'Familia paterna', MATERNAL: 'Familia materna', FRIENDS: 'Amigos', OTHER: 'Otros' };
export const STATUS_LABELS = { PENDING: 'Pendiente', ATTENDING: 'Confirmado', NOT_ATTENDING: 'No asistirá' };
export const MODERATION_LABELS = { PENDING: 'Pendiente', APPROVED: 'Aprobada', REJECTED: 'Rechazada' };
