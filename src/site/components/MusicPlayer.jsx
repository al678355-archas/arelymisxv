import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { playableAudioUrl } from '../../lib/format.js';
import Icon from './Icon.jsx';

// Botón flotante de música. La reproducción inicia al presionar "Abrir invitación"
// (los navegadores exigen una interacción del usuario para reproducir audio).
const MusicPlayer = forwardRef(function MusicPlayer({ music, labels = {} }, ref) {
  const audio = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const src = music?.url ? playableAudioUrl(music.url) : '';

  useEffect(() => {
    if (audio.current && music) audio.current.volume = Math.min(1, Math.max(0, (music.volume ?? 60) / 100));
  }, [music]);

  useEffect(() => setFailed(false), [src]);

  const play = async () => {
    if (!audio.current) return;
    try {
      await audio.current.play();
      setFailed(false);
    } catch {
      setPlaying(false);
    }
  };

  useImperativeHandle(ref, () => ({ play }));

  if (!src) return null;
  const toggle = () => (playing ? audio.current?.pause() : play());

  return (
    <div className={`music ${playing ? 'is-playing' : ''} ${failed ? 'is-failed' : ''}`}>
      <audio
        ref={audio}
        src={src}
        loop={music.loop !== false}
        preload="none"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onError={() => {
          setPlaying(false);
          setFailed(true);
        }}
      />
      <button type="button" className="music__btn" onClick={toggle} aria-pressed={playing} aria-label={playing ? labels.pause || 'Pausar' : labels.play || 'Reproducir'} title={[music.title, music.artist].filter(Boolean).join(' — ')}>
        <span className="music__disc" aria-hidden="true" />
        <Icon name={playing ? 'pause' : 'play'} size={18} />
      </button>
      <span className="music__bars" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </span>
    </div>
  );
});

export default MusicPlayer;
