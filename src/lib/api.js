// Cliente HTTP para la API. Los errores siempre llegan con un mensaje legible.
// En producción siempre se usa VITE_API_URL (Render); localhost solo como respaldo en desarrollo.
export const API_URL = (import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:4580' : '')).replace(/\/$/, '');

const TOKEN_KEY = 'xv_admin_token';

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || '';
  } catch {
    return '';
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* almacenamiento no disponible */
  }
}

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

function handleUnauthorized(status, path) {
  if (status === 401 && getToken() && !path.startsWith('/api/auth/login')) {
    setToken('');
    window.dispatchEvent(new Event('xv:unauthorized'));
  }
}

export async function request(path, { method = 'GET', body, auth = true, signal } = {}) {
  const headers = {};
  const token = getToken();
  if (auth && token) headers.Authorization = `Bearer ${token}`;
  let payload = body;
  if (body !== undefined && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  let res;
  try {
    res = await fetch(API_URL + path, { method, headers, body: payload, signal });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new ApiError('No se pudo conectar con el servidor. Revisa tu conexión a internet.', 0);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    handleUnauthorized(res.status, path);
    throw new ApiError(data.error || 'Ocurrió un error inesperado.', res.status, data.details);
  }
  return data;
}

export const api = {
  get: (path, opts) => request(path, { ...opts, method: 'GET' }),
  post: (path, body, opts) => request(path, { ...opts, method: 'POST', body }),
  put: (path, body, opts) => request(path, { ...opts, method: 'PUT', body }),
  patch: (path, body, opts) => request(path, { ...opts, method: 'PATCH', body }),
  del: (path, opts) => request(path, { ...opts, method: 'DELETE' }),
};

// Subida con progreso (XMLHttpRequest permite conocer el avance).
export function uploadWithProgress(path, formData, { auth = true, onProgress } = {}) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', API_URL + path);
    const token = getToken();
    if (auth && token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      let data = {};
      try {
        data = JSON.parse(xhr.responseText || '{}');
      } catch {
        /* respuesta vacía */
      }
      if (xhr.status >= 200 && xhr.status < 300) resolve(data);
      else {
        handleUnauthorized(xhr.status, path);
        reject(new ApiError(data.error || (xhr.status === 413 ? 'La imagen no puede superar los 10 MB.' : 'No se pudo subir la imagen.'), xhr.status));
      }
    };
    xhr.onerror = () => reject(new ApiError('No se pudo conectar con el servidor. Revisa tu conexión a internet.', 0));
    xhr.send(formData);
  });
}
