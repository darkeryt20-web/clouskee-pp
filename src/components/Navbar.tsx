import {useState} from 'react';
import {Link, NavLink} from 'react-router-dom';
import {ArrowRight, ExternalLink, Menu, X} from 'lucide-react';

const LOGO_URL =
  'https://res.cloudinary.com/dz7jkt7gx/image/upload/v1794018458/Clous_Kee_Logo_BW_bektaf.png';
const DISCORD_URL = 'https://discord.gg/FDQrVXEdbK';

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const closeMobile = () => setMobileOpen(false);

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

  return (
    <header className="fixed top-4 sm:top-5 inset-x-0 z-50 px-4 flex flex-col items-center pointer-events-none">
      <nav
        aria-label="Primary navigation"
        className="pointer-events-auto w-full max-w-[780px] rounded-full bg-[rgba(20,12,35,0.75)] backdrop-blur-xl border border-purple-400/20 shadow-[0_8px_36px_rgba(7,3,13,0.75),inset_0_1px_0_rgba(255,255,255,0.06)] px-3.5 sm:px-5 py-2 flex items-center justify-between gap-4 sm:gap-6"
      >
        {/* Left: Brand Logo + Text */}
        <Link
          to="/"
          onClick={closeMobile}
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
          <NavLink to="/login" className={navLinkClass}>
            Login
          </NavLink>
        </div>

        {/* Right: CTA + Mobile Hamburger */}
        <div className="flex items-center gap-2 shrink-0">
          <Link
            to="/signup"
            className="hidden sm:inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 rounded-full bg-gradient-to-r from-[#5b21b6] via-[#7c3aed] to-[#6d28d9] hover:from-[#6d28d9] hover:to-[#8b5cf6] px-4 py-1.5 text-[12.5px] font-semibold text-white border border-purple-300/25 shadow-[0_0_20px_rgba(124,58,237,0.45)] hover:shadow-[0_0_28px_rgba(168,85,247,0.65)] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
          >
            <span>Sign Up Free</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </Link>

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
        </div>
      )}
    </header>
  );
}
