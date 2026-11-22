import {FormEvent, useEffect, useState} from 'react';
import {Link, Navigate} from 'react-router-dom';
import {
  Check,
  Copy,
  ExternalLink,
  Eye,
  Link2,
  Loader2,
  MessageCircle,
  Music,
  Palette,
  Plus,
  Save,
  Trash2,
  User,
} from 'lucide-react';
import {useAuth} from '../context/AuthContext';
import {ProfileLinkItem} from '../lib/supabase';
import {getRuntimeDomainInfo, sanitizeExternalUrl} from '../lib/domain';
import {LoadingSpinner} from '../components/LoadingSpinner';

export function DashboardPage() {
  const {activeProfile, loading, startDiscordOAuth, updateOwnProfile} =
    useAuth();
  const {host} = getRuntimeDomainInfo();

  const [globalName, setGlobalName] = useState('');
  const [bio, setBio] = useState('');
  const [themeColor, setThemeColor] = useState('#8b5cf6');
  const [musicTitle, setMusicTitle] = useState('');
  const [musicArtist, setMusicArtist] = useState('');
  const [musicUrl, setMusicUrl] = useState('');
  const [links, setLinks] = useState<ProfileLinkItem[]>([]);

  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!activeProfile) return;
    setGlobalName(activeProfile.global_name ?? activeProfile.username);
    setBio(activeProfile.bio ?? '');
    setThemeColor(
      activeProfile.theme_color &&
        /^#[0-9a-fA-F]{6}$/.test(activeProfile.theme_color)
        ? activeProfile.theme_color
        : '#8b5cf6',
    );
    setMusicTitle(activeProfile.music_title ?? '');
    setMusicArtist(activeProfile.music_artist ?? '');
    setMusicUrl(activeProfile.music_url ?? '');
    setLinks(
      Array.isArray(activeProfile.links) ? [...activeProfile.links] : [],
    );
  }, [activeProfile]);

  if (loading) {
    return <LoadingSpinner label="Loading your dashboard..." />;
  }

  if (!activeProfile) {
    return <Navigate to="/login" replace />;
  }

  const safeAvatar = sanitizeExternalUrl(activeProfile.avatar_url);
  const safeDecoration = sanitizeExternalUrl(
    activeProfile.avatar_decoration_url,
  );
  const profilePath = `/${encodeURIComponent(activeProfile.username)}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/${activeProfile.username}`,
      );
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Ignore clipboard restrictions
    }
  };

  const handleSyncDiscord = () => {
    setErrorMessage('');
    try {
      startDiscordOAuth({intent: 'link'});
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Unable to start Discord sync.',
      );
    }
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSaveMessage('');

    if (!/^#[0-9a-fA-F]{6}$/.test(themeColor.trim())) {
      setErrorMessage('Theme color must be a valid 6-digit hex code (e.g. #8b5cf6).');
      return;
    }

    let safeMusic: string | null = null;
    if (musicUrl.trim()) {
      const checked = sanitizeExternalUrl(musicUrl);
      if (!checked) {
        setErrorMessage('Music URL must start with https:// or http://.');
        return;
      }
      safeMusic = checked;
    }

    const sanitizedLinks: ProfileLinkItem[] = [];
    for (const item of links) {
      const label = item.label.trim();
      const url = item.url.trim();
      if (!label && !url) continue;
      const safeUrl = sanitizeExternalUrl(url);
      if (!safeUrl) {
        setErrorMessage(
          `Link "${label || url}" must start with https:// or http://.`,
        );
        return;
      }
      sanitizedLinks.push({label: label || safeUrl, url: safeUrl});
    }

    setSaving(true);
    try {
      await updateOwnProfile({
        global_name: globalName.trim() || activeProfile.username,
        bio: bio.trim(),
        theme_color: themeColor.trim(),
        music_title: musicTitle.trim() || null,
        music_artist: musicArtist.trim() || null,
        music_url: safeMusic,
        links: sanitizedLinks,
      });
      setSaveMessage('Profile changes saved to Supabase.');
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to save changes.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07030d] px-4 sm:px-6 pt-32 sm:pt-36 pb-24 relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[820px] h-[420px] rounded-full blur-[120px] opacity-55"
        style={{
          background:
            'radial-gradient(circle, rgba(124, 58, 237, 0.22) 0%, rgba(7, 3, 13, 0) 72%)',
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto space-y-6">
        {/* Top Account Summary Card */}
        <div className="rounded-2xl bg-[#0d0718]/95 border border-purple-500/25 p-6 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-[0_18px_50px_rgba(4,2,10,0.65)]">
          <div className="flex items-center gap-4 min-w-0">
            <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
              {safeAvatar ? (
                <img
                  src={safeAvatar}
                  alt={activeProfile.username}
                  referrerPolicy="no-referrer"
                  className="w-16 h-16 rounded-full object-cover border-2 border-purple-400/40"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#7c3aed] to-[#4c1d95] flex items-center justify-center text-xl font-bold text-white">
                  <User className="w-7 h-7" />
                </div>
              )}
              {safeDecoration && (
                <img
                  src={safeDecoration}
                  alt=""
                  aria-hidden="true"
                  referrerPolicy="no-referrer"
                  className="pointer-events-none absolute inset-0 w-20 h-20 object-contain"
                />
              )}
            </div>

            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-extrabold text-white truncate">
                {activeProfile.global_name || activeProfile.username}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-mono text-purple-300">
                <span>
                  {host}/{activeProfile.username}
                </span>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="inline-flex items-center gap-1 rounded-md bg-purple-950/60 border border-purple-500/30 px-2 py-0.5 text-[11px] text-purple-200 hover:text-white cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy URL</span>
                    </>
                  )}
                </button>
              </div>
              <div className="mt-2 flex items-center gap-3 text-xs text-slate-400 font-mono tabular-nums">
                <span className="inline-flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5 text-purple-400" />
                  <span>{(activeProfile.views ?? 0).toLocaleString()} total views</span>
                </span>
                <span aria-hidden="true">·</span>
                <span className="uppercase text-purple-300 font-semibold">
                  {activeProfile.plan || 'free'} plan
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              to={profilePath}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#6d28d9] to-[#8b5cf6] hover:brightness-110 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-[0_0_22px_rgba(139,92,246,0.35)] transition-all"
            >
              <span>Visit Profile Page</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Discord Link / Sync Card */}
        <div className="rounded-2xl bg-[#0b0615]/95 border border-purple-500/20 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-indigo-400" />
              <span>Discord Identity &amp; Avatar Decoration Sync</span>
            </h2>
            <p className="mt-1 text-xs text-[#b2abc4]">
              {activeProfile.discord_id ? (
                <>
                  Linked as{' '}
                  <span className="font-mono text-purple-300">
                    @{activeProfile.discord_username || activeProfile.discord_global_name}
                  </span>
                  . Re-sync anytime to refresh your global name, avatar, and
                  Nitro decoration.
                </>
              ) : (
                'Connect Discord OAuth2 to pull your global name, animated avatar, and avatar decoration.'
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={handleSyncDiscord}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#4f46e5]/90 hover:bg-[#4f46e5] border border-indigo-400/35 px-4 py-2.5 text-xs font-semibold text-white shrink-0 transition-colors cursor-pointer"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>
              {activeProfile.discord_id ? 'Sync Discord' : 'Link Discord'}
            </span>
          </button>
        </div>

        {/* Profile Customization Form */}
        <form
          onSubmit={handleSave}
          className="rounded-2xl bg-[#0b0615]/95 border border-purple-500/20 p-6 sm:p-8 space-y-6"
        >
          <div className="flex items-center justify-between gap-4 border-b border-purple-500/15 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white">
                Customize Profile Page
              </h2>
              <p className="mt-0.5 text-xs text-slate-400">
                Changes are published immediately to clouskee.pp/
                {activeProfile.username}.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label
                htmlFor="dash-global-name"
                className="block text-xs font-medium text-slate-300 mb-1.5"
              >
                Display Name (Global Name)
              </label>
              <input
                id="dash-global-name"
                type="text"
                value={globalName}
                onChange={(e) => setGlobalName(e.target.value)}
                placeholder="Your display name"
                className="w-full rounded-xl bg-[#07030d] border border-purple-500/25 focus:border-purple-400 px-3.5 py-2.5 text-sm text-white focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="dash-theme-color"
                className="flex items-center gap-1.5 text-xs font-medium text-slate-300 mb-1.5"
              >
                <Palette className="w-3.5 h-3.5 text-purple-400" />
                <span>Theme Accent Color</span>
              </label>
              <div className="flex items-center gap-2.5">
                <input
                  type="color"
                  aria-label="Pick accent color"
                  value={
                    /^#[0-9a-fA-F]{6}$/.test(themeColor)
                      ? themeColor
                      : '#8b5cf6'
                  }
                  onChange={(e) => setThemeColor(e.target.value)}
                  className="w-11 h-10 rounded-lg bg-[#07030d] border border-purple-500/25 p-1 cursor-pointer"
                />
                <input
                  id="dash-theme-color"
                  type="text"
                  value={themeColor}
                  onChange={(e) => setThemeColor(e.target.value)}
                  placeholder="#8b5cf6"
                  className="flex-1 rounded-xl bg-[#07030d] border border-purple-500/25 focus:border-purple-400 px-3.5 py-2.5 font-mono text-sm text-white focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label
              htmlFor="dash-bio"
              className="block text-xs font-medium text-slate-300 mb-1.5"
            >
              Profile Bio
            </label>
            <textarea
              id="dash-bio"
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Full-Stack Architect & Digital Creator..."
              className="w-full rounded-xl bg-[#07030d] border border-purple-500/25 focus:border-purple-400 px-3.5 py-2.5 text-sm text-white focus:outline-none"
            />
          </div>

          {/* Music Configuration */}
          <div className="pt-2 border-t border-purple-500/15">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3.5">
              <Music className="w-4 h-4 text-purple-400" />
              <span>Background Music Player</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label
                  htmlFor="dash-music-title"
                  className="block text-xs font-medium text-slate-300 mb-1.5"
                >
                  Track Title
                </label>
                <input
                  id="dash-music-title"
                  type="text"
                  value={musicTitle}
                  onChange={(e) => setMusicTitle(e.target.value)}
                  placeholder="Starlight Odyssey"
                  className="w-full rounded-xl bg-[#07030d] border border-purple-500/25 focus:border-purple-400 px-3.5 py-2.5 text-sm text-white focus:outline-none"
                />
              </div>
              <div>
                <label
                  htmlFor="dash-music-artist"
                  className="block text-xs font-medium text-slate-300 mb-1.5"
                >
                  Artist
                </label>
                <input
                  id="dash-music-artist"
                  type="text"
                  value={musicArtist}
                  onChange={(e) => setMusicArtist(e.target.value)}
                  placeholder="KSLV Noh & Clouskee"
                  className="w-full rounded-xl bg-[#07030d] border border-purple-500/25 focus:border-purple-400 px-3.5 py-2.5 text-sm text-white focus:outline-none"
                />
              </div>
              <div>
                <label
                  htmlFor="dash-music-url"
                  className="block text-xs font-medium text-slate-300 mb-1.5"
                >
                  Direct Audio URL (.mp3)
                </label>
                <input
                  id="dash-music-url"
                  type="url"
                  value={musicUrl}
                  onChange={(e) => setMusicUrl(e.target.value)}
                  placeholder="https://cdn.example.com/track.mp3"
                  className="w-full rounded-xl bg-[#07030d] border border-purple-500/25 focus:border-purple-400 px-3.5 py-2.5 text-sm text-white focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Links Editor */}
          <div className="pt-2 border-t border-purple-500/15">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Link2 className="w-4 h-4 text-purple-400" />
                <span>Social &amp; Profile Links</span>
              </h3>
              <button
                type="button"
                onClick={() =>
                  setLinks((prev) => [...prev, {label: '', url: ''}])
                }
                className="inline-flex items-center gap-1 rounded-lg bg-purple-950/60 border border-purple-500/30 px-3 py-1.5 text-xs font-semibold text-purple-200 hover:text-white cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Link</span>
              </button>
            </div>

            {links.length === 0 ? (
              <p className="text-xs text-slate-500">
                No links added yet. Click &quot;Add Link&quot; to attach social
                profiles or direct downloads.
              </p>
            ) : (
              <div className="space-y-2.5">
                {links.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
                  >
                    <input
                      type="text"
                      value={item.label}
                      onChange={(e) =>
                        setLinks((prev) =>
                          prev.map((l, i) =>
                            i === idx ? {...l, label: e.target.value} : l,
                          ),
                        )
                      }
                      placeholder="Label (e.g. GitHub)"
                      className="sm:w-1/3 rounded-xl bg-[#07030d] border border-purple-500/25 px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none"
                    />
                    <div className="flex-1 flex items-center gap-2">
                      <input
                        type="url"
                        value={item.url}
                        onChange={(e) =>
                          setLinks((prev) =>
                            prev.map((l, i) =>
                              i === idx ? {...l, url: e.target.value} : l,
                            ),
                          )
                        }
                        placeholder="https://..."
                        className="flex-1 rounded-xl bg-[#07030d] border border-purple-500/25 px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setLinks((prev) => prev.filter((_, i) => i !== idx))
                        }
                        aria-label="Remove link"
                        className="p-2.5 rounded-xl bg-[#07030d] border border-purple-500/20 text-slate-400 hover:text-rose-400 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {errorMessage && (
            <p className="text-xs font-medium text-rose-300 bg-rose-950/45 border border-rose-500/30 rounded-xl px-4 py-2.5">
              {errorMessage}
            </p>
          )}

          {saveMessage && (
            <p className="inline-flex items-center gap-2 text-xs font-medium text-emerald-300 bg-emerald-950/40 border border-emerald-500/30 rounded-xl px-4 py-2.5">
              <Check className="w-4 h-4" />
              <span>{saveMessage}</span>
            </p>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#6d28d9] via-[#7c3aed] to-[#9333ea] hover:brightness-110 disabled:opacity-60 px-6 py-3 text-sm font-semibold text-white shadow-[0_0_24px_rgba(139,92,246,0.4)] transition-all cursor-pointer"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default DashboardPage;
