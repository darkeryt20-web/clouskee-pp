import {FormEvent, useRef, useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  Compass,
  ExternalLink,
  LayoutDashboard,
  Loader2,
  Sparkles,
  User,
} from 'lucide-react';
import {motion, useReducedMotion} from 'motion/react';
import {useAuth} from '../context/AuthContext';
import {AstronautCharacter} from './AstronautCharacter';
import {Hero3DProfileShowcase} from './Hero3DProfileShowcase';
import {
  checkUsernameAvailability,
  sanitizeHandle,
} from '../utils/usernameRegistry';

export function HeroSection() {
  const navigate = useNavigate();
  const {activeProfile} = useAuth();
  const prefersReducedMotion = useReducedMotion();
  const [username, setUsername] = useState('');
  const [checking, setChecking] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClaimSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (checking) return;

    setChecking(true);
    setClaimError(null);
    try {
      const check = await checkUsernameAvailability(username);
      if (!check.available) {
        setClaimError(check.message ?? 'Username is already taken');
        inputRef.current?.focus();
        return;
      }
      navigate(
        `/signup?handle=${encodeURIComponent(check.cleaned)}&verified=1`,
      );
    } finally {
      setChecking(false);
    }
  };

  const reveal = (delay = 0) =>
    prefersReducedMotion
      ? {}
      : {
          initial: {opacity: 0, y: 18},
          animate: {opacity: 1, y: 0},
          transition: {duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] as const},
        };

  return (
    <section
      id="home"
      className="relative overflow-hidden px-4 sm:px-6 pt-32 sm:pt-36 pb-14 sm:pb-16 bg-[#07030d]"
    >
      {/* Ambient Grid, Starfield & Glowing Mesh Orbs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute inset-0 bg-cyber-grid opacity-55 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_78%)]" />
        <div className="absolute -inset-6 bg-starfield opacity-75 animate-starfield-drift [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_85%)]" />

        <div
          className="absolute -top-12 left-[18%] w-[560px] h-[440px] rounded-full opacity-75 blur-[120px] animate-orb-drift"
          style={{
            background:
              'radial-gradient(circle, rgba(124, 58, 237, 0.28) 0%, rgba(88, 28, 135, 0.12) 48%, rgba(7, 3, 13, 0) 75%)',
          }}
        />
        <div
          className="absolute top-[18%] right-[6%] w-[480px] h-[420px] rounded-full opacity-65 blur-[120px] animate-orb-drift-reverse"
          style={{
            background:
              'radial-gradient(circle, rgba(192, 132, 252, 0.22) 0%, rgba(236, 72, 153, 0.09) 50%, rgba(7, 3, 13, 0) 75%)',
          }}
        />
      </div>

      {/* Main Responsive Hero Grid */}
      <div className="relative z-10 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
        {/* Left Column: Copy, Auth-Aware CTAs & Username Claim */}
        <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left">
          <motion.p
            {...reveal(0)}
            className="text-[11px] sm:text-xs font-mono font-semibold uppercase tracking-[0.22em] text-purple-300/90"
          >
            Next-Gen Link-in-Bio &amp; Media Hosting
          </motion.p>

          <motion.h1
            {...reveal(0.06)}
            className="mt-5 text-[clamp(2.4rem,5vw,4.25rem)] font-extrabold tracking-[-0.03em] leading-[1.07] text-white text-balance"
          >
            Everything you want,
            <br />
            <span className="bg-gradient-to-r from-[#a855f7] via-[#c084fc] to-[#e879f9] bg-clip-text text-transparent">
              right here
            </span>
            <span className="text-white">.</span>
          </motion.h1>

          <motion.p
            {...reveal(0.12)}
            className="mt-5 max-w-xl text-base sm:text-[17px] leading-relaxed text-[#b2abc4] font-normal"
          >
            Clouskee PP brings custom glassmorphism profiles, 5-style music
            players, interactive cursors, and direct media uploads into one
            sleek creator link.
          </motion.p>

          {/* Auth-Aware Primary & Secondary CTAs + Perched 3D Astronaut */}
          <motion.div
            {...reveal(0.18)}
            className="mt-14 sm:mt-16 flex flex-wrap items-center justify-center lg:justify-start gap-3.5"
          >
            {activeProfile ? (
              <>
                <div className="relative inline-flex">
                  <AstronautCharacter />
                  <Link
                    to="/dashboard"
                    className="relative inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#6d28d9] via-[#7c3aed] to-[#6d28d9] hover:from-[#7c3aed] hover:to-[#9333ea] pl-9 pr-7 py-3.5 text-[15px] font-semibold text-white border border-purple-300/25 shadow-[0_0_32px_rgba(139,92,246,0.48),inset_0_1px_0_rgba(255,255,255,0.22)] hover:shadow-[0_0_42px_rgba(168,85,247,0.72)] hover:-translate-y-0.5 active:scale-[0.97] transition-all duration-200 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
                  >
                    <LayoutDashboard className="w-4 h-4" aria-hidden="true" />
                    <span>Dashboard</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </Link>
                </div>

                <a
                  href={`/${encodeURIComponent(activeProfile.username)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#130b22]/90 hover:bg-[#1c1133] border border-purple-400/25 hover:border-purple-400/45 px-6 py-3.5 text-[15px] font-semibold text-slate-100 shadow-[0_4px_20px_rgba(7,3,13,0.65)] hover:-translate-y-0.5 active:scale-[0.97] transition-all duration-200 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
                >
                  <User className="w-4 h-4 text-purple-300" aria-hidden="true" />
                  <span>Visit Profile</span>
                  <ExternalLink
                    className="w-3.5 h-3.5 text-purple-300"
                    aria-hidden="true"
                  />
                </a>

                <a
                  href="#features"
                  className="inline-flex items-center justify-center gap-1.5 rounded-full bg-transparent hover:bg-purple-500/10 border border-purple-500/25 px-5 py-3.5 text-[14px] font-semibold text-purple-200 hover:text-white active:scale-[0.97] transition-all duration-200 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
                >
                  <Compass className="w-4 h-4 text-purple-300" aria-hidden="true" />
                  <span>Explore</span>
                </a>
              </>
            ) : (
              <>
                <div className="relative inline-flex">
                  <AstronautCharacter />
                  <Link
                    to="/signup"
                    className="relative inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#6d28d9] via-[#7c3aed] to-[#6d28d9] hover:from-[#7c3aed] hover:to-[#9333ea] pl-9 pr-7 py-3.5 text-[15px] font-semibold text-white border border-purple-300/25 shadow-[0_0_32px_rgba(139,92,246,0.48),inset_0_1px_0_rgba(255,255,255,0.22)] hover:shadow-[0_0_42px_rgba(168,85,247,0.72)] hover:-translate-y-0.5 active:scale-[0.97] transition-all duration-200 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
                  >
                    <span>Get Started</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </Link>
                </div>

                <Link
                  to="/login"
                  className="inline-flex items-center justify-center rounded-full bg-[#130b22]/90 hover:bg-[#1c1133] border border-purple-400/25 hover:border-purple-400/45 px-7 py-3.5 text-[15px] font-semibold text-slate-100 shadow-[0_4px_20px_rgba(7,3,13,0.65)] hover:-translate-y-0.5 active:scale-[0.97] transition-all duration-200 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
                >
                  Login
                </Link>

                <a
                  href="#features"
                  className="inline-flex items-center justify-center gap-1.5 rounded-full bg-transparent hover:bg-purple-500/10 border border-purple-500/25 px-5 py-3.5 text-[14px] font-semibold text-purple-200 hover:text-white active:scale-[0.97] transition-all duration-200 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
                >
                  <Compass className="w-4 h-4 text-purple-300" aria-hidden="true" />
                  <span>Explore</span>
                </a>
              </>
            )}
          </motion.div>

          {/* Username Claim Input Bar */}
          <motion.form
            {...reveal(0.24)}
            onSubmit={handleClaimSubmit}
            noValidate
            className="mt-9 w-full max-w-[490px] flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-3"
          >
            <label className="sr-only" htmlFor="claim-username-input">
              Claim your Clouskee PP username
            </label>
            <div className="flex-1 flex items-center rounded-xl bg-[#0d0717]/95 border border-purple-500/30 focus-within:border-purple-400/75 focus-within:shadow-[0_0_24px_rgba(139,92,246,0.22)] px-4 py-3 transition-all duration-200">
              <span className="font-mono text-sm font-medium text-[#a855f7] select-none shrink-0">
                clouskee.pp/
              </span>
              <input
                ref={inputRef}
                id="claim-username-input"
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(sanitizeHandle(e.target.value));
                  if (claimError) setClaimError(null);
                }}
                placeholder="yourname"
                autoComplete="off"
                spellCheck={false}
                className="w-full min-w-0 bg-transparent pl-1 font-mono text-sm text-white placeholder:text-slate-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={checking}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#7c3aed] via-[#9333ea] to-[#a855f7] hover:brightness-110 disabled:opacity-70 px-6 py-3 text-sm font-semibold text-white shadow-[0_0_26px_rgba(168,85,247,0.45),inset_0_1px_0_rgba(255,255,255,0.25)] hover:shadow-[0_0_34px_rgba(168,85,247,0.68)] hover:-translate-y-0.5 active:scale-[0.97] transition-all duration-200 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
            >
              {checking ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Checking...</span>
                </>
              ) : (
                <>
                  <span>Claim Now</span>
                  <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                </>
              )}
            </button>
          </motion.form>

          {/* Inline Taken / Validation Error */}
          {claimError && (
            <div
              role="status"
              aria-live="polite"
              className="mt-3.5 inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs sm:text-sm font-medium border bg-rose-950/40 border-rose-500/35 text-rose-200"
            >
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{claimError}</span>
            </div>
          )}
        </div>

        {/* Right Column: 3D Floating Layered Profile Card Showcase */}
        <div className="lg:col-span-5">
          <Hero3DProfileShowcase />
        </div>
      </div>
    </section>
  );
}
