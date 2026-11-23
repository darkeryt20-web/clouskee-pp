import {useCallback, useEffect, useMemo, useState} from 'react';
import {Link} from 'react-router-dom';
import {
  Activity,
  AlertCircle,
  BarChart3,
  Calendar,
  Check,
  Crown,
  ExternalLink,
  Eye,
  Globe,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Tag,
  Users,
  X,
} from 'lucide-react';
import {useAuth} from '../context/AuthContext';
import {auth} from '../lib/firebase';
import {sanitizeExternalUrl} from '../lib/domain';
import {
  AdminProfileSummary,
  adminUpdateUserAccess,
  CustomRoleBadge,
  DailySiteVisitRow,
  fetchAdminProfilesList,
  fetchDailySiteVisits,
} from '../lib/supabase';

const ROLE_PRESETS: CustomRoleBadge[] = [
  {name: 'Founder', color: '#f59e0b'},
  {name: 'Staff', color: '#8b5cf6'},
  {name: 'Moderator', color: '#06b6d4'},
  {name: 'VIP', color: '#ec4899'},
  {name: 'Verified OG', color: '#a855f7'},
  {name: 'Developer', color: '#10b981'},
];

function normalizeRoles(
  rawRoles: (string | CustomRoleBadge)[] | null | undefined,
): CustomRoleBadge[] {
  if (!Array.isArray(rawRoles)) return [];
  return rawRoles
    .map((role) =>
      typeof role === 'string'
        ? {name: role.trim(), color: '#8b5cf6'}
        : {
            name: String(role?.name ?? '').trim(),
            color: /^#[0-9a-fA-F]{6}$/.test(String(role?.color ?? '').trim())
              ? String(role.color).trim()
              : '#8b5cf6',
          },
    )
    .filter((r) => r.name.length > 0);
}

