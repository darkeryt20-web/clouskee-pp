import {useEffect, useMemo, useRef, useState} from 'react';
import {
  ExternalLink,
  Eye,
  Music,
  Pause,
  Play,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {ProfileRecord} from '../lib/supabase';
import {getRuntimeDomainInfo, sanitizeExternalUrl} from '../lib/domain';

export const ALLOWED_PROFILE_FONTS = [
  'Plus Jakarta Sans',
  'JetBrains Mono',
  'Outfit',
  'Manrope',
  'Playfair Display',
  'Space Mono',
] as const;

export function sanitizeHexColor(color: string | null | undefined): string {
  if (!color || typeof color !== 'string') return '#8b5cf6';
  const trimmed = color.trim();
  return /^#[0-9a-fA-F]{6}$/.test(trimmed) ? trimmed : '#8b5cf6';
}

export function sanitizeFontFamily(font: string | null | undefined): string {
  if (!font) return 'Plus Jakarta Sans';
  return ALLOWED_PROFILE_FONTS.includes(
    font as (typeof ALLOWED_PROFILE_FONTS)[number],
  )
    ? font
    : 'Plus Jakarta Sans';
}

function TypewriterBio({lines, staticBio}: {lines: string[]; staticBio: string}) {
  const activeLines = useMemo(
    () => lines.map((l) => l.trim()).filter(Boolean),
    [lines],
  );
  const [lineIndex, setLineIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setLineIndex(0);
    setCharIndex(0);
    setDeleting(false);
  }, [activeLines]);

  useEffect(() => {
    if (activeLines.length === 0) return;
    const current = activeLines[lineIndex % activeLines.length];

    let delay = deleting ? 32 : 58;
    if (!deleting && charIndex === current.length) {
      delay = 1600;
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
        setLineIndex((i) => (i + 1) % activeLines.length);
      }
    }, delay);

    return () => window.clearTimeout(timer);
  }, [activeLines, lineIndex, charIndex, deleting]);

  if (activeLines.length === 0) {
    return staticBio ? (
      <p className="mt-4 max-w-md text-sm text-[#c7bfdc] leading-relaxed">
        {staticBio}
      </p>
    ) : null;
  }

  const currentLine = activeLines[lineIndex % activeLines.length];
  const visibleText = currentLine.slice(0, charIndex);

  return (
    <p className="mt-4 max-w-md min-h-[1.5rem] font-mono text-xs sm:text-sm text-[#e2dbf7] leading-relaxed">
      <span>{visibleText}</span>
      <span
        aria-hidden="true"
        className="inline-block w-[2px] h-4 ml-0.5 align-middle bg-purple-400 animate-pulse"
      />
    </p>
  );
}

interface ProfileViewProps {
  profile: ProfileRecord;
  isPreview?: boolean;
}

