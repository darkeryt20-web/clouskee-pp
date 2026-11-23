import {lazy, Suspense, useEffect} from 'react';
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';
import {AuthProvider} from './context/AuthContext';
import {Navbar} from './components/Navbar';
import {Footer} from './components/Footer';
import {LoadingSpinner} from './components/LoadingSpinner';
import {LazyErrorBoundary} from './components/LazyErrorBoundary';
import {AdminRoute} from './components/AdminRoute';

const HomePage = lazy(() =>
  import('./pages/HomePage').then((m) => ({default: m.HomePage})),
);
const ComparePage = lazy(() =>
  import('./pages/ComparePage').then((m) => ({default: m.ComparePage})),
);
const LeaderboardPage = lazy(() =>
  import('./pages/LeaderboardPage').then((m) => ({default: m.LeaderboardPage})),
);
const PricingPage = lazy(() =>
  import('./pages/PricingPage').then((m) => ({default: m.PricingPage})),
);
const AuthPage = lazy(() =>
  import('./pages/AuthPage').then((m) => ({default: m.AuthPage})),
);
const DiscordCallbackPage = lazy(() =>
  import('./pages/DiscordCallbackPage').then((m) => ({
    default: m.DiscordCallbackPage,
  })),
);
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));

function ScrollToTop() {
  const {pathname} = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function MainShellLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-[#07030d] text-white font-sans">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  useEffect(() => {
    try {
      window.sessionStorage.removeItem('clouskee_chunk_reload_retried');
    } catch {
      // Ignore sessionStorage restrictions
    }
  }, []);

  return (
    <BrowserRouter>
      <AuthProvider>
        <ScrollToTop />
        <LazyErrorBoundary>
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              {/* Standard Pages with Shared Navbar & Footer */}
              <Route element={<MainShellLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/compare" element={<ComparePage />} />
                <Route path="/leaderboard" element={<LeaderboardPage />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/login" element={<AuthPage mode="login" />} />
                <Route path="/signup" element={<AuthPage mode="signup" />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route
                  path="/admin"
                  element={
                    <AdminRoute>
                      <AdminPage />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/auth/discord/callback"
                  element={<DiscordCallbackPage />}
                />
                <Route
                  path="/auth/discord/callback/"
                  element={<DiscordCallbackPage />}
                />
              </Route>

              {/* Clean Standalone Profile Page (No Navbar, No Footer) */}
              <Route path="/:username" element={<ProfilePage />} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </LazyErrorBoundary>
      </AuthProvider>
    </BrowserRouter>
  );
}
