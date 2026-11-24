import {FormEvent, useEffect, useRef, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  ChevronDown,
  Eye,
  FileText,
  HardDrive,
  HelpCircle,
  Layers,
  MousePointerClick,
  Music,
  Pause,
  Play,
  ShieldCheck,
  Users,
  Zap,
} from 'lucide-react';
import {motion, useInView, useReducedMotion} from 'motion/react';
import {DEMO_PROFILES, DemoProfile, DemoProfileModal} from './DemoProfileModal';
import {PricingCards} from './PricingCards';
import {Tilt3DCard} from './Tilt3DCard';
import {
  checkUsernameAvailability,
  sanitizeHandle,
} from '../utils/usernameRegistry';

interface StatConfig {
  target: number;
  decimals: number;
  suffix: string;
  fallback: string;
  label: string;
  icon: typeof Eye;
  iconBg: string;
}

const PLATFORM_STATS: StatConfig[] = [
  {
    target: 1.4,
    decimals: 1,
    suffix: 'M+',
    fallback: '1.4M+',
    label: 'Profile Views',
    icon: Eye,
    iconBg: 'bg-purple-500/15 border-purple-500/25 text-purple-400',
  },
  {
    target: 284,
    decimals: 0,
    suffix: 'K+',
    fallback: '284K+',
    label: 'Active Profiles',
    icon: Users,
    iconBg: 'bg-indigo-500/15 border-indigo-500/25 text-indigo-400',
  },
  {
    target: 4.9,
    decimals: 1,
    suffix: 'M+',
    fallback: '4.9M+',
    label: 'File Uploads',
    icon: HardDrive,
    iconBg: 'bg-violet-500/15 border-violet-500/25 text-violet-400',
  },
  {
    target: 99.99,
    decimals: 2,
    suffix: '%',
    fallback: '99.99%',
    label: 'Network Uptime',
    icon: ShieldCheck,
    iconBg: 'bg-emerald-500/15 border-emerald-500/25 text-emerald-400',
  },
];

const WORKFLOW_STEPS = [
  {
    step: '01',
    title: 'Claim Your Handle',
    description:
      'Lock in your short clouskee.pp/username URL in seconds and reserve your custom creator identity.',
  },
  {
    step: '02',
    title: 'Upload & Customize',
    description:
      'Drop in background videos, avatars, custom cursors, and a 5-style music player with real-time live preview.',
  },
  {
    step: '03',
    title: 'Share & Track Views',
    description:
      'Publish one clean bio link everywhere, count unique visitor views, and climb the creator leaderboard.',
  },
];