export function ProfileView({profile, isPreview = false}: ProfileViewProps) {
  const {host} = getRuntimeDomainInfo();
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoMuted, setVideoMuted] = useState(true);
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

  const displayName = profile.global_name || profile.username;
  const badges = Array.isArray(profile.badges) ? profile.badges : [];
  const links = Array.isArray(profile.links) ? profile.links : [];
  const typewriterLines = Array.isArray(profile.typewriter_texts)
    ? profile.typewriter_texts
    : [];

  useEffect(() => {
    if (isPreview || !profile.music_autoplay || !safeMusicUrl) return;
    const audioEl = audioRef.current;
    if (!audioEl) return;
    audioEl
      .play()
      .then(() => setIsPlaying(true))
      .catch(() => setIsPlaying(false));
  }, [isPreview, profile.music_autoplay, safeMusicUrl]);

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

  const toggleVideoMute = () => {
    const nextMuted = !videoMuted;
    setVideoMuted(nextMuted);
    if (videoRef.current) {
      videoRef.current.muted = nextMuted;
    }
  };

  const bgPositionClass = isPreview ? 'absolute inset-0' : 'fixed inset-0';

  return (
    <div
      className={`${
        isPreview
          ? 'relative min-h-[580px] rounded-b-2xl overflow-hidden px-4 py-8'
          : 'relative min-h-screen overflow-hidden px-4 sm:px-6 py-16'
      } bg-[#07030d] flex items-center justify-center`}
      style={{fontFamily: `"${fontFamily}", sans-serif`}}
    >
      {/* Background Video / Image Layer */}
      {profile.bg_type === 'video' && safeBgUrl && (
        <video
          ref={videoRef}
          src={safeBgUrl}
          autoPlay
          loop
          muted={videoMuted}
          playsInline
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

      {/* Configurable Dark Overlay / Radial Accent Scrim */}
      <div
        aria-hidden="true"
        className={`${bgPositionClass} pointer-events-none`}
        style={{
          backgroundColor:
            profile.bg_type && profile.bg_type !== 'none' && safeBgUrl
              ? `rgba(7, 3, 13, ${bgOpacity})`
              : 'transparent',
          backgroundImage:
            !profile.bg_type || profile.bg_type === 'none' || !safeBgUrl
              ? `radial-gradient(circle at 50% 25%, ${accentColor}30 0%, rgba(7, 3, 13, 0) 70%)`
              : undefined,
        }}
      />

      {/* Video Sound Toggle Button */}
      {profile.bg_type === 'video' && safeBgUrl && (
        <button
          type="button"
          onClick={toggleVideoMute}
          aria-label={
            videoMuted ? 'Unmute background video' : 'Mute background video'
          }
          className={`${
            isPreview ? 'absolute bottom-3 right-3' : 'fixed bottom-5 right-5'
          } z-30 w-9 h-9 rounded-full bg-[#0e071a]/80 hover:bg-[#190d2e] border border-purple-400/30 backdrop-blur-md flex items-center justify-center text-slate-200 hover:text-white transition-colors cursor-pointer`}
        >
          {videoMuted ? (
            <VolumeX className="w-4 h-4" />
          ) : (
            <Volume2 className="w-4 h-4" style={{color: accentColor}} />
          )}
        </button>
      )}

      {safeMusicUrl && (
        <audio
          ref={audioRef}
          src={safeMusicUrl}
          loop
          onEnded={() => setIsPlaying(false)}
        />
      )}

      {/* Main Profile Glass Card */}
      <div className={`relative z-10 w-full ${isPreview ? 'max-w-sm' : 'max-w-lg'} mx-auto`}>
        <div
          className="rounded-3xl border p-6 sm:p-8 shadow-[0_24px_80px_rgba(4,2,10,0.85)] transition-all"
          style={{
            backgroundColor: `rgba(14, 7, 26, ${cardOpacity})`,
            backdropFilter: `blur(${cardBlur}px)`,
            WebkitBackdropFilter: `blur(${cardBlur}px)`,
            borderColor: `${accentColor}4d`,
            boxShadow: `0 24px 80px rgba(4, 2, 10, 0.85), 0 0 42px ${accentColor}24`,
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
                    background: `linear-gradient(135deg, ${accentColor}, #3b0764)`,
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

            <h1 className="mt-4 text-xl sm:text-3xl font-extrabold tracking-tight text-white">
              {displayName}
            </h1>

            <div className="mt-1.5 flex items-center gap-2 text-xs font-mono text-purple-200">
              <span style={{color: accentColor}}>@{profile.username}</span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1 text-slate-300 tabular-nums">
                <Eye className="w-3.5 h-3.5" style={{color: accentColor}} />
                <span>{(profile.views ?? 0).toLocaleString()} views</span>
              </span>
            </div>

            <p className="mt-1 font-mono text-[11px] text-slate-400">
              {host}/{profile.username}
            </p>

            {/* Badges */}
            {badges.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                {badges.map((badge) => (
                  <span
                    key={badge}
                    className="inline-flex items-center rounded-full bg-[#1a0f30]/90 border px-3 py-1 text-xs font-semibold text-purple-100"
                    style={{borderColor: `${accentColor}44`}}
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
                <p className="mt-4 max-w-md text-xs sm:text-sm text-[#c7bfdc] leading-relaxed">
                  {profile.bio}
                </p>
              )
            )}
          </div>

          {/* Music Player Widget */}
          {(profile.music_title ||
            profile.music_artist ||
            safeMusicUrl ||
            safeMusicCover) && (
            <div
              className="mt-6 rounded-2xl bg-[#090412]/85 border px-3.5 py-2.5 flex items-center justify-between gap-3"
              style={{borderColor: `${accentColor}38`}}
            >
              <div className="flex items-center gap-3 min-w-0">
                {safeMusicCover ? (
                  <img
                    src={safeMusicCover}
                    alt={profile.music_title || 'Track cover'}
                    referrerPolicy="no-referrer"
                    className="w-9 h-9 rounded-lg object-cover shrink-0 border border-white/10"
                  />
                ) : null}

                <button
                  type="button"
                  onClick={toggleAudio}
                  aria-label={isPlaying ? 'Pause music' : 'Play music'}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white shrink-0 cursor-pointer transition-transform hover:scale-105"
                  style={{backgroundColor: accentColor}}
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
                  <p
                    className="text-[11px] truncate"
                    style={{color: accentColor}}
                  >
                    {profile.music_artist || displayName}
                  </p>
                </div>
              </div>
              <Music
                className="w-4 h-4 shrink-0"
                style={{color: accentColor}}
              />
            </div>
          )}

          {/* Social Links */}
          <div className="mt-6 space-y-2.5">
            {links.length === 0 ? (
              <div className="rounded-xl bg-[#090412]/65 border border-purple-500/15 px-4 py-3.5 text-center text-xs text-slate-400">
                No public links added yet.
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
                    className="flex items-center justify-between rounded-xl bg-[#090412]/80 hover:bg-[#140a26]/90 border px-4 py-3 text-xs sm:text-sm font-medium text-white transition-all"
                    style={{borderColor: `${accentColor}35`}}
                  >
                    <span className="truncate">{link.label}</span>
                    <ExternalLink
                      className="w-4 h-4 shrink-0"
                      style={{color: accentColor}}
                    />
                  </a>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
