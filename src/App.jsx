import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import InvitationPage from './site/InvitationPage.jsx';

// El panel y la página de subida se cargan por separado para que la invitación sea ligera.
const AdminApp = lazy(() => import('./admin/AdminApp.jsx'));
const UploadPhotoPage = lazy(() => import('./site/UploadPhotoPage.jsx'));

function Loader() {
  return (
    <div className="app-loader" role="status" aria-live="polite">
      <span className="app-loader__ring" />
    </div>
  );
}

export default function App() {
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
