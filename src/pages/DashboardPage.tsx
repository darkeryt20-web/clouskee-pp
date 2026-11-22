import {ChangeEvent, FormEvent, useEffect, useMemo, useState} from 'react';
import {Link, Navigate} from 'react-router-dom';
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  Eye,
  Image as ImageIcon,
  Link2,
  Loader2,
  MessageCircle,
  Music,
  Palette,
  Plus,
  RefreshCw,
  Save,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  User,
  Video,
} from 'lucide-react';
import {useAuth} from '../context/AuthContext';
import {
  MusicCardPosition,
  ProfileLinkItem,
  ProfileRecord,
  SocialPresetKey,
  uploadProfileMedia,
} from '../lib/supabase';
import {sanitizeExternalUrl} from '../lib/domain';
import {LoadingSpinner} from '../components/LoadingSpinner';
import {
  ALLOWED_PROFILE_FONTS,
  ProfileView,
  sanitizeFontFamily,
  sanitizeHexColor,
} from '../components/ProfileView';
import {MUSIC_POSITIONS, MUSIC_STYLES} from '../components/MusicPlayerCard';
import {
  getPresetMeta,
  inferPresetFromLink,
  SOCIAL_PRESETS,
  SocialPresetIcon,
} from '../components/SocialPresetIcons';
import {
  checkUsernameAvailability,
  sanitizeHandle,
} from '../utils/usernameRegistry';

type DashboardTab =
  | 'general'
  | 'appearance'
  | 'audio'
  | 'links'
  | 'connections';

function GoogleBadgeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-4 h-4 shrink-0"
      aria-hidden="true"
    >
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.24 1.25-.96 2.31-2.05 3.02l3.31 2.57c1.93-1.78 3.04-4.4 3.04-7.49 0-.72-.06-1.41-.19-2.08H12z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.75 0 5.06-.91 6.75-2.46l-3.31-2.57c-.91.61-2.08.98-3.44.98-2.64 0-4.88-1.78-5.68-4.18H2.9v2.64A10 10 0 0 0 12 22z"
      />
      <path
        fill="#4A90E2"
        d="M6.32 13.77A5.99 5.99 0 0 1 6 12c0-.61.11-1.21.32-1.77V7.59H2.9A10 10 0 0 0 2 12c0 1.61.39 3.14 1.08 4.41l3.24-2.64z"
      />
      <path
        fill="#FBBC05"
        d="M12 6.05c1.5 0 2.84.52 3.9 1.53l2.92-2.92C17.05 3.02 14.74 2 12 2a10 10 0 0 0-9.1 5.59l3.42 2.64c.8-2.4 3.04-4.18 5.68-4.18z"
      />
    </svg>
  );
}

const TABS: {id: DashboardTab; label: string; icon: typeof User}[] = [
  {id: 'general', label: 'General', icon: User},
  {id: 'appearance', label: 'Appearance', icon: Palette},
  {id: 'audio', label: 'Audio', icon: Music},
  {id: 'links', label: 'Links', icon: Link2},
  {id: 'connections', label: 'Connections', icon: ShieldCheck},
];

