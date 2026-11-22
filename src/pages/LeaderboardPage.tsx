import {useState} from 'react';
import {RefreshCw, Search, Trophy} from 'lucide-react';

export interface RegisteredProfile {
  rank: number;
  username: string;
  handle: string;
  viewsAllTime: number;
  viewsThisMonth: number;
}

// Structured cleanly so real database records can plug straight in later
const REGISTERED_PROFILES: RegisteredProfile[] = [];

export function LeaderboardPage() {
  const [timeframe, setTimeframe] = useState<'all' | 'month'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredProfiles = REGISTERED_PROFILES.filter((profile) => {
    if (!normalizedQuery) return true;
    return (
      profile.username.toLowerCase().includes(normalizedQuery) ||
      profile.handle.toLowerCase().includes(normalizedQuery)
    );
  }).sort((a, b) =>
    timeframe === 'all'
      ? b.viewsAllTime - a.viewsAllTime
      : b.viewsThisMonth - a.viewsThisMonth,
  );

  const handleRefresh = () => {
    setRefreshing(true);
    window.setTimeout(() => {
      setRefreshing(false);
    }, 450);
  };

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

        {/* Leaderboard Table Container */}
        <div className="mt-7 overflow-hidden rounded-2xl border border-purple-500/25 bg-[#0b0615]/95 shadow-[0_18px_50px_rgba(4,2,10,0.65)]">
          <div className="grid grid-cols-12 items-center px-5 sm:px-7 py-3.5 bg-gradient-to-r from-[#240f47] via-[#1c0c38] to-[#240f47] border-b border-purple-500/25 text-[11px] font-bold tracking-wider uppercase text-purple-200">
            <div className="col-span-2 sm:col-span-1">#</div>
            <div className="col-span-7 sm:col-span-9">PROFILE</div>
            <div className="col-span-3 sm:col-span-2 text-right">VIEWS</div>
          </div>

          {filteredProfiles.length === 0 ? (
            <div className="py-16 px-6 text-center font-mono text-xs sm:text-sm text-slate-400">
              No registered profiles found matching &quot;{searchQuery}&quot;.
            </div>
          ) : (
            <div className="divide-y divide-purple-500/10">
              {filteredProfiles.map((profile, idx) => {
                const views =
                  timeframe === 'all'
                    ? profile.viewsAllTime
                    : profile.viewsThisMonth;
                return (
                  <div
                    key={profile.handle}
                    className="grid grid-cols-12 items-center px-5 sm:px-7 py-4 text-sm hover:bg-purple-500/[0.04] transition-colors"
                  >
                    <div className="col-span-2 sm:col-span-1 font-mono font-bold text-purple-300 tabular-nums">
                      #{idx + 1}
                    </div>
                    <div className="col-span-7 sm:col-span-9">
                      <div className="font-semibold text-white">
                        {profile.username}
                      </div>
                      <div className="font-mono text-xs text-slate-400">
                        clouskee.pp/{profile.handle}
                      </div>
                    </div>
                    <div className="col-span-3 sm:col-span-2 text-right font-mono text-slate-200 tabular-nums">
                      {views.toLocaleString()}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
