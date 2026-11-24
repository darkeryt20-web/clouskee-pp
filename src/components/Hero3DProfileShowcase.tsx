import {useEffect, useRef, useState} from 'react';
import {
  Eye,
  Music,
  Pause,
  Play,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'motion/react';
import {Tilt3DCard} from './Tilt3DCard';

export function Hero3DProfileShowcase() {
  const prefersReducedMotion = useReducedMotion();
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [secondsLeft, setSecondsLeft] = useState(88);
  const [cursorEffect, setCursorEffect] = useState<'lightning' | 'orb'>(
    'lightning',
  );

  const {scrollYProgress} = useScroll({
    target: wrapperRef,
    offset: ['start end', 'end start'],
  });

  const layerShiftSlow = useTransform(scrollYProgress, [0, 1], [-10, 14]);
  const layerShiftFast = useTransform(scrollYProgress, [0, 1], [8, -16]);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => (prev <= 1 ? 124 : prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isPlaying]);

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const countdown = `-${mins}:${String(secs).padStart(2, '0')}`;

  return (
    <motion.div
      ref={wrapperRef}
      initial={prefersReducedMotion ? false : {opacity: 0, y: 24}}
      animate={{opacity: 1, y: 0}}
      transition={{duration: 0.65, delay: 0.15, ease: [0.22, 1, 0.36, 1]}}
      className="relative w-full max-w-[400px] mx-auto select-none py-4"
    >
      {/* Layer 0: Deep Background Ambient Aura */}
      <motion.div
        aria-hidden="true"
        style={prefersReducedMotion ? undefined : {y: layerShiftSlow}}
        className="pointer-events-none absolute -inset-6 rounded-3xl opacity-85 blur-3xl"
      >
        <div
          className="w-full h-full rounded-full transition-colors duration-500"
          style={{
            background:
              cursorEffect === 'lightning'
                ? 'radial-gradient(circle at 50% 42%, rgba(139, 92, 246, 0.44), rgba(236, 72, 153, 0.16) 55%, rgba(7, 3, 13, 0) 78%)'
                : 'radial-gradient(circle at 50% 42%, rgba(56, 189, 248, 0.34), rgba(168, 85, 247, 0.18) 55%, rgba(7, 3, 13, 0) 78%)',
          }}
        />
      </motion.div>

      {/* Idle Gentle Float Container */}
      <motion.div
        animate={
          prefersReducedMotion
            ? undefined
            : {
                y: [0, -7, 0],
              }
        }
        transition={
          prefersReducedMotion
            ? undefined
            : {
                duration: 5.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }
        }
      >
        <Tilt3DCard
          maxTiltDeg={9}
          glareOpacity={0.22}
          scaleOnHover={1.018}
          enable3DChildren
          className="relative z-10"
          innerClassName="rounded-3xl"
        >
          {/* Back Stacked Depth Card #2 */}
          <div
            aria-hidden="true"
            style={
              prefersReducedMotion
                ? undefined
                : {
                    transform:
                      'translateZ(-62px) translateX(18px) translateY(14px) rotateZ(4.5deg)',
                  }
            }
            className="pointer-events-none absolute inset-0 rounded-3xl bg-[#120826]/65 border border-purple-500/20 shadow-[0_24px_60px_rgba(4,2,10,0.7)]"
          />

          {/* Middle Stacked Depth Card #1 */}
          <div
            aria-hidden="true"
            style={
              prefersReducedMotion
                ? undefined
                : {
                    transform:
                      'translateZ(-30px) translateX(-16px) translateY(8px) rotateZ(-4deg)',
                  }
            }
            className="pointer-events-none absolute inset-0 rounded-3xl bg-[#160a2e]/75 border border-purple-400/25 shadow-[0_24px_60px_rgba(4,2,10,0.75)]"
          />

          {/* Foreground Layer: Main Dark Glassmorphism Profile Card Body */}
          <div
            className="relative rounded-3xl bg-[#0e071c]/95 backdrop-blur-xl border border-purple-400/35 p-6 shadow-[0_30px_80px_rgba(4,2,10,0.9),inset_0_1px_0_rgba(255,255,255,0.14)]"
            style={{transformStyle: 'preserve-3d'}}
          >
            {/* Top Glossy Specular Edge */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-purple-300/65 to-transparent"
            />

            {/* Top Floating Depth Accent Chips (Interactive Cursor Toggle + Views) */}
            <motion.div
              style={
                prefersReducedMotion
                  ? undefined
                  : {y: layerShiftFast, transformStyle: 'preserve-3d'}
              }
            >
              <div
                style={
                  prefersReducedMotion
                    ? undefined
                    : {transform: 'translateZ(26px)'}
                }
                className="relative z-30 flex items-center justify-between gap-2 text-[11px]"
              >
                <button
                  type="button"
                  onClick={() =>
                    setCursorEffect((prev) =>
                      prev === 'lightning' ? 'orb' : 'lightning',
                    )
                  }
                  className="inline-flex items-center gap-1.5 rounded-md bg-purple-500/15 hover:bg-purple-500/25 border border-purple-400/35 px-2.5 py-1 font-mono font-medium text-purple-100 transition-colors cursor-pointer active:scale-95 whitespace-nowrap"
                  title="Switch cursor preview effect"
                >
                  <Zap
                    className={`w-3 h-3 ${
                      cursorEffect === 'lightning'
                        ? 'text-rose-400'
                        : 'text-cyan-300'
                    }`}
                    aria-hidden="true"
                  />
                  <span>
                    {cursorEffect === 'lightning'
                      ? 'Lightning Trail'
                      : 'Glow Orb Cursor'}
                  </span>
                </button>

                <span className="inline-flex items-center gap-1 font-mono text-slate-300 tabular-nums">
                  <Eye className="w-3 h-3 text-purple-300" aria-hidden="true" />
                  <span>18,420</span>
                </span>
              </div>
            </motion.div>

            {/* Layer 2: Floating Avatar + Identity + Role Tags */}
            <div
              className="mt-5 flex flex-col items-center text-center"
              style={
                prefersReducedMotion
                  ? undefined
                  : {transform: 'translateZ(36px)'}
              }
            >
              <div className="relative">
                <div
                  aria-hidden="true"
                  className={`absolute -inset-1.5 rounded-full opacity-70 blur-sm transition-colors duration-500 ${
                    cursorEffect === 'lightning'
                      ? 'bg-gradient-to-tr from-[#7c3aed] via-[#c084fc] to-[#ec4899]'
                      : 'bg-gradient-to-tr from-cyan-400 via-[#8b5cf6] to-indigo-500'
                  }`}
                />
                <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-[#7c3aed] via-[#5b21b6] to-[#1e1038] border-2 border-purple-200/50 flex items-center justify-center text-2xl font-extrabold text-white shadow-[0_12px_30px_rgba(124,58,237,0.45)]">
                  C
                </div>
                <span
                  aria-hidden="true"
                  className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-[#160b29] border border-purple-400/50 flex items-center justify-center text-purple-300 shadow-lg"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                </span>
              </div>

              <h3 className="mt-4 text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-purple-200 to-[#c084fc] bg-clip-text text-transparent">
                Clouskee Studio
              </h3>
              <p className="mt-0.5 font-mono text-xs text-purple-300">
                @clouskee
              </p>

              {/* Role Tags */}
              <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
                <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 border border-amber-400/35 px-2 py-0.5 text-[11px] font-semibold text-amber-200">
                  <ShieldCheck
                    className="w-3 h-3 text-amber-300"
                    aria-hidden="true"
                  />
                  <span>Founder</span>
                </span>
                <span className="inline-flex items-center gap-1 rounded-md bg-purple-500/20 border border-purple-400/35 px-2 py-0.5 text-[11px] font-semibold text-purple-100">
                  <span>Verified OG</span>
                </span>
              </div>

              <p className="mt-3 text-xs text-slate-300 leading-relaxed max-w-[260px]">
                Glassmorphism bio card, synced audio &amp; interactive 3D depth.
              </p>
            </div>

            {/* Layer 3: Floating Mini Music Player Layer */}
            <div
              style={
                prefersReducedMotion
                  ? undefined
                  : {transform: 'translateZ(46px)'}
              }
              className="relative z-30 mt-5 rounded-2xl bg-[#080411]/95 border border-purple-400/30 px-3.5 py-3 shadow-[0_14px_34px_rgba(5,2,14,0.85)]"
            >
              <div className="flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <button
                    type="button"
                    onClick={() => setIsPlaying((prev) => !prev)}
                    aria-label={
                      isPlaying ? 'Pause showcase track' : 'Play showcase track'
                    }
                    className="w-8 h-8 rounded-full bg-gradient-to-br from-[#9333ea] to-[#6d28d9] hover:brightness-110 active:scale-95 flex items-center justify-center text-white shrink-0 shadow-[0_0_16px_rgba(168,85,247,0.45)] transition-all cursor-pointer"
                  >
                    {isPlaying ? (
                      <Pause className="w-3.5 h-3.5" />
                    ) : (
                      <Play className="w-3.5 h-3.5 ml-0.5" />
                    )}
                  </button>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <Music
                        className="w-3 h-3 text-purple-300 shrink-0"
                        aria-hidden="true"
                      />
                      <p className="text-xs font-semibold text-white truncate">
                        Starlight Odyssey
                      </p>
                      {isPlaying && !prefersReducedMotion && (
                        <span
                          aria-hidden="true"
                          className="inline-flex items-end gap-0.5 h-3 shrink-0"
                        >
                          <motion.span
                            animate={{scaleY: [0.4, 1, 0.5, 0.9, 0.4]}}
                            transition={{
                              duration: 0.9,
                              repeat: Infinity,
                              ease: 'easeInOut',
                            }}
                            className="w-0.5 h-full origin-bottom bg-purple-400 rounded-full"
                          />
                          <motion.span
                            animate={{scaleY: [0.9, 0.4, 1, 0.45, 0.9]}}
                            transition={{
                              duration: 0.75,
                              repeat: Infinity,
                              ease: 'easeInOut',
                            }}
                            className="w-0.5 h-full origin-bottom bg-fuchsia-400 rounded-full"
                          />
                          <motion.span
                            animate={{scaleY: [0.5, 0.95, 0.4, 0.85, 0.5]}}
                            transition={{
                              duration: 1.05,
                              repeat: Infinity,
                              ease: 'easeInOut',
                            }}
                            className="w-0.5 h-full origin-bottom bg-purple-300 rounded-full"
                          />
                        </span>
                      )}
                    </div>
                    <p className="text-[10.5px] text-purple-300/90 truncate">
                      KSLV Noh &amp; Clouskee
                    </p>
                  </div>
                </div>

                <span className="font-mono text-[11px] text-purple-200 tabular-nums shrink-0">
                  {countdown}
                </span>
              </div>

              <div className="mt-2.5 h-1 w-full rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#7c3aed] via-[#a855f7] to-[#ec4899] transition-[width] duration-500"
                  style={{
                    width: `${Math.round(((124 - secondsLeft) / 124) * 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </Tilt3DCard>
      </motion.div>
    </motion.div>
  );
}
