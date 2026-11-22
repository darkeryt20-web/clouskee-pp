import {FormEvent, useEffect, useState} from 'react';
import {Link, useParams} from 'react-router-dom';
import {
  Check,
  Edit3,
  ExternalLink,
  Eye,
  Loader2,
  MessageCircle,
  Music,
  Pause,
  Play,
  Plus,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import {useAuth} from '../context/AuthContext';
import {
  getProfileByUsername,
  incrementProfileViews,
  isSupabaseConfigured,
  ProfileLinkItem,
  ProfileRecord,
} from '../lib/supabase';
import {getRuntimeDomainInfo, sanitizeExternalUrl} from '../lib/domain';

export function ProfilePage() {
  const {username = ''} = useParams<{username: string}>();
  const {activeProfile, startDiscordOAuth, updateOwnProfile} = useAuth();
  const {host} = getRuntimeDomainInfo();

  const [profile, setProfile] = useState<ProfileRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Edit drawer state
  const [editing, setEditing] = useState(false);
  const [editGlobalName, setEditGlobalName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editMusicTitle, setEditMusicTitle] = useState('');
  const [editMusicArtist, setEditMusicArtist] = useState('');
  const [editLinks, setEditLinks] = useState<ProfileLinkItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [editError, setEditError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const cleanUsername = username.trim().toLowerCase();

    async function load() {
      setLoading(true);
      setNotFound(false);

      // If active session matches this username and Supabase isn't configured, render active session profile
      if (
        activeProfile &&
        activeProfile.username.toLowerCase() === cleanUsername &&
        !isSupabaseConfigured
      ) {
        if (!cancelled) {
          setProfile(activeProfile);
          setLoading(false);
        }
        return;
      }

      const {data} = await getProfileByUsername(cleanUsername);
      if (cancelled) return;

      if (!data) {
        if (
          activeProfile &&
          activeProfile.username.toLowerCase() === cleanUsername
        ) {
          setProfile(activeProfile);
          setLoading(false);
          return;
        }
        setProfile(null);
        setNotFound(true);
        setLoading(false);
        return;
      }

      setProfile(data);
      setLoading(false);

      await incrementProfileViews(cleanUsername);
      if (!cancelled) {
        setProfile((prev) =>
          prev ? {...prev, views: (prev.views ?? 0) + 1} : prev,
        );
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [username, activeProfile]);

  const isOwner =
    Boolean(profile && activeProfile) &&
    activeProfile!.username.toLowerCase() === profile!.username.toLowerCase();

  const openEditor = () => {
    if (!profile) return;
    setEditGlobalName(profile.global_name ?? profile.username);
    setEditBio(profile.bio ?? '');
    setEditMusicTitle(profile.music_title ?? '');
    setEditMusicArtist(profile.music_artist ?? '');
    setEditLinks(Array.isArray(profile.links) ? [...profile.links] : []);
    setEditError('');
    setSaveMessage('');
    setEditing(true);
  };

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setEditError('');
    setSaveMessage('');

    const sanitizedLinks: ProfileLinkItem[] = [];
    for (const item of editLinks) {
      const label = item.label.trim();
      const url = item.url.trim();
      if (!label && !url) continue;
      const safeUrl = sanitizeExternalUrl(url);
      if (!safeUrl) {
        setEditError(
          `Link "${label || url}" must start with https:// or http://.`,
        );
        return;
      }
      sanitizedLinks.push({label: label || safeUrl, url: safeUrl});
    }

    setSaving(true);
    try {
      const updated = await updateOwnProfile({
        global_name: editGlobalName.trim() || profile?.username,
        bio: editBio.trim(),
        music_title: editMusicTitle.trim() || null,
        music_artist: editMusicArtist.trim() || null,
        links: sanitizedLinks,
      });
      if (updated) {
        setProfile(updated);
      }
      setSaveMessage('Profile saved!');
      window.setTimeout(() => {
        setEditing(false);
        setSaveMessage('');
      }, 700);
    } catch (err: unknown) {
      setEditError(
        err instanceof Error ? err.message : 'Failed to save profile changes.',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleLinkDiscord = () => {
    try {
      startDiscordOAuth({intent: 'link'});
    } catch (err: unknown) {
      setEditError(
        err instanceof Error ? err.message : 'Discord OAuth2 unavailable.',
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-[85vh] bg-[#07030d] px-4 pt-36 pb-24 flex items-center justify-center">
        <Loader2 className="w-9 h-9 text-purple-400 animate-spin" />
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-[85vh] bg-[#07030d] px-4 pt-36 pb-24 flex items-center justify-center">
        <div className="w-full max-w-md rounded-2xl bg-[#0d0718] border border-purple-500/25 p-8 text-center shadow-[0_24px_80px_rgba(7,3,13,0.9)]">
          <div className="mx-auto w-12 h-12 rounded-full bg-purple-600/20 border border-purple-400/30 flex items-center justify-center mb-4">
            <Sparkles className="w-5 h-5 text-purple-300" />
          </div>
          <h1 className="text-2xl font-bold text-white">
            clouskee.pp/{username.toLowerCase()} is unclaimed
          </h1>
          <p className="mt-2.5 text-sm text-[#b2abc4]">
            This profile page has not been registered yet. Claim it now in
            seconds.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              to={`/signup?handle=${encodeURIComponent(username.toLowerCase())}`}
              className="rounded-xl bg-gradient-to-r from-[#6d28d9] to-[#8b5cf6] hover:brightness-110 px-5 py-2.5 text-sm font-semibold text-white transition-all"
            >
              Claim This Handle
            </Link>
            <Link
              to="/"
              className="rounded-xl bg-[#160b29] border border-purple-500/30 px-5 py-2.5 text-sm font-semibold text-slate-200 hover:text-white transition-colors"
            >
              Back Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const safeAvatar = sanitizeExternalUrl(profile.avatar_url);
  const safeDecoration = sanitizeExternalUrl(profile.avatar_decoration_url);
  const displayName = profile.global_name || profile.username;
  const badges = Array.isArray(profile.badges) ? profile.badges : [];
  const links = Array.isArray(profile.links) ? profile.links : [];

  return (
    <div className="min-h-[88vh] bg-[#07030d] px-4 sm:px-6 pt-32 sm:pt-36 pb-24 relative overflow-hidden">
      {/* Radial Background Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-10 left-1/2 -translate-x-1/2 w-[780px] h-[440px] rounded-full blur-[120px] opacity-60"
        style={{
          background:
            'radial-gradient(circle, rgba(139, 92, 246, 0.25) 0%, rgba(7, 3, 13, 0) 72%)',
        }}
      />

      <div className="relative z-10 max-w-xl mx-auto">
        {/* Owner Management Bar */}
        {isOwner && (
          <div className="mb-5 rounded-2xl bg-[#140a26]/95 border border-purple-400/35 px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-[0_10px_30px_rgba(7,3,13,0.75)]">
            <span className="text-xs font-medium text-purple-200">
              Signed in as{' '}
              <span className="font-mono font-bold text-white">
                @{profile.username}
              </span>
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={openEditor}
                className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </button>
              <button
                type="button"
                onClick={handleLinkDiscord}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#4f46e5]/85 hover:bg-[#4f46e5] border border-indigo-400/30 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors cursor-pointer"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>
                  {profile.discord_id ? 'Sync Discord' : 'Link Discord'}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Main Profile Glass Card */}
        <div className="rounded-3xl bg-gradient-to-b from-[#160a28]/95 via-[#0e061b]/95 to-[#0a0414]/95 border border-purple-500/30 p-7 sm:p-9 shadow-[0_24px_80px_rgba(4,2,10,0.85),0_0_45px_rgba(124,58,237,0.16)]">
          {/* Avatar + Discord Avatar Decoration Overlay */}
          <div className="flex flex-col items-center text-center">
            <div className="relative w-28 h-28 flex items-center justify-center">
              {safeAvatar ? (
                <img
                  src={safeAvatar}
                  alt={`${displayName} avatar`}
                  referrerPolicy="no-referrer"
                  className="w-24 h-24 rounded-full object-cover border-2 border-purple-400/40 shadow-[0_0_28px_rgba(139,92,246,0.35)]"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#7c3aed] to-[#4c1d95] border-2 border-purple-400/40 flex items-center justify-center text-3xl font-extrabold text-white shadow-[0_0_28px_rgba(139,92,246,0.35)]">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}

              {safeDecoration && (
                <img
                  src={safeDecoration}
                  alt=""
                  aria-hidden="true"
                  referrerPolicy="no-referrer"
                  className="pointer-events-none select-none absolute inset-0 w-28 h-28 object-contain"
                />
              )}
            </div>

            <h1 className="mt-4 text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {displayName}
            </h1>

            <div className="mt-1.5 flex items-center gap-2 text-xs font-mono text-purple-300">
              <span>@{profile.username}</span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1 text-slate-300 tabular-nums">
                <Eye className="w-3.5 h-3.5 text-purple-400" />
                <span>{(profile.views ?? 0).toLocaleString()} views</span>
              </span>
            </div>

            <p className="mt-1 font-mono text-[11px] text-slate-500">
              {host}/{profile.username}
            </p>

            {/* Badges */}
            {badges.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                {badges.map((badge) => (
                  <span
                    key={badge}
                    className="inline-flex items-center rounded-full bg-[#1a0f30] border border-purple-400/30 px-3 py-1 text-xs font-semibold text-purple-100"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            )}

            {/* Bio */}
            {profile.bio && (
              <p className="mt-5 max-w-md text-sm text-[#c7bfdc] leading-relaxed">
                {profile.bio}
              </p>
            )}
          </div>

          {/* Music Player Widget */}
          {(profile.music_title || profile.music_artist) && (
            <div className="mt-7 rounded-2xl bg-[#090412]/95 border border-purple-500/25 px-4 py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => setIsPlaying((p) => !p)}
                  aria-label={isPlaying ? 'Pause music' : 'Play music'}
                  className="w-9 h-9 rounded-full bg-gradient-to-br from-[#9333ea] to-[#7c3aed] flex items-center justify-center text-white shrink-0 cursor-pointer"
                >
                  {isPlaying ? (
                    <Pause className="w-3.5 h-3.5" />
                  ) : (
                    <Play className="w-3.5 h-3.5 ml-0.5" />
                  )}
                </button>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-semibold text-white truncate">
                    {profile.music_title || 'Profile Track'}
                  </p>
                  <p className="text-[11px] text-purple-400 truncate">
                    {profile.music_artist || displayName}
                  </p>
                </div>
              </div>
              <Music className="w-4 h-4 text-purple-400 shrink-0" />
            </div>
          )}

          {/* Social Links */}
          <div className="mt-7 space-y-2.5">
            {links.length === 0 ? (
              <div className="rounded-xl bg-[#090412]/75 border border-purple-500/15 px-4 py-4 text-center text-xs text-slate-400">
                {isOwner
                  ? 'No links added yet. Click "Edit Profile" above to add your socials.'
                  : 'No public links added yet.'}
              </div>
            ) : (
              links.map((link, idx) => {
                const safeHref = sanitizeExternalUrl(link.url);
                if (!safeHref) return null;
                return (
                  <a
                    key={`${link.label}-${idx}`}
                    href={safeHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-xl bg-[#090412]/90 hover:bg-[#140a26] border border-purple-500/25 hover:border-purple-400/50 px-4 py-3.5 text-sm font-medium text-white transition-all"
                  >
                    <span>{link.label}</span>
                    <ExternalLink className="w-4 h-4 text-purple-300 shrink-0" />
                  </a>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {editing && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-profile-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
          onClick={() => setEditing(false)}
        >
          <div
            className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-[#110820] border border-purple-400/30 p-6 shadow-[0_24px_80px_rgba(7,3,13,0.95)]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setEditing(false)}
              aria-label="Close editor"
              className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-purple-500/15 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h2
              id="edit-profile-title"
              className="text-xl font-bold text-white"
            >
              Edit Profile
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Update your display name, bio, music embed, or sync your Discord
              avatar &amp; decoration.
            </p>

            <form onSubmit={handleSaveProfile} className="mt-5 space-y-4">
              <div>
                <label
                  htmlFor="edit-global-name"
                  className="block text-xs font-medium text-slate-300 mb-1.5"
                >
                  Display Name
                </label>
                <input
                  id="edit-global-name"
                  type="text"
                  value={editGlobalName}
                  onChange={(e) => setEditGlobalName(e.target.value)}
                  className="w-full rounded-xl bg-[#07030d] border border-purple-500/25 focus:border-purple-400 px-3.5 py-2.5 text-sm text-white focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="edit-bio"
                  className="block text-xs font-medium text-slate-300 mb-1.5"
                >
                  Bio
                </label>
                <textarea
                  id="edit-bio"
                  rows={3}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Full-Stack Architect & Digital Creator..."
                  className="w-full rounded-xl bg-[#07030d] border border-purple-500/25 focus:border-purple-400 px-3.5 py-2.5 text-sm text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="edit-music-title"
                    className="block text-xs font-medium text-slate-300 mb-1.5"
                  >
                    Track Title
                  </label>
                  <input
                    id="edit-music-title"
                    type="text"
                    value={editMusicTitle}
                    onChange={(e) => setEditMusicTitle(e.target.value)}
                    placeholder="Starlight Odyssey"
                    className="w-full rounded-xl bg-[#07030d] border border-purple-500/25 focus:border-purple-400 px-3.5 py-2 text-sm text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label
                    htmlFor="edit-music-artist"
                    className="block text-xs font-medium text-slate-300 mb-1.5"
                  >
                    Track Artist
                  </label>
                  <input
                    id="edit-music-artist"
                    type="text"
                    value={editMusicArtist}
                    onChange={(e) => setEditMusicArtist(e.target.value)}
                    placeholder="KSLV Noh & Clouskee"
                    className="w-full rounded-xl bg-[#07030d] border border-purple-500/25 focus:border-purple-400 px-3.5 py-2 text-sm text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-slate-300">
                    Social &amp; File Links
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setEditLinks((prev) => [...prev, {label: '', url: ''}])
                    }
                    className="inline-flex items-center gap-1 text-xs font-semibold text-purple-300 hover:text-white cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Link</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {editLinks.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={item.label}
                        onChange={(e) =>
                          setEditLinks((prev) =>
                            prev.map((l, i) =>
                              i === idx ? {...l, label: e.target.value} : l,
                            ),
                          )
                        }
                        placeholder="Label (e.g. GitHub)"
                        className="w-1/3 rounded-lg bg-[#07030d] border border-purple-500/25 px-3 py-2 text-xs text-white focus:outline-none"
                      />
                      <input
                        type="url"
                        value={item.url}
                        onChange={(e) =>
                          setEditLinks((prev) =>
                            prev.map((l, i) =>
                              i === idx ? {...l, url: e.target.value} : l,
                            ),
                          )
                        }
                        placeholder="https://..."
                        className="flex-1 rounded-lg bg-[#07030d] border border-purple-500/25 px-3 py-2 text-xs text-white focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setEditLinks((prev) =>
                            prev.filter((_, i) => i !== idx),
                          )
                        }
                        aria-label="Remove link"
                        className="p-2 text-slate-400 hover:text-rose-400 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {editError && (
                <p className="text-xs font-medium text-rose-300 bg-rose-950/45 border border-rose-500/30 rounded-lg px-3 py-2">
                  {editError}
                </p>
              )}

              {saveMessage && (
                <p className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-300">
                  <Check className="w-4 h-4" />
                  <span>{saveMessage}</span>
                </p>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="rounded-xl bg-[#160b29] border border-purple-500/25 px-4 py-2 text-xs font-semibold text-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-gradient-to-r from-[#6d28d9] to-[#8b5cf6] hover:brightness-110 px-5 py-2 text-xs font-semibold text-white disabled:opacity-60 cursor-pointer"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
