import {useCallback, useEffect, useState} from 'react';
import {Loader2, RefreshCw, Search, Trophy} from 'lucide-react';
import {
  fetchLeaderboardProfiles,
  isSupabaseConfigured,
  ProfileRecord,
} from '../lib/supabase';
import {sanitizeExternalUrl} from '../lib/domain';

export function LeaderboardPage() {
  const [timeframe, setTimeframe] = useState<'all' | 'month'>('all');
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

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredProfiles = profiles.filter((profile) => {
    if (!normalizedQuery) return true;
    return (
      profile.username.toLowerCase().includes(normalizedQuery) ||
      (profile.global_name ?? '').toLowerCase().includes(normalizedQuery)
    );
  });

  return (
    <div className="min-h-[85vh] bg-[#07030d] px-4 sm:px-6 pt-32 sm:pt-36 pb-24 relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[780px] h-[380px] rounded-full blur-[120px] opacity-55"
        style={{
          background:
            'radial-gradient(circle, rgba(124, 58, 237, 0.2) 0%, rgba(7, 3, 13, 0) 72%)',
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#1a0d30] border border-purple-500/35 px-4 py-1.5 text-xs font-medium text-purple-200 shadow-[0_0_20px_rgba(139,92,246,0.18)]">
            <Trophy className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
            <span>Clouskee PP Hall of Fame</span>
          </div>

          <h1 className="mt-5 text-[clamp(2.25rem,4.5vw,3.35rem)] font-extrabold tracking-tight text-white">
            Views Leaderboard
          </h1>

          <p className="mt-3 text-sm sm:text-base text-[#b2abc4]">
            Top verified creators and registered accounts ranked by total
            platform views.
          </p>

          {/* Timeframe Filter Toggle Pills */}
          <div className="mt-7 inline-flex items-center gap-1 p-1 rounded-full bg-[#0e071a] border border-purple-500/25">
            <button
              type="button"
              onClick={() => setTimeframe('all')}
              className={`px-5 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
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
              className={`px-5 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                timeframe === 'month'
                  ? 'bg-gradient-to-r from-[#7c3aed] to-[#9333ea] text-white shadow-[0_0_20px_rgba(139,92,246,0.45)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              This Month
            </button>
          </div>
        </div>

        {/* Search & Refresh Row */}
        <div className="mt-8 max-w-md mx-auto flex items-center gap-2.5">
          <div className="flex-1 flex items-center rounded-full bg-[#0b0615] border border-purple-500/25 focus-within:border-purple-400/65 px-4 py-2.5 transition-colors">
            <Search
              className="w-4 h-4 text-slate-400 mr-2.5 shrink-0"
              aria-hidden="true"
            />
            <label htmlFor="leaderboard-search" className="sr-only">
              Search registered username or handle
            </label>
            <input
              id="leaderboard-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search registered username or handle..."
              className="w-full bg-transparent text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            aria-label="Refresh leaderboard"
            className="w-10 h-10 rounded-full bg-[#0b0615] hover:bg-[#150b28] border border-purple-500/25 hover:border-purple-400/50 flex items-center justify-center text-slate-300 hover:text-white transition-colors shrink-0 cursor-pointer"
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? 'animate-spin text-purple-300' : ''}`}
              aria-hidden="true"
            />
          </button>
        </div>

        {error && (
          <p className="mt-4 text-center text-xs text-rose-300">{error}</p>
        )}

        {/* Leaderboard Table Container */}
        <div className="mt-7 overflow-hidden rounded-2xl border border-purple-500/25 bg-[#0b0615]/95 shadow-[0_18px_50px_rgba(4,2,10,0.65)]">
          <div className="grid grid-cols-12 items-center px-5 sm:px-7 py-3.5 bg-gradient-to-r from-[#240f47] via-[#1c0c38] to-[#240f47] border-b border-purple-500/25 text-[11px] font-bold tracking-wider uppercase text-purple-200">
            <div className="col-span-2 sm:col-span-1">#</div>
            <div className="col-span-7 sm:col-span-9">PROFILE</div>
            <div className="col-span-3 sm:col-span-2 text-right">VIEWS</div>
          </div>

          {loading ? (
            <div className="py-16 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
            </div>
          ) : filteredProfiles.length === 0 ? (
            <div className="py-16 px-6 text-center font-mono text-xs sm:text-sm text-slate-400">
              No registered profiles found matching &quot;{searchQuery}&quot;.
            </div>
          ) : (
            <div className="divide-y divide-purple-500/10">
              {filteredProfiles.map((profile, idx) => {
                const views =
                  timeframe === 'all'
                    ? (profile.views ?? 0)
                    : (profile.monthly_views ?? 0);
                const safeAvatar = sanitizeExternalUrl(profile.avatar_url);
                const safeDeco = sanitizeExternalUrl(
                  profile.avatar_decoration_url,
                );
                const displayName = profile.global_name || profile.username;

                return (
                  <a
                    key={profile.id}
                    href={`/${encodeURIComponent(profile.username)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="grid grid-cols-12 items-center px-5 sm:px-7 py-4 text-sm hover:bg-purple-500/[0.06] transition-colors"
                  >
                    <div className="col-span-2 sm:col-span-1 font-mono font-bold text-purple-300 tabular-nums">
                      #{idx + 1}
                    </div>
                    <div className="col-span-7 sm:col-span-9 flex items-center gap-3 min-w-0">
                      <div className="relative w-10 h-10 shrink-0 flex items-center justify-center">
                        {safeAvatar ? (
                          <img
                            src={safeAvatar}
                            alt={displayName}
                            referrerPolicy="no-referrer"
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <span className="w-8 h-8 rounded-full bg-purple-700 flex items-center justify-center text-xs font-bold text-white">
                            {displayName.charAt(0).toUpperCase()}
                          </span>
                        )}
                        {safeDeco && (
                          <img
                            src={safeDeco}
                            alt=""
                            aria-hidden="true"
                            referrerPolicy="no-referrer"
                            className="pointer-events-none absolute inset-0 w-10 h-10 object-contain"
                          />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="font-semibold text-white truncate">
                          {displayName}
                        </div>
                        <div className="font-mono text-xs text-slate-400 truncate">
                          clouskee.pp/{profile.username}
                        </div>
                      </div>
                    </div>
                    <div className="col-span-3 sm:col-span-2 text-right font-mono text-slate-200 tabular-nums">
                      {views.toLocaleString()}
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
