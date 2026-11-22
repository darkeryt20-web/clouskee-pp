import {useEffect} from 'react';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';
import {Navbar} from './components/Navbar';
import {Footer} from './components/Footer';
import {HomePage} from './pages/HomePage';
import {ComparePage} from './pages/ComparePage';
import {LeaderboardPage} from './pages/LeaderboardPage';
import {PricingPage} from './pages/PricingPage';
import {AuthPage} from './pages/AuthPage';

function ScrollToTop() {
  const {pathname} = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <div className="min-h-screen flex flex-col bg-[#07030d] text-white font-sans">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/compare" element={<ComparePage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/login" element={<AuthPage mode="login" />} />
            <Route path="/signup" element={<AuthPage mode="signup" />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}