function AnimatedStatValue({
  target,
  decimals,
  suffix,
  fallback,
}: {
  target: number;
  decimals: number;
  suffix: string;
  fallback: string;
}) {
  const prefersReducedMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement | null>(null);
  const isInView = useInView(ref, {once: true, amount: 0.4});
  const [display, setDisplay] = useState(fallback);

  useEffect(() => {
    if (prefersReducedMotion || !isInView) {
      setDisplay(fallback);
      return;
    }

    let rafId = 0;
    const duration = 950;
    const startTime = performance.now();

    const tick = (now: number) => {
      const progress = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = target * eased;
      setDisplay(`${current.toFixed(decimals)}${suffix}`);
      if (progress < 1) {
        rafId = window.requestAnimationFrame(tick);
      } else {
        setDisplay(fallback);
      }
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [decimals, fallback, isInView, prefersReducedMotion, suffix, target]);

  return (
    <div
      ref={ref}
      className="mt-4 text-3xl font-extrabold tracking-tight text-white tabular-nums"
    >
      {display}
    </div>
  );
}

const FAQ_ITEMS = [
  {
    question: 'What is Clouskee PP and how does it work?',
    answer:
      'Clouskee PP is an all-in-one platform for creating sleek, highly custom link-in-bio profile pages and hosting media assets. You can customize glassmorphism profile cards, place a 5-style music player anywhere on screen, enable Click to Enter gates, customize cursors, and share social links in seconds.',
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
    question: 'Can I upload music, videos, and custom cursors directly?',
    answer:
      'Yes, your Creator Studio lets you upload background videos, images, avatars, music tracks, cover art, and custom cursor icons directly from your device with instant live preview syncing.',
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
  const prefersReducedMotion = useReducedMotion();
  const [selectedDemo, setSelectedDemo] = useState<DemoProfile | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(165); // 02:45
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [bottomHandle, setBottomHandle] = useState('');
  const [bottomChecking, setBottomChecking] = useState(false);
  const [bottomError, setBottomError] = useState('');

  useEffect(() => {
    if (!isAudioPlaying) return;
    const timer = window.setInterval(() => {
      setElapsedSec((prev) => (prev >= 192 ? 0 : prev + 1)); // 03:12 = 192s
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isAudioPlaying]);

  const handleBottomClaim = async (e: FormEvent) => {
    e.preventDefault();
    if (bottomChecking) return;
    setBottomChecking(true);
    setBottomError('');
    try {
      const check = await checkUsernameAvailability(bottomHandle);
      if (!check.available) {
        setBottomError(check.message ?? 'Username is already taken');
        return;
      }
      navigate(
        `/signup?handle=${encodeURIComponent(check.cleaned)}&verified=1`,
      );
    } finally {
      setBottomChecking(false);
    }
  };

  const scrollReveal = (index = 0) =>
    prefersReducedMotion
      ? {}
      : {
          initial: {opacity: 0, y: 20},
          whileInView: {opacity: 1, y: 0},
          viewport: {once: true, amount: 0.15},
          transition: {
            duration: 0.5,
            delay: Math.min(index * 0.06, 0.3),
            ease: [0.22, 1, 0.36, 1] as const,
          },
        };

  return (
    <div className="relative z-10 bg-[#07030d]">
      {/* 1. Live Demos Bar & Platform Stats Grid */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-4 pb-16">
        {/* Try Live Demos Row */}
        <motion.div
          {...scrollReveal(0)}
          className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3"
        >
          <span className="text-xs sm:text-sm font-medium text-slate-400 mr-1">
            Try Live Demos:
          </span>
          {(['clouskee', 'alex', 'luna'] as const).map((handle) => (
            <button
              key={handle}
              type="button"
              onClick={() => setSelectedDemo(DEMO_PROFILES[handle])}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#130a24] hover:bg-[#1c0f34] border border-purple-500/30 hover:border-purple-400/55 px-3.5 py-1.5 text-xs font-mono font-medium text-purple-100 shadow-[0_0_16px_rgba(124,58,237,0.12)] hover:shadow-[0_0_22px_rgba(168,85,247,0.28)] hover:-translate-y-0.5 active:scale-[0.97] transition-all duration-150 cursor-pointer whitespace-nowrap"
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
        </motion.div>

        {/* 4-Column Interactive 3D Stats Grid */}
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {PLATFORM_STATS.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <motion.div key={stat.label} {...scrollReveal(idx)}>
                <Tilt3DCard
                  maxTiltDeg={6}
                  glareOpacity={0.14}
                  innerClassName="rounded-2xl"
                >
                  <div className="h-full rounded-2xl bg-[#0d0718]/90 border border-purple-500/20 px-6 py-7 flex flex-col items-center text-center shadow-[0_12px_36px_rgba(4,2,10,0.5)] hover:border-purple-400/45 transition-colors">
                    <div
                      className={`w-11 h-11 rounded-xl border flex items-center justify-center ${stat.iconBg}`}
                    >
                      <Icon className="w-5 h-5" aria-hidden="true" />
                    </div>
                    <AnimatedStatValue
                      target={stat.target}
                      decimals={stat.decimals}
                      suffix={stat.suffix}
                      fallback={stat.fallback}
                    />
                    <div className="mt-1 text-xs sm:text-sm font-medium text-slate-400">
                      {stat.label}
                    </div>
                  </div>
                </Tilt3DCard>
              </motion.div>
            );
          })}
        </div>

        {/* 3-Step Animated Creator Workflow Strip */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
          {WORKFLOW_STEPS.map((item, idx) => (
            <motion.div key={item.step} {...scrollReveal(idx)}>
              <Tilt3DCard
                maxTiltDeg={5}
                glareOpacity={0.14}
                className="h-full"
                innerClassName="rounded-2xl"
              >
                <div className="h-full rounded-2xl bg-[#0b0615]/90 border border-purple-500/20 hover:border-purple-400/45 p-6 transition-colors shadow-[0_12px_32px_rgba(4,2,10,0.5)]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold tracking-wider text-purple-300">
                      {item.step}.
                    </span>
                    <span className="h-px flex-1 bg-gradient-to-r from-purple-500/35 to-transparent" />
                  </div>
                  <h3 className="mt-3.5 text-base sm:text-lg font-bold text-white">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-[#b2abc4] leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </Tilt3DCard>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 2. Features 3D Showcase Grid */}
      <section
        id="features"
        className="relative max-w-5xl mx-auto px-4 sm:px-6 py-20 sm:py-24"
      >
        {/* Subtle Ambient Feature Mesh & Starfield Backdrop */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-12 bottom-12 overflow-hidden"
        >
          <div className="absolute -inset-6 bg-starfield opacity-45 animate-starfield-drift [mask-image:radial-gradient(ellipse_at_center,black_35%,transparent_80%)]" />
          <div
            className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[680px] h-[360px] rounded-full blur-[130px] opacity-45 animate-orb-drift"
            style={{
              background:
                'radial-gradient(circle, rgba(124, 58, 237, 0.34) 0%, rgba(7, 3, 13, 0) 72%)',
            }}
          />
        </div>

        <motion.div
          {...scrollReveal(0)}
          className="relative z-10 text-center max-w-2xl mx-auto"
        >
          <h2 className="text-3xl sm:text-[42px] font-extrabold tracking-tight text-white leading-tight text-balance">
            Designed to make your profile stand out.
          </h2>
          <p className="mt-3.5 text-sm sm:text-base text-[#b2abc4] leading-relaxed">
            Built with dark glassmorphism cards, interactive audio players,
            custom cursor effects, real-time analytics, and direct media
            uploads.
          </p>
        </motion.div>

        {/* 6-Card 3D Tilt Feature Grid */}
        <div className="relative z-10 mt-12 grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Card 1: Movable 5-Style Music Card (7 cols) */}
          <motion.div {...scrollReveal(0)} className="lg:col-span-7">
            <Tilt3DCard
              maxTiltDeg={5.5}
              glareOpacity={0.16}
              className="h-full"
              innerClassName="rounded-2xl"
            >
              <div className="h-full relative overflow-hidden rounded-2xl bg-[#0b0615]/95 border border-purple-500/20 hover:border-purple-400/40 p-6 sm:p-7 flex flex-col justify-between transition-colors shadow-[0_18px_48px_rgba(4,2,10,0.65)]">
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
                    Movable 5-Style Music Card
                  </h3>
                  <p className="mt-2.5 text-sm text-[#b2abc4] leading-relaxed max-w-xl">
                    Choose from 5 distinct player layouts and place your music
                    card inside your profile card, directly below it, or pinned
                    to any corner with live scrubbing and countdown timers.
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
                      className="w-9 h-9 rounded-full bg-gradient-to-br from-[#9333ea] to-[#7c3aed] hover:brightness-110 active:scale-95 flex items-center justify-center text-white shrink-0 shadow-[0_0_18px_rgba(168,85,247,0.45)] transition-all cursor-pointer"
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

                  <span className="rounded-md bg-[#170c2b] border border-purple-500/25 px-2.5 py-1 font-mono text-[11px] text-purple-200 tabular-nums shrink-0">
                    -{formatSeconds(192 - elapsedSec)} / 03:12
                  </span>
                </div>
              </div>
            </Tilt3DCard>
          </motion.div>

          {/* Card 2: Customizable Profile Card & Click to Enter Gate (5 cols) */}
          <motion.div {...scrollReveal(1)} className="lg:col-span-5">
            <Tilt3DCard
              maxTiltDeg={6.5}
              glareOpacity={0.16}
              className="h-full"
              innerClassName="rounded-2xl"
            >
              <div className="h-full relative overflow-hidden rounded-2xl bg-[#0b0615]/95 border border-purple-500/20 hover:border-purple-400/40 p-6 sm:p-7 flex flex-col justify-between transition-colors shadow-[0_18px_48px_rgba(4,2,10,0.65)]">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -top-20 -right-20 w-56 h-56 rounded-full blur-[70px] opacity-30"
                  style={{
                    background:
                      'radial-gradient(circle, rgba(168, 85, 247, 0.35) 0%, transparent 70%)',
                  }}
                />

                <div className="relative z-10">
                  <div className="w-11 h-11 rounded-xl bg-fuchsia-500/15 border border-fuchsia-400/25 flex items-center justify-center text-fuchsia-300">
                    <Layers className="w-5 h-5" aria-hidden="true" />
                  </div>

                  <h3 className="mt-5 text-xl font-bold text-white">
                    Customizable Profile &amp; Click to Enter
                  </h3>
                  <p className="mt-2.5 text-sm text-[#b2abc4] leading-relaxed">
                    Fine-tune card opacity, frosted backdrop blur, background
                    videos, and an atmospheric Click to Enter splash screen that
                    unlocks background audio on tap.
                  </p>
                </div>

                <div className="relative z-10 mt-6 rounded-xl bg-[#07030d] border border-purple-500/20 px-4 py-3 flex items-center justify-between text-xs">
                  <span className="inline-flex items-center gap-2 text-slate-300 font-medium">
                    <MousePointerClick className="w-4 h-4 text-purple-400" />
                    <span>Click to Enter Gate</span>
                  </span>
                  <span className="font-mono text-[11px] text-purple-300">
                    Audio + Visual Sync
                  </span>
                </div>
              </div>
            </Tilt3DCard>
          </motion.div>

          {/* Card 3: Custom & Electric Lightning Cursors (5 cols) */}
          <motion.div {...scrollReveal(2)} className="lg:col-span-5">
            <Tilt3DCard
              maxTiltDeg={6.5}
              glareOpacity={0.16}
              className="h-full"
              innerClassName="rounded-2xl"
            >
              <div className="h-full relative overflow-hidden rounded-2xl bg-[#0b0615]/95 border border-purple-500/20 hover:border-purple-400/40 p-6 sm:p-7 flex flex-col justify-between transition-colors shadow-[0_18px_48px_rgba(4,2,10,0.65)]">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -top-20 -right-20 w-56 h-56 rounded-full blur-[70px] opacity-30"
                  style={{
                    background:
                      'radial-gradient(circle, rgba(244, 63, 94, 0.32) 0%, transparent 70%)',
                  }}
                />

                <div className="relative z-10">
                  <div className="w-11 h-11 rounded-xl bg-rose-500/15 border border-rose-400/25 flex items-center justify-center text-rose-300">
                    <Zap className="w-5 h-5" aria-hidden="true" />
                  </div>

                  <h3 className="mt-5 text-xl font-bold text-white">
                    Custom &amp; Electric Lightning Cursors
                  </h3>
                  <p className="mt-2.5 text-sm text-[#b2abc4] leading-relaxed">
                    Replace default pointers with glowing orbs, crosshairs,
                    uploaded PNG cursors, or Premium single-bolt electric
                    lightning trails with customizable arc length and click
                    shockwaves.
                  </p>
                </div>

                <div className="relative z-10 mt-6 grid grid-cols-2 gap-2.5 text-xs">
                  <div className="rounded-lg bg-[#080410] border border-purple-500/20 px-3 py-2 text-slate-200 font-medium">
                    Single-Bolt Trail
                  </div>
                  <div className="rounded-lg bg-[#080410] border border-rose-500/25 px-3 py-2 text-rose-200 font-medium">
                    Click Shockwaves
                  </div>
                </div>
              </div>
            </Tilt3DCard>
          </motion.div>

          {/* Card 4: Typewriter & Global Name Effects (7 cols) */}
          <motion.div {...scrollReveal(3)} className="lg:col-span-7">
            <Tilt3DCard
              maxTiltDeg={5.5}
              glareOpacity={0.16}
              className="h-full"
              innerClassName="rounded-2xl"
            >
              <div className="h-full relative overflow-hidden rounded-2xl bg-[#0b0615]/95 border border-purple-500/20 hover:border-purple-400/40 p-6 sm:p-7 flex flex-col justify-between transition-colors shadow-[0_18px_48px_rgba(4,2,10,0.65)]">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -top-20 -right-20 w-72 h-72 rounded-full blur-[70px] opacity-30"
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
                    Typewriter Bios &amp; Global Name Effects
                  </h3>
                  <p className="mt-2.5 text-sm text-[#b2abc4] leading-relaxed max-w-xl">
                    Cycle multi-line typewriter bios, animate browser tab
                    titles, and style your display name with Gradient Shimmer,
                    Neon Pulse, or Floating Letters.
                  </p>
                </div>

                <div className="relative z-10 mt-6 rounded-xl bg-[#07030d] border border-purple-500/20 px-4 py-3.5 font-mono text-xs sm:text-[13px] text-slate-200 leading-relaxed">
                  <span>Full-Stack Architect &amp; Digital Creator</span>
                  <span
                    aria-hidden="true"
                    className="inline-block w-[2px] h-4 ml-0.5 align-middle bg-purple-400 animate-pulse"
                  />
                </div>
              </div>
            </Tilt3DCard>
          </motion.div>

          {/* Card 5: Analytics, Views & Leaderboard (6 cols) */}
          <motion.div {...scrollReveal(4)} className="lg:col-span-6">
            <Tilt3DCard
              maxTiltDeg={6}
              glareOpacity={0.16}
              className="h-full"
              innerClassName="rounded-2xl"
            >
              <div className="h-full relative overflow-hidden rounded-2xl bg-[#0b0615]/95 border border-purple-500/20 hover:border-purple-400/40 p-6 sm:p-7 flex flex-col justify-between transition-colors shadow-[0_18px_48px_rgba(4,2,10,0.65)]">
                <div className="relative z-10">
                  <div className="w-11 h-11 rounded-xl bg-cyan-500/15 border border-cyan-400/25 flex items-center justify-center text-cyan-300">
                    <BarChart3 className="w-5 h-5" aria-hidden="true" />
                  </div>

                  <h3 className="mt-5 text-xl font-bold text-white">
                    Analytics &amp; Unique Profile Views
                  </h3>
                  <p className="mt-2.5 text-sm text-[#b2abc4] leading-relaxed">
                    Track unique IP-deduplicated profile views, compete on
                    all-time and monthly creator leaderboards, and inspect daily
                    platform traffic metrics.
                  </p>
                </div>

                <div className="relative z-10 mt-6 grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-lg bg-[#080410] border border-purple-500/20 px-3.5 py-2.5">
                    <p className="font-semibold text-cyan-300">
                      Unique View Count
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-400">
                      Anti-spam deduplication
                    </p>
                  </div>
                  <div className="rounded-lg bg-[#080410] border border-purple-500/20 px-3.5 py-2.5">
                    <p className="font-semibold text-purple-300">
                      Live Rankings
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-400">
                      Monthly &amp; all-time boards
                    </p>
                  </div>
                </div>
              </div>
            </Tilt3DCard>
          </motion.div>

          {/* Card 6: Direct Uploads & Admin/Role Controls (6 cols) */}
          <motion.div {...scrollReveal(5)} className="lg:col-span-6">
            <Tilt3DCard
              maxTiltDeg={6}
              glareOpacity={0.16}
              className="h-full"
              innerClassName="rounded-2xl"
            >
              <div className="h-full relative overflow-hidden rounded-2xl bg-[#0b0615]/95 border border-purple-500/20 hover:border-purple-400/40 p-6 sm:p-7 flex flex-col justify-between transition-colors shadow-[0_18px_48px_rgba(4,2,10,0.65)]">
                <div className="relative z-10">
                  <div className="w-11 h-11 rounded-xl bg-emerald-500/15 border border-emerald-400/25 flex items-center justify-center text-emerald-400">
                    <ShieldCheck className="w-5 h-5" aria-hidden="true" />
                  </div>

                  <h3 className="mt-5 text-xl font-bold text-white">
                    Direct Uploads &amp; Role Controls
                  </h3>
                  <p className="mt-2.5 text-sm text-[#b2abc4] leading-relaxed">
                    Upload avatars, videos, audio tracks, and custom link icons
                    in one click, paired with custom profile role tags and Admin
                    access management.
                  </p>
                </div>

                <div className="relative z-10 mt-6 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-500/15 border border-amber-400/35 px-2.5 py-1 text-xs font-semibold text-amber-200">
                    Founder
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-purple-500/20 border border-purple-400/35 px-2.5 py-1 text-xs font-semibold text-purple-100">
                    Verified OG
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-cyan-500/15 border border-cyan-400/35 px-2.5 py-1 text-xs font-semibold text-cyan-200">
                    Premium
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/15 border border-emerald-400/35 px-2.5 py-1 text-xs font-semibold text-emerald-200">
                    Developer
                  </span>
                </div>
              </div>
            </Tilt3DCard>
          </motion.div>
        </div>
      </section>

      {/* 3. Lifetime Pricing Section */}
      <PricingCards />

      {/* 4. Frequently Asked Questions (FAQ) Section */}
      <section
        id="faq"
        className="max-w-3xl mx-auto px-4 sm:px-6 py-20 sm:py-24"
      >
        <motion.div {...scrollReveal(0)} className="text-center">
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
        </motion.div>

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
                  className="w-full px-5 sm:px-6 py-4 sm:py-5 flex items-center justify-between gap-4 text-left cursor-pointer active:scale-[0.995] transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 rounded-2xl"
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
        <Tilt3DCard
          maxTiltDeg={3.5}
          glareOpacity={0.14}
          scaleOnHover={1.005}
          innerClassName="rounded-3xl"
        >
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
                Join creators, developers, and stream partners using Clouskee PP
                for modern bio links and media hosting.
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
                  disabled={bottomChecking}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#7c3aed] via-[#9333ea] to-[#a855f7] hover:brightness-110 disabled:opacity-70 px-6 py-3 text-sm font-semibold text-white shadow-[0_0_24px_rgba(168,85,247,0.45)] active:scale-[0.97] transition-all whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>{bottomChecking ? 'Checking...' : 'Claim Now'}</span>
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
        </Tilt3DCard>
      </section>

      <DemoProfileModal
        profile={selectedDemo}
        onClose={() => setSelectedDemo(null)}
      />
    </div>
  );
}
