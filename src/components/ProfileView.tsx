import {MouseEvent, useEffect, useMemo, useRef, useState} from 'react';
import {Eye} from 'lucide-react';
import {
  CustomCursorStyle,
  GlobalNameEffect,
  MusicCardPosition,
  ProfileRecord,
} from '../lib/supabase';
import {getRuntimeDomainInfo, sanitizeExternalUrl} from '../lib/domain';
import {
  getPresetMeta,
  inferPresetFromLink,
  SocialPresetIcon,
} from './SocialPresetIcons';
import {MusicPlayerCard, normalizeMusicPosition} from './MusicPlayerCard';
import {CustomCursorLayer, useFinePointer} from './CustomCursorLayer';
import {LightningCursorCanvas} from './LightningCursorCanvas';

const DEFAULT_DOCUMENT_TITLE =
  'Clouskee PP — Next-Gen Profile Pages & Secure File Hosting';

export const ALLOWED_PROFILE_FONTS = [
  'Plus Jakarta Sans',
  'JetBrains Mono',
  'Outfit',
  'Manrope',
  'Playfair Display',
  'Space Mono',
] as const;

export const GLOBAL_NAME_EFFECTS: {id: GlobalNameEffect; label: string}[] = [
  {id: 'none', label: 'None'},
  {id: 'gradient_shimmer', label: 'Gradient Shimmer'},
  {id: 'neon_pulse', label: 'Neon Pulse'},
  {id: 'typewriter_cursor', label: 'Typewriter Cursor'},
  {id: 'floating_letter', label: 'Floating Letters'},
];

export function sanitizeHexColor(
  color: string | null | undefined,
  fallback = '#8b5cf6',
): string {
  if (!color || typeof color !== 'string') return fallback;
  const trimmed = color.trim();
  return /^#[0-9a-fA-F]{6}$/.test(trimmed) ? trimmed : fallback;
}

export function sanitizeFontFamily(font: string | null | undefined): string {
  if (!font) return 'Plus Jakarta Sans';
  return ALLOWED_PROFILE_FONTS.includes(
    font as (typeof ALLOWED_PROFILE_FONTS)[number],
  )
    ? font
    : 'Plus Jakarta Sans';
}

function useTypewriterCycle(
  lines: string[],
  enabled: boolean,
  typeSpeedMs = 65,
  deleteSpeedMs = 35,
  pauseMs = 1500,
) {
  const cleanLines = useMemo(
    () => lines.map((l) => l.trim()).filter(Boolean),
    [lines],
  );
  const [lineIndex, setLineIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);

  const signature = cleanLines.join('\n');

  useEffect(() => {
    setLineIndex(0);
    setCharIndex(0);
    setDeleting(false);
  }, [signature, enabled]);

  useEffect(() => {
    if (!enabled || cleanLines.length === 0) return;
    const current = cleanLines[lineIndex % cleanLines.length];

    let delay = deleting ? deleteSpeedMs : typeSpeedMs;
    if (!deleting && charIndex === current.length) {
      delay = pauseMs;
    } else if (deleting && charIndex === 0) {
      delay = 320;
    }

    const timer = window.setTimeout(() => {
      if (!deleting) {
        if (charIndex < current.length) {
          setCharIndex((c) => c + 1);
        } else {
          setDeleting(true);
        }
      } else if (charIndex > 0) {
        setCharIndex((c) => c - 1);
      } else {
        setDeleting(false);
        setLineIndex((i) => (i + 1) % cleanLines.length);
      }
    }, delay);

    return () => window.clearTimeout(timer);
  }, [
    enabled,
    cleanLines,
    lineIndex,
    charIndex,
    deleting,
    typeSpeedMs,
    deleteSpeedMs,
    pauseMs,
  ]);

  if (!enabled || cleanLines.length === 0) {
    return cleanLines[0] ?? '';
  }

  const currentLine = cleanLines[lineIndex % cleanLines.length];
  return currentLine.slice(0, charIndex);
}

