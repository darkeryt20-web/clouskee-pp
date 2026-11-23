import {useEffect, useRef, useState} from 'react';
import {Link, NavLink, useNavigate} from 'react-router-dom';
import {
  ArrowRight,
  ChevronDown,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  User,
  X,
} from 'lucide-react';
import {useAuth} from '../context/AuthContext';
import {auth} from '../lib/firebase';
import {verifyAdminAccessInSupabase} from '../lib/supabase';
import {sanitizeExternalUrl} from '../lib/domain';

const LOGO_URL =
  'https://res.cloudinary.com/dz7jkt7gx/image/upload/v1794018458/Clous_Kee_Logo_BW_bektaf.png';
const DISCORD_URL = 'https://discord.gg/FDQrVXEdbK';

export function Navbar() {
  const navigate = useNavigate();
  const {activeProfile, firebaseUser, signOut} = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [verifiedIsAdmin, setVerifiedIsAdmin] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const closeMobile = () => setMobileOpen(false);
  const closeAccountMenu = () => setAccountMenuOpen(false);

  useEffect(() => {
    if (!accountMenuOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setAccountMenuOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setAccountMenuOpen(false);
    };
    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [accountMenuOpen]);

  useEffect(() => {
    if (!activeProfile) {
      setVerifiedIsAdmin(false);
      return;
    }

    const verifiedFirebaseUid =
      auth?.currentUser?.uid ??
      firebaseUser?.uid ??
      activeProfile.firebase_uid ??
      null;
    const verifiedDiscordId = activeProfile.discord_id ?? null;

    if (!verifiedFirebaseUid && !verifiedDiscordId) {
      setVerifiedIsAdmin(false);
      return;
    }

    let cancelled = false;
    verifyAdminAccessInSupabase({
      firebaseUid: verifiedFirebaseUid,
      discordId: verifiedDiscordId,
    })
      .then((res) => {
        if (!cancelled) {
          setVerifiedIsAdmin(res.isAdmin === true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setVerifiedIsAdmin(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    activeProfile,
    activeProfile?.firebase_uid,
    activeProfile?.discord_id,
    firebaseUser?.uid,
  ]);

  const safeAvatar = sanitizeExternalUrl(activeProfile?.avatar_url);
  const displayHandle =
    activeProfile?.global_name ||
    (activeProfile ? `@${activeProfile.username}` : '');

  const navLinkClass = ({isActive}: {isActive: boolean}) =>
    `whitespace-nowrap shrink-0 transition-colors duration-150 focus-visible:outline-none focus-visible:text-white ${
      isActive ? 'text-white font-semibold' : 'text-slate-300 hover:text-white'
    }`;

  const mobileLinkClass = ({isActive}: {isActive: boolean}) =>
    `px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
      isActive
        ? 'bg-purple-500/20 text-white'
        : 'text-slate-200 hover:text-white hover:bg-purple-500/15'
    }`;

  const handleSignOut = async () => {
    closeMobile();
    closeAccountMenu();
    await signOut();
    navigate('/');
  };

  return (
    <header className="fixed top-4 sm:top-5 inset-x-0 z-50 px-4 flex flex-col items-center pointer-events-none">
      <nav
        aria-label="Primary navigation"
        className="pointer-events-auto w-full max-w-[780px] rounded-full bg-[rgba(20,12,35,0.75)] backdrop-blur-xl border border-purple-400/20 shadow-[0_8px_36px_rgba(7,3,13,0.75),inset_0_1px_0_rgba(255,255,255,0.06)] px-3.5 sm:px-5 py-2 flex items-center justify-between gap-4 sm:gap-6"
      >
        {/* Left: Brand Logo + Text */}
        <Link
          to="/"
          onClick={() => {
            closeMobile();
            closeAccountMenu();
          }}
          className="flex items-center gap-2.5 shrink-0 whitespace-nowrap group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 rounded-full pr-1"
        >
          {!logoError ? (
            <img
              src={LOGO_URL}
              alt="Clouskee PP logo"
              referrerPolicy="no-referrer"
              onError={() => setLogoError(true)}
              className="w-7 h-7 object-contain rounded-md transition-transform duration-200 group-hover:scale-105"
            />
          ) : (
            <span
              aria-hidden="true"
              className="w-7 h-7 rounded-md bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center text-white text-xs font-extrabold shadow-inner"
            >
              C
            </span>
          )}
          <span className="text-[15px] font-bold tracking-tight text-white">
            Clouskee{' '}
            <span className="text-[#a855f7] font-extrabold">PP</span>
          </span>
        </Link>

        {/* Center Links (Desktop) */}
        <div className="hidden md:flex items-center gap-5 text-[13px] font-medium">
          <NavLink to="/" end className={navLinkClass}>
            Home
          </NavLink>
          <a
            href={DISCORD_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 whitespace-nowrap shrink-0 text-slate-300 hover:text-white transition-colors duration-150 focus-visible:outline-none focus-visible:text-white"
          >
            <span>Discord</span>
            <ExternalLink className="w-3 h-3 text-slate-400" aria-hidden="true" />
          </a>
          <NavLink to="/compare" className={navLinkClass}>
            Compare
          </NavLink>
          <NavLink to="/leaderboard" className={navLinkClass}>
            Leaderboard
          </NavLink>
          <NavLink to="/pricing" className={navLinkClass}>
            Pricing
          </NavLink>
          {!activeProfile && (
            <NavLink to="/login" className={navLinkClass}>
              Login
            </NavLink>
          )}
        </div>

        {/* Right: Auth CTA or Logged-In User Dropdown + Mobile Hamburger */}
        <div className="flex items-center gap-2 shrink-0">
          {activeProfile ? (
            <div ref={dropdownRef} className="relative hidden sm:block">
              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={accountMenuOpen}
                onClick={() => setAccountMenuOpen((prev) => !prev)}
                className="inline-flex items-center gap-2 whitespace-nowrap shrink-0 rounded-full bg-[#1a0f30] hover:bg-[#241542] border border-purple-400/35 pl-1.5 pr-3 py-1 text-[12.5px] font-semibold text-white transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
              >
                {safeAvatar ? (
                  <img
                    src={safeAvatar}
                    alt={activeProfile.username}
                    referrerPolicy="no-referrer"
                    className="w-6 h-6 rounded-full object-cover"
                  />
                ) : (
                  <span className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-white" />
                  </span>
                )}
                <span className="max-w-[120px] truncate">{displayHandle}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-purple-300 transition-transform duration-150 ${
                    accountMenuOpen ? 'rotate-180' : ''
                  }`}
                  aria-hidden="true"
                />
              </button>

              {accountMenuOpen && (
                <div
                  role="menu"
                  aria-label="Account navigation"
                  className="absolute right-0 mt-2.5 w-52 rounded-2xl bg-[rgba(17,10,30,0.97)] backdrop-blur-xl border border-purple-400/25 shadow-[0_18px_45px_rgba(7,3,13,0.9)] p-1.5"
                >
                  <div className="px-3 py-2 border-b border-purple-500/15 mb-1">
                    <p className="text-xs font-semibold text-white truncate">
                      {activeProfile.global_name || activeProfile.username}
                    </p>
                    <p className="font-mono text-[11px] text-purple-300 truncate">
                      @{activeProfile.username}
                    </p>
                  </div>

                  <Link
                    role="menuitem"
                    to={`/${encodeURIComponent(activeProfile.username)}`}
                    onClick={closeAccountMenu}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-200 hover:text-white hover:bg-purple-500/20 transition-colors"
                  >
                    <User className="w-3.5 h-3.5 text-purple-300" />
                    <span>Visit Profile Page</span>
                  </Link>

                  <Link
                    role="menuitem"
                    to="/dashboard"
                    onClick={closeAccountMenu}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-200 hover:text-white hover:bg-purple-500/20 transition-colors"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5 text-purple-300" />
                    <span>Dashboard</span>
                  </Link>

                  {verifiedIsAdmin && (
                    <Link
                      role="menuitem"
                      to="/admin"
                      onClick={closeAccountMenu}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-amber-200 hover:text-white hover:bg-amber-500/15 transition-colors"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                      <span>Admin Panel</span>
                    </Link>
                  )}

                  <div className="h-px bg-purple-500/15 my-1" />

                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-rose-300 hover:text-rose-200 hover:bg-rose-500/15 transition-colors cursor-pointer text-left"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/signup"
              className="hidden sm:inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 rounded-full bg-gradient-to-r from-[#5b21b6] via-[#7c3aed] to-[#6d28d9] hover:from-[#6d28d9] hover:to-[#8b5cf6] px-4 py-1.5 text-[12.5px] font-semibold text-white border border-purple-300/25 shadow-[0_0_20px_rgba(124,58,237,0.45)] hover:shadow-[0_0_28px_rgba(168,85,247,0.65)] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
            >
              <span>Sign Up Free</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          )}

          <button
            type="button"
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((prev) => !prev)}
            className="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-full text-slate-200 hover:text-white hover:bg-purple-500/15 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
          >
            {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </nav>

      {/* Mobile Dropdown Menu */}
      {mobileOpen && (
        <div className="pointer-events-auto md:hidden mt-2.5 w-full max-w-[440px] rounded-2xl bg-[rgba(17,10,30,0.95)] backdrop-blur-xl border border-purple-400/20 shadow-[0_16px_40px_rgba(7,3,13,0.85)] p-4 flex flex-col gap-1.5">
          <NavLink to="/" end onClick={closeMobile} className={mobileLinkClass}>
            Home
          </NavLink>
          <a
            href={DISCORD_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={closeMobile}
            className="px-3 py-2.5 rounded-xl text-sm font-medium text-slate-200 hover:text-white hover:bg-purple-500/15 transition-colors flex items-center justify-between"
          >
            <span>Discord</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
          </a>
          <NavLink to="/compare" onClick={closeMobile} className={mobileLinkClass}>
            Compare
          </NavLink>
          <NavLink to="/leaderboard" onClick={closeMobile} className={mobileLinkClass}>
            Leaderboard
          </NavLink>
          <NavLink to="/pricing" onClick={closeMobile} className={mobileLinkClass}>
            Pricing
          </NavLink>
          <div className="h-px bg-purple-400/15 my-1.5" />
          {activeProfile ? (
            <div className="flex flex-col gap-2 pt-1">
              <Link
                to={`/${encodeURIComponent(activeProfile.username)}`}
                onClick={closeMobile}
                className="flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white"
              >
                <User className="w-4 h-4" />
                <span>Visit Profile Page</span>
              </Link>
              <div className="flex items-center gap-2">
                <Link
                  to="/dashboard"
                  onClick={closeMobile}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-purple-400/25 bg-purple-950/35 px-4 py-2.5 text-sm font-medium text-slate-200 hover:text-white"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="rounded-xl border border-rose-400/25 bg-rose-950/30 px-4 py-2.5 text-sm font-medium text-rose-200 hover:text-white cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
              {verifiedIsAdmin && (
                <Link
                  to="/admin"
                  onClick={closeMobile}
                  className="flex items-center justify-center gap-2 rounded-xl border border-amber-400/35 bg-amber-500/15 px-4 py-2.5 text-sm font-semibold text-amber-200 hover:text-white"
                >
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>Admin Panel</span>
                </Link>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 pt-1">
              <Link
                to="/login"
                onClick={closeMobile}
                className="flex-1 text-center rounded-xl border border-purple-400/20 bg-purple-950/30 px-4 py-2.5 text-sm font-medium text-slate-200 hover:text-white hover:bg-purple-900/40 transition-colors"
              >
                Login
              </Link>
              <Link
                to="/signup"
                onClick={closeMobile}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#6d28d9] to-[#8b5cf6] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_20px_rgba(139,92,246,0.4)]"
              >
                <span>Sign Up Free</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
