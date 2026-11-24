import {useCallback, useEffect, useMemo, useState} from 'react';
import {
  Award,
  Crown,
  ExternalLink,
  Eye,
  Loader2,
  Medal,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
} from 'lucide-react';
import {MotionConfig, motion, useReducedMotion} from 'motion/react';
import {useAuth} from '../context/AuthContext';
import {Tilt3DCard} from '../components/Tilt3DCard';
import {
  CustomRoleBadge,
  fetchLeaderboardProfiles,
  hasPremiumAccess,
  isSupabaseConfigured,
  ProfileRecord,
} from '../lib/supabase';
import {sanitizeExternalUrl} from '../lib/domain';

type TimeframeFilter = 'all' | 'month';
type ScopeFilter = 'all' | 'creators';

interface ResolvedRole {
  label: string;
  color: string;
  kind: 'custom' | 'admin' | 'premium' | 'free';
}

function resolvePrimaryRole(profile: ProfileRecord): ResolvedRole {
  if (Array.isArray(profile.custom_roles) && profile.custom_roles.length > 0) {
    const first = profile.custom_roles[0] as string | CustomRoleBadge;
    if (typeof first === 'string' && first.trim()) {
      return {
        label: first.trim(),
        color: '#a855f7',
        kind: 'custom',
      };
    }
    if (first && typeof first === 'object' && first.name?.trim()) {
      return {
        label: first.name.trim(),
        color: /^#[0-9a-fA-F]{6}$/.test(first.color ?? '')
          ? first.color
          : '#a855f7',
        kind: 'custom',
      };
    }
  }

  if (profile.is_admin) {
    return {label: 'Admin', color: '#f59e0b', kind: 'admin'};
  }
  if (hasPremiumAccess(profile)) {
    return {label: 'Premium', color: '#a855f7', kind: 'premium'};
  }
  return {label: 'Creator', color: '#94a3b8', kind: 'free'};
}

function formatCompactViews(count: number): string {
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1).replace(/\.0$/, '')}M Views`;
  }
  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(1).replace(/\.0$/, '')}K Views`;
  }
  return `${count.toLocaleString()} ${count === 1 ? 'View' : 'Views'}`;
}

