import {useEffect, useMemo, useState} from 'react';
import {Link} from 'react-router-dom';
import {
  Crown,
  ExternalLink,
  Eye,
  Loader2,
  Search,
  ShieldCheck,
  Users,
} from 'lucide-react';
import {useAuth} from '../context/AuthContext';
import {auth} from '../lib/firebase';
import {AdminProfileSummary, fetchAdminProfilesList} from '../lib/supabase';

export function AdminPage() {
  const {firebaseUser, activeProfile} = useAuth();
  const [profiles, setProfiles] = useState<AdminProfileSummary[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;
    const verifiedFirebaseUid =
      auth?.currentUser?.uid ?? firebaseUser?.uid ?? activeProfile?.firebase_uid ?? null;
    const verifiedDiscordId = activeProfile?.discord_id ?? null;

    setLoadingList(true);
    fetchAdminProfilesList({
      firebaseUid: verifiedFirebaseUid,
      discordId: verifiedDiscordId,
    })
      .then((res) => {
        if (cancelled) return;
        if (res.error) {
          setError(res.error);
        } else {
          setProfiles(res.data);
        }
      })
      .catch(() => {
        if (cancelled) return;
        setError('Unable to load administrator overview.');
      })
      .finally(() => {
        if (!cancelled) setLoadingList(false);
      });

    return () => {
      cancelled = true;
    };
  }, [firebaseUser, activeProfile?.firebase_uid, activeProfile?.discord_id]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return profiles;
    return profiles.filter(
      (p) =>
        p.username.toLowerCase().includes(q) ||
        (p.global_name ?? '').toLowerCase().includes(q),
    );
  }, [profiles, search]);

  const totalViews = useMemo(
    () => profiles.reduce((acc, p) => acc + (p.views ?? 0), 0),
    [profiles],
  );
  const premiumCount = useMemo(
    () => profiles.filter((p) => p.plan === 'premium').length,
    [profiles],
  );

  return (
    <div className="min-h-screen bg-[#07030d] px-4 sm:px-6 pt-28 sm:pt-32 pb-24">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="rounded-2xl bg-[#0d0718]/95 border border-purple-500/25 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[0_18px_50px_rgba(4,2,10,0.65)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-400/30 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-purple-300" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-white">
                Clouskee PP Admin Console
              </h1>
              <p className="text-xs text-slate-400">
                Verified administrator access via Supabase profile permissions.
              </p>
            </div>
          </div>

          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl bg-[#160b29] hover:bg-[#1f1038] border border-purple-500/30 px-4 py-2 text-xs font-semibold text-purple-100 transition-colors"
          >
            <span>Back to Dashboard</span>
          </Link>
        </div>

        {/* Summary Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl bg-[#0b0615]/95 border border-purple-500/20 p-5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Profiles Loaded</span>
              <Users className="w-4 h-4 text-purple-400" />
            </div>
            <p className="mt-2 text-2xl font-extrabold text-white tabular-nums">
              {profiles.length.toLocaleString()}
            </p>
          </div>
          <div className="rounded-2xl bg-[#0b0615]/95 border border-purple-500/20 p-5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Cumulative Views</span>
              <Eye className="w-4 h-4 text-purple-400" />
            </div>
            <p className="mt-2 text-2xl font-extrabold text-white tabular-nums">
              {totalViews.toLocaleString()}
            </p>
          </div>
          <div className="rounded-2xl bg-[#0b0615]/95 border border-purple-500/20 p-5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Premium Accounts</span>
              <Crown className="w-4 h-4 text-amber-400" />
            </div>
            <p className="mt-2 text-2xl font-extrabold text-white tabular-nums">
              {premiumCount.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Profiles Table */}
        <div className="rounded-2xl bg-[#0b0615]/95 border border-purple-500/20 overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-purple-500/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-sm font-bold text-white">Recent Profiles</h2>
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter by handle or name..."
                className="w-full rounded-xl bg-[#07030d] border border-purple-500/25 pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-purple-400"
              />
            </div>
          </div>

          {loadingList ? (
            <div className="p-10 flex items-center justify-center gap-2 text-xs text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
              <span>Loading profiles...</span>
            </div>
          ) : error ? (
            <div className="p-6 text-xs text-rose-300">{error}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-purple-500/15 text-slate-400">
                    <th className="py-3 px-4 font-semibold">Username</th>
                    <th className="py-3 px-4 font-semibold">Display Name</th>
                    <th className="py-3 px-4 font-semibold">Plan</th>
                    <th className="py-3 px-4 font-semibold">Role</th>
                    <th className="py-3 px-4 font-semibold text-right">Views</th>
                    <th className="py-3 px-4 font-semibold text-right">Page</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-500/10">
                  {filtered.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-purple-950/20 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono text-purple-300">
                        @{item.username}
                      </td>
                      <td className="py-3 px-4 text-white">
                        {item.global_name || item.username}
                      </td>
                      <td className="py-3 px-4 uppercase text-slate-300">
                        {item.plan || 'free'}
                      </td>
                      <td className="py-3 px-4">
                        {item.is_admin ? (
                          <span className="rounded-full bg-purple-500/20 border border-purple-400/40 px-2 py-0.5 text-[10px] font-semibold text-purple-200">
                            Admin
                          </span>
                        ) : (
                          <span className="text-slate-500">User</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-200">
                        {(item.views ?? 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          to={`/${encodeURIComponent(item.username)}`}
                          className="inline-flex items-center gap-1 text-purple-300 hover:text-white"
                        >
                          <span>View</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-8 px-4 text-center text-slate-400"
                      >
                        No matching profiles found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminPage;
