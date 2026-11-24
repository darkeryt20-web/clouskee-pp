import {useCallback, useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  Crown,
  Eye,
  RefreshCw,
  Trophy,
} from 'lucide-react';
import {motion, useReducedMotion} from 'motion/react';
import {
  fetchLeaderboardProfiles,
  isSupabaseConfigured,
  ProfileRecord,
} from '../lib/supabase';
import {sanitizeExternalUrl} from '../lib/domain';
import {SmartImage} from './CloudinaryMedia';

function formatCompactViews(count: number): string {
  if (!Number.isFinite(count) || count <= 0) return '0';
  if (count >= 1_000_000) {
    const val = count / 1_000_000;
    return `${val >= 10 ? Math.round(val) : val.toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (count >= 1_000) {
    const val = count / 1_000;
    return `${val >= 100 ? Math.round(val) : val.toFixed(1).replace(/\.0$/, '')}K`;
  }
  return String(Math.round(count));
}

function getCreatorDescriptor(profile: ProfileRecord): string {
  const tier = profile.is_admin
    ? 'Founder'
    : profile.badges?.some((b) => b.toLowerCase().includes('verified'))
      ? 'Verified'
      : profile.plan === 'premium'
        ? 'Premium'
        : 'Creator';

  const linkCount = Array.isArray(profile.links) ? profile.links.length : 0;
  if (linkCount > 0) {
    return `${tier} · ${linkCount} ${linkCount === 1 ? 'link' : 'links'}`;
  }
  return `${tier} · Bio Page`;
}

interface PodiumTheme {
  rank: 1 | 2 | 3;
  orderClass: string;
  elevationClass: string;
  rimGradient: string;
  auraStyle: string;
  badgeClasses: string;
  avatarRingClass: string;
  viewsColorClass: string;
  pedestalGlow: string;
}

const PODIUM_THEMES: Record<1 | 2 | 3, PodiumTheme> = {
  1: {
    rank: 1,
    orderClass: 'order-1 md:order-2',
    elevationClass: 'md:-translate-y-6',
    rimGradient:
      'from-amber-300 via-yellow-200/90 to-purple-500/80',
    auraStyle:
      'radial-gradient(circle at 50% 42%, rgba(250, 204, 21, 0.28) 0%, rgba(139, 92, 246, 0.28) 46%, rgba(7, 3, 13, 0) 76%)',
    badgeClasses:
      'bg-gradient-to-br from-amber-300 via-amber-400 to-yellow-600 text-[#160b04] shadow-[0_6px_22px_rgba(251,191,36,0.5)] border border-amber-100/70',
    avatarRingClass:
      'ring-2 ring-amber-300/80 shadow-[0_0_28px_rgba(251,191,36,0.35)]',
    viewsColorClass: 'text-amber-200',
    pedestalGlow:
      'from-transparent via-amber-300/50 to-transparent',
  },
  2: {
    rank: 2,
    orderClass: 'order-2 md:order-1',
    elevationClass: 'md:translate-y-2',
    rimGradient:
      'from-slate-200 via-slate-400/80 to-indigo-500/60',
    auraStyle:
      'radial-gradient(circle at 50% 45%, rgba(203, 213, 225, 0.22) 0%, rgba(124, 58, 237, 0.16) 50%, rgba(7, 3, 13, 0) 76%)',
    badgeClasses:
      'bg-gradient-to-br from-slate-100 via-slate-300 to-slate-500 text-slate-950 shadow-[0_6px_18px_rgba(203,213,225,0.35)] border border-white/60',
    avatarRingClass:
      'ring-2 ring-slate-300/70 shadow-[0_0_22px_rgba(203,213,225,0.22)]',
    viewsColorClass: 'text-slate-100',
    pedestalGlow:
      'from-transparent via-slate-300/35 to-transparent',
  },
  3: {
    rank: 3,
    orderClass: 'order-3 md:order-3',
    elevationClass: 'md:translate-y-4',
    rimGradient:
      'from-amber-500 via-orange-400/85 to-purple-600/60',
    auraStyle:
      'radial-gradient(circle at 50% 45%, rgba(245, 158, 11, 0.22) 0%, rgba(168, 85, 247, 0.15) 50%, rgba(7, 3, 13, 0) 76%)',
    badgeClasses:
      'bg-gradient-to-br from-amber-400 via-orange-500 to-amber-700 text-[#190a02] shadow-[0_6px_18px_rgba(245,158,11,0.35)] border border-amber-200/50',
    avatarRingClass:
      'ring-2 ring-amber-500/75 shadow-[0_0_22px_rgba(245,158,11,0.24)]',
    viewsColorClass: 'text-amber-200',
    pedestalGlow:
      'from-transparent via-amber-500/35 to-transparent',
  },
};

function ProfileAvatar({
  profile,
  sizeClass,
  ringClass = '',
}: {
  profile: ProfileRecord;
  sizeClass: string;
  ringClass?: string;
}) {
  const displayName = profile.global_name || profile.username;
  const safeAvatar = sanitizeExternalUrl(profile.avatar_url);
  const safeDeco = sanitizeExternalUrl(profile.avatar_decoration_url);

  const fallback = (
    <div
      className={`w-full h-full rounded-full bg-gradient-to-br from-[#7c3aed] via-[#5b21b6] to-[#1e1038] flex items-center justify-center font-extrabold text-white select-none`}
    >
      {displayName.charAt(0).toUpperCase()}
    </div>
  );

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${sizeClass}`}
    >
      <div
        className={`w-full h-full rounded-full overflow-hidden bg-[#120922] ${ringClass}`}
      >
        <SmartImage
          src={safeAvatar}
          alt={displayName}
          width={160}
          height={160}
          className="w-full h-full rounded-full object-cover object-center block"
          fallback={fallback}
        />
      </div>
      {safeDeco && (
        <SmartImage
          src={safeDeco}
          alt=""
          ariaHidden
          width={192}
          height={192}
          className="pointer-events-none select-none absolute inset-0 w-full h-full object-contain object-center scale-[1.2] origin-center block z-10"
        />
      )}
    </div>
  );
}

export function HomeLeaderboardSection() {
  const prefersReducedMotion = useReducedMotion();
  const [timeframe, setTimeframe] = useState<'all' | 'month'>('all');
  const [profiles, setProfiles] = useState<ProfileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLeaderboard = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setProfiles([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetchLeaderboardProfiles(timeframe);
      if (res.error) {
        setError(res.error);
        setProfiles([]);
      } else {
        setProfiles(res.data);
      }
    } finally {
      setLoading(false);
    }
  }, [timeframe]);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  const topThree = profiles.slice(0, 3);
  const restProfiles = profiles.slice(3, 10);

  const podiumGridClass =
    topThree.length === 1
      ? 'max-w-xs mx-auto grid-cols-1'
      : topThree.length === 2
        ? 'max-w-2xl mx-auto grid-cols-1 md:grid-cols-2'
        : 'grid-cols-1 md:grid-cols-3';

  return (
    <section
      id="leaderboard"
      className="relative max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-20"
    >
      {/* Ambient Backdrop */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-6 bottom-0 overflow-hidden"
      >
        <div
          className="absolute top-6 left-1/2 -translate-x-1/2 w-[720px] h-[360px] rounded-full blur-[135px] opacity-45"
          style={{
            background:
              'radial-gradient(circle, rgba(124, 58, 237, 0.34) 0%, rgba(250, 204, 21, 0.08) 45%, rgba(7, 3, 13, 0) 74%)',
          }}
        />
      </div>

      {/* Section Header + Timeframe Filter */}
      <motion.div
        initial={prefersReducedMotion ? false : {opacity: 0, y: 18}}
        whileInView={{opacity: 1, y: 0}}
        viewport={{once: true, amount: 0.2}}
        transition={{duration: 0.5, ease: [0.22, 1, 0.36, 1]}}
        className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6"
      >
        <div className="max-w-xl">
          <p className="inline-flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-[0.2em] text-purple-300">
            <Trophy className="w-3.5 h-3.5 text-amber-300" aria-hidden="true" />
            <span>Creator Podium</span>
          </p>
          <h2 className="mt-2.5 text-3xl sm:text-[40px] font-extrabold tracking-tight text-white leading-tight text-balance">
            Top Clouskee PP Profiles
          </h2>
          <p className="mt-2.5 text-sm sm:text-base text-[#b2abc4] leading-relaxed">
            Discover the highest-viewed creator bio pages across the network.
            Click any podium shield or row to visit their profile.
          </p>
        </div>

        {/* Interactive Segmented Timeframe Control */}
        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <div
            role="group"
            aria-label="Leaderboard timeframe"
            className="inline-flex items-center gap-1 p-1 rounded-xl bg-[#0e071a] border border-purple-500/25"
          >
            <button
              type="button"
              onClick={() => setTimeframe('all')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                timeframe === 'all'
                  ? 'bg-gradient-to-r from-[#7c3aed] to-[#9333ea] text-white shadow-[0_0_18px_rgba(139,92,246,0.4)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Time
            </button>
            <button
              type="button"
              onClick={() => setTimeframe('month')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                timeframe === 'month'
                  ? 'bg-gradient-to-r from-[#7c3aed] to-[#9333ea] text-white shadow-[0_0_18px_rgba(139,92,246,0.4)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              This Month
            </button>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="relative z-10 mt-12">
        {loading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end pt-4">
              {[2, 1, 3].map((slot) => (
                <div
                  key={slot}
                  className={`${
                    slot === 1
                      ? 'md:-translate-y-4 h-[330px]'
                      : 'h-[296px]'
                  } podium-shield-clip p-[1px] bg-purple-500/20 animate-pulse`}
                >
                  <div className="w-full h-full podium-shield-clip bg-[#100820]/95 flex flex-col items-center justify-center p-6">
                    <div className="w-16 h-16 rounded-full bg-purple-500/15" />
                    <div className="mt-4 w-28 h-4 rounded bg-purple-500/15" />
                    <div className="mt-2 w-20 h-3 rounded bg-purple-500/10" />
                    <div className="mt-5 w-16 h-5 rounded bg-purple-500/15" />
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-2.5">
              {[4, 5, 6].map((row) => (
                <div
                  key={row}
                  className="h-[66px] rounded-2xl bg-[#0d0719]/80 border border-purple-500/15 animate-pulse"
                />
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="rounded-2xl bg-[#0d0719]/90 border border-rose-500/25 p-8 text-center">
            <p className="text-sm text-rose-200">
              Unable to load creator rankings right now ({error}).
            </p>
            <button
              type="button"
              onClick={loadLeaderboard}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-purple-600/25 hover:bg-purple-600/40 border border-purple-400/35 px-4 py-2 text-xs font-semibold text-white transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Retry</span>
            </button>
          </div>
        ) : profiles.length === 0 ? (
          <div className="rounded-2xl bg-[#0d0719]/90 border border-purple-500/20 p-10 text-center">
            <Trophy
              className="w-8 h-8 text-purple-300 mx-auto"
              aria-hidden="true"
            />
            <h3 className="mt-3 text-lg font-bold text-white">
              Claim the #1 Podium Spot
            </h3>
            <p className="mt-1.5 text-sm text-[#b2abc4] max-w-md mx-auto">
              Be among the first creators on the Clouskee PP leaderboard. Create
              your custom profile page and share your link.
            </p>
            <Link
              to="/signup"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#9333ea] hover:brightness-110 active:scale-[0.97] px-5 py-2.5 text-sm font-semibold text-white transition-all"
            >
              <span>Create Your Profile</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>
        ) : (
          <>
            {/* Top 3 Pointed Shield Podium */}
            <div
              className={`grid ${podiumGridClass} gap-6 lg:gap-7 items-end pt-6 md:pt-8`}
            >
              {topThree.map((profile, idx) => {
                const rank = (idx + 1) as 1 | 2 | 3;
                const theme =
                  topThree.length < 3 && rank === 1
                    ? {
                        ...PODIUM_THEMES[1],
                        orderClass: 'order-1',
                        elevationClass: '',
                      }
                    : topThree.length === 2 && rank === 2
                      ? {
                          ...PODIUM_THEMES[2],
                          orderClass: 'order-2',
                          elevationClass: '',
                        }
                      : PODIUM_THEMES[rank];

                const views =
                  timeframe === 'all'
                    ? (profile.views ?? 0)
                    : (profile.monthly_views ?? 0);
                const displayName = profile.global_name || profile.username;
                const isFirst = rank === 1;

                return (
                  <div
                    key={profile.id}
                    className={`${theme.orderClass} ${theme.elevationClass}`}
                  >
                    <motion.div
                      initial={prefersReducedMotion ? false : {opacity: 0, y: 24}}
                      whileInView={{opacity: 1, y: 0}}
                      viewport={{once: true, amount: 0.15}}
                      transition={{
                        duration: 0.55,
                        delay: rank === 1 ? 0.05 : rank === 2 ? 0.14 : 0.22,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                    >
                      <Link
                        to={`/${encodeURIComponent(profile.username)}`}
                        className="group relative block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 rounded-2xl transition-transform duration-300 hover:-translate-y-1.5"
                      >
                        <div
                          className={
                            isFirst && !prefersReducedMotion
                              ? 'animate-gentle-float'
                              : ''
                          }
                        >
                      {/* Ambient Podium Glow Behind Shield */}
                      <div
                        aria-hidden="true"
                        className={`pointer-events-none absolute -inset-4 rounded-3xl blur-2xl ${
                          prefersReducedMotion ? 'opacity-65' : 'animate-podium-glow'
                        }`}
                        style={{background: theme.auraStyle}}
                      />

                      {/* Floating Rank Emblem Above Shield Crest */}
                      <div className="relative z-20 flex justify-center -mb-4">
                        <div
                          className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-xl font-mono text-xs font-extrabold tracking-wide ${theme.badgeClasses}`}
                        >
                          {isFirst && (
                            <Crown className="w-3.5 h-3.5" aria-hidden="true" />
                          )}
                          <span>#{rank}</span>
                        </div>
                      </div>

                      {/* Outer Shield Gradient Rim */}
                      <div
                        className={`relative z-10 podium-shield-clip p-[1.5px] bg-gradient-to-b ${theme.rimGradient} shadow-[0_24px_60px_rgba(4,2,10,0.85)]`}
                      >
                        {/* Inner Dark Frosted Glass Shield Body */}
                        <div
                          className={`relative podium-shield-clip bg-[#0b0616]/95 backdrop-blur-xl px-6 ${
                            isFirst ? 'pt-9 pb-14' : 'pt-8 pb-12'
                          } flex flex-col items-center text-center overflow-hidden`}
                        >
                          {/* Subtle Animated Light Sweep on Hover / Idle */}
                          {!prefersReducedMotion && (
                            <div
                              aria-hidden="true"
                              className="pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent animate-podium-shimmer"
                            />
                          )}

                          {/* Top Rim Specular Highlight */}
                          <div
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent"
                          />

                          {/* Circular Avatar */}
                          <ProfileAvatar
                            profile={profile}
                            sizeClass={
                              isFirst ? 'w-20 h-20 text-2xl' : 'w-16 h-16 text-xl'
                            }
                            ringClass={theme.avatarRingClass}
                          />

                          {/* Creator Display Name & Handle */}
                          <h3 className="mt-4 w-full text-lg font-extrabold tracking-tight text-white truncate group-hover:text-purple-200 transition-colors">
                            {displayName}
                          </h3>
                          <p className="mt-0.5 w-full font-mono text-xs text-purple-300/90 truncate">
                            @{profile.username}
                          </p>

                          {/* Clean Creator Link-in-Bio Metadata */}
                          <p className="mt-2.5 text-xs text-slate-400 truncate max-w-full">
                            {getCreatorDescriptor(profile)}
                          </p>

                          {/* Views Metric */}
                          <div
                            title={`${views.toLocaleString()} profile views`}
                            className="mt-4 inline-flex items-center gap-1.5 font-mono tabular-nums"
                          >
                            <Eye
                              className="w-3.5 h-3.5 text-purple-300"
                              aria-hidden="true"
                            />
                            <span
                              className={`text-xl font-extrabold ${theme.viewsColorClass}`}
                            >
                              {formatCompactViews(views)}
                            </span>
                            <span className="text-[11px] font-medium text-slate-400">
                              views
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Subtle Ground Glow Line Beneath Pointed Shield Tip */}
                      <div
                        aria-hidden="true"
                        className={`mx-auto mt-2 h-[2px] w-24 rounded-full bg-gradient-to-r ${theme.pedestalGlow} opacity-70 group-hover:w-32 transition-all duration-300`}
                      />
                        </div>
                      </Link>
                    </motion.div>
                  </div>
                );
              })}
            </div>

            {/* Ranks #4 and Below (Sleek Glassmorphism List Rows) */}
            {restProfiles.length > 0 && (
              <div className="mt-10 space-y-2.5">
                {restProfiles.map((profile, idx) => {
                  const rank = idx + 4;
                  const views =
                    timeframe === 'all'
                      ? (profile.views ?? 0)
                      : (profile.monthly_views ?? 0);
                  const displayName = profile.global_name || profile.username;

                  return (
                    <motion.div
                      key={profile.id}
                      initial={prefersReducedMotion ? false : {opacity: 0, y: 12}}
                      whileInView={{opacity: 1, y: 0}}
                      viewport={{once: true, amount: 0.15}}
                      transition={{
                        duration: 0.35,
                        delay: Math.min(idx * 0.04, 0.24),
                        ease: [0.22, 1, 0.36, 1],
                      }}
                    >
                      <Link
                        to={`/${encodeURIComponent(profile.username)}`}
                        className="group flex items-center justify-between gap-4 rounded-2xl bg-[#0c0617]/90 hover:bg-[#140a26] border border-purple-500/20 hover:border-purple-400/45 px-4 sm:px-6 py-3.5 shadow-[0_8px_28px_rgba(4,2,10,0.45)] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
                      >
                        <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                          <span className="w-7 text-center font-mono text-sm font-bold text-purple-300/90 tabular-nums shrink-0">
                            {rank}
                          </span>

                          <ProfileAvatar
                            profile={profile}
                            sizeClass="w-10 h-10 text-sm"
                            ringClass="ring-1 ring-purple-400/30"
                          />

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-sm font-bold text-white truncate group-hover:text-purple-200 transition-colors">
                                {displayName}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-400 truncate">
                              <span className="font-mono text-purple-300/85 truncate">
                                @{profile.username}
                              </span>
                              <span
                                aria-hidden="true"
                                className="hidden sm:inline text-slate-600"
                              >
                                ·
                              </span>
                              <span className="hidden sm:inline truncate">
                                {getCreatorDescriptor(profile)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <div
                            title={`${views.toLocaleString()} profile views`}
                            className="inline-flex items-center gap-1.5 font-mono text-xs sm:text-sm font-semibold text-slate-100 tabular-nums"
                          >
                            <Eye
                              className="w-3.5 h-3.5 text-purple-400"
                              aria-hidden="true"
                            />
                            <span>{formatCompactViews(views)}</span>
                            <span className="hidden sm:inline text-xs font-normal text-slate-400">
                              views
                            </span>
                          </div>
                          <ArrowUpRight
                            className="w-4 h-4 text-slate-500 group-hover:text-purple-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all"
                            aria-hidden="true"
                          />
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Footer Link to Full Leaderboard Page */}
            <div className="mt-7 flex justify-center">
              <Link
                to="/leaderboard"
                className="inline-flex items-center gap-2 rounded-xl bg-[#120923] hover:bg-[#1a0e32] border border-purple-500/30 hover:border-purple-400/55 px-5 py-2.5 text-xs sm:text-sm font-semibold text-purple-100 active:scale-[0.97] transition-all"
              >
                <span>View Full Leaderboard</span>
                <ArrowRight className="w-4 h-4 text-purple-300" aria-hidden="true" />
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