export function useAnimatedPageTitle(profile: ProfileRecord): string {
  const mode = profile.page_title_mode === 'username' ? 'username' : 'global_name';
  const baseTitle =
    mode === 'username'
      ? `@${profile.username}`
      : profile.global_name?.trim() || profile.username;

  const extraTitles = useMemo(
    () =>
      Array.isArray(profile.page_title_texts)
        ? profile.page_title_texts.map((t) => t.trim()).filter(Boolean)
        : [],
    [profile.page_title_texts],
  );

  const allTitles = useMemo(
    () => [baseTitle, ...extraTitles],
    [baseTitle, extraTitles],
  );

  const typewriterEnabled = Boolean(profile.page_title_typewriter);
  const typed = useTypewriterCycle(allTitles, typewriterEnabled, 175, 95, 1400);

  if (!typewriterEnabled) {
    return baseTitle;
  }

  // Never allow an empty document.title so browsers don't flash the raw URL
  return typed.length > 0 ? typed : '|';
}

function TypewriterBio({lines, staticBio}: {lines: string[]; staticBio: string}) {
  const cleanLines = useMemo(
    () => lines.map((l) => l.trim()).filter(Boolean),
    [lines],
  );
  const visibleText = useTypewriterCycle(cleanLines, cleanLines.length > 0);

  if (cleanLines.length === 0) {
    return staticBio ? (
      <p className="mt-4 max-w-md text-sm text-zinc-300 leading-relaxed">
        {staticBio}
      </p>
    ) : null;
  }

  return (
    <p className="mt-4 max-w-md min-h-[1.5rem] font-mono text-xs sm:text-sm text-zinc-100 leading-relaxed">
      <span>{visibleText}</span>
      <span
        aria-hidden="true"
        className="inline-block w-[2px] h-4 ml-0.5 align-middle bg-white/80 animate-pulse"
      />
    </p>
  );
}

function GlobalNameHeading({
  profile,
  accentColor,
}: {
  profile: ProfileRecord;
  accentColor: string;
}) {
  const baseName = profile.global_name?.trim() || profile.username;
  const extraNames = useMemo(
    () =>
      Array.isArray(profile.global_name_texts)
        ? profile.global_name_texts.map((t) => t.trim()).filter(Boolean)
        : [],
    [profile.global_name_texts],
  );
  const lines = useMemo(() => [baseName, ...extraNames], [baseName, extraNames]);
  const typewriterEnabled = Boolean(profile.global_name_typewriter);
  const typedName = useTypewriterCycle(lines, typewriterEnabled, 85, 45, 1600);

  const displayedName = typewriterEnabled ? typedName : baseName;
  const effect: GlobalNameEffect = profile.global_name_effect ?? 'none';
  const nameColor = sanitizeHexColor(profile.global_name_color, '#ffffff');
  const hasGlow = Boolean(profile.global_name_glow) || effect === 'neon_pulse';

  const textShadow = hasGlow
    ? effect === 'neon_pulse'
      ? `0 0 14px ${nameColor}aa, 0 0 28px ${accentColor}77`
      : `0 0 18px ${nameColor}88`
    : undefined;

  const isShimmer = effect === 'gradient_shimmer';
  const showCursor = typewriterEnabled || effect === 'typewriter_cursor';

  return (
    <h1
      className={`mt-4 min-h-[2.25rem] text-xl sm:text-3xl font-extrabold tracking-tight flex items-center justify-center flex-wrap ${
        effect === 'neon_pulse' ? 'animate-neon-pulse' : ''
      }`}
      style={{textShadow}}
    >
      {effect === 'floating_letter' ? (
        <span className="inline-flex flex-wrap justify-center">
          {(displayedName || '\u00A0').split('').map((char, idx) => (
            <span
              key={`${idx}-${char}`}
              className="inline-block animate-gentle-float"
              style={{
                color: nameColor,
                animationDelay: `${idx * 65}ms`,
              }}
            >
              {char === ' ' ? '\u00A0' : char}
            </span>
          ))}
        </span>
      ) : (
        <span
          className={
            isShimmer
              ? 'bg-clip-text text-transparent animate-text-shimmer'
              : undefined
          }
          style={
            isShimmer
              ? {
                  backgroundImage: `linear-gradient(90deg, ${nameColor}, ${accentColor}, #ffffff, ${nameColor})`,
                }
              : {color: nameColor}
          }
        >
          {displayedName}
        </span>
      )}

      {showCursor && (
        <span
          aria-hidden="true"
          className="inline-block w-[2px] h-6 sm:h-7 ml-1 align-middle animate-pulse"
          style={{backgroundColor: nameColor}}
        />
      )}
    </h1>
  );
}

