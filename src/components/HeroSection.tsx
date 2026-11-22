import {FormEvent, useRef, useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import {AlertCircle, ArrowRight, Sparkles} from 'lucide-react';
import {AstronautCharacter} from './AstronautCharacter';
import {
  sanitizeHandle,
  validateAndCheckUsername,
} from '../utils/usernameRegistry';

export function HeroSection() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [claimError, setClaimError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClaimSubmit = (e: FormEvent) => {
    e.preventDefault();
    const check = validateAndCheckUsername(username);

    if (!check.available) {
      setClaimError(check.message ?? 'Username is unavailable.');
      inputRef.current?.focus();
      return;
    }

    setClaimError(null);
    navigate(`/signup?handle=${encodeURIComponent(check.cleaned)}`);
  };

  return (
    <section
      id="home"
      className="relative flex flex-col items-center justify-center overflow-hidden px-4 sm:px-6 pt-32 sm:pt-36 pb-10 bg-[#07030d]"
    >
      {/* Atmospheric Radial Purple Glows */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div
          className="absolute top-[14%] left-1/2 -translate-x-1/2 w-[900px] h-[540px] rounded-full opacity-80 blur-[120px]"
          style={{
            background:
              'radial-gradient(circle, rgba(124, 58, 237, 0.24) 0%, rgba(88, 28, 135, 0.14) 45%, rgba(7, 3, 13, 0) 75%)',
          }}
        />
        <div
          className="absolute bottom-[4%] left-1/2 -translate-x-1/2 w-[620px] h-[280px] rounded-full opacity-70 blur-[110px]"
          style={{
            background:
              'radial-gradient(circle, rgba(168, 85, 247, 0.16) 0%, rgba(7, 3, 13, 0) 72%)',
          }}
        />
      </div>

      {/* Main Centered Hero Stack */}
      <div className="relative z-10 w-full max-w-3xl mx-auto flex flex-col items-center text-center">
        {/* Top Pill Badge */}
        <div className="inline-flex items-center gap-2 rounded-full bg-[#160b29]/90 border border-purple-500/35 px-4 py-1.5 text-xs sm:text-[13px] font-medium text-purple-100/95 shadow-[0_0_24px_rgba(139,92,246,0.18)] backdrop-blur-md">
          <span aria-hidden="true">✨</span>
          <span>Next-Gen Profile Pages &amp; Secure File Hosting</span>
          <span className="text-purple-400" aria-hidden="true">
            •
          </span>
          <span className="text-purple-300 font-semibold">v2.8 Live</span>
        </div>

        {/* Display Headline */}
        <h1 className="mt-8 text-[clamp(2.45rem,5.4vw,4.35rem)] font-extrabold tracking-[-0.03em] leading-[1.08] text-white text-balance">
          Everything you want,
          <br />
          <span className="bg-gradient-to-r from-[#a855f7] via-[#9333ea] to-[#c084fc] bg-clip-text text-transparent">
            right here
          </span>
          <span className="text-white">.</span>
        </h1>

        {/* Subheadline */}
        <p className="mt-6 max-w-xl text-base sm:text-[17px] leading-relaxed text-[#b2abc4] font-normal">
          Clouskee PP is your go-to for modern, feature-rich link-in-bio pages
          and fast, secure file hosting.
        </p>

        {/* Primary & Secondary CTAs + Perched 3D Astronaut */}
        <div className="mt-16 sm:mt-20 flex flex-wrap items-center justify-center gap-4">
          <div className="relative inline-flex">
            <AstronautCharacter />
            <Link
              to="/signup"
              className="relative inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#6d28d9] via-[#7c3aed] to-[#6d28d9] hover:from-[#7c3aed] hover:to-[#9333ea] pl-9 pr-7 py-3.5 text-[15px] font-semibold text-white border border-purple-300/25 shadow-[0_0_32px_rgba(139,92,246,0.48),inset_0_1px_0_rgba(255,255,255,0.22)] hover:shadow-[0_0_42px_rgba(168,85,247,0.72)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
            >
              <span>Sign Up Free</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>

          <Link
            to="/pricing"
            className="inline-flex items-center justify-center rounded-full bg-[#130b22]/90 hover:bg-[#1c1133] border border-purple-400/25 hover:border-purple-400/45 px-7 py-3.5 text-[15px] font-semibold text-slate-100 shadow-[0_4px_20px_rgba(7,3,13,0.65)] hover:-translate-y-0.5 transition-all duration-200 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
          >
            View Pricing
          </Link>
        </div>

        {/* Username Claim Input Bar */}
        <form
          onSubmit={handleClaimSubmit}
          noValidate
          className="mt-12 w-full max-w-[490px] flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3"
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
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#7c3aed] via-[#9333ea] to-[#a855f7] hover:brightness-110 px-6 py-3 text-sm font-semibold text-white shadow-[0_0_26px_rgba(168,85,247,0.45),inset_0_1px_0_rgba(255,255,255,0.25)] hover:shadow-[0_0_34px_rgba(168,85,247,0.68)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
          >
            <span>Claim Now</span>
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </form>

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
    </section>
  );
}
