import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveInvitation } from '../hooks/useLiveInvitation.js';
import { useSiteTheme } from './InvitationPage.jsx';
import PhotoUploadForm from './components/PhotoUploadForm.jsx';
import { Petals, Sparkles } from './components/Decorations.jsx';
import Icon from './components/Icon.jsx';
import Loader from '../components/Loader.jsx';
import '../styles/site.css';

// Página a la que dirige el QR: subir fotos durante la fiesta (y recuerdos si está habilitado).
export default function UploadPhotoPage() {
  const { data, error, reload } = useLiveInvitation();
  const vars = useSiteTheme(data);
  const partyOpen = Boolean(data?.site?.partyUploadsEnabled);
  const memoryOpen = Boolean(data?.site?.memoryUploadsEnabled);
  const [tab, setTab] = useState('party');

  useEffect(() => {
    if (!data) return;
    if (tab === 'party' && !partyOpen && memoryOpen) setTab('memory');
    if (tab === 'memory' && !memoryOpen && partyOpen) setTab('party');
  }, [data, partyOpen, memoryOpen, tab]);

  if (!data) return <Loader error={error} onRetry={reload} />;

  const texts = data.site.texts || {};
  const section = (key) => data.sections.find((s) => s.key === key)?.content || {};
  const content = tab === 'party' ? section('party') : section('memories');
  const anyOpen = partyOpen || memoryOpen;

  return (
    <div className="xv upload-page" style={vars}>
      {data.theme?.decorations !== false && (
        <>
          <Petals count={10} />
          <Sparkles count={14} />
        </>
      )}
      <main className="upload-page__card card">
        <p className="cover__eyebrow">{data.site.quinceaneraName}</p>
        <h1 className="upload-page__title">{texts.uploadPageTitle}</h1>
        {anyOpen ? (
          <>
            {texts.uploadPageSubtitle && <p className="upload-page__subtitle">{texts.uploadPageSubtitle}</p>}
            {partyOpen && memoryOpen && (
              <div className="tabs" role="tablist">
                <button type="button" role="tab" aria-selected={tab === 'party'} className={tab === 'party' ? 'is-active' : ''} onClick={() => setTab('party')}>
                  {texts.uploadPartyTab}
                </button>
                <button type="button" role="tab" aria-selected={tab === 'memory'} className={tab === 'memory' ? 'is-active' : ''} onClick={() => setTab('memory')}>
                  {texts.uploadMemoryTab}
                </button>
              </div>
            )}
            <PhotoUploadForm key={tab} type={tab} content={content} />
          </>
        ) : (
          <p className="empty-note">{texts.uploadClosedText}</p>
        )}
        <Link to="/" className="link-btn upload-page__back">
          <Icon name="heart" size={16} /> {texts.uploadBackLink}
        </Link>
      </main>
    </div>
  );
}
