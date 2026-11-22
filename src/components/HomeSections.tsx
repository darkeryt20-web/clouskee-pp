import {FormEvent, useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {
  ArrowRight,
  ChevronDown,
  Eye,
  FileText,
  Flame,
  HardDrive,
  HelpCircle,
  Music,
  Pause,
  Play,
  ShieldCheck,
  Users,
} from 'lucide-react';
import {DEMO_PROFILES, DemoProfile, DemoProfileModal} from './DemoProfileModal';
import {PricingCards} from './PricingCards';
import {
  sanitizeHandle,
  validateAndCheckUsername,
} from '../utils/usernameRegistry';

const PLATFORM_STATS = [
  {
    value: '1.4M+',
    label: 'Profile Views',
    icon: Eye,
    iconBg: 'bg-purple-500/15 border-purple-500/25 text-purple-400',
  },
  {
    value: '284K+',
    label: 'Active Profiles',
    icon: Users,
    iconBg: 'bg-indigo-500/15 border-indigo-500/25 text-indigo-400',
  },
  {
    value: '4.9M+',
    label: 'File Uploads',
    icon: HardDrive,
    iconBg: 'bg-violet-500/15 border-violet-500/25 text-violet-400',
  },
  {
    value: '99.99%',
    label: 'Network Uptime',
    icon: ShieldCheck,
    iconBg: 'bg-emerald-500/15 border-emerald-500/25 text-emerald-400',
  },
];

const FAQ_ITEMS = [
  {
    question: 'What is Clouskee PP and how does it work?',
    answer:
      'Clouskee PP is an all-in-one platform for creating sleek, highly custom link-in-bio profile pages and hosting fast, secure files. You can link your social media, stream custom background music, display typewriter bios, earn exclusive badges, and share direct files in seconds.',
  },
  {
    question: 'What is the price of Clouskee PP Premium?',
    answer:
      'Clouskee PP Premium is a single one-time payment of 7,99€ for lifetime access with zero recurring monthly fees.',
  },
  {
    question: 'How do I claim my custom handle?',
    answer:
      'Enter your desired username into the clouskee.pp/ claim bar on the homepage and click Claim Now to reserve your custom profile link.',
  },
  {
    question: 'Can I upload music and custom background artwork?',
    answer:
      'Yes, you can customize your profile with background artwork and embed background audio tracks with custom player controls.',
  },
  {
    question: 'How can I join the Clouskee PP Discord community?',
    answer:
      'Click the Discord link in the top navigation bar or footer to join our official server at https://discord.gg/FDQrVXEdbK.',
  },
];

function formatSeconds(totalSec: number) {
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function HomeSections() {
  const navigate = useNavigate();
  const [selectedDemo, setSelectedDemo] = useState<DemoProfile | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(165); // 02:45
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [bottomHandle, setBottomHandle] = useState('');
  const [bottomError, setBottomError] = useState('');

  // Subtle interactive time progression when user plays the Bento audio widget
  useEffect(() => {
    if (!isAudioPlaying) return;
    const timer = window.setInterval(() => {
      setElapsedSec((prev) => (prev >= 192 ? 0 : prev + 1)); // 03:12 = 192s
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isAudioPlaying]);

  const handleBottomClaim = (e: FormEvent) => {
    e.preventDefault();
    const check = validateAndCheckUsername(bottomHandle);
    if (!check.available) {
      setBottomError(check.message ?? 'Please enter an available username.');
      return;
    }
    setBottomError('');
    navigate(`/signup?handle=${encodeURIComponent(check.cleaned)}`);
  };

  return (
    <div className="relative z-10 bg-[#07030d]">
      {/* 1. Live Demos Bar & Platform Stats Grid */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-4 pb-16">
        {/* Try Live Demos Row */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
          <span className="text-xs sm:text-sm font-medium text-slate-400 mr-1">
            Try Live Demos:
          </span>
          {(['clouskee', 'alex', 'luna'] as const).map((handle) => (
            <button
              key={handle}
              type="button"
              onClick={() => setSelectedDemo(DEMO_PROFILES[handle])}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#130a24] hover:bg-[#1c0f34] border border-purple-500/30 hover:border-purple-400/55 px-3.5 py-1.5 text-xs font-mono font-medium text-purple-100 shadow-[0_0_16px_rgba(124,58,237,0.12)] hover:shadow-[0_0_22px_rgba(168,85,247,0.28)] transition-all duration-150 cursor-pointer whitespace-nowrap"
            >
              <span
                aria-hidden="true"
                className="text-[10px] text-purple-400 leading-none"
              >
                ▶
              </span>
              <span>clouskee.pp/{handle}</span>
            </button>
          ))}
        </div>

        {/* 4-Column Stats Grid */}
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {PLATFORM_STATS.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="rounded-2xl bg-[#0d0718]/90 border border-purple-500/20 px-6 py-7 flex flex-col items-center text-center shadow-[0_12px_36px_rgba(4,2,10,0.5)] hover:border-purple-400/35 transition-colors"
              >
                <div
                  className={`w-11 h-11 rounded-full border flex items-center justify-center ${stat.iconBg}`}
                >
                  <Icon className="w-5 h-5" aria-hidden="true" />
                </div>
                <div className="mt-4 text-3xl font-extrabold tracking-tight text-white tabular-nums">
                  {stat.value}
                </div>
                <div className="mt-1 text-xs sm:text-sm font-medium text-slate-400">
                  {stat.label}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 2. Features Bento Grid Section */}
      <section
        id="features"
        className="max-w-5xl mx-auto px-4 sm:px-6 py-20 sm:py-24"
      >
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-[42px] font-extrabold tracking-tight text-white leading-tight text-balance">
            Designed to make your profile stand out.
          </h2>
          <p className="mt-3.5 text-sm sm:text-base text-[#b2abc4] leading-relaxed">
            Packed with modern customizations, background music, exclusive
            badges,
            <br className="hidden sm:inline" /> and high-speed file hosting.
          </p>
        </div>

        {/* Asymmetric 2-Row Bento Grid */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Card 1: Top-Left Wide (~60% -> 7 cols) */}
          <div className="lg:col-span-7 relative overflow-hidden rounded-2xl bg-[#0b0615] border border-purple-500/20 p-6 sm:p-7 flex flex-col justify-between">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-20 -right-20 w-72 h-72 rounded-full blur-[70px] opacity-40"
              style={{
                background:
                  'radial-gradient(circle, rgba(139, 92, 246, 0.45) 0%, transparent 70%)',
              }}
            />

            <div className="relative z-10">
              <div className="w-11 h-11 rounded-xl bg-purple-600/20 border border-purple-400/25 flex items-center justify-center text-purple-300">
                <Music className="w-5 h-5" aria-hidden="true" />
              </div>

              <h3 className="mt-5 text-xl font-bold text-white">
                Background Music &amp; Audio Autoplay
              </h3>
              <p className="mt-2.5 text-sm text-[#b2abc4] leading-relaxed max-w-xl">
                Embed your favorite track or lo-fi synthwave beat. Visitors
                experience immersive background audio complete with custom
                player controls and animated equalizer indicators.
              </p>
            </div>

            {/* Embedded Interactive Mini Audio Player Widget */}
            <div className="relative z-10 mt-6 rounded-xl bg-[#080410]/95 border border-purple-500/20 px-4 py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3.5 min-w-0">
                <button
                  type="button"
                  onClick={() => setIsAudioPlaying((prev) => !prev)}
                  aria-label={
                    isAudioPlaying
                      ? 'Pause Starlight Odyssey preview'
                      : 'Play Starlight Odyssey preview'
                  }
                  className="w-9 h-9 rounded-full bg-gradient-to-br from-[#9333ea] to-[#7c3aed] hover:brightness-110 flex items-center justify-center text-white shrink-0 shadow-[0_0_18px_rgba(168,85,247,0.45)] transition-all cursor-pointer"
                >
                  {isAudioPlaying ? (
                    <Pause className="w-3.5 h-3.5" />
                  ) : (
                    <Play className="w-3.5 h-3.5 ml-0.5" />
                  )}
                </button>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs sm:text-sm font-semibold text-white truncate">
                      Starlight Odyssey (Phonk Remix)
                    </p>
                    {isAudioPlaying && (
                      <span
                        aria-hidden="true"
                        className="inline-flex items-end gap-0.5 h-3"
                      >
                        <span className="w-0.5 h-2 bg-purple-400 animate-pulse" />
                        <span className="w-0.5 h-3 bg-purple-300 animate-pulse" />
                        <span className="w-0.5 h-1.5 bg-purple-400 animate-pulse" />
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] font-medium text-purple-400 truncate">
                    KSLV Noh &amp; Clouskee
                  </p>
                </div>
              </div>

              <span className="rounded-full bg-[#170c2b] border border-purple-500/25 px-3 py-1 font-mono text-[11px] text-purple-200 tabular-nums shrink-0">
                {formatSeconds(elapsedSec)} / 03:12
              </span>
            </div>
          </div>

          {/* Card 2: Top-Right (~40% -> 5 cols) */}
          <div className="lg:col-span-5 relative overflow-hidden rounded-2xl bg-[#0b0615] border border-purple-500/20 p-6 sm:p-7 flex flex-col justify-between">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-20 -right-20 w-56 h-56 rounded-full blur-[70px] opacity-30"
              style={{
                background:
                  'radial-gradient(circle, rgba(245, 158, 11, 0.35) 0%, transparent 70%)',
              }}
            />

            <div className="relative z-10">
              <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-400/25 flex items-center justify-center text-amber-400">
                <Flame className="w-5 h-5" aria-hidden="true" />
              </div>

              <h3 className="mt-5 text-xl font-bold text-white">
                Exclusive Badges
              </h3>
              <p className="mt-2.5 text-sm text-[#b2abc4] leading-relaxed">
                Collect verified badges including Founder, Verified OG, Server
                Booster, Staff Pick, and Developer tags.
              </p>
            </div>

            <div className="relative z-10 mt-6 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-400 px-3 py-1 text-xs font-bold text-slate-950 shadow-[0_0_16px_rgba(251,191,36,0.3)]">
                <span aria-hidden="true">👑</span>
                <span>Founder</span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#a855f7] px-3 py-1 text-xs font-bold text-white shadow-[0_0_16px_rgba(168,85,247,0.35)]">
                <span aria-hidden="true">⚡</span>
                <span>Verified OG</span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-cyan-400 to-sky-400 px-3 py-1 text-xs font-bold text-slate-950 shadow-[0_0_16px_rgba(34,211,238,0.3)]">
                <span aria-hidden="true">💎</span>
                <span>Premium</span>
              </span>
            </div>
          </div>

          {/* Card 3: Bottom-Left (~40% -> 5 cols) */}
          <div className="lg:col-span-5 relative overflow-hidden rounded-2xl bg-[#0b0615] border border-purple-500/20 p-6 sm:p-7 flex flex-col justify-between">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-20 -right-20 w-56 h-56 rounded-full blur-[70px] opacity-30"
              style={{
                background:
                  'radial-gradient(circle, rgba(99, 102, 241, 0.35) 0%, transparent 70%)',
              }}
            />

            <div className="relative z-10">
              <div className="w-11 h-11 rounded-xl bg-indigo-500/15 border border-indigo-400/25 flex items-center justify-center text-indigo-300">
                <FileText className="w-5 h-5" aria-hidden="true" />
              </div>

              <h3 className="mt-5 text-xl font-bold text-white">
                Typewriter Animation
              </h3>
              <p className="mt-2.5 text-sm text-[#b2abc4] leading-relaxed">
                Give your profile a retro terminal or sleek typewriter effect
                with custom typing speeds and looping cursors.
              </p>
            </div>

            {/* Dark Monospace Terminal Preview Box */}
            <div className="relative z-10 mt-6 rounded-xl bg-[#07030d] border border-purple-500/20 px-4 py-3.5 font-mono text-xs sm:text-[13px] text-slate-200 leading-relaxed">
              <span>Full-Stack Architect &amp; Digital Creator</span>
              <span
                aria-hidden="true"
                className="inline-block w-[2px] h-4 ml-0.5 align-middle bg-purple-400 animate-pulse"
              />
            </div>
          </div>

          {/* Card 4: Bottom-Right Wide (~60% -> 7 cols) */}
          <div className="lg:col-span-7 relative overflow-hidden rounded-2xl bg-[#0b0615] border border-purple-500/20 p-6 sm:p-7 flex flex-col justify-between">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-20 -right-20 w-72 h-72 rounded-full blur-[70px] opacity-30"
              style={{
                background:
                  'radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, transparent 70%)',
              }}
            />

            <div className="relative z-10">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/15 border border-emerald-400/25 flex items-center justify-center text-emerald-400">
                <HardDrive className="w-5 h-5" aria-hidden="true" />
              </div>

              <h3 className="mt-5 text-xl font-bold text-white">
                Fast, Secure File Hosting
              </h3>
              <p className="mt-2.5 text-sm text-[#b2abc4] leading-relaxed max-w-xl">
                Upload files up to 5GB per asset with instant CDN distribution.
                Share direct links with custom passcodes, expiration timers, and
                view counters.
              </p>
            </div>

            {/* Three Mini Sub-Cards */}
            <div className="relative z-10 mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-xl bg-[#080410]/95 border border-purple-500/20 px-4 py-3">
                <p className="text-xs font-bold text-purple-400">
                  High Speed CDN
                </p>
                <p className="mt-1 text-[11px] text-slate-400">
                  10Gbps Global Edge
                </p>
              </div>
              <div className="rounded-xl bg-[#080410]/95 border border-purple-500/20 px-4 py-3">
                <p className="text-xs font-bold text-emerald-400">
                  Password Protect
                </p>
                <p className="mt-1 text-[11px] text-slate-400">
                  Encrypted Downloads
                </p>
              </div>
              <div className="rounded-xl bg-[#080410]/95 border border-purple-500/20 px-4 py-3">
                <p className="text-xs font-bold text-amber-400">
                  Zero Compression
                </p>
                <p className="mt-1 text-[11px] text-slate-400">
                  Original Quality
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Lifetime Pricing Section */}
      <PricingCards />

      {/* 4. Frequently Asked Questions (FAQ) Section */}
      <section
        id="faq"
        className="max-w-3xl mx-auto px-4 sm:px-6 py-20 sm:py-24"
      >
        <div className="text-center">
          <div className="mx-auto w-11 h-11 rounded-full bg-purple-600/20 border border-purple-400/30 flex items-center justify-center text-purple-300 shadow-[0_0_24px_rgba(139,92,246,0.22)]">
            <HelpCircle className="w-5 h-5" aria-hidden="true" />
          </div>
          <h2 className="mt-5 text-3xl sm:text-[40px] font-extrabold tracking-tight text-white">
            Frequently Asked Questions
          </h2>
          <p className="mt-2.5 text-sm sm:text-base text-[#b2abc4]">
            Everything you need to know about Clouskee PP setup, plans, and
            features.
          </p>
        </div>

        <div className="mt-10 space-y-3">
          {FAQ_ITEMS.map((item, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={item.question}
                className="rounded-2xl bg-[#0c0617]/90 border border-purple-500/20 transition-colors hover:border-purple-400/35"
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full px-5 sm:px-6 py-4 sm:py-5 flex items-center justify-between gap-4 text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 rounded-2xl"
                >
                  <span
                    className={`text-sm sm:text-[15px] font-semibold transition-colors ${
                      isOpen ? 'text-purple-300' : 'text-white'
                    }`}
                  >
                    {item.question}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-purple-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                    aria-hidden="true"
                  />
                </button>

                {isOpen && (
                  <div className="px-5 sm:px-6 pb-5 pt-0.5 text-sm text-[#b2abc4] leading-relaxed border-t border-purple-500/10">
                    <p className="pt-3.5">{item.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. Bottom CTA Banner */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 pb-24">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#2a1154] via-[#170933] to-[#110726] border border-purple-400/25 px-6 sm:px-12 py-14 sm:py-16 text-center shadow-[0_24px_80px_rgba(10,4,22,0.85),0_0_50px_rgba(124,58,237,0.16)]">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 left-1/4 w-96 h-72 rounded-full blur-[90px] opacity-55"
            style={{
              background:
                'radial-gradient(circle, rgba(168, 85, 247, 0.35) 0%, transparent 70%)',
            }}
          />

          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-[42px] font-extrabold tracking-tight text-white">
              Everything you want, right here.
            </h2>
            <p className="mt-3.5 text-sm sm:text-base text-[#cbc4de] leading-relaxed">
              Join thousands of creators, developers, and stream partners who
              rely on Clouskee PP for modern bio links and fast file hosting.
            </p>

            <form
              onSubmit={handleBottomClaim}
              noValidate
              className="mt-8 max-w-[460px] mx-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
            >
              <label className="sr-only" htmlFor="bottom-claim-input">
                Claim username
              </label>
              <div className="flex-1 flex items-center rounded-xl bg-[#090412]/90 border border-purple-400/30 focus-within:border-purple-300/75 px-4 py-3">
                <span className="font-mono text-sm font-medium text-[#a855f7] select-none shrink-0">
                  clouskee.pp/
                </span>
                <input
                  id="bottom-claim-input"
                  type="text"
                  value={bottomHandle}
                  onChange={(e) => {
                    setBottomHandle(sanitizeHandle(e.target.value));
                    if (bottomError) setBottomError('');
                  }}
                  placeholder="username"
                  autoComplete="off"
                  spellCheck={false}
                  className="w-full min-w-0 bg-transparent pl-1 font-mono text-sm text-white placeholder:text-slate-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#7c3aed] via-[#9333ea] to-[#a855f7] hover:brightness-110 px-6 py-3 text-sm font-semibold text-white shadow-[0_0_24px_rgba(168,85,247,0.45)] transition-all whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>Claim Now</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </form>

            {bottomError && (
              <p className="mt-3 text-xs font-medium text-amber-300">
                {bottomError}
              </p>
            )}
          </div>
        </div>
      </section>

      <DemoProfileModal
        profile={selectedDemo}
        onClose={() => setSelectedDemo(null)}
      />
    </div>
  );
}
