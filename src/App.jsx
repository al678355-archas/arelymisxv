import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import InvitationPage from './site/InvitationPage.jsx';
import Loader from './components/Loader.jsx';
import { useBackendKeepAlive } from './hooks/useBackendKeepAlive.js';

// El panel y la página de subida se cargan por separado para que la invitación sea ligera.
const AdminApp = lazy(() => import('./admin/AdminApp.jsx'));
const UploadPhotoPage = lazy(() => import('./site/UploadPhotoPage.jsx'));

export default function App() {
  useBackendKeepAlive();
  return (
    <Suspense fallback={<Loader />}>
      <Routes>
        <Route path="/" element={<InvitationPage />} />
        <Route path="/subir-foto" element={<UploadPhotoPage />} />
        <Route path="/admin/*" element={<AdminApp />} />
        <Route path="*" element={<InvitationPage />} />
      </Routes>
    </Suspense>
  );
}