interface ProfileViewProps {
  profile: ProfileRecord;
  isPreview?: boolean;
}

export function ProfileView({profile, isPreview = false}: ProfileViewProps) {
  const {host} = getRuntimeDomainInfo();
  const isFinePointer = useFinePointer();

  const clickToEnterEnabled = profile.click_to_enter_enabled !== false;
  const clickToEnterText =
    profile.click_to_enter_text?.trim() || 'Click to Enter';

  const [hasEntered, setHasEntered] = useState(
    () => isPreview || !clickToEnterEnabled,
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [cursorPos, setCursorPos] = useState({x: 0, y: 0, visible: false});

  const containerRef = useRef<HTMLDivElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const safeAvatar = sanitizeExternalUrl(profile.avatar_url);
  const safeDecoration = sanitizeExternalUrl(profile.avatar_decoration_url);
  const safeBgUrl = sanitizeExternalUrl(profile.bg_url);
  const safeMusicUrl = sanitizeExternalUrl(profile.music_url);
  const safeMusicCover = sanitizeExternalUrl(profile.music_cover);

  const accentColor = sanitizeHexColor(
    profile.accent_color || profile.theme_color,
  );
  const fontFamily = sanitizeFontFamily(profile.font_family);
  const bgOpacity = Math.min(95, Math.max(0, profile.bg_opacity ?? 55)) / 100;
  const bgBlur = Math.min(24, Math.max(0, profile.bg_blur ?? 0));
  const cardOpacity =
    Math.min(100, Math.max(20, profile.card_opacity ?? 88)) / 100;
  const cardBlur = Math.min(32, Math.max(0, profile.card_blur ?? 16));

  const hasCustomMediaBg = Boolean(
    profile.bg_type && profile.bg_type !== 'none' && safeBgUrl,
  );

  const displayName = profile.global_name || profile.username;
  const badges = Array.isArray(profile.badges) ? profile.badges : [];
  const links = Array.isArray(profile.links) ? profile.links : [];
  const typewriterLines = Array.isArray(profile.typewriter_texts)
    ? profile.typewriter_texts
    : [];

  const showProfileLink = profile.show_profile_link === true;
  const showViewsCount = profile.show_views_count !== false;

  const musicCardEnabled = profile.music_card_enabled !== false;
  const musicPosition = normalizeMusicPosition(profile.music_position);
  const hasMusicMetadata = Boolean(
    profile.music_title ||
      profile.music_artist ||
      safeMusicUrl ||
      safeMusicCover,
  );
  const showVisibleMusicCard = musicCardEnabled && hasMusicMetadata;

  const customCursorEnabled =
    Boolean(profile.custom_cursor_enabled) && isFinePointer;
  const customCursorStyle: CustomCursorStyle =
    profile.custom_cursor_style ?? 'dot_ring';
  const lightningCursorEnabled = Boolean(profile.lightning_cursor_enabled);
  const lightningCursorColor = sanitizeHexColor(
    profile.lightning_cursor_color,
    '#f43f5e',
  );
  const lightningTrailLength = Math.min(
    300,
    Math.max(30, Math.round(Number(profile.lightning_trail_length ?? 120) || 120)),
  );

  const animatedBrowserTitle = useAnimatedPageTitle(profile);

  // Update real browser document.title on public /:username pages
  useEffect(() => {
    if (isPreview || typeof document === 'undefined') return;
    document.title = animatedBrowserTitle;
  }, [isPreview, animatedBrowserTitle]);

  useEffect(() => {
    if (isPreview || typeof document === 'undefined') return;
    return () => {
      document.title = DEFAULT_DOCUMENT_TITLE;
    };
  }, [isPreview]);

  useEffect(() => {
    if (isPreview || !clickToEnterEnabled) {
      setHasEntered(true);
    } else {
      setHasEntered(false);
    }
  }, [isPreview, clickToEnterEnabled, profile.username]);

  // Always enforce muted=true on background videos on mount/load
  useEffect(() => {
    if (profile.bg_type === 'video' && videoRef.current) {
      videoRef.current.defaultMuted = true;
      videoRef.current.muted = true;
    }
  }, [profile.bg_type, safeBgUrl]);

  // Reset audio progress when music URL changes
  useEffect(() => {
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
  }, [safeMusicUrl]);

  // Autoplay when gate is disabled and music_autoplay is on (even if music card UI is hidden)
  useEffect(() => {
    if (
      isPreview ||
      clickToEnterEnabled ||
      !profile.music_autoplay ||
      !safeMusicUrl
    ) {
      return;
    }
    const audioEl = audioRef.current;
    if (!audioEl) return;
    audioEl
      .play()
      .then(() => setIsPlaying(true))
      .catch(() => setIsPlaying(false));
  }, [isPreview, clickToEnterEnabled, profile.music_autoplay, safeMusicUrl]);

  const handleEnterSite = () => {
    setHasEntered(true);
    if (videoRef.current) {
      videoRef.current.defaultMuted = true;
      videoRef.current.muted = true;
    }
    // Start audio even when music_card_enabled is false (invisible background audio)
    if (safeMusicUrl && audioRef.current) {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  };

  const toggleAudio = async () => {
    if (safeMusicUrl && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        try {
          await audioRef.current.play();
          setIsPlaying(true);
        } catch {
          setIsPlaying(false);
        }
      }
    } else {
      setIsPlaying((prev) => !prev);
    }
  };

  const handleSeek = (nextTime: number) => {
    setCurrentTime(nextTime);
    if (audioRef.current) {
      audioRef.current.currentTime = nextTime;
    }
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!customCursorEnabled) return;
    if (isPreview && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setCursorPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        visible: true,
      });
    } else {
      setCursorPos({x: e.clientX, y: e.clientY, visible: true});
    }
  };

  const handleMouseLeave = () => {
    if (!customCursorEnabled) return;
    setCursorPos((prev) => ({...prev, visible: false}));
  };

  const bgPositionClass = isPreview ? 'absolute inset-0' : 'fixed inset-0';
  const isCornerTop =
    showVisibleMusicCard &&
    (musicPosition === 'page_top_left' || musicPosition === 'page_top_right');
  const isCornerBottom =
    showVisibleMusicCard &&
    (musicPosition === 'page_bottom_left' ||
      musicPosition === 'page_bottom_right');

  const cornerPlacementClass: Record<
    Exclude<MusicCardPosition, 'profile_card_on' | 'profile_card_bottom'>,
    string
  > = {
    page_top_left: isPreview
      ? 'absolute top-3 left-3'
      : 'fixed top-4 left-4',
    page_top_right: isPreview
      ? 'absolute top-3 right-3'
      : 'fixed top-4 right-4',
    page_bottom_left: isPreview
      ? 'absolute bottom-3 left-3'
      : 'fixed bottom-4 left-4',
    page_bottom_right: isPreview
      ? 'absolute bottom-3 right-3'
      : 'fixed bottom-4 right-4',
  };

  const renderMusicCard = (extraClass = '') => {
    if (!showVisibleMusicCard) return null;
    return (
      <MusicPlayerCard
        profile={profile}
        safeMusicCover={safeMusicCover}
        accentColor={accentColor}
        cardOpacity={cardOpacity}
        cardBlur={cardBlur}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        onTogglePlay={toggleAudio}
        onSeek={handleSeek}
        className={extraClass}
      />
    );
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`${
        isPreview
          ? `relative min-h-[600px] rounded-b-2xl overflow-hidden px-4 ${
              isCornerTop ? 'pt-24' : 'py-8'
            } ${isCornerBottom ? 'pb-24' : 'py-8'}`
          : `relative min-h-screen overflow-hidden px-4 sm:px-6 ${
              isCornerTop ? 'pt-28 sm:pt-20' : 'py-14'
            } ${isCornerBottom ? 'pb-28 sm:pb-20' : 'py-14'}`
      } ${
        customCursorEnabled ? 'cursor-none [&_*]:cursor-none' : ''
      } bg-[#09090c] flex items-center justify-center`}
      style={{fontFamily: `"${fontFamily}", sans-serif`}}
    >
      {/* Background Video (Strictly Muted) / Image Layer */}
      {profile.bg_type === 'video' && safeBgUrl && (
        <video
          ref={videoRef}
          src={safeBgUrl}
          autoPlay
          loop
          muted
          playsInline
          onLoadedMetadata={() => {
            if (videoRef.current) {
              videoRef.current.defaultMuted = true;
              videoRef.current.muted = true;
            }
          }}
          className={`${bgPositionClass} w-full h-full object-cover pointer-events-none scale-105`}
          style={{filter: bgBlur > 0 ? `blur(${bgBlur}px)` : undefined}}
        />
      )}

      {profile.bg_type === 'image' && safeBgUrl && (
        <img
          src={safeBgUrl}
          alt=""
          aria-hidden="true"
          referrerPolicy="no-referrer"
          className={`${bgPositionClass} w-full h-full object-cover pointer-events-none scale-105`}
          style={{filter: bgBlur > 0 ? `blur(${bgBlur}px)` : undefined}}
        />
      )}

      {/* Clean Neutral Dark Overlay */}
      <div
        aria-hidden="true"
        className={`${bgPositionClass} pointer-events-none`}
        style={{
          backgroundColor: hasCustomMediaBg
            ? `rgba(8, 8, 12, ${bgOpacity})`
            : 'transparent',
          backgroundImage: !hasCustomMediaBg
            ? `radial-gradient(circle at 50% 25%, ${accentColor}20 0%, rgba(9, 9, 12, 0) 68%)`
            : undefined,
        }}
      />

      {/* Hidden Audio Element — Always Active Even When Music Card Is Off */}
      {safeMusicUrl && (
        <audio
          ref={audioRef}
          src={safeMusicUrl}
          loop
          preload="metadata"
          onLoadedMetadata={(e) => {
            const el = e.currentTarget;
            if (Number.isFinite(el.duration)) setDuration(el.duration);
          }}
          onDurationChange={(e) => {
            const el = e.currentTarget;
            if (Number.isFinite(el.duration)) setDuration(el.duration);
          }}
          onTimeUpdate={(e) => {
            setCurrentTime(e.currentTarget.currentTime);
          }}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
        />
      )}

      {/* Page-Corner Music Card Positions */}
      {showVisibleMusicCard &&
        musicPosition !== 'profile_card_on' &&
        musicPosition !== 'profile_card_bottom' && (
          <div
            className={`${cornerPlacementClass[musicPosition]} z-30 ${
              isPreview
                ? 'w-[245px] max-w-[calc(100%-1.5rem)]'
                : 'w-[calc(100vw-2rem)] sm:w-80'
            }`}
          >
            {renderMusicCard()}
          </div>
        )}

      {/* Main Profile Container + Optional Separate Card Directly Below */}
      <div
        className={`relative z-10 w-full ${
          isPreview ? 'max-w-sm' : 'max-w-lg'
        } mx-auto`}
      >
        <div
          className="rounded-3xl border p-6 sm:p-8 transition-all"
          style={{
            backgroundColor: `rgba(12, 12, 16, ${cardOpacity})`,
            backdropFilter: `blur(${cardBlur}px)`,
            WebkitBackdropFilter: `blur(${cardBlur}px)`,
            borderColor: 'rgba(255, 255, 255, 0.12)',
            boxShadow: '0 24px 70px rgba(0, 0, 0, 0.55)',
          }}
        >
          {/* Avatar + Discord Avatar Decoration Overlay */}
          <div className="flex flex-col items-center text-center">
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center">
              {safeAvatar ? (
                <img
                  src={safeAvatar}
                  alt={`${displayName} avatar`}
                  referrerPolicy="no-referrer"
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-2"
                  style={{borderColor: `${accentColor}77`}}
                />
              ) : (
                <div
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 flex items-center justify-center text-2xl sm:text-3xl font-extrabold text-white"
                  style={{
                    borderColor: `${accentColor}77`,
                    background: `linear-gradient(135deg, ${accentColor}, #18181b)`,
                  }}
                >
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}

              {safeDecoration && (
                <img
                  src={safeDecoration}
                  alt=""
                  aria-hidden="true"
                  referrerPolicy="no-referrer"
                  className="pointer-events-none select-none absolute inset-0 w-24 h-24 sm:w-28 sm:h-28 object-contain"
                />
              )}
            </div>

            {/* Enhanced Global Name with Effects & Typewriter Animation */}
            <GlobalNameHeading profile={profile} accentColor={accentColor} />

            <p
              className="mt-1 text-xs font-mono"
              style={{color: accentColor}}
            >
              @{profile.username}
            </p>

            {showProfileLink && (
              <p className="mt-1 font-mono text-[11px] text-zinc-400">
                {host}/{profile.username}
              </p>
            )}

            {/* Badges */}
            {badges.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                {badges.map((badge) => (
                  <span
                    key={badge}
                    className="inline-flex items-center rounded-full bg-white/10 border border-white/15 px-3 py-1 text-xs font-semibold text-zinc-100"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            )}

            {/* Bio / Typewriter Bio */}
            {profile.typewriter_enabled ? (
              <TypewriterBio
                lines={typewriterLines}
                staticBio={profile.bio || ''}
              />
            ) : (
              profile.bio && (
                <p className="mt-4 max-w-md text-xs sm:text-sm text-zinc-300 leading-relaxed">
                  {profile.bio}
                </p>
              )
            )}
          </div>

          {/* Social Links — Clean Horizontal Icon/Logo-Only Row */}
          {links.length > 0 && (
            <div className="mt-6 pt-1 flex flex-wrap items-center justify-center gap-4 sm:gap-5">
              {links.map((link, idx) => {
                const safeHref = sanitizeExternalUrl(link.url);
                if (!safeHref) return null;
                const preset = inferPresetFromLink(link);
                const presetMeta = getPresetMeta(preset);
                const tooltipText =
                  link.label?.trim() ||
                  (preset !== 'custom' && preset !== 'globe'
                    ? presetMeta.label
                    : safeHref);

                return (
                  <a
                    key={`${preset}-${idx}`}
                    href={safeHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={tooltipText}
                    aria-label={tooltipText}
                    className="group relative inline-flex items-center justify-center text-white/85 hover:text-white transition-all duration-150 hover:scale-115 hover:-translate-y-0.5 focus:outline-none"
                  >
                    <SocialPresetIcon
                      preset={preset}
                      customIconUrl={link.customIconUrl}
                      label={tooltipText}
                      className="w-6 h-6 sm:w-7 sm:h-7 drop-shadow-[0_2px_8px_rgba(0,0,0,0.45)]"
                    />
                    <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-zinc-900/95 border border-white/15 px-2 py-0.5 text-[10px] font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                      {tooltipText}
                    </span>
                  </a>
                );
              })}
            </div>
          )}

          {/* Music Card Position: profile_card_on (Embedded Inside Profile Card) */}
          {musicPosition === 'profile_card_on' && renderMusicCard('mt-6')}

          {/* Views Count at Bottom-Left of Profile Card */}
          {showViewsCount && (
            <div className="mt-6 flex items-center justify-start">
              <span className="inline-flex items-center gap-1.5 text-xs font-mono text-zinc-300 tabular-nums">
                <Eye className="w-3.5 h-3.5" style={{color: accentColor}} />
                <span>{(profile.views ?? 0).toLocaleString()}</span>
              </span>
            </div>
          )}
        </div>

        {/* Music Card Position: profile_card_bottom (Separate Standalone Card Below Profile Card) */}
        {musicPosition === 'profile_card_bottom' && renderMusicCard('mt-4')}
      </div>

      {/* Full-Screen "Click to Enter" Normal Plain Text Overlay (Public Profile Only) */}
      {!isPreview && clickToEnterEnabled && !hasEntered && (
        <div
          role="button"
          tabIndex={0}
          onClick={handleEnterSite}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleEnterSite();
            }
          }}
          aria-label={clickToEnterText}
          className="fixed inset-0 z-50 bg-black/82 backdrop-blur-md flex items-center justify-center px-6 cursor-pointer select-none"
        >
          <span className="text-base sm:text-lg font-medium tracking-wide text-white/90 hover:text-white transition-opacity">
            {clickToEnterText}
          </span>
        </div>
      )}

      {/* Electric Lightning & Click Shockwave Canvas Overlay */}
      <LightningCursorCanvas
        enabled={lightningCursorEnabled}
        color={lightningCursorColor}
        trailLength={lightningTrailLength}
        isPreview={isPreview}
        containerRef={containerRef}
      />

      {/* Custom Cursor Overlay */}
      <CustomCursorLayer
        enabled={customCursorEnabled}
        style={customCursorStyle}
        customUrl={profile.custom_cursor_url}
        accentColor={accentColor}
        isPreview={isPreview}
        position={cursorPos}
      />
    </div>
  );
}