function ProfileAvatar({
  avatarUrl,
  decoUrl,
  displayName,
  sizeClass,
  ringClass,
}: {
  avatarUrl: string | null;
  decoUrl: string | null;
  displayName: string;
  sizeClass: string;
  ringClass: string;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const [decoFailed, setDecoFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [avatarUrl]);

  useEffect(() => {
    setDecoFailed(false);
  }, [decoUrl]);

  const safeAvatar = !imgFailed ? sanitizeExternalUrl(avatarUrl) : null;
  const safeDeco = !decoFailed ? sanitizeExternalUrl(decoUrl) : null;

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${sizeClass}`}
    >
      <div
        className={`relative w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-[#5b21b6] via-[#7c3aed] to-[#1e1038] ${ringClass}`}
      >
        {safeAvatar ? (
          <img
            src={safeAvatar}
            alt={displayName}
            referrerPolicy="no-referrer"
            onError={() => setImgFailed(true)}
            className="w-full h-full rounded-full object-cover object-center block"
          />
        ) : (
          <span className="font-extrabold text-white select-none leading-none">
            {displayName.charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      {safeDeco && (
        <img
          src={safeDeco}
          alt=""
          aria-hidden="true"
          referrerPolicy="no-referrer"
          onError={() => setDecoFailed(true)}
          className="pointer-events-none select-none absolute inset-0 w-full h-full object-contain object-center scale-[1.2] origin-center block z-10"
        />
      )}
    </div>
  );
}

const PODIUM_META = {
  1: {
    label: '#1',
    title: 'Rank #1',
    containerOrder: 'order-1 md:order-2 md:-translate-y-5',
    cardBorder:
      'border-amber-400/55 bg-gradient-to-b from-[#231507]/95 via-[#130a22]/95 to-[#0b0615]/95 shadow-[0_24px_70px_rgba(245,158,11,0.18),inset_0_1px_0_rgba(253,224,71,0.22)]',
    ringClass:
      'ring-2 ring-amber-400 shadow-[0_0_28px_rgba(251,191,36,0.45)] text-2xl',
    avatarSize: 'w-20 h-20 sm:w-24 sm:h-24',
    badgeClass:
      'bg-amber-500/20 border-amber-400/45 text-amber-200',
    accentText: 'text-amber-300',
    icon: Crown,
    delay: 0.05,
  },
  2: {
    label: '#2',
    title: 'Rank #2',
    containerOrder: 'order-2 md:order-1',
    cardBorder:
      'border-slate-300/35 bg-gradient-to-b from-[#171625]/95 via-[#10091e]/95 to-[#0b0615]/95 shadow-[0_18px_48px_rgba(148,163,184,0.12),inset_0_1px_0_rgba(226,232,240,0.16)]',
    ringClass:
      'ring-2 ring-slate-300/80 shadow-[0_0_22px_rgba(203,213,225,0.28)] text-xl',
    avatarSize: 'w-16 h-16 sm:w-20 sm:h-20',
    badgeClass:
      'bg-slate-400/15 border-slate-300/35 text-slate-200',
    accentText: 'text-slate-200',
    icon: Award,
    delay: 0.14,
  },
  3: {
    label: '#3',
    title: 'Rank #3',
    containerOrder: 'order-3 md:order-3',
    cardBorder:
      'border-orange-400/35 bg-gradient-to-b from-[#20120c]/95 via-[#11081d]/95 to-[#0b0615]/95 shadow-[0_18px_48px_rgba(217,119,6,0.12),inset_0_1px_0_rgba(251,146,60,0.16)]',
    ringClass:
      'ring-2 ring-orange-400/80 shadow-[0_0_22px_rgba(251,146,60,0.28)] text-xl',
    avatarSize: 'w-16 h-16 sm:w-20 sm:h-20',
    badgeClass:
      'bg-orange-500/15 border-orange-400/35 text-orange-200',
    accentText: 'text-orange-300',
    icon: Medal,
    delay: 0.22,
  },
} as const;

export function LeaderboardPage() {
  const {activeProfile} = useAuth();
  const prefersReducedMotion = useReducedMotion();
  const [timeframe, setTimeframe] = useState<TimeframeFilter>('all');
  const [scope, setScope] = useState<ScopeFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [profiles, setProfiles] = useState<ProfileRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadLeaderboard = useCallback(
    async (showSpinner = true) => {
      if (!isSupabaseConfigured) {
        setProfiles([]);
        setLoading(false);
        return;
      }
      if (showSpinner) setLoading(true);
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
        setRefreshing(false);
      }
    },
    [timeframe],
  );

  useEffect(() => {
    loadLeaderboard(true);
  }, [loadLeaderboard]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadLeaderboard(false);
  };

  const scopedProfiles = useMemo(() => {
    if (scope === 'all') return profiles;
    return profiles.filter((p) => {
      const views = timeframe === 'all' ? (p.views ?? 0) : (p.monthly_views ?? 0);
      const hasRoles = Array.isArray(p.custom_roles) && p.custom_roles.length > 0;
      return hasPremiumAccess(p) || hasRoles || views >= 50;
    });
  }, [profiles, scope, timeframe]);

  const rankedEntries = useMemo(
    () => scopedProfiles.map((profile, idx) => ({profile, rank: idx + 1})),
    [scopedProfiles],
  );

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredEntries = useMemo(() => {
    if (!normalizedQuery) return rankedEntries;
    return rankedEntries.filter(({profile}) => {
      return (
        profile.username.toLowerCase().includes(normalizedQuery) ||
        (profile.global_name ?? '').toLowerCase().includes(normalizedQuery)
      );
    });
  }, [normalizedQuery, rankedEntries]);

  const currentUserEntry = useMemo(() => {
    if (!activeProfile) return null;
    return (
      rankedEntries.find(({profile}) => profile.id === activeProfile.id) ??
      null
    );
  }, [activeProfile, rankedEntries]);

  const showPodium =
    !loading && !error && !normalizedQuery && scopedProfiles.length > 0;
  const topThreeEntries = showPodium ? rankedEntries.slice(0, 3) : [];
  const listEntries = showPodium ? rankedEntries.slice(3) : filteredEntries;

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-[88vh] bg-[#07030d] px-4 sm:px-6 pt-32 sm:pt-36 pb-24 relative overflow-hidden">
        {/* Ambient Grid, Starfield & Glow Backdrop */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
          <div className="absolute inset-0 bg-cyber-grid opacity-40 [mask-image:radial-gradient(ellipse_at_top,black_25%,transparent_75%)]" />
          <div className="absolute -inset-6 bg-starfield opacity-55 animate-starfield-drift [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_80%)]" />
          <div
            className="absolute -top-10 left-1/2 -translate-x-1/2 w-[820px] h-[420px] rounded-full blur-[130px] opacity-60 animate-orb-drift"
            style={{
              background:
                'radial-gradient(circle, rgba(124, 58, 237, 0.25) 0%, rgba(245, 158, 11, 0.08) 48%, rgba(7, 3, 13, 0) 74%)',
            }}
          />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto">
          {/* Header */}
          <motion.div
            initial={prefersReducedMotion ? false : {opacity: 0, y: 16}}
            animate={{opacity: 1, y: 0}}
            transition={{duration: 0.5, ease: [0.22, 1, 0.36, 1]}}
            className="text-center max-w-2xl mx-auto"
          >
            <p className="inline-flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-[0.2em] text-amber-300/90">
              <Trophy className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
              <span>Clouskee PP Hall of Fame</span>
            </p>

            <h1 className="mt-4 text-[clamp(2.25rem,4.5vw,3.5rem)] font-extrabold tracking-tight text-white text-balance">
              Creator Views Leaderboard
            </h1>

            <p className="mt-3 text-sm sm:text-base text-[#b2abc4]">
              Top Clouskee PP link-in-bio profiles ranked by total profile views.
            </p>

            {/* Filter Controls Row */}
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              {/* Timeframe Segmented Control */}
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
                      ? 'bg-gradient-to-r from-[#7c3aed] to-[#9333ea] text-white shadow-[0_0_20px_rgba(139,92,246,0.45)]'
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
                      ? 'bg-gradient-to-r from-[#7c3aed] to-[#9333ea] text-white shadow-[0_0_20px_rgba(139,92,246,0.45)]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  This Month
                </button>
              </div>

              {/* Creator Scope Segmented Control */}
              <div
                role="group"
                aria-label="Profile filter"
                className="inline-flex items-center gap-1 p-1 rounded-xl bg-[#0e071a] border border-purple-500/25"
              >
                <button
                  type="button"
                  onClick={() => setScope('all')}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    scope === 'all'
                      ? 'bg-purple-500/25 text-purple-100 border border-purple-400/40'
                      : 'text-slate-400 hover:text-white border border-transparent'
                  }`}
                >
                  All Profiles
                </button>
                <button
                  type="button"
                  onClick={() => setScope('creators')}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    scope === 'creators'
                      ? 'bg-purple-500/25 text-purple-100 border border-purple-400/40'
                      : 'text-slate-400 hover:text-white border border-transparent'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-300" aria-hidden="true" />
                  <span>Top Creators</span>
                </button>
              </div>
            </div>
          </motion.div>

          {/* Search, Refresh & Logged-In Rank Summary */}
          <div className="mt-8 max-w-2xl mx-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex-1 flex items-center rounded-xl bg-[#0b0615] border border-purple-500/25 focus-within:border-purple-400/65 px-4 py-2.5 transition-colors">
              <Search
                className="w-4 h-4 text-slate-400 mr-2.5 shrink-0"
                aria-hidden="true"
              />
              <label htmlFor="leaderboard-search" className="sr-only">
                Search registered username or display name
              </label>
              <input
                id="leaderboard-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search creator display name or @username..."
                className="w-full bg-transparent text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2.5 justify-between sm:justify-end">
              {currentUserEntry && (
                <a
                  href={`/${encodeURIComponent(currentUserEntry.profile.username)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-400/35 px-3.5 py-2.5 text-xs font-semibold text-purple-100 transition-colors whitespace-nowrap"
                >
                  <span className="font-mono text-purple-300 tabular-nums">
                    Your Rank #{currentUserEntry.rank}
                  </span>
                  <span aria-hidden="true" className="text-purple-400/60">
                    ·
                  </span>
                  <span className="tabular-nums">
                    {formatCompactViews(
                      timeframe === 'all'
                        ? (currentUserEntry.profile.views ?? 0)
                        : (currentUserEntry.profile.monthly_views ?? 0),
                    )}
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-purple-300" aria-hidden="true" />
                </a>
              )}

              <button
                type="button"
                onClick={handleRefresh}
                aria-label="Refresh leaderboard"
                className="w-10 h-10 rounded-xl bg-[#0b0615] hover:bg-[#150b28] border border-purple-500/25 hover:border-purple-400/50 flex items-center justify-center text-slate-300 hover:text-white active:scale-95 transition-all shrink-0 cursor-pointer"
              >
                <RefreshCw
                  className={`w-4 h-4 ${refreshing ? 'animate-spin text-purple-300' : ''}`}
                  aria-hidden="true"
                />
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-6 max-w-xl mx-auto rounded-xl border border-rose-500/35 bg-rose-950/30 px-4 py-3 text-center text-xs sm:text-sm text-rose-200">
              <p>{error}</p>
              <button
                type="button"
                onClick={handleRefresh}
                className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 px-3 py-1.5 text-xs font-semibold text-white transition-colors cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="mt-14 py-16 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-7 h-7 text-purple-400 animate-spin" />
              <p className="text-xs font-mono text-slate-400">
                Loading Clouskee PP creator rankings...
              </p>
            </div>
          )}

          {/* Top 3 Animated Podium */}
          {showPodium && (
            <section
              aria-label="Top 3 Creators Podium"
              className="mt-12 md:mt-16"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6 items-end">
                {topThreeEntries.map(({profile, rank}) => {
                  const meta =
                    PODIUM_META[rank as 1 | 2 | 3] ?? PODIUM_META[3];
                  const RankIcon = meta.icon;
                  const views =
                    timeframe === 'all'
                      ? (profile.views ?? 0)
                      : (profile.monthly_views ?? 0);
                  const displayName = profile.global_name || profile.username;
                  const primaryRole = resolvePrimaryRole(profile);
                  const isYou = Boolean(
                    activeProfile && activeProfile.id === profile.id,
                  );

                  return (
                    <motion.div
                      key={profile.id}
                      initial={
                        prefersReducedMotion
                          ? false
                          : {opacity: 0, y: 28, scale: 0.96}
                      }
                      animate={{opacity: 1, y: 0, scale: 1}}
                      transition={{
                        duration: 0.55,
                        delay: meta.delay,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      className={`relative ${meta.containerOrder}`}
                    >
                      {/* Radiant Pulse Aura on #1 */}
                      {rank === 1 && !prefersReducedMotion && (
                        <motion.div
                          aria-hidden="true"
                          animate={{
                            opacity: [0.45, 0.78, 0.45],
                            scale: [0.98, 1.03, 0.98],
                          }}
                          transition={{
                            duration: 3.4,
                            repeat: Infinity,
                            ease: 'easeInOut',
                          }}
                          className="pointer-events-none absolute -inset-3 rounded-3xl blur-2xl"
                          style={{
                            background:
                              'radial-gradient(circle at 50% 35%, rgba(251, 191, 36, 0.28), rgba(139, 92, 246, 0.16) 55%, transparent 78%)',
                          }}
                        />
                      )}

                      <Tilt3DCard
                        maxTiltDeg={rank === 1 ? 8 : 6}
                        glareOpacity={rank === 1 ? 0.22 : 0.16}
                        scaleOnHover={1.02}
                        innerClassName="rounded-3xl"
                      >
                        <div
                          className={`relative rounded-3xl border p-6 sm:p-7 flex flex-col items-center text-center transition-colors ${
                            meta.cardBorder
                          } ${rank === 1 ? 'md:pb-9 md:pt-8' : ''} ${
                            isYou ? 'ring-1 ring-purple-400/70' : ''
                          }`}
                        >
                          {/* Rank Header Row */}
                          <div className="w-full flex items-center justify-between gap-2">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-bold tracking-wide ${meta.badgeClass}`}
                            >
                              <RankIcon
                                className="w-3.5 h-3.5"
                                aria-hidden="true"
                              />
                              <span className="font-mono">{meta.label}</span>
                            </span>

                            {isYou ? (
                              <span className="rounded-md bg-purple-500/25 border border-purple-400/50 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-purple-100">
                                YOU
                              </span>
                            ) : (
                              <span
                                className="rounded-md border px-2 py-0.5 text-[11px] font-semibold"
                                style={{
                                  borderColor: `${primaryRole.color}55`,
                                  backgroundColor: `${primaryRole.color}1a`,
                                  color:
                                    primaryRole.kind === 'free'
                                      ? '#cbd5e1'
                                      : '#f5f3ff',
                                }}
                              >
                                {primaryRole.label}
                              </span>
                            )}
                          </div>

                          {/* Avatar + Floating Rank Crown on #1 */}
                          <div className="mt-5 relative flex flex-col items-center">
                            {rank === 1 && (
                              <motion.div
                                aria-hidden="true"
                                animate={
                                  prefersReducedMotion
                                    ? undefined
                                    : {y: [0, -4, 0]}
                                }
                                transition={
                                  prefersReducedMotion
                                    ? undefined
                                    : {
                                        duration: 2.8,
                                        repeat: Infinity,
                                        ease: 'easeInOut',
                                      }
                                }
                                className="mb-2 text-amber-300 drop-shadow-[0_0_12px_rgba(251,191,36,0.75)]"
                              >
                                <Crown className="w-6 h-6" />
                              </motion.div>
                            )}

                            <ProfileAvatar
                              avatarUrl={profile.avatar_url}
                              decoUrl={profile.avatar_decoration_url}
                              displayName={displayName}
                              sizeClass={meta.avatarSize}
                              ringClass={meta.ringClass}
                            />
                          </div>

                          {/* Display Name + Username */}
                          <h2 className="mt-4 max-w-full text-lg sm:text-xl font-extrabold text-white truncate">
                            {displayName}
                          </h2>
                          <p className="mt-0.5 font-mono text-xs text-purple-300/90 truncate max-w-full">
                            @{profile.username}
                          </p>

                          {/* Optional Short Clouskee Bio */}
                          {profile.bio && (
                            <p className="mt-2.5 text-xs text-slate-400 line-clamp-1 max-w-[240px]">
                              {profile.bio}
                            </p>
                          )}

                          {/* Total Profile Views Metric */}
                          <div className="mt-5 w-full rounded-2xl bg-[#07030d]/85 border border-purple-500/20 px-4 py-3 flex items-center justify-between gap-2">
                            <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                              <Eye
                                className={`w-3.5 h-3.5 ${meta.accentText}`}
                                aria-hidden="true"
                              />
                              <span>
                                {timeframe === 'all'
                                  ? 'Total Views'
                                  : 'Monthly Views'}
                              </span>
                            </span>
                            <span
                              title={`${views.toLocaleString()} profile views`}
                              className={`font-mono text-sm font-bold tabular-nums ${meta.accentText}`}
                            >
                              {formatCompactViews(views)}
                            </span>
                          </div>

                          {/* Visit Profile CTA (Opens in New Tab) */}
                          <a
                            href={`/${encodeURIComponent(profile.username)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="relative z-30 mt-4 w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/35 border border-purple-400/35 hover:border-purple-300/60 py-2.5 px-4 text-xs font-semibold text-white active:scale-[0.97] transition-all whitespace-nowrap"
                          >
                            <span>Visit Profile</span>
                            <ExternalLink
                              className="w-3.5 h-3.5 text-purple-300"
                              aria-hidden="true"
                            />
                          </a>
                        </div>
                      </Tilt3DCard>
                    </motion.div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Ranks #4+ (or Search Results) Table */}
          {!loading && (listEntries.length > 0 || !showPodium) && (
            <section
              aria-label="Ranked Creators List"
              className="mt-10 overflow-hidden rounded-2xl border border-purple-500/25 bg-[#0b0615]/95 shadow-[0_18px_50px_rgba(4,2,10,0.65)]"
            >
              <div className="grid grid-cols-12 items-center gap-2 px-4 sm:px-7 py-3.5 bg-gradient-to-r from-[#240f47] via-[#1c0c38] to-[#240f47] border-b border-purple-500/25 text-[11px] font-bold tracking-wider uppercase text-purple-200">
                <div className="col-span-2 sm:col-span-1">Rank</div>
                <div className="col-span-6 sm:col-span-6">Creator</div>
                <div className="hidden sm:block sm:col-span-2">Role</div>
                <div className="col-span-4 sm:col-span-3 text-right">
                  {timeframe === 'all' ? 'Profile Views' : 'Monthly Views'}
                </div>
              </div>

              {filteredEntries.length === 0 ? (
                <div className="py-16 px-6 text-center flex flex-col items-center gap-2">
                  <Users className="w-6 h-6 text-purple-400/70" aria-hidden="true" />
                  <p className="font-mono text-xs sm:text-sm text-slate-400">
                    {normalizedQuery
                      ? `No Clouskee PP profiles found matching "${searchQuery}".`
                      : 'No registered profiles match the current filter.'}
                  </p>
                </div>
              ) : listEntries.length === 0 ? (
                <div className="py-10 px-6 text-center text-xs sm:text-sm text-slate-400">
                  All matching creators are featured on the Top 3 podium above.
                </div>
              ) : (
                <div className="divide-y divide-purple-500/10">
                  {listEntries.map(({profile, rank}, idx) => {
                    const views =
                      timeframe === 'all'
                        ? (profile.views ?? 0)
                        : (profile.monthly_views ?? 0);
                    const displayName = profile.global_name || profile.username;
                    const primaryRole = resolvePrimaryRole(profile);
                    const isYou = Boolean(
                      activeProfile && activeProfile.id === profile.id,
                    );

                    return (
                      <motion.div
                        key={profile.id}
                        initial={
                          prefersReducedMotion ? false : {opacity: 0, y: 10}
                        }
                        whileInView={{opacity: 1, y: 0}}
                        viewport={{once: true, amount: 0.1}}
                        transition={{
                          duration: 0.35,
                          delay: Math.min(idx * 0.03, 0.24),
                          ease: [0.22, 1, 0.36, 1],
                        }}
                        className={`grid grid-cols-12 items-center gap-2 px-4 sm:px-7 py-3.5 text-sm transition-colors ${
                          isYou
                            ? 'bg-purple-500/[0.12] hover:bg-purple-500/[0.16]'
                            : 'hover:bg-purple-500/[0.06]'
                        }`}
                      >
                        <div className="col-span-2 sm:col-span-1 font-mono font-bold text-purple-300 tabular-nums">
                          #{rank}
                        </div>

                        <div className="col-span-6 sm:col-span-6 flex items-center gap-3 min-w-0">
                          <ProfileAvatar
                            avatarUrl={profile.avatar_url}
                            decoUrl={profile.avatar_decoration_url}
                            displayName={displayName}
                            sizeClass="w-11 h-11 text-sm"
                            ringClass="border border-purple-400/35"
                          />

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="font-semibold text-white truncate">
                                {displayName}
                              </span>
                              {isYou && (
                                <span className="rounded bg-purple-500/30 border border-purple-400/50 px-1.5 py-0.5 font-mono text-[10px] font-bold text-purple-100 shrink-0">
                                  YOU
                                </span>
                              )}
                            </div>
                            <div className="font-mono text-xs text-slate-400 truncate">
                              @{profile.username}
                            </div>
                          </div>
                        </div>

                        <div className="hidden sm:flex sm:col-span-2 items-center">
                          <span
                            className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold truncate max-w-full"
                            style={{
                              borderColor: `${primaryRole.color}45`,
                              backgroundColor: `${primaryRole.color}18`,
                              color:
                                primaryRole.kind === 'free'
                                  ? '#cbd5e1'
                                  : '#f5f3ff',
                            }}
                          >
                            {primaryRole.kind === 'admin' && (
                              <ShieldCheck
                                className="w-3 h-3 text-amber-300 shrink-0"
                                aria-hidden="true"
                              />
                            )}
                            <span className="truncate">{primaryRole.label}</span>
                          </span>
                        </div>

                        <div className="col-span-4 sm:col-span-3 flex items-center justify-end gap-2.5 sm:gap-3">
                          <span
                            title={`${views.toLocaleString()} profile views`}
                            className="font-mono text-xs sm:text-sm font-semibold text-slate-200 tabular-nums whitespace-nowrap"
                          >
                            {formatCompactViews(views)}
                          </span>

                          <a
                            href={`/${encodeURIComponent(profile.username)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Open ${displayName} profile in new tab`}
                            className="inline-flex items-center justify-center gap-1 rounded-lg bg-[#160c29] hover:bg-purple-600/30 border border-purple-500/30 hover:border-purple-400/55 px-2.5 py-1.5 text-xs font-semibold text-purple-100 active:scale-95 transition-all shrink-0"
                          >
                            <span className="hidden md:inline">Visit</span>
                            <ExternalLink
                              className="w-3.5 h-3.5 text-purple-300"
                              aria-hidden="true"
                            />
                          </a>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </MotionConfig>
  );
}
