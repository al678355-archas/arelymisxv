import { useEffect, useMemo, useRef, useState } from 'react';
import { useLiveInvitation } from '../hooks/useLiveInvitation.js';
import { useReveal } from '../hooks/useReveal.js';
import { useStage } from '../hooks/useStage.js';
import { useEditorBridge } from '../hooks/useEditorBridge.js';
import { themeVars, loadGoogleFonts } from '../lib/theme.js';
import { applyFavicon } from '../lib/image.js';
import Cover from './sections/Cover.jsx';
import { Intro, Message, People, Countdown } from './sections/TextSections.jsx';
import { Calendar, Venue, Itinerary, DressCode, Story } from './sections/EventSections.jsx';
import { Gallery, Rsvp, Dedications, Footer } from './sections/InteractiveSections.jsx';
import MusicPlayer from './components/MusicPlayer.jsx';
import NavMenu from './components/NavMenu.jsx';
import StageNav from './components/StageNav.jsx';
import Loader, { rememberLoaderLook } from '../components/Loader.jsx';
import '../styles/site.css';
import '../styles/stage.css';
import '../styles/look.css';

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
  const faviconSrc = data?.site?.favicon?.url || '';
  useEffect(() => {
    if (data) applyFavicon(faviconSrc);
  }, [data, faviconSrc]);
  useEffect(() => {
    if (data) rememberLoaderLook(data);
  }, [data]);
  return vars;
}

export default function InvitationPage() {
  const { data: liveData, error, reload } = useLiveInvitation();
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const preview = params.has('preview');
  // Editor visual del CMS: todas las secciones visibles y seleccionables con clic.
  const editor = preview && params.has('editor');
  const hashKey = useMemo(() => window.location.hash.replace(/^#s-/, ''), []);
  const [opened, setOpened] = useState(preview);
  const rootRef = useRef(null);
  const music = useRef(null);
  const { data } = useEditorBridge(liveData, editor, rootRef);
  const vars = useSiteTheme(data);
  const [loaderGone, setLoaderGone] = useState(false);
  const ready = Boolean(data);

  // La pantalla de carga se desvanece sobre la invitación ya lista y luego se retira.
  useEffect(() => {
    if (!ready) return undefined;
    const t = setTimeout(() => setLoaderGone(true), 900);
    return () => clearTimeout(t);
  }, [ready]);

  const sections = data?.sections || [];
  const coverFirst = sections[0]?.key === 'cover';
  const stageMode = ready && !editor && data.theme?.navigationMode !== 'scroll';
  const animations = data?.theme?.animations !== false;
  const stage = useStage({ sections, enabled: stageMode, animate: animations });
  const { goTo, goToKey, jump, next, prev } = stage;
  const locked = ready && !stageMode && coverFirst && !opened;
  const navVisible = opened || !coverFirst;

  // Modo continuo: animaciones al hacer scroll. Modo por secciones: las controla useStage.
  useReveal(rootRef, [ready, stageMode], !stageMode);

  // Modo continuo: la portada bloquea el desplazamiento hasta presionar "Abrir invitación".
  useEffect(() => {
    document.documentElement.classList.toggle('xv-locked', locked);
    return () => document.documentElement.classList.remove('xv-locked');
  }, [locked]);

  // Enlace directo a una sección (#s-clave) cuando no hay portada que abrir.
  useEffect(() => {
    if (!stageMode || coverFirst || !hashKey) return;
    const i = sections.findIndex((x) => x.key === hashKey);
    if (i > 0) jump(i);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stageMode]);

  // Vista previa dentro del CMS: el panel pide mostrar la sección que se edita.
  useEffect(() => {
    if (!preview) return undefined;
    const onMessage = (e) => {
      if (e.origin !== window.location.origin || e.data?.type !== 'xv:scroll-to') return;
      if (stageMode) goToKey(e.data.key);
      else document.getElementById(`s-${e.data.key}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [preview, stageMode, goToKey]);

  // Teclado (flechas) y deslizamiento lateral en celulares.
  useEffect(() => {
    if (!stageMode || !navVisible) return undefined;
    const blocked = (target, extra = '') =>
      Boolean(target?.closest?.(`input, textarea, select, [contenteditable], .lightbox${extra}`) || document.querySelector('.lightbox'));
    const onKey = (e) => {
      if (blocked(e.target) || e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };
    let start = null;
    const onStart = (e) => {
      // La barra del menú se desliza horizontalmente: ahí no se cambia de sección.
      start = blocked(e.target, ', .stage-nav, .stage-panel') ? null : { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };
    const onEnd = (e) => {
      if (!start) return;
      const dx = e.changedTouches[0].clientX - start.x;
      const dy = e.changedTouches[0].clientY - start.y;
      start = null;
      if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.6) {
        if (dx < 0) next();
        else prev();
      }
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('touchstart', onStart, { passive: true });
    document.addEventListener('touchend', onEnd, { passive: true });
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('touchstart', onStart);
      document.removeEventListener('touchend', onEnd);
    };
  }, [stageMode, navVisible, next, prev]);

  function open() {
    setOpened(true);
    music.current?.play();
    if (stageMode) {
      const fromHash = sections.findIndex((x) => x.key === hashKey);
      setTimeout(() => goTo(fromHash > 0 ? fromHash : 1), 650);
    } else {
      setTimeout(() => {
        document.getElementById('after-cover')?.scrollIntoView({ behavior: 'smooth' });
      }, 900);
    }
  }

  const texts = data?.site?.texts || {};
  // Mismo lugar en el árbol antes y después de cargar: así el loader se desvanece con transición.
  const loader = !loaderGone && <Loader done={ready} error={ready ? null : error} onRetry={reload} />;
  if (!data) return <>{null}{loader}</>;

  const name = data.site?.quinceaneraName;
  const rootClass = ['xv', `xv--photo-${data.theme?.photoRatio || 'square'}`, stageMode && 'xv--stage', editor && 'xv--editor', !animations && 'no-anim', opened && 'is-opened', navVisible && 'has-nav'].filter(Boolean).join(' ');

  return (
    <>
      <div id="top" ref={rootRef} className={rootClass} style={vars}>
        {stageMode
          ? navVisible && <StageNav sections={sections} current={stage.target} onSelect={goTo} onPrev={prev} onNext={next} name={name} adminLabel={texts.adminLinkText} />
          : !editor && <NavMenu sections={sections} name={name} visible={navVisible} adminLabel={texts.adminLinkText} />}
        {sections.map((section, index) => {
          const isCover = section.key === 'cover';
          const Component = COMPONENTS[section.key];
          if (!isCover && !Component) return null;
          return (
            <div key={section.id} ref={stage.slideRef(section.key)} className="stage-slide" hidden={stageMode && index !== stage.active}>
              {isCover ? (
                <>
                  <Cover section={section} data={data} opened={opened || index !== 0} onOpen={open} onNext={stageMode ? next : undefined} />
                  {!stageMode && <div id="after-cover" />}
                </>
              ) : (
                <Component section={section} data={data} />
              )}
            </div>
          );
        })}
        {data.music && (
          <MusicPlayer
            ref={music}
            music={data.music}
            allowAutoplay={!preview}
            labels={{ play: texts.musicPlayLabel, pause: texts.musicPauseLabel, listen: texts.musicListenLabel }}
          />
        )}
      </div>
      {loader}
    </>
  );
}
