import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { playableAudioUrl } from '../../lib/format.js';
import Icon from './Icon.jsx';

// Reproductor global de la invitación. Vive fuera de las secciones, así que la canción
// NO se reinicia al navegar entre ellas.
//  · Caso A: el navegador permite autoplay → suena sola.
//  · Caso B: el navegador lo bloquea → aparece "♫ Escuchar invitación" y suena al primer toque
//    (también con "Abrir invitación"). Así funciona en Chrome, Safari, iPhone y Android.
const MusicPlayer = forwardRef(function MusicPlayer({ music, labels = {}, allowAutoplay = true }, ref) {
  const audio = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [failed, setFailed] = useState(false);
  const [showTitle, setShowTitle] = useState(false);
  const src = music?.url ? playableAudioUrl(music.url) : '';
  const loop = music?.loop !== false;

  const play = useCallback(async () => {
    const el = audio.current;
    if (!el) return false;
    try {
      await el.play();
      setBlocked(false);
      setFailed(false);
      return true;
    } catch (error) {
      if (error?.name === 'NotAllowedError') setBlocked(true);
      setPlaying(false);
      return false;
    }
  }, []);

  useImperativeHandle(ref, () => ({ play }), [play]);

  useEffect(() => {
    if (audio.current && music) audio.current.volume = Math.min(1, Math.max(0, (music.volume ?? 60) / 100));
  }, [music]);

  useEffect(() => setFailed(false), [src]);

  // Caso A: intentar reproducir al abrir la página
  useEffect(() => {
    if (!src || !allowAutoplay || music?.autoplay === false) return;
    play();
  }, [src, allowAutoplay, music?.autoplay, play]);

  // Caso B: bloqueado → el primer toque, clic o tecla inicia la música
  useEffect(() => {
    if (!blocked) return undefined;
    const start = (e) => {
      if (e.target?.closest?.('.music')) return; // el propio botón ya se encarga
      play();
    };
    const opts = { once: true, capture: true };
    document.addEventListener('pointerdown', start, opts);
    document.addEventListener('keydown', start, opts);
    return () => {
      document.removeEventListener('pointerdown', start, opts);
      document.removeEventListener('keydown', start, opts);
    };
  }, [blocked, play]);

  // Mostrar el nombre de la canción unos segundos al empezar
  useEffect(() => {
    if (!playing) return undefined;
    setShowTitle(true);
    const t = setTimeout(() => setShowTitle(false), 4500);
    return () => clearTimeout(t);
  }, [playing]);

  if (!src) return null;
  const toggle = () => (playing ? audio.current?.pause() : play());
  const song = [music.title, music.artist].filter(Boolean).join(' — ');

  return (
    <div className={`music ${playing ? 'is-playing' : ''} ${failed ? 'is-failed' : ''} ${showTitle ? 'show-title' : ''}`}>
      <audio
        ref={audio}
        src={src}
        loop={loop}
        preload={allowAutoplay ? 'auto' : 'none'}
        playsInline
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          // Respaldo del loop para navegadores que no reinician audio en streaming
          if (loop && audio.current) {
            audio.current.currentTime = 0;
            play();
          }
        }}
        onError={() => {
          setPlaying(false);
          setFailed(true);
        }}
      />
      {blocked && !playing && (
        <button type="button" className="music__cta" onClick={play}>
          <span aria-hidden="true">♫</span> {labels.listen || 'Escuchar invitación'}
        </button>
      )}
      {song && (
        <span className="music__title" aria-live="polite">
          <span aria-hidden="true">♫</span> {song}
        </span>
      )}
      <span className="music__bars" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </span>
      <button
        type="button"
        className="music__btn"
        onClick={toggle}
        onMouseEnter={() => setShowTitle(true)}
        onMouseLeave={() => setShowTitle(false)}
        aria-pressed={playing}
        aria-label={playing ? labels.pause || 'Pausar' : labels.play || 'Reproducir'}
        title={song}
      >
        <span className="music__disc" aria-hidden="true" />
        <Icon name={playing ? 'pause' : 'music'} size={18} />
      </button>
    </div>
  );
});

export default MusicPlayer;
