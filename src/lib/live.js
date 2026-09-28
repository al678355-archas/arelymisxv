// Conexión única de Server-Sent Events compartida por toda la app.
// EventSource se reconecta solo; al reconectar se recibe "hello" y se vuelve a pedir la información.
//
// Los navegadores limitan a 6 conexiones HTTP/1.1 por servidor, así que:
//  - la conexión se cierra al salir de la página (pagehide) y se reabre al volver;
//  - la vista previa (iframe) del CMS reutiliza la conexión del panel en lugar de abrir otra.
import { API_URL } from './api.js';

const listeners = { content: new Set(), activity: new Set(), hello: new Set(), status: new Set() };
let source = null;
let connected = false;

function emit(type, data) {
  listeners[type]?.forEach((fn) => {
    try {
      fn(data);
    } catch (error) {
      console.error(error);
    }
  });
}

function parse(e) {
  try {
    return JSON.parse(e.data);
  } catch {
    return {};
  }
}

function open() {
  if (source || typeof EventSource === 'undefined') return;
  source = new EventSource(`${API_URL}/api/public/stream`);
  source.addEventListener('hello', (e) => {
    connected = true;
    emit('status', true);
    emit('hello', parse(e));
  });
  source.addEventListener('content', (e) => emit('content', parse(e)));
  source.addEventListener('activity', (e) => emit('activity', parse(e)));
  source.onerror = () => {
    if (connected) {
      connected = false;
      emit('status', false);
    }
  };
}

function close() {
  source?.close();
  source = null;
  if (connected) {
    connected = false;
    emit('status', false);
  }
}

// Conexión del panel padre (mismo origen) cuando esta página es la vista previa en un iframe.
function parentHub() {
  try {
    if (window.parent !== window && window.parent.__xvLive) return window.parent.__xvLive;
  } catch {
    /* otro origen */
  }
  return null;
}

let started = false;
function ensureStarted() {
  if (started) return;
  started = true;
  window.addEventListener('pagehide', close);
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) open();
  });
  open();
}

export function subscribe(type, fn) {
  const hub = parentHub();
  if (hub) return hub.subscribe(type, fn);
  ensureStarted();
  listeners[type].add(fn);
  return () => listeners[type].delete(fn);
}

export function isLiveConnected() {
  const hub = parentHub();
  return hub ? hub.isLiveConnected() : connected;
}

if (typeof window !== 'undefined') {
  window.__xvLive = { subscribe, isLiveConnected };
}