export function DashboardPage() {
  const {
    activeProfile,
    firebaseUser,
    loading,
    startDiscordOAuth,
    linkGoogleAccount,
    changeUsername,
    updateOwnProfile,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<DashboardTab>('general');

  // General & Account state
  const [draftUsername, setDraftUsername] = useState('');
  const [usernameStatus, setUsernameStatus] = useState<{
    state: 'idle' | 'checking' | 'available' | 'taken';
    message?: string;
  }>({state: 'idle'});
  const [updatingUsername, setUpdatingUsername] = useState(false);

  const [globalName, setGlobalName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bio, setBio] = useState('');
  const [typewriterEnabled, setTypewriterEnabled] = useState(false);
  const [typewriterTexts, setTypewriterTexts] = useState<string[]>([]);
  const [clickToEnterEnabled, setClickToEnterEnabled] = useState(true);
  const [clickToEnterText, setClickToEnterText] = useState('Click to Enter');
  const [showViewsCount, setShowViewsCount] = useState(true);

  // Appearance & Background state
  const [bgType, setBgType] = useState<'none' | 'image' | 'video'>('none');
  const [bgUrl, setBgUrl] = useState('');
  const [bgOpacity, setBgOpacity] = useState(55);
  const [bgBlur, setBgBlur] = useState(0);
  const [cardOpacity, setCardOpacity] = useState(88);
  const [cardBlur, setCardBlur] = useState(16);
  const [accentColor, setAccentColor] = useState('#8b5cf6');
  const [fontFamily, setFontFamily] = useState<string>('Plus Jakarta Sans');

  // Audio state
  const [musicTitle, setMusicTitle] = useState('');
  const [musicArtist, setMusicArtist] = useState('');
  const [musicUrl, setMusicUrl] = useState('');
  const [musicCover, setMusicCover] = useState('');
  const [musicAutoplay, setMusicAutoplay] = useState(false);
  const [musicPosition, setMusicPosition] =
    useState<MusicCardPosition>('profile_bottom');
  const [musicStyle, setMusicStyle] = useState<number>(1);
  const [musicShowCover, setMusicShowCover] = useState(true);
  const [musicShowProgress, setMusicShowProgress] = useState(true);
  const [musicShowCountdown, setMusicShowCountdown] = useState(true);
  const [musicShowControls, setMusicShowControls] = useState(true);
  const [musicShowTitle, setMusicShowTitle] = useState(true);
  const [musicShowArtist, setMusicShowArtist] = useState(true);

  // Links state
  const [links, setLinks] = useState<ProfileLinkItem[]>([]);

  // UI feedback states
  const [uploadingField, setUploadingField] = useState<
    'bg' | 'audio' | 'cover' | 'avatar' | null
  >(null);
  const [uploadingLinkIconIdx, setUploadingLinkIconIdx] = useState<
    number | null
  >(null);
  const [linkingGoogle, setLinkingGoogle] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!activeProfile) return;
    setDraftUsername(activeProfile.username);
    setUsernameStatus({state: 'idle'});
    setGlobalName(activeProfile.global_name ?? activeProfile.username);
    setAvatarUrl(activeProfile.avatar_url ?? '');
    setBio(activeProfile.bio ?? '');
    setTypewriterEnabled(Boolean(activeProfile.typewriter_enabled));
    setTypewriterTexts(
      Array.isArray(activeProfile.typewriter_texts)
        ? [...activeProfile.typewriter_texts]
        : [],
    );
    setClickToEnterEnabled(activeProfile.click_to_enter_enabled !== false);
    setClickToEnterText(
      activeProfile.click_to_enter_text?.trim() || 'Click to Enter',
    );
    setShowViewsCount(activeProfile.show_views_count !== false);

    setBgType(activeProfile.bg_type ?? 'none');
    setBgUrl(activeProfile.bg_url ?? '');
    setBgOpacity(activeProfile.bg_opacity ?? 55);
    setBgBlur(activeProfile.bg_blur ?? 0);
    setCardOpacity(activeProfile.card_opacity ?? 88);
    setCardBlur(activeProfile.card_blur ?? 16);
    setAccentColor(
      sanitizeHexColor(
        activeProfile.accent_color || activeProfile.theme_color,
      ),
    );
    setFontFamily(sanitizeFontFamily(activeProfile.font_family));

    setMusicTitle(activeProfile.music_title ?? '');
    setMusicArtist(activeProfile.music_artist ?? '');
    setMusicUrl(activeProfile.music_url ?? '');
    setMusicCover(activeProfile.music_cover ?? '');
    setMusicAutoplay(Boolean(activeProfile.music_autoplay));
    setMusicPosition(activeProfile.music_position ?? 'profile_bottom');
    setMusicStyle(Math.min(5, Math.max(1, Number(activeProfile.music_style || 1))));
    setMusicShowCover(activeProfile.music_show_cover !== false);
    setMusicShowProgress(activeProfile.music_show_progress !== false);
    setMusicShowCountdown(activeProfile.music_show_countdown !== false);
    setMusicShowControls(activeProfile.music_show_controls !== false);
    setMusicShowTitle(activeProfile.music_show_title !== false);
    setMusicShowArtist(activeProfile.music_show_artist !== false);

    setLinks(
      Array.isArray(activeProfile.links)
        ? activeProfile.links.map((item) => ({
            ...item,
            preset: inferPresetFromLink(item),
          }))
        : [],
    );
  }, [activeProfile]);

  // Real-time debounced username availability check (excluding own profile ID)
  useEffect(() => {
    if (!activeProfile) return;
    const cleaned = sanitizeHandle(draftUsername);
    if (!cleaned || cleaned === activeProfile.username.toLowerCase()) {
      setUsernameStatus({state: 'idle'});
      return;
    }

    setUsernameStatus({state: 'checking'});
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      const res = await checkUsernameAvailability(cleaned, activeProfile.id);
      if (cancelled) return;
      if (res.available) {
        setUsernameStatus({
          state: 'available',
          message: 'Available to claim',
        });
      } else {
        setUsernameStatus({
          state: 'taken',
          message: res.message || 'Already taken',
        });
      }
    }, 320);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [draftUsername, activeProfile]);

  const liveDraftProfile: ProfileRecord | null = useMemo(() => {
    if (!activeProfile) return null;
    return {
      ...activeProfile,
      username: sanitizeHandle(draftUsername) || activeProfile.username,
      global_name: globalName.trim() || activeProfile.username,
      avatar_url: avatarUrl.trim() || null,
      bio,
      typewriter_enabled: typewriterEnabled,
      typewriter_texts: typewriterTexts,
      click_to_enter_enabled: clickToEnterEnabled,
      click_to_enter_text: clickToEnterText.trim() || 'Click to Enter',
      show_profile_link: false,
      show_views_count: showViewsCount,
      bg_type: bgType,
      bg_url: bgUrl.trim() || null,
      bg_opacity: bgOpacity,
      bg_blur: bgBlur,
      card_opacity: cardOpacity,
      card_blur: cardBlur,
      accent_color: accentColor,
      theme_color: accentColor,
      font_family: fontFamily,
      music_title: musicTitle.trim() || null,
      music_artist: musicArtist.trim() || null,
      music_url: musicUrl.trim() || null,
      music_cover: musicCover.trim() || null,
      music_autoplay: musicAutoplay,
      music_position: musicPosition,
      music_style: musicStyle,
      music_show_cover: musicShowCover,
      music_show_progress: musicShowProgress,
      music_show_countdown: musicShowCountdown,
      music_show_controls: musicShowControls,
      music_show_title: musicShowTitle,
      music_show_artist: musicShowArtist,
      links,
    };
  }, [
    activeProfile,
    draftUsername,
    globalName,
    avatarUrl,
    bio,
    typewriterEnabled,
    typewriterTexts,
    clickToEnterEnabled,
    clickToEnterText,
    showViewsCount,
    bgType,
    bgUrl,
    bgOpacity,
    bgBlur,
    cardOpacity,
    cardBlur,
    accentColor,
    fontFamily,
    musicTitle,
    musicArtist,
    musicUrl,
    musicCover,
    musicAutoplay,
    musicPosition,
    musicStyle,
    musicShowCover,
    musicShowProgress,
    musicShowCountdown,
    musicShowControls,
    musicShowTitle,
    musicShowArtist,
    links,
  ]);

  if (loading) {
    return <LoadingSpinner label="Loading your dashboard..." />;
  }

  if (!activeProfile || !liveDraftProfile) {
    return <Navigate to="/login" replace />;
  }

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

  const handleUpdateUsername = async () => {
    setErrorMessage('');
    setSaveMessage('');
    const cleaned = sanitizeHandle(draftUsername);
    if (cleaned === activeProfile.username.toLowerCase()) return;

    setUpdatingUsername(true);
    try {
      const updated = await changeUsername(cleaned);
      setSaveMessage(`Username updated to clouskee.pp/${updated.username}.`);
      setUsernameStatus({state: 'idle'});
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Unable to update username.',
      );
    } finally {
      setUpdatingUsername(false);
    }
  };

  const handleMediaUpload = async (
    e: ChangeEvent<HTMLInputElement>,
    target: 'bg' | 'audio' | 'cover' | 'avatar',
  ) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setErrorMessage('');
    setSaveMessage('');
    setUploadingField(target);
    try {
      const folder =
        target === 'audio' ? 'audio' : target === 'bg' ? 'backgrounds' : 'covers';
      const {url, error} = await uploadProfileMedia(
        activeProfile.id,
        file,
        folder,
      );
      if (error || !url) {
        setErrorMessage(
          error ||
            'Upload failed. Ensure Supabase Storage bucket "profile-media" exists or paste a direct URL.',
        );
        return;
      }

      if (target === 'bg') {
        setBgUrl(url);
        if (file.type.startsWith('video/')) {
          setBgType('video');
        } else if (file.type.startsWith('image/')) {
          setBgType('image');
        }
      } else if (target === 'audio') {
        setMusicUrl(url);
      } else if (target === 'cover') {
        setMusicCover(url);
      } else if (target === 'avatar') {
        setAvatarUrl(url);
      }
      setSaveMessage('Media uploaded. Click Save Changes to publish.');
    } finally {
      setUploadingField(null);
    }
  };

  const handleSyncDiscord = () => {
    setErrorMessage('');
    setSaveMessage('');
    try {
      startDiscordOAuth({intent: 'link'});
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Unable to start Discord sync.',
      );
    }
  };

  const handleLinkGoogle = async () => {
    setErrorMessage('');
    setSaveMessage('');
    setLinkingGoogle(true);
    try {
      await linkGoogleAccount();
      setSaveMessage('Google account linked to your Clouskee PP profile.');
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to link Google account.',
      );
    } finally {
      setLinkingGoogle(false);
    }
  };

  const handleUploadLinkIcon = async (
    e: ChangeEvent<HTMLInputElement>,
    idx: number,
  ) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setErrorMessage('');
    setSaveMessage('');
    setUploadingLinkIconIdx(idx);
    try {
      const {url, error} = await uploadProfileMedia(
        activeProfile.id,
        file,
        'icons',
      );
      if (error || !url) {
        setErrorMessage(
          error ||
            'Upload failed. Ensure Supabase Storage bucket "profile-media" exists or paste a direct image URL.',
        );
        return;
      }
      setLinks((prev) =>
        prev.map((l, i) =>
          i === idx ? {...l, preset: 'custom', customIconUrl: url} : l,
        ),
      );
      setSaveMessage('Custom logo uploaded. Click Save Changes to publish.');
    } finally {
      setUploadingLinkIconIdx(null);
    }
  };

  const handleMoveLink = (idx: number, direction: -1 | 1) => {
    const nextIdx = idx + direction;
    if (nextIdx < 0 || nextIdx >= links.length) return;
    setLinks((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(idx, 1);
      copy.splice(nextIdx, 0, item);
      return copy;
    });
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSaveMessage('');

    const cleanAccent = accentColor.trim();
    if (!/^#[0-9a-fA-F]{6}$/.test(cleanAccent)) {
      setErrorMessage(
        'Accent color must be a valid 6-digit hex code (e.g. #8b5cf6).',
      );
      return;
    }

    let safeAvatar: string | null = null;
    if (avatarUrl.trim()) {
      const checked = sanitizeExternalUrl(avatarUrl);
      if (!checked) {
        setErrorMessage('Avatar URL must start with https:// or http://.');
        return;
      }
      safeAvatar = checked;
    }

    let safeBg: string | null = null;
    if (bgType !== 'none' && bgUrl.trim()) {
      const checked = sanitizeExternalUrl(bgUrl);
      if (!checked) {
        setErrorMessage('Background media URL must start with https:// or http://.');
        return;
      }
      safeBg = checked;
    } else if (bgUrl.trim()) {
      safeBg = sanitizeExternalUrl(bgUrl);
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

    let safeCover: string | null = null;
    if (musicCover.trim()) {
      const checked = sanitizeExternalUrl(musicCover);
      if (!checked) {
        setErrorMessage('Music cover URL must start with https:// or http://.');
        return;
      }
      safeCover = checked;
    }

    const sanitizedLinks: ProfileLinkItem[] = [];
    for (const item of links) {
      const preset = inferPresetFromLink(item);
      const presetMeta = getPresetMeta(preset);
      const label = item.label.trim();
      const url = item.url.trim();
      if (!label && !url && !item.customIconUrl?.trim()) continue;
      const safeUrl = sanitizeExternalUrl(url);
      if (!safeUrl) {
        setErrorMessage(
          `Link "${label || presetMeta.label || url}" must start with https:// or http://.`,
        );
        return;
      }

      let safeCustomIconUrl: string | undefined;
      if (preset === 'custom' && item.customIconUrl?.trim()) {
        const checkedIcon = sanitizeExternalUrl(item.customIconUrl);
        if (!checkedIcon) {
          setErrorMessage(
            `Custom logo URL for "${label || safeUrl}" must start with https:// or http://.`,
          );
          return;
        }
        safeCustomIconUrl = checkedIcon;
      }

      sanitizedLinks.push({
        label: label || presetMeta.label,
        url: safeUrl,
        preset,
        ...(safeCustomIconUrl ? {customIconUrl: safeCustomIconUrl} : {}),
      });
    }

    const cleanedTypewriterLines = typewriterTexts
      .map((line) => line.trim())
      .filter(Boolean);

    setSaving(true);
    try {
      await updateOwnProfile({
        global_name: globalName.trim() || activeProfile.username,
        avatar_url: safeAvatar,
        bio: bio.trim(),
        typewriter_enabled: typewriterEnabled,
        typewriter_texts: cleanedTypewriterLines,
        click_to_enter_enabled: clickToEnterEnabled,
        click_to_enter_text: clickToEnterText.trim() || 'Click to Enter',
        show_profile_link: false,
        show_views_count: showViewsCount,
        bg_type: bgType,
        bg_url: safeBg,
        bg_opacity: bgOpacity,
        bg_blur: bgBlur,
        card_opacity: cardOpacity,
        card_blur: cardBlur,
        accent_color: cleanAccent,
        theme_color: cleanAccent,
        font_family: sanitizeFontFamily(fontFamily),
        music_title: musicTitle.trim() || null,
        music_artist: musicArtist.trim() || null,
        music_url: safeMusic,
        music_cover: safeCover,
        music_autoplay: musicAutoplay,
        music_position: musicPosition,
        music_style: musicStyle,
        music_show_cover: musicShowCover,
        music_show_progress: musicShowProgress,
        music_show_countdown: musicShowCountdown,
        music_show_controls: musicShowControls,
        music_show_title: musicShowTitle,
        music_show_artist: musicShowArtist,
        links: sanitizedLinks,
      });
      setSaveMessage('All profile changes saved and published.');
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to save changes.',
      );
    } finally {
      setSaving(false);
    }
  };

  const hasGoogleLinked = Boolean(
    activeProfile.firebase_uid || firebaseUser?.uid,
  );
  const hasDiscordLinked = Boolean(activeProfile.discord_id);
  const isUsernameDirty =
    sanitizeHandle(draftUsername) !== activeProfile.username.toLowerCase();

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
        {/* Top Header Summary Strip */}
        <div className="rounded-2xl bg-[#0d0718]/95 border border-purple-500/25 px-5 py-4 sm:px-7 sm:py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[0_18px_50px_rgba(4,2,10,0.65)]">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
              <h1 className="text-lg sm:text-xl font-extrabold text-white truncate">
                Creator Studio &amp; Live Sync
              </h1>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-400 font-mono tabular-nums">
              <span className="text-purple-300">
                clouskee.pp/{activeProfile.username}
              </span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1">
                <Eye className="w-3.5 h-3.5 text-purple-400" />
                <span>
                  {(activeProfile.views ?? 0).toLocaleString()} unique views
                </span>
              </span>
              <span aria-hidden="true">·</span>
              <span className="uppercase text-purple-300 font-semibold">
                {activeProfile.plan || 'free'} plan
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#160b29] hover:bg-[#1f1038] border border-purple-500/30 px-3.5 py-2 text-xs font-semibold text-purple-100 transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Link</span>
                </>
              )}
            </button>
            <Link
              to={profilePath}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#6d28d9] to-[#8b5cf6] hover:brightness-110 px-4 py-2 text-xs font-semibold text-white shadow-[0_0_20px_rgba(139,92,246,0.35)] transition-all"
            >
              <span>Open Live Profile</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Split-Screen Grid: Left ~60% Controls / Right ~40% Sticky Live Sync Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: Categorized Controls */}
          <form
            onSubmit={handleSave}
            className="lg:col-span-7 rounded-2xl bg-[#0b0615]/95 border border-purple-500/20 overflow-hidden shadow-[0_18px_50px_rgba(4,2,10,0.65)]"
          >
            {/* Category Tabs */}
            <div className="border-b border-purple-500/15 px-3 sm:px-5 pt-3 flex items-center gap-1.5 overflow-x-auto">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                      active
                        ? 'border-purple-400 text-white bg-purple-950/30 rounded-t-lg'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="p-5 sm:p-7 space-y-6">
              {/* TAB 1: GENERAL & ACCOUNT */}
              {activeTab === 'general' && (
                <div className="space-y-5">
                  {/* Change Username */}
                  <div className="rounded-xl bg-[#07030d]/80 border border-purple-500/20 p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <label
                        htmlFor="dash-username"
                        className="text-xs font-semibold text-white"
                      >
                        Profile Username (Handle)
                      </label>
                      {usernameStatus.state === 'checking' && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-purple-300">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Checking...</span>
                        </span>
                      )}
                      {usernameStatus.state === 'available' && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{usernameStatus.message}</span>
                        </span>
                      )}
                      {usernameStatus.state === 'taken' && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-rose-400 font-medium">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>{usernameStatus.message}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2.5">
                      <div className="flex-1 flex items-center rounded-xl bg-[#0b0615] border border-purple-500/25 focus-within:border-purple-400 px-3.5 py-2.5">
                        <span className="font-mono text-xs text-purple-400 select-none shrink-0">
                          clouskee.pp/
                        </span>
                        <input
                          id="dash-username"
                          type="text"
                          value={draftUsername}
                          onChange={(e) =>
                            setDraftUsername(sanitizeHandle(e.target.value))
                          }
                          spellCheck={false}
                          autoComplete="off"
                          className="w-full min-w-0 bg-transparent pl-1 font-mono text-sm text-white focus:outline-none"
                        />
                      </div>

                      <button
                        type="button"
                        disabled={
                          !isUsernameDirty ||
                          updatingUsername ||
                          usernameStatus.state === 'taken' ||
                          usernameStatus.state === 'checking'
                        }
                        onClick={handleUpdateUsername}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#6d28d9] hover:bg-[#7c3aed] disabled:opacity-45 px-4 py-2.5 text-xs font-semibold text-white shrink-0 transition-colors cursor-pointer"
                      >
                        {updatingUsername ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Updating...</span>
                          </>
                        ) : (
                          <span>Update Username</span>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Display Name + Avatar URL */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                        htmlFor="dash-avatar-url"
                        className="block text-xs font-medium text-slate-300 mb-1.5"
                      >
                        Avatar Image URL
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          id="dash-avatar-url"
                          type="url"
                          value={avatarUrl}
                          onChange={(e) => setAvatarUrl(e.target.value)}
                          placeholder="https://..."
                          className="flex-1 min-w-0 rounded-xl bg-[#07030d] border border-purple-500/25 focus:border-purple-400 px-3.5 py-2.5 text-sm text-white focus:outline-none"
                        />
                        <label className="inline-flex items-center gap-1 rounded-xl bg-[#160b29] hover:bg-[#1f1038] border border-purple-500/30 px-3 py-2.5 text-xs font-semibold text-purple-200 cursor-pointer shrink-0">
                          {uploadingField === 'avatar' ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Upload className="w-3.5 h-3.5" />
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleMediaUpload(e, 'avatar')}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Bio */}
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

                  {/* Typewriter Animation Toggle & Lines */}
                  <div className="rounded-xl bg-[#07030d]/80 border border-purple-500/20 p-4 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold text-white">
                          Typewriter Bio Animation
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Cycle through animated typing lines below your handle.
                        </p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={typewriterEnabled}
                        onClick={() => setTypewriterEnabled((p) => !p)}
                        className={`w-11 h-6 rounded-full transition-colors p-0.5 cursor-pointer ${
                          typewriterEnabled ? 'bg-purple-600' : 'bg-slate-700'
                        }`}
                      >
                        <span
                          className={`block w-5 h-5 rounded-full bg-white transition-transform ${
                            typewriterEnabled ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {typewriterEnabled && (
                      <div className="space-y-2 pt-2 border-t border-purple-500/15">
                        {typewriterTexts.map((line, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <input
                              type="text"
                              value={line}
                              onChange={(e) =>
                                setTypewriterTexts((prev) =>
                                  prev.map((item, i) =>
                                    i === idx ? e.target.value : item,
                                  ),
                                )
                              }
                              placeholder={`Typewriter line #${idx + 1}`}
                              className="flex-1 rounded-xl bg-[#0b0615] border border-purple-500/25 px-3 py-2 font-mono text-xs text-white focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setTypewriterTexts((prev) =>
                                  prev.filter((_, i) => i !== idx),
                                )
                              }
                              aria-label="Remove typewriter line"
                              className="p-2 rounded-lg bg-[#0b0615] border border-purple-500/20 text-slate-400 hover:text-rose-400 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() =>
                            setTypewriterTexts((prev) => [...prev, ''])
                          }
                          className="inline-flex items-center gap-1 rounded-lg bg-purple-950/60 border border-purple-500/30 px-3 py-1.5 text-xs font-semibold text-purple-200 hover:text-white cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Typing Line</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Click to Enter Overlay & Views Counter Controls */}
                  <div className="rounded-xl bg-[#07030d]/80 border border-purple-500/20 p-4 space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold text-white">
                          Click to Enter Gate Overlay
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Show clean centered text before revealing your page &amp; starting audio.
                        </p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={clickToEnterEnabled}
                        onClick={() => setClickToEnterEnabled((p) => !p)}
                        className={`w-11 h-6 rounded-full transition-colors p-0.5 cursor-pointer shrink-0 ${
                          clickToEnterEnabled ? 'bg-purple-600' : 'bg-slate-700'
                        }`}
                      >
                        <span
                          className={`block w-5 h-5 rounded-full bg-white transition-transform ${
                            clickToEnterEnabled
                              ? 'translate-x-5'
                              : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {clickToEnterEnabled && (
                      <div>
                        <label
                          htmlFor="dash-enter-text"
                          className="block text-[11px] font-medium text-slate-300 mb-1.5"
                        >
                          Entry Overlay Plain Text
                        </label>
                        <input
                          id="dash-enter-text"
                          type="text"
                          value={clickToEnterText}
                          onChange={(e) => setClickToEnterText(e.target.value)}
                          placeholder="Click to Enter"
                          className="w-full rounded-xl bg-[#0b0615] border border-purple-500/25 focus:border-purple-400 px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none"
                        />
                      </div>
                    )}

                    <div className="pt-3 border-t border-purple-500/15 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold text-white">
                          Show Views Count (Bottom-Left)
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Display the eye icon &amp; unique view count at the bottom-left of your card.
                        </p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={showViewsCount}
                        onClick={() => setShowViewsCount((p) => !p)}
                        className={`w-11 h-6 rounded-full transition-colors p-0.5 cursor-pointer shrink-0 ${
                          showViewsCount ? 'bg-purple-600' : 'bg-slate-700'
                        }`}
                      >
                        <span
                          className={`block w-5 h-5 rounded-full bg-white transition-transform ${
                            showViewsCount ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: APPEARANCE & BACKGROUND MEDIA */}
              {activeTab === 'appearance' && (
                <div className="space-y-5">
                  {/* Background Type Selector */}
                  <div>
                    <p className="text-xs font-medium text-slate-300 mb-2">
                      Background Media Type
                    </p>
                    <div className="grid grid-cols-3 gap-2.5">
                      {(
                        [
                          {id: 'none', label: 'None (Glow)', icon: Sparkles},
                          {id: 'image', label: 'Image / GIF', icon: ImageIcon},
                          {id: 'video', label: 'Video Loop', icon: Video},
                        ] as const
                      ).map((opt) => {
                        const Icon = opt.icon;
                        const selected = bgType === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setBgType(opt.id)}
                            className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 px-3 text-xs font-semibold transition-all cursor-pointer ${
                              selected
                                ? 'bg-purple-600/25 border-purple-400 text-white'
                                : 'bg-[#07030d] border-purple-500/20 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            <span>{opt.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Background URL + File Upload */}
                  {bgType !== 'none' && (
                    <div className="rounded-xl bg-[#07030d]/80 border border-purple-500/20 p-4 space-y-3">
                      <label
                        htmlFor="dash-bg-url"
                        className="block text-xs font-medium text-slate-300"
                      >
                        {bgType === 'video'
                          ? 'Background Video URL (.mp4 / .webm) or Upload'
                          : 'Background Image / GIF URL or Upload'}
                      </label>
                      <div className="flex flex-col sm:flex-row gap-2.5">
                        <input
                          id="dash-bg-url"
                          type="url"
                          value={bgUrl}
                          onChange={(e) => setBgUrl(e.target.value)}
                          placeholder={
                            bgType === 'video'
                              ? 'https://cdn.example.com/loop.mp4'
                              : 'https://cdn.example.com/wallpaper.jpg'
                          }
                          className="flex-1 rounded-xl bg-[#0b0615] border border-purple-500/25 focus:border-purple-400 px-3.5 py-2.5 text-sm text-white focus:outline-none"
                        />
                        <label className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#160b29] hover:bg-[#1f1038] border border-purple-500/30 px-4 py-2.5 text-xs font-semibold text-purple-100 cursor-pointer shrink-0">
                          {uploadingField === 'bg' ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Uploading...</span>
                            </>
                          ) : (
                            <>
                              <Upload className="w-3.5 h-3.5" />
                              <span>Upload File</span>
                            </>
                          )}
                          <input
                            type="file"
                            accept={
                              bgType === 'video'
                                ? 'video/mp4,video/webm,video/quicktime'
                                : 'image/*'
                            }
                            onChange={(e) => handleMediaUpload(e, 'bg')}
                            className="hidden"
                          />
                        </label>
                      </div>
                      {bgType === 'video' && (
                        <p className="text-[11px] text-slate-400">
                          Background videos are always muted by default for visitors.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Sliders */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="rounded-xl bg-[#07030d]/80 border border-purple-500/20 p-3.5">
                      <div className="flex justify-between text-xs mb-2">
                        <span className="text-slate-300">
                          Background Overlay
                        </span>
                        <span className="font-mono text-purple-300">
                          {bgOpacity}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={95}
                        value={bgOpacity}
                        onChange={(e) => setBgOpacity(Number(e.target.value))}
                        className="w-full accent-purple-500 cursor-pointer"
                      />
                    </div>

                    <div className="rounded-xl bg-[#07030d]/80 border border-purple-500/20 p-3.5">
                      <div className="flex justify-between text-xs mb-2">
                        <span className="text-slate-300">Background Blur</span>
                        <span className="font-mono text-purple-300">
                          {bgBlur}px
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={24}
                        value={bgBlur}
                        onChange={(e) => setBgBlur(Number(e.target.value))}
                        className="w-full accent-purple-500 cursor-pointer"
                      />
                    </div>

                    <div className="rounded-xl bg-[#07030d]/80 border border-purple-500/20 p-3.5">
                      <div className="flex justify-between text-xs mb-2">
                        <span className="text-slate-300">Card Opacity</span>
                        <span className="font-mono text-purple-300">
                          {cardOpacity}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min={20}
                        max={100}
                        value={cardOpacity}
                        onChange={(e) => setCardOpacity(Number(e.target.value))}
                        className="w-full accent-purple-500 cursor-pointer"
                      />
                    </div>

                    <div className="rounded-xl bg-[#07030d]/80 border border-purple-500/20 p-3.5">
                      <div className="flex justify-between text-xs mb-2">
                        <span className="text-slate-300">Card Glass Blur</span>
                        <span className="font-mono text-purple-300">
                          {cardBlur}px
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={32}
                        value={cardBlur}
                        onChange={(e) => setCardBlur(Number(e.target.value))}
                        className="w-full accent-purple-500 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Accent Color + Font Family */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="dash-accent-color"
                        className="block text-xs font-medium text-slate-300 mb-1.5"
                      >
                        Accent &amp; Glow Color
                      </label>
                      <div className="flex items-center gap-2.5">
                        <input
                          type="color"
                          aria-label="Pick accent color"
                          value={sanitizeHexColor(accentColor)}
                          onChange={(e) => setAccentColor(e.target.value)}
                          className="w-11 h-10 rounded-lg bg-[#07030d] border border-purple-500/25 p-1 cursor-pointer"
                        />
                        <input
                          id="dash-accent-color"
                          type="text"
                          value={accentColor}
                          onChange={(e) => setAccentColor(e.target.value)}
                          placeholder="#8b5cf6"
                          className="flex-1 rounded-xl bg-[#07030d] border border-purple-500/25 focus:border-purple-400 px-3.5 py-2.5 font-mono text-sm text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="dash-font-family"
                        className="block text-xs font-medium text-slate-300 mb-1.5"
                      >
                        Profile Typography
                      </label>
                      <select
                        id="dash-font-family"
                        value={fontFamily}
                        onChange={(e) => setFontFamily(e.target.value)}
                        className="w-full rounded-xl bg-[#07030d] border border-purple-500/25 focus:border-purple-400 px-3.5 py-2.5 text-sm text-white focus:outline-none cursor-pointer"
                      >
                        {ALLOWED_PROFILE_FONTS.map((font) => (
                          <option key={font} value={font}>
                            {font}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: AUDIO & MUSIC PLAYER */}
              {activeTab === 'audio' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  </div>

                  <div>
                    <label
                      htmlFor="dash-music-url"
                      className="block text-xs font-medium text-slate-300 mb-1.5"
                    >
                      Audio Source URL (.mp3 / .wav / .ogg)
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2.5">
                      <input
                        id="dash-music-url"
                        type="url"
                        value={musicUrl}
                        onChange={(e) => setMusicUrl(e.target.value)}
                        placeholder="https://cdn.example.com/track.mp3"
                        className="flex-1 rounded-xl bg-[#07030d] border border-purple-500/25 focus:border-purple-400 px-3.5 py-2.5 text-sm text-white focus:outline-none"
                      />
                      <label className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#160b29] hover:bg-[#1f1038] border border-purple-500/30 px-4 py-2.5 text-xs font-semibold text-purple-100 cursor-pointer shrink-0">
                        {uploadingField === 'audio' ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Upload className="w-3.5 h-3.5" />
                        )}
                        <span>Upload Audio</span>
                        <input
                          type="file"
                          accept="audio/*"
                          onChange={(e) => handleMediaUpload(e, 'audio')}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="dash-music-cover"
                      className="block text-xs font-medium text-slate-300 mb-1.5"
                    >
                      Album Cover Art URL (Optional)
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2.5">
                      <input
                        id="dash-music-cover"
                        type="url"
                        value={musicCover}
                        onChange={(e) => setMusicCover(e.target.value)}
                        placeholder="https://cdn.example.com/cover.png"
                        className="flex-1 rounded-xl bg-[#07030d] border border-purple-500/25 focus:border-purple-400 px-3.5 py-2.5 text-sm text-white focus:outline-none"
                      />
                      <label className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#160b29] hover:bg-[#1f1038] border border-purple-500/30 px-4 py-2.5 text-xs font-semibold text-purple-100 cursor-pointer shrink-0">
                        {uploadingField === 'cover' ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Upload className="w-3.5 h-3.5" />
                        )}
                        <span>Upload Cover</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleMediaUpload(e, 'cover')}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="rounded-xl bg-[#07030d]/80 border border-purple-500/20 p-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold text-white">
                        Auto-play Audio on Profile Load
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Starts automatically when Click to Enter is off (or immediately upon entering).
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={musicAutoplay}
                      onClick={() => setMusicAutoplay((p) => !p)}
                      className={`w-11 h-6 rounded-full transition-colors p-0.5 cursor-pointer shrink-0 ${
                        musicAutoplay ? 'bg-purple-600' : 'bg-slate-700'
                      }`}
                    >
                      <span
                        className={`block w-5 h-5 rounded-full bg-white transition-transform ${
                          musicAutoplay ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Music Card Position (6 Positions) */}
                  <div className="rounded-xl bg-[#07030d]/80 border border-purple-500/20 p-4 space-y-2.5">
                    <p className="text-xs font-semibold text-white">
                      Music Card Position
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {MUSIC_POSITIONS.map((pos) => {
                        const selected = musicPosition === pos.id;
                        return (
                          <button
                            key={pos.id}
                            type="button"
                            onClick={() => setMusicPosition(pos.id)}
                            className={`rounded-xl border px-3 py-2 text-xs font-medium transition-all cursor-pointer ${
                              selected
                                ? 'bg-purple-600/25 border-purple-400 text-white'
                                : 'bg-[#0b0615] border-purple-500/20 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            {pos.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Music Card Style (5 Styles) */}
                  <div className="rounded-xl bg-[#07030d]/80 border border-purple-500/20 p-4 space-y-2.5">
                    <p className="text-xs font-semibold text-white">
                      Music Card Visual Style
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {MUSIC_STYLES.map((st) => {
                        const selected = musicStyle === st.id;
                        return (
                          <button
                            key={st.id}
                            type="button"
                            onClick={() => setMusicStyle(st.id)}
                            className={`rounded-xl border px-3 py-2 text-left text-xs font-medium transition-all cursor-pointer ${
                              selected
                                ? 'bg-purple-600/25 border-purple-400 text-white'
                                : 'bg-[#0b0615] border-purple-500/20 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            {st.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Individual On/Off Toggles for Music Card Elements */}
                  <div className="rounded-xl bg-[#07030d]/80 border border-purple-500/20 p-4 space-y-3">
                    <p className="text-xs font-semibold text-white">
                      Music Card Elements
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {(
                        [
                          {
                            label: 'Cover Image',
                            checked: musicShowCover,
                            toggle: () => setMusicShowCover((v) => !v),
                          },
                          {
                            label: 'Real-Time Progress Bar',
                            checked: musicShowProgress,
                            toggle: () => setMusicShowProgress((v) => !v),
                          },
                          {
                            label: 'Countdown Timer (-mm:ss)',
                            checked: musicShowCountdown,
                            toggle: () => setMusicShowCountdown((v) => !v),
                          },
                          {
                            label: 'Play / Pause Controls',
                            checked: musicShowControls,
                            toggle: () => setMusicShowControls((v) => !v),
                          },
                          {
                            label: 'Track Title',
                            checked: musicShowTitle,
                            toggle: () => setMusicShowTitle((v) => !v),
                          },
                          {
                            label: 'Artist Name',
                            checked: musicShowArtist,
                            toggle: () => setMusicShowArtist((v) => !v),
                          },
                        ] as const
                      ).map((item) => (
                        <div
                          key={item.label}
                          className="flex items-center justify-between gap-2 rounded-lg bg-[#0b0615] border border-purple-500/15 px-3 py-2"
                        >
                          <span className="text-xs text-slate-200">
                            {item.label}
                          </span>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={item.checked}
                            onClick={item.toggle}
                            className={`w-9 h-5 rounded-full transition-colors p-0.5 cursor-pointer shrink-0 ${
                              item.checked ? 'bg-purple-600' : 'bg-slate-700'
                            }`}
                          >
                            <span
                              className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                                item.checked ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: SOCIALS & LINKS */}
              {activeTab === 'links' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-sm font-bold text-white">
                        Socials &amp; Icon Links
                      </h2>
                      <p className="text-xs text-slate-400">
                        Displayed as a clean icon-only row on your profile. Choose a built-in logo preset or upload your own.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setLinks((prev) => [
                          ...prev,
                          {label: 'GitHub', url: '', preset: 'github'},
                        ])
                      }
                      className="inline-flex items-center gap-1 rounded-xl bg-purple-950/60 border border-purple-500/30 px-3.5 py-2 text-xs font-semibold text-purple-200 hover:text-white shrink-0 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Link</span>
                    </button>
                  </div>

                  {links.length === 0 ? (
                    <div className="rounded-xl bg-[#07030d]/70 border border-purple-500/15 px-4 py-6 text-center text-xs text-slate-400">
                      No links added yet. Click &quot;Add Link&quot; above to
                      attach GitHub, YouTube, Discord, X, or custom logo links.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {links.map((item, idx) => {
                        const activePreset = inferPresetFromLink(item);
                        const presetMeta = getPresetMeta(activePreset);
                        return (
                          <div
                            key={idx}
                            className="rounded-xl bg-[#07030d]/85 border border-purple-500/20 p-3.5 space-y-3"
                          >
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                              {/* Preset Icon Preview + Selector */}
                              <div className="flex items-center gap-2 sm:w-44 shrink-0">
                                <div className="w-9 h-9 rounded-lg bg-[#0b0615] border border-purple-500/25 flex items-center justify-center text-white shrink-0">
                                  <SocialPresetIcon
                                    preset={activePreset}
                                    customIconUrl={item.customIconUrl}
                                    label={item.label || presetMeta.label}
                                    className="w-5 h-5"
                                  />
                                </div>
                                <select
                                  aria-label="Icon preset"
                                  value={activePreset}
                                  onChange={(e) => {
                                    const nextPreset =
                                      e.target.value as SocialPresetKey;
                                    const nextMeta = getPresetMeta(nextPreset);
                                    setLinks((prev) =>
                                      prev.map((l, i) => {
                                        if (i !== idx) return l;
                                        const isDefaultLabel =
                                          !l.label.trim() ||
                                          SOCIAL_PRESETS.some(
                                            (p) => p.label === l.label.trim(),
                                          );
                                        return {
                                          ...l,
                                          preset: nextPreset,
                                          label: isDefaultLabel
                                            ? nextMeta.label
                                            : l.label,
                                        };
                                      }),
                                    );
                                  }}
                                  className="flex-1 min-w-0 rounded-lg bg-[#0b0615] border border-purple-500/20 px-2.5 py-2 text-xs text-white focus:outline-none cursor-pointer"
                                >
                                  {SOCIAL_PRESETS.map((p) => (
                                    <option key={p.key} value={p.key}>
                                      {p.label}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {/* Target URL */}
                              <input
                                type="url"
                                value={item.url}
                                onChange={(e) =>
                                  setLinks((prev) =>
                                    prev.map((l, i) =>
                                      i === idx
                                        ? {...l, url: e.target.value}
                                        : l,
                                    ),
                                  )
                                }
                                placeholder={presetMeta.placeholderUrl}
                                className="flex-1 min-w-0 rounded-lg bg-[#0b0615] border border-purple-500/20 px-3 py-2 text-xs sm:text-sm text-white focus:outline-none"
                              />

                              {/* Reorder & Remove */}
                              <div className="flex items-center justify-end gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  disabled={idx === 0}
                                  onClick={() => handleMoveLink(idx, -1)}
                                  aria-label="Move link up"
                                  className="p-2 rounded-lg bg-[#0b0615] border border-purple-500/20 text-slate-300 hover:text-white disabled:opacity-35 cursor-pointer"
                                >
                                  <ArrowUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  disabled={idx === links.length - 1}
                                  onClick={() => handleMoveLink(idx, 1)}
                                  aria-label="Move link down"
                                  className="p-2 rounded-lg bg-[#0b0615] border border-purple-500/20 text-slate-300 hover:text-white disabled:opacity-35 cursor-pointer"
                                >
                                  <ArrowDown className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setLinks((prev) =>
                                      prev.filter((_, i) => i !== idx),
                                    )
                                  }
                                  aria-label="Remove link"
                                  className="p-2 rounded-lg bg-[#0b0615] border border-purple-500/20 text-slate-400 hover:text-rose-400 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Optional Hover Tooltip + Custom Logo Image URL/Upload */}
                            <div
                              className={`grid grid-cols-1 ${
                                activePreset === 'custom' ? 'sm:grid-cols-2' : ''
                              } gap-2.5`}
                            >
                              <input
                                type="text"
                                value={item.label}
                                onChange={(e) =>
                                  setLinks((prev) =>
                                    prev.map((l, i) =>
                                      i === idx
                                        ? {...l, label: e.target.value}
                                        : l,
                                    ),
                                  )
                                }
                                placeholder="Hover tooltip label (e.g. GitHub)"
                                className="rounded-lg bg-[#0b0615] border border-purple-500/15 px-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none"
                              />

                              {activePreset === 'custom' && (
                                <div className="flex items-center gap-2">
                                  <input
                                    type="url"
                                    value={item.customIconUrl ?? ''}
                                    onChange={(e) =>
                                      setLinks((prev) =>
                                        prev.map((l, i) =>
                                          i === idx
                                            ? {
                                                ...l,
                                                preset: 'custom',
                                                customIconUrl: e.target.value,
                                              }
                                            : l,
                                        ),
                                      )
                                    }
                                    placeholder="Custom Logo Image URL (https://...)"
                                    className="flex-1 min-w-0 rounded-lg bg-[#0b0615] border border-purple-500/20 px-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none"
                                  />
                                  <label className="inline-flex items-center gap-1 rounded-lg bg-[#160b29] hover:bg-[#1f1038] border border-purple-500/30 px-2.5 py-1.5 text-[11px] font-semibold text-purple-200 cursor-pointer shrink-0">
                                    {uploadingLinkIconIdx === idx ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <Upload className="w-3 h-3" />
                                    )}
                                    <span>Upload</span>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={(e) =>
                                        handleUploadLinkIcon(e, idx)
                                      }
                                      className="hidden"
                                    />
                                  </label>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: CONNECTIONS (GOOGLE & DISCORD) */}
              {activeTab === 'connections' && (
                <div className="space-y-4">
                  {/* Google Connection */}
                  <div className="rounded-xl bg-[#07030d]/85 border border-purple-500/20 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#141926] border border-slate-700/70 flex items-center justify-center shrink-0">
                        <GoogleBadgeIcon />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-white">
                            Google Account
                          </h3>
                          {hasGoogleLinked ? (
                            <span className="rounded-full bg-emerald-500/15 border border-emerald-400/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                              Connected
                            </span>
                          ) : (
                            <span className="rounded-full bg-slate-800 border border-slate-700 px-2 py-0.5 text-[10px] font-semibold text-slate-400">
                              Not Linked
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-slate-400">
                          {hasGoogleLinked
                            ? `Linked (${activeProfile.email || firebaseUser?.email || 'Firebase Google Auth'}).`
                            : 'Link Google to sign in with either Google or Discord on this same profile.'}
                        </p>
                      </div>
                    </div>

                    {!hasGoogleLinked && (
                      <button
                        type="button"
                        disabled={linkingGoogle}
                        onClick={handleLinkGoogle}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#141926] hover:bg-[#1c2334] border border-slate-700 px-4 py-2.5 text-xs font-semibold text-white shrink-0 transition-colors cursor-pointer disabled:opacity-60"
                      >
                        {linkingGoogle ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Linking...</span>
                          </>
                        ) : (
                          <>
                            <GoogleBadgeIcon />
                            <span>Link Google</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Discord Connection */}
                  <div className="rounded-xl bg-[#07030d]/85 border border-purple-500/20 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center shrink-0 text-indigo-300">
                        <MessageCircle className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-white">
                            Discord &amp; Avatar Decoration
                          </h3>
                          {hasDiscordLinked ? (
                            <span className="rounded-full bg-indigo-500/15 border border-indigo-400/30 px-2 py-0.5 text-[10px] font-semibold text-indigo-200">
                              Connected
                            </span>
                          ) : (
                            <span className="rounded-full bg-slate-800 border border-slate-700 px-2 py-0.5 text-[10px] font-semibold text-slate-400">
                              Not Linked
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-slate-400">
                          {hasDiscordLinked ? (
                            <>
                              Linked as{' '}
                              <span className="font-mono text-purple-300">
                                @
                                {activeProfile.discord_username ||
                                  activeProfile.discord_global_name}
                              </span>
                              . Re-sync anytime to pull your latest Nitro avatar
                              &amp; decoration.
                            </>
                          ) : (
                            'Link Discord OAuth2 to attach your Discord identity, animated avatar, and Nitro decoration.'
                          )}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleSyncDiscord}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#4f46e5]/90 hover:bg-[#4f46e5] border border-indigo-400/35 px-4 py-2.5 text-xs font-semibold text-white shrink-0 transition-colors cursor-pointer"
                    >
                      {hasDiscordLinked ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Re-Sync Discord</span>
                        </>
                      ) : (
                        <>
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>Link Discord</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Feedback + Save Bar */}
              {errorMessage && (
                <p className="text-xs font-medium text-rose-300 bg-rose-950/45 border border-rose-500/30 rounded-xl px-4 py-2.5">
                  {errorMessage}
                </p>
              )}

              {saveMessage && (
                <p className="inline-flex items-center gap-2 text-xs font-medium text-emerald-300 bg-emerald-950/40 border border-emerald-500/30 rounded-xl px-4 py-2.5">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{saveMessage}</span>
                </p>
              )}

              <div className="pt-3 border-t border-purple-500/15 flex items-center justify-between gap-3">
                <p className="text-[11px] text-slate-400">
                  Preview updates live. Save to persist to Supabase.
                </p>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#6d28d9] via-[#7c3aed] to-[#9333ea] hover:brightness-110 disabled:opacity-60 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-[0_0_24px_rgba(139,92,246,0.4)] transition-all cursor-pointer"
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
            </div>
          </form>

          {/* RIGHT COLUMN (~40%): Sticky Live Sync Profile Page Preview Card */}
          <div className="lg:col-span-5 lg:sticky lg:top-28">
            <div className="rounded-2xl bg-[#0d0718]/95 border border-purple-500/30 overflow-hidden shadow-[0_24px_70px_rgba(4,2,10,0.85)]">
              {/* Browser Window Top Bar */}
              <div className="flex items-center justify-between gap-2 px-4 py-2.5 bg-[#090412] border-b border-purple-500/20">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500/70" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400/70" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/70" />
                </div>

                <div className="flex-1 max-w-[230px] truncate rounded-md bg-[#120922] border border-purple-500/20 px-2.5 py-1 text-center font-mono text-[11px] text-purple-200">
                  clouskee.pp/{liveDraftProfile.username}
                </div>

                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Live Sync</span>
                </span>
              </div>

              {/* Embedded Live Sync Profile Preview */}
              <ProfileView profile={liveDraftProfile} isPreview />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
