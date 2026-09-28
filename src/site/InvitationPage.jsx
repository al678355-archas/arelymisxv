import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { useLiveInvitation } from '../hooks/useLiveInvitation.js';
import { useReveal } from '../hooks/useReveal.js';
import { themeVars, loadGoogleFonts } from '../lib/theme.js';
import Cover from './sections/Cover.jsx';
import { Intro, Message, People, Countdown } from './sections/TextSections.jsx';
import { Calendar, Venue, Itinerary, DressCode, Story } from './sections/EventSections.jsx';
import { Gallery, Rsvp, Dedications, Footer } from './sections/InteractiveSections.jsx';
import MusicPlayer from './components/MusicPlayer.jsx';
import NavMenu from './components/NavMenu.jsx';
import '../styles/site.css';

const COMPONENTS = {
  intro: Intro,
  countdown: Countdown,
  message: Message,
  parents: People,
  godparents: People,
  calendar: Calendar,
  ceremony: Venue,
  reception: Venue,
  itinerary: Itinerary,
  dresscode: DressCode,
  story: Story,
  memories: Gallery,
  party: Gallery,
  rsvp: Rsvp,
  dedications: Dedications,
  footer: Footer,
};

// Aplica tema, tipografías y metadatos del documento.
export function useSiteTheme(data) {
  const vars = useMemo(() => themeVars(data?.theme), [data?.theme]);
  useEffect(() => {
    if (!data?.theme) return;
    const t = data.theme;
    loadGoogleFonts([t.fontTitle, t.fontScript, t.fontSubtitle, t.fontBody]);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', t.backgroundColor);
  }, [data?.theme]);
  useEffect(() => {
    if (!data?.site) return;
    document.title = data.site.siteTitle || data.site.quinceaneraName;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'description';
      document.head.appendChild(meta);
    }
    meta.content = data.site.metaDescription || '';
  }, [data?.site]);
  return vars;
}

export default function InvitationPage() {
  const { data, error, reload } = useLiveInvitation();
  const preview = useMemo(() => new URLSearchParams(window.location.search).has('preview'), []);
  const [opened, setOpened] = useState(preview);
  const rootRef = useRef(null);
  const music = useRef(null);
  const vars = useSiteTheme(data);

  useReveal(rootRef, [Boolean(data)]);

  const sections = data?.sections || [];
  const coverFirst = sections[0]?.key === 'cover';
  const locked = Boolean(data) && coverFirst && !opened;

  // La portada bloquea el desplazamiento hasta presionar "Abrir invitación".
  useEffect(() => {
    document.documentElement.classList.toggle('xv-locked', locked);
    return () => document.documentElement.classList.remove('xv-locked');
  }, [locked]);

  // Vista previa dentro del CMS: el panel pide desplazarse a la sección que se edita.
  useEffect(() => {
    if (!preview) return undefined;
    const onMessage = (e) => {
      if (e.origin !== window.location.origin || e.data?.type !== 'xv:scroll-to') return;
      document.getElementById(`s-${e.data.key}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [preview]);

  function open() {
    setOpened(true);
    music.current?.play();
    setTimeout(() => {
      document.getElementById('after-cover')?.scrollIntoView({ behavior: 'smooth' });
    }, 900);
  }

  if (!data) {
    return (
      <div className="app-loader" role="status" aria-live="polite">
        {error ? (
          <div className="app-loader__error">
            <p>{error.message}</p>
            <button type="button" className="btn" onClick={reload}>
              Reintentar
            </button>
          </div>
        ) : (
          <span className="app-loader__ring" />
        )}
      </div>
    );
  }

  const animations = data.theme?.animations !== false;
  const texts = data.site?.texts || {};

  return (
    <div id="top" ref={rootRef} className={`xv ${animations ? '' : 'no-anim'} ${opened ? 'is-opened' : ''}`} style={vars}>
      <NavMenu sections={sections} name={data.site?.quinceaneraName} visible={opened || !coverFirst} />
      {sections.map((section, index) => {
        if (section.key === 'cover') {
          return (
            <Fragment key={section.id}>
              <Cover section={section} data={data} opened={opened || index !== 0} onOpen={open} />
              <div id="after-cover" />
            </Fragment>
          );
        }
        const Component = COMPONENTS[section.key];
        return Component ? <Component key={section.id} section={section} data={data} /> : null;
      })}
      {data.music && <MusicPlayer ref={music} music={data.music} labels={{ play: texts.musicPlayLabel, pause: texts.musicPauseLabel }} />}
    </div>
  );
}
