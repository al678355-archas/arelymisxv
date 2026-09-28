import { createContext, lazy, Suspense, useCallback, useContext, useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { api, getToken, setToken } from '../lib/api.js';
import { ToastProvider, ConfirmProvider, Loading } from './components/ui.jsx';
import Layout from './Layout.jsx';
import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import { PaletteProvider } from './palette.jsx';
import '../styles/admin.css';
import '../styles/admin-v2.css';

const InvitationSettingsPage = lazy(() => import('./pages/InvitationSettingsPage.jsx'));
const DesignPage = lazy(() => import('./pages/DesignPage.jsx'));
const SectionsPage = lazy(() => import('./pages/SectionsPage.jsx'));
const SectionEditorPage = lazy(() => import('./pages/SectionEditorPage.jsx'));
const MediaPage = lazy(() => import('./pages/MediaPage.jsx'));
const MusicPage = lazy(() => import('./pages/MusicPage.jsx'));
const ItineraryPage = lazy(() => import('./pages/ItineraryPage.jsx'));
const GuestsPage = lazy(() => import('./pages/GuestsPage.jsx'));
const FamiliesPage = lazy(() => import('./pages/FamiliesPage.jsx'));
const ConfirmationsPage = lazy(() => import('./pages/ConfirmationsPage.jsx'));
const SponsorsPage = lazy(() => import('./pages/SponsorsPage.jsx'));
const GalleryPage = lazy(() => import('./pages/GalleryPage.jsx'));
const DedicationsPage = lazy(() => import('./pages/DedicationsPage.jsx'));
const QrPage = lazy(() => import('./pages/QrPage.jsx'));
const SettingsPage = lazy(() => import('./pages/SettingsPage.jsx'));
const VisualEditorPage = lazy(() => import('./pages/VisualEditorPage.jsx'));
const PalettesPage = lazy(() => import('./pages/PalettesPage.jsx'));
const AdministratorsPage = lazy(() => import('./pages/AdministratorsPage.jsx'));
const ActivityPage = lazy(() => import('./pages/ActivityPage.jsx'));

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [checking, setChecking] = useState(Boolean(getToken()));

  const logout = useCallback(() => {
    setToken('');
    setAdmin(null);
  }, []);

  useEffect(() => {
    if (!getToken()) return;
    api
      .get('/api/auth/me')
      .then((res) => setAdmin(res.admin))
      .catch(() => logout())
      .finally(() => setChecking(false));
  }, [logout]);

  useEffect(() => {
    const onUnauthorized = () => setAdmin(null);
    window.addEventListener('xv:unauthorized', onUnauthorized);
    return () => window.removeEventListener('xv:unauthorized', onUnauthorized);
  }, []);

  const login = useCallback(async (username, password) => {
    const res = await api.post('/api/auth/login', { username, password }, { auth: false });
    setToken(res.token);
    setAdmin(res.admin);
  }, []);

  return <AuthContext.Provider value={{ admin, checking, login, logout }}>{children}</AuthContext.Provider>;
}

function Protected({ children }) {
  const { admin, checking } = useAuth();
  const location = useLocation();
  if (checking) return <Loading label="Verificando sesión…" />;
  if (!admin) return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  return children;
}

export default function AdminApp() {
  useEffect(() => {
    document.title = 'Panel · Invitación XV';
    document.documentElement.classList.remove('xv-locked');
  }, []);

  return (
    <AuthProvider>
      <ToastProvider>
        <PaletteProvider>
        <ConfirmProvider>
          <Routes>
            <Route path="login" element={<LoginPage />} />
            <Route
              path="*"
              element={
                <Protected>
                  <Layout>
                    <Suspense fallback={<Loading />}>
                      <Routes>
                        <Route index element={<DashboardPage />} />
                        <Route path="invitacion" element={<VisualEditorPage />} />
                        <Route path="evento" element={<InvitationSettingsPage />} />
                        <Route path="paletas" element={<PalettesPage />} />
                        <Route path="administrators" element={<AdministratorsPage />} />
                        <Route path="actividad" element={<ActivityPage />} />
                        <Route path="diseno" element={<DesignPage />} />
                        <Route path="secciones" element={<SectionsPage />} />
                        <Route path="secciones/:id" element={<SectionEditorPage />} />
                        <Route path="multimedia" element={<MediaPage />} />
                        <Route path="musica" element={<MusicPage />} />
                        <Route path="itinerario" element={<ItineraryPage />} />
                        <Route path="invitados" element={<GuestsPage />} />
                        <Route path="familias" element={<FamiliesPage />} />
                        <Route path="confirmaciones" element={<ConfirmationsPage />} />
                        <Route path="padrinos" element={<SponsorsPage />} />
                        <Route path="galeria-recuerdos" element={<GalleryPage type="memory" />} />
                        <Route path="galeria-fiesta" element={<GalleryPage type="party" />} />
                        <Route path="dedicatorias" element={<DedicationsPage />} />
                        <Route path="qr" element={<QrPage />} />
                        <Route path="configuracion" element={<SettingsPage />} />
                        <Route path="*" element={<Navigate to="/admin" replace />} />
                      </Routes>
                    </Suspense>
                  </Layout>
                </Protected>
              }
            />
          </Routes>
        </ConfirmProvider>
        </PaletteProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
