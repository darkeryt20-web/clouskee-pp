import {useEffect, useRef, useState} from 'react';
import {Link, useParams} from 'react-router-dom';
import {
  ExternalLink,
  Eye,
  Loader2,
  Music,
  Pause,
  Play,
  Sparkles,
} from 'lucide-react';
import {useAuth} from '../context/AuthContext';
import {
  getProfileByUsername,
  isSupabaseConfigured,
  ProfileRecord,
  recordUniqueProfileView,
} from '../lib/supabase';
import {getRuntimeDomainInfo, sanitizeExternalUrl} from '../lib/domain';

function sanitizeHexColor(color: string | null | undefined): string {
  if (!color || typeof color !== 'string') return '#8b5cf6';
  const trimmed = color.trim();
  return /^#[0-9a-fA-F]{6}$/.test(trimmed) ? trimmed : '#8b5cf6';
}

export function ProfilePage() {
  const {username = ''} = useParams<{username: string}>();
  const {activeProfile} = useAuth();
  const {host} = getRuntimeDomainInfo();

  const [profile, setProfile] = useState<ProfileRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    const cleanUsername = username.trim().toLowerCase();

    async function loadProfile() {
      setLoading(true);
      setNotFound(false);
      setIsPlaying(false);

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

      // Strictly record at most 1 view per IP address exclusively on /:username
      const result = await recordUniqueProfileView(cleanUsername);
      if (!cancelled && result.counted) {
        setProfile((prev) =>
          prev ? {...prev, views: (prev.views ?? 0) + 1} : prev,
        );
      }
    }

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, [username, activeProfile]);

  const safeMusicUrl = sanitizeExternalUrl(profile?.music_url);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07030d] px-4 flex items-center justify-center">
        <Loader2 className="w-9 h-9 text-purple-400 animate-spin" />
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen bg-[#07030d] px-4 flex items-center justify-center">
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
  const accentColor = sanitizeHexColor(profile.theme_color);
  const displayName = profile.global_name || profile.username;
  const badges = Array.isArray(profile.badges) ? profile.badges : [];
  const links = Array.isArray(profile.links) ? profile.links : [];

  return (
    <div className="min-h-screen bg-[#07030d] px-4 sm:px-6 py-16 flex items-center justify-center relative overflow-hidden">
      {/* Accent Radial Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/4 w-[760px] h-[440px] rounded-full blur-[130px] opacity-40"
        style={{
          background: `radial-gradient(circle, ${accentColor}55 0%, rgba(7, 3, 13, 0) 72%)`,
        }}
      />

      {safeMusicUrl && (
        <audio
          ref={audioRef}
          src={safeMusicUrl}
          loop
          onEnded={() => setIsPlaying(false)}
        />
      )}

      <main className="relative z-10 w-full max-w-lg mx-auto">
        <div
          className="rounded-3xl bg-gradient-to-b from-[#160a28]/95 via-[#0e061b]/95 to-[#0a0414]/95 border p-7 sm:p-9 shadow-[0_24px_80px_rgba(4,2,10,0.85)]"
          style={{
            borderColor: `${accentColor}4d`,
            boxShadow: `0 24px 80px rgba(4, 2, 10, 0.85), 0 0 45px ${accentColor}24`,
          }}
        >
          {/* Avatar + Discord Avatar Decoration Overlay */}
          <div className="flex flex-col items-center text-center">
            <div className="relative w-28 h-28 flex items-center justify-center">
              {safeAvatar ? (
                <img
                  src={safeAvatar}
                  alt={`${displayName} avatar`}
                  referrerPolicy="no-referrer"
                  className="w-24 h-24 rounded-full object-cover border-2"
                  style={{borderColor: `${accentColor}66`}}
                />
              ) : (
                <div
                  className="w-24 h-24 rounded-full border-2 flex items-center justify-center text-3xl font-extrabold text-white"
                  style={{
                    borderColor: `${accentColor}66`,
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
                <Eye className="w-3.5 h-3.5" style={{color: accentColor}} />
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
          {(profile.music_title || profile.music_artist || safeMusicUrl) && (
            <div className="mt-7 rounded-2xl bg-[#090412]/95 border border-purple-500/25 px-4 py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
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
                  <p className="text-[11px] text-purple-300 truncate">
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
      </main>
    </div>
  );
}

export default ProfilePage;