export function AdminPage() {
  const {firebaseUser, activeProfile, setActiveProfile} = useAuth();
  const [profiles, setProfiles] = useState<AdminProfileSummary[]>([]);
  const [dailyVisits, setDailyVisits] = useState<DailySiteVisitRow[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [search, setSearch] = useState('');

  // Per-user editing state
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [roleEditorUserId, setRoleEditorUserId] = useState<string | null>(null);
  const [customRoleName, setCustomRoleName] = useState('');
  const [customRoleColor, setCustomRoleColor] = useState('#8b5cf6');

  const getSessionIdentity = useCallback(
    () => ({
      firebaseUid:
        auth?.currentUser?.uid ??
        firebaseUser?.uid ??
        activeProfile?.firebase_uid ??
        null,
      discordId: activeProfile?.discord_id ?? null,
    }),
    [firebaseUser?.uid, activeProfile?.firebase_uid, activeProfile?.discord_id],
  );

  const loadAdminData = useCallback(
    async (isManualRefresh = false) => {
      if (isManualRefresh) {
        setRefreshing(true);
      } else {
        setLoadingData(true);
      }
      setError('');

      const session = getSessionIdentity();
      try {
        const [profilesRes, visitsRes] = await Promise.all([
          fetchAdminProfilesList(session),
          fetchDailySiteVisits(session),
        ]);

        if (profilesRes.error) {
          setError(profilesRes.error);
        } else {
          setProfiles(profilesRes.data);
        }

        if (!visitsRes.error) {
          setDailyVisits(visitsRes.data);
        }
      } catch {
        setError('Unable to load administrator data.');
      } finally {
        setLoadingData(false);
        setRefreshing(false);
      }
    },
    [getSessionIdentity],
  );

  useEffect(() => {
    loadAdminData(false);
  }, [loadAdminData]);

  const showSuccessToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => {
      setToast((prev) => (prev === msg ? '' : prev));
    }, 2800);
  };

  const applyUserAccessUpdate = async (
    user: AdminProfileSummary,
    next: {
      plan: 'free' | 'premium';
      is_admin: boolean;
      custom_roles: CustomRoleBadge[];
    },
  ) => {
    setError('');
    setSavingUserId(user.id);
    try {
      const res = await adminUpdateUserAccess(
        getSessionIdentity(),
        user.id,
        next,
      );
      if (res.error) {
        setError(res.error);
        return;
      }

      setProfiles((prev) =>
        prev.map((row) =>
          row.id === user.id
            ? {
                ...row,
                plan: next.plan,
                is_admin: next.is_admin,
                custom_roles: next.custom_roles,
              }
            : row,
        ),
      );

      if (activeProfile && activeProfile.id === user.id) {
        setActiveProfile({
          ...activeProfile,
          plan: next.plan,
          is_admin: next.is_admin,
          custom_roles: next.custom_roles,
        });
      }

      showSuccessToast(`Updated access for @${user.username}`);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unexpected error updating user access.',
      );
    } finally {
      setSavingUserId(null);
    }
  };

  const filteredProfiles = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return profiles;
    return profiles.filter(
      (p) =>
        p.username.toLowerCase().includes(q) ||
        (p.global_name ?? '').toLowerCase().includes(q) ||
        (p.email ?? '').toLowerCase().includes(q) ||
        (p.discord_username ?? '').toLowerCase().includes(q),
    );
  }, [profiles, search]);

  const todayIso = new Date().toISOString().slice(0, 10);
  const todayRow = useMemo(
    () => dailyVisits.find((d) => d.visit_date === todayIso) ?? dailyVisits[0],
    [dailyVisits, todayIso],
  );

  const todayTotalVisits = todayRow?.total_visits ?? 0;
  const todayUniqueVisitors = todayRow?.unique_visitors ?? 0;
  const allTimeSiteVisits = useMemo(
    () => dailyVisits.reduce((sum, row) => sum + (row.total_visits ?? 0), 0),
    [dailyVisits],
  );
  const maxDailyVisit = useMemo(
    () => Math.max(1, ...dailyVisits.map((r) => r.total_visits ?? 0)),
    [dailyVisits],
  );

  const premiumCount = useMemo(
    () => profiles.filter((p) => p.plan === 'premium').length,
    [profiles],
  );
  const adminCount = useMemo(
    () => profiles.filter((p) => p.is_admin === true).length,
    [profiles],
  );

  return (
    <div className="min-h-screen bg-[#07030d] px-4 sm:px-6 pt-28 sm:pt-32 pb-24 relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[440px] rounded-full blur-[130px] opacity-55"
        style={{
          background:
            'radial-gradient(circle, rgba(124, 58, 237, 0.22) 0%, rgba(7, 3, 13, 0) 72%)',
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto space-y-6">
        {/* Header Bar */}
        <div className="rounded-2xl bg-[#0d0718]/95 border border-purple-500/25 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[0_18px_50px_rgba(4,2,10,0.65)]">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-400/35 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-extrabold text-white">
                Clouskee PP Admin Console
              </h1>
              <p className="text-xs text-slate-400">
                Daily site traffic analytics, Free/Premium access control, Admin
                permissions &amp; custom user roles.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              disabled={refreshing}
              onClick={() => loadAdminData(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#160b29] hover:bg-[#1f1038] border border-purple-500/30 px-3.5 py-2 text-xs font-semibold text-purple-100 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`}
              />
              <span>Refresh</span>
            </button>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#6d28d9] to-[#8b5cf6] hover:brightness-110 px-4 py-2 text-xs font-semibold text-white shadow-[0_0_18px_rgba(139,92,246,0.35)] transition-all"
            >
              <span>Dashboard</span>
            </Link>
          </div>
        </div>

        {/* Feedback Toast / Error */}
        {toast && (
          <div className="fixed bottom-6 right-6 z-50 inline-flex items-center gap-2 rounded-xl bg-emerald-950/95 backdrop-blur-md border border-emerald-500/45 px-4 py-3 text-xs font-semibold text-emerald-100 shadow-[0_14px_40px_rgba(0,0,0,0.65)]">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toast}</span>
          </div>
        )}
        {error && (
          <div
            role="alert"
            className="fixed bottom-6 right-6 z-50 max-w-md flex items-start gap-2.5 rounded-xl bg-rose-950/95 backdrop-blur-md border border-rose-500/45 px-4 py-3 text-xs font-medium text-rose-100 shadow-[0_14px_40px_rgba(0,0,0,0.7)]"
          >
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span className="flex-1">{error}</span>
            <button
              type="button"
              onClick={() => setError('')}
              aria-label="Dismiss error"
              className="text-rose-300 hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Section 1: Daily Total Site Visits & Platform Overview Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          <div className="rounded-2xl bg-[#0b0615]/95 border border-purple-500/20 p-4">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Today Visits</span>
              <Activity className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <p className="mt-2 text-2xl font-extrabold text-white tabular-nums">
              {todayTotalVisits.toLocaleString()}
            </p>
          </div>

          <div className="rounded-2xl bg-[#0b0615]/95 border border-purple-500/20 p-4">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Today Unique</span>
              <Eye className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <p className="mt-2 text-2xl font-extrabold text-white tabular-nums">
              {todayUniqueVisitors.toLocaleString()}
            </p>
          </div>

          <div className="rounded-2xl bg-[#0b0615]/95 border border-purple-500/20 p-4">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>All-Time Visits</span>
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <p className="mt-2 text-2xl font-extrabold text-white tabular-nums">
              {allTimeSiteVisits.toLocaleString()}
            </p>
          </div>

          <div className="rounded-2xl bg-[#0b0615]/95 border border-purple-500/20 p-4">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Total Users</span>
              <Users className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <p className="mt-2 text-2xl font-extrabold text-white tabular-nums">
              {profiles.length.toLocaleString()}
            </p>
          </div>

          <div className="rounded-2xl bg-[#0b0615]/95 border border-purple-500/20 p-4">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Premium Users</span>
              <Crown className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <p className="mt-2 text-2xl font-extrabold text-white tabular-nums">
              {premiumCount.toLocaleString()}
            </p>
          </div>

          <div className="rounded-2xl bg-[#0b0615]/95 border border-purple-500/20 p-4">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Admins</span>
              <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
            </div>
            <p className="mt-2 text-2xl font-extrabold text-white tabular-nums">
              {adminCount.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Daily Visits Breakdown Table & Bars */}
        <div className="rounded-2xl bg-[#0b0615]/95 border border-purple-500/20 overflow-hidden">
          <div className="px-5 py-4 border-b border-purple-500/15 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-purple-400" />
              <h2 className="text-sm font-bold text-white">
                Daily Site Visits History
              </h2>
            </div>
            <span className="font-mono text-[11px] text-slate-400">
              Last {dailyVisits.length} recorded days
            </span>
          </div>

          {dailyVisits.length === 0 ? (
            <div className="p-6 text-xs text-slate-400">
              No daily site visit records found yet in{' '}
              <span className="font-mono text-purple-300">
                daily_site_visits
              </span>
              .
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-purple-500/15 text-slate-400">
                    <th className="py-2.5 px-5 font-semibold">Date</th>
                    <th className="py-2.5 px-4 font-semibold">Traffic Volume</th>
                    <th className="py-2.5 px-4 font-semibold text-right">
                      Total Visits
                    </th>
                    <th className="py-2.5 px-5 font-semibold text-right">
                      Unique Visitors
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-500/10">
                  {dailyVisits.slice(0, 14).map((row) => {
                    const widthPct = Math.max(
                      4,
                      Math.round((row.total_visits / maxDailyVisit) * 100),
                    );
                    return (
                      <tr
                        key={row.visit_date}
                        className="hover:bg-purple-950/20 transition-colors"
                      >
                        <td className="py-2.5 px-5 font-mono text-purple-200 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5">
                            <Calendar className="w-3 h-3 text-purple-400" />
                            <span>{row.visit_date}</span>
                          </span>
                        </td>
                        <td className="py-2.5 px-4 w-1/2">
                          <div className="h-2 w-full rounded-full bg-[#160b29] overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-[#6d28d9] to-[#a855f7]"
                              style={{width: `${widthPct}%`}}
                            />
                          </div>
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono tabular-nums text-white font-semibold">
                          {(row.total_visits ?? 0).toLocaleString()}
                        </td>
                        <td className="py-2.5 px-5 text-right font-mono tabular-nums text-slate-300">
                          {(row.unique_visitors ?? 0).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Section 2: User Management (Free / Premium, Admin & Custom Roles) */}
        <div className="rounded-2xl bg-[#0b0615]/95 border border-purple-500/20 overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-purple-500/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-white">
                User Access &amp; Roles Management
              </h2>
              <p className="text-[11px] text-slate-400">
                Switch plans between Free &amp; Premium, toggle Admin access,
                and assign custom profile role badges.
              </p>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search @username, name, email..."
                className="w-full rounded-xl bg-[#07030d] border border-purple-500/25 pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-purple-400"
              />
            </div>
          </div>

          {loadingData ? (
            <div className="p-12 flex items-center justify-center gap-2 text-xs text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
              <span>Loading registered users...</span>
            </div>
          ) : (
            <div className="divide-y divide-purple-500/15">
              {filteredProfiles.map((user) => {
                const safeAvatar = sanitizeExternalUrl(user.avatar_url);
                const userRoles = normalizeRoles(user.custom_roles);
                const isPremium = user.plan === 'premium';
                const isAdmin = user.is_admin === true;
                const isBusy = savingUserId === user.id;
                const isEditingRoles = roleEditorUserId === user.id;

                return (
                  <div
                    key={user.id}
                    className="p-4 sm:p-5 hover:bg-purple-950/15 transition-colors space-y-3"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Identity & Current Badges */}
                      <div className="flex items-start sm:items-center gap-3 min-w-0">
                        {safeAvatar ? (
                          <img
                            src={safeAvatar}
                            alt={user.username}
                            referrerPolicy="no-referrer"
                            className="w-10 h-10 rounded-full object-cover border border-purple-500/30 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-purple-900/50 border border-purple-500/30 flex items-center justify-center text-sm font-bold text-white shrink-0">
                            {(user.global_name || user.username)
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                        )}

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-bold text-white truncate">
                              {user.global_name || user.username}
                            </span>
                            <span className="font-mono text-xs text-purple-300">
                              @{user.username}
                            </span>
                            <span
                              className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${
                                isPremium
                                  ? 'bg-amber-500/15 border-amber-400/40 text-amber-200'
                                  : 'bg-slate-800 border-slate-700 text-slate-300'
                              }`}
                            >
                              {isPremium ? 'Premium' : 'Free'}
                            </span>
                            {isAdmin && (
                              <span className="rounded-full bg-rose-500/15 border border-rose-400/40 px-2 py-0.5 text-[10px] font-bold uppercase text-rose-200">
                                Admin
                              </span>
                            )}
                          </div>

                          <div className="mt-1 flex flex-wrap items-center gap-2.5 text-[11px] text-slate-400">
                            {user.email && <span>{user.email}</span>}
                            {user.discord_username && (
                              <span className="font-mono text-indigo-300">
                                Discord: @{user.discord_username}
                              </span>
                            )}
                            <span className="font-mono">
                              {(user.views ?? 0).toLocaleString()} views
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Controls: Free/Premium Switcher, Admin Toggle, Roles Button, View Link */}
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        {/* Free / Premium Plan Switcher */}
                        <div className="inline-flex rounded-xl bg-[#07030d] border border-purple-500/25 p-0.5">
                          <button
                            type="button"
                            disabled={isBusy || !isPremium}
                            onClick={() =>
                              applyUserAccessUpdate(user, {
                                plan: 'free',
                                is_admin: isAdmin,
                                custom_roles: userRoles,
                              })
                            }
                            className={`rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-colors cursor-pointer disabled:cursor-default ${
                              !isPremium
                                ? 'bg-slate-700 text-white'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            Free
                          </button>
                          <button
                            type="button"
                            disabled={isBusy || isPremium}
                            onClick={() =>
                              applyUserAccessUpdate(user, {
                                plan: 'premium',
                                is_admin: isAdmin,
                                custom_roles: userRoles,
                              })
                            }
                            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-colors cursor-pointer disabled:cursor-default ${
                              isPremium
                                ? 'bg-amber-500/25 text-amber-200'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            <Crown className="w-3 h-3" />
                            <span>Premium</span>
                          </button>
                        </div>

                        {/* Admin Toggle */}
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() =>
                            applyUserAccessUpdate(user, {
                              plan: isPremium ? 'premium' : 'free',
                              is_admin: !isAdmin,
                              custom_roles: userRoles,
                            })
                          }
                          className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[11px] font-semibold transition-colors cursor-pointer disabled:opacity-50 ${
                            isAdmin
                              ? 'bg-rose-500/20 border-rose-400/50 text-rose-100'
                              : 'bg-[#07030d] border-purple-500/25 text-slate-300 hover:text-white'
                          }`}
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>{isAdmin ? 'Admin: ON' : 'Make Admin'}</span>
                        </button>

                        {/* Roles Editor Toggle */}
                        <button
                          type="button"
                          onClick={() =>
                            setRoleEditorUserId(isEditingRoles ? null : user.id)
                          }
                          className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[11px] font-semibold transition-colors cursor-pointer ${
                            isEditingRoles
                              ? 'bg-purple-600/25 border-purple-400 text-white'
                              : 'bg-[#07030d] border-purple-500/25 text-slate-300 hover:text-white'
                          }`}
                        >
                          <Tag className="w-3.5 h-3.5" />
                          <span>Roles ({userRoles.length})</span>
                        </button>

                        <Link
                          to={`/${encodeURIComponent(user.username)}`}
                          className="inline-flex items-center gap-1 rounded-xl bg-[#160b29] hover:bg-[#1f1038] border border-purple-500/25 px-3 py-1.5 text-[11px] font-semibold text-purple-200 hover:text-white"
                        >
                          <span>View</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>

                    {/* Assigned Role Badges Display */}
                    {userRoles.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pl-0 sm:pl-13">
                        {userRoles.map((role) => (
                          <span
                            key={role.name}
                            className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold text-white"
                            style={{
                              backgroundColor: `${role.color}22`,
                              borderColor: `${role.color}66`,
                            }}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{backgroundColor: role.color}}
                            />
                            <span>{role.name}</span>
                            <button
                              type="button"
                              disabled={isBusy}
                              aria-label={`Remove ${role.name} role`}
                              onClick={() =>
                                applyUserAccessUpdate(user, {
                                  plan: isPremium ? 'premium' : 'free',
                                  is_admin: isAdmin,
                                  custom_roles: userRoles.filter(
                                    (r) => r.name !== role.name,
                                  ),
                                })
                              }
                              className="ml-0.5 text-white/70 hover:text-white cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Inline Role Assignment Drawer */}
                    {isEditingRoles && (
                      <div className="ml-0 sm:ml-13 rounded-xl bg-[#07030d]/90 border border-purple-500/25 p-3.5 space-y-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[11px] text-slate-400 mr-1">
                            Quick presets:
                          </span>
                          {ROLE_PRESETS.map((preset) => {
                            const alreadyHas = userRoles.some(
                              (r) =>
                                r.name.toLowerCase() ===
                                preset.name.toLowerCase(),
                            );
                            return (
                              <button
                                key={preset.name}
                                type="button"
                                disabled={isBusy || alreadyHas}
                                onClick={() =>
                                  applyUserAccessUpdate(user, {
                                    plan: isPremium ? 'premium' : 'free',
                                    is_admin: isAdmin,
                                    custom_roles: [...userRoles, preset],
                                  })
                                }
                                className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium text-white disabled:opacity-40 cursor-pointer hover:brightness-110"
                                style={{
                                  backgroundColor: `${preset.color}22`,
                                  borderColor: `${preset.color}55`,
                                }}
                              >
                                <Plus className="w-3 h-3" />
                                <span>{preset.name}</span>
                              </button>
                            );
                          })}
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2">
                          <div className="flex items-center gap-2 flex-1">
                            <input
                              type="color"
                              aria-label="Custom role color"
                              value={customRoleColor}
                              onChange={(e) =>
                                setCustomRoleColor(e.target.value)
                              }
                              className="w-9 h-9 rounded-lg bg-[#0b0615] border border-purple-500/25 p-0.5 cursor-pointer shrink-0"
                            />
                            <input
                              type="text"
                              value={customRoleName}
                              onChange={(e) =>
                                setCustomRoleName(e.target.value)
                              }
                              placeholder="Custom role name (e.g. Early Supporter)"
                              className="flex-1 rounded-xl bg-[#0b0615] border border-purple-500/25 px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-400"
                            />
                          </div>
                          <button
                            type="button"
                            disabled={isBusy || !customRoleName.trim()}
                            onClick={() => {
                              const cleanName = customRoleName.trim();
                              if (!cleanName) return;
                              const nextRoles = [
                                ...userRoles.filter(
                                  (r) =>
                                    r.name.toLowerCase() !==
                                    cleanName.toLowerCase(),
                                ),
                                {name: cleanName, color: customRoleColor},
                              ];
                              setCustomRoleName('');
                              applyUserAccessUpdate(user, {
                                plan: isPremium ? 'premium' : 'free',
                                is_admin: isAdmin,
                                custom_roles: nextRoles,
                              });
                            }}
                            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#6d28d9] hover:bg-[#7c3aed] disabled:opacity-45 px-4 py-2 text-xs font-semibold text-white cursor-pointer shrink-0"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Assign Role</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {filteredProfiles.length === 0 && (
                <div className="p-8 text-center text-xs text-slate-400">
                  No users match your search query.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {/* Floating Status Toast (always visible while scrolled) */}
      {(toast || error) && (
        <div
          role={error ? 'alert' : 'status'}
          className={`fixed bottom-5 right-5 z-50 max-w-md rounded-xl border px-4 py-3 text-xs font-semibold shadow-[0_14px_40px_rgba(0,0,0,0.75)] backdrop-blur-md flex items-start gap-2.5 ${
            error
              ? 'bg-rose-950/90 border-rose-400/50 text-rose-100'
              : 'bg-emerald-950/90 border-emerald-400/50 text-emerald-100'
          }`}
        >
          {error ? (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          ) : (
            <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          )}
          <span className="flex-1 break-words">{error || toast}</span>
          <button
            type="button"
            aria-label="Dismiss message"
            onClick={() => {
              setError('');
              setToast('');
            }}
            className="text-white/70 hover:text-white cursor-pointer shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

export default AdminPage;
