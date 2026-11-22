import {useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import {ArrowRight, ExternalLink, Pause, Play, X} from 'lucide-react';

export interface DemoProfile {
  handle: string;
  displayName: string;
  bio: string;
  badges: string[];
  trackTitle: string;
  trackArtist: string;
  views: string;
  links: {label: string; meta: string}[];
}

export const DEMO_PROFILES: Record<string, DemoProfile> = {
  clouskee: {
    handle: 'clouskee',
    displayName: 'Clouskee Official',
    bio: 'Next-gen link-in-bio profiles, audio embeds & 5GB edge file hosting.',
    badges: ['👑 Founder', '⚡ Verified OG', '💎 Premium'],
    trackTitle: 'Starlight Odyssey (Phonk Remix)',
    trackArtist: 'KSLV Noh & Clouskee',
    views: '412,840',
    links: [
      {label: 'Official Discord Server', meta: 'Invite'},
      {label: 'Clouskee Assets Pack v2.8', meta: '480 MB · ZIP'},
      {label: 'Lifetime Premium Pass', meta: '7,99€'},
    ],
  },
  alex: {
    handle: 'alex',
    displayName: 'Alex Mercer',
    bio: 'Full-Stack Architect & Digital Creator building shaders and CLI tools.',
    badges: ['⚡ Verified OG', '💎 Premium'],
    trackTitle: 'Midnight Telemetry (Lo-Fi Mix)',
    trackArtist: 'Alex Mercer',
    views: '128,490',
    links: [
      {label: 'Shader Library 2026', meta: '1.2 GB · CDN'},
      {label: 'GitHub Repositories', meta: 'Source'},
      {label: 'Encrypted Client Drop', meta: 'Passcode'},
    ],
  },
  luna: {
    handle: 'luna',
    displayName: 'Luna Rivera',
    bio: 'Visual designer & electronic producer sharing lossless stems and UI kits.',
    badges: ['💎 Premium', '⚡ Verified OG'],
    trackTitle: 'Velvet Horizon (Extended)',
    trackArtist: 'Luna Rivera',
    views: '96,120',
    links: [
      {label: 'Synthwave Stem Pack (24-bit)', meta: '890 MB · FLAC'},
      {label: 'Dark Glass UI Kit', meta: 'Figma · 140 MB'},
      {label: 'Press & Booking Kit', meta: 'PDF'},
    ],
  },
};

interface DemoProfileModalProps {
  profile: DemoProfile | null;
  onClose: () => void;
}

export function DemoProfileModal({profile, onClose}: DemoProfileModalProps) {
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    setPlaying(true);
  }, [profile]);

  useEffect(() => {
    if (!profile) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [profile, onClose]);

  if (!profile) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="demo-profile-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl bg-[#10081e] border border-purple-400/30 p-6 shadow-[0_24px_80px_rgba(7,3,13,0.9),0_0_45px_rgba(139,92,246,0.22)]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close live demo preview"
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-purple-500/15 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#7c3aed] to-[#4c1d95] border border-purple-300/25 flex items-center justify-center text-xl font-extrabold text-white shadow-[0_0_24px_rgba(139,92,246,0.35)]">
            {profile.displayName.charAt(0)}
          </div>
          <div>
            <h3 id="demo-profile-title" className="text-lg font-bold text-white">
              {profile.displayName}
            </h3>
            <p className="font-mono text-xs text-purple-300">
              clouskee.pp/{profile.handle} · {profile.views} views
            </p>
          </div>
        </div>

        {/* Badges */}
        <div className="mt-4 flex flex-wrap gap-2">
          {profile.badges.map((badge) => (
            <span
              key={badge}
              className="inline-flex items-center rounded-full bg-[#1a0f30] border border-purple-400/25 px-2.5 py-0.5 text-[11px] font-semibold text-purple-100"
            >
              {badge}
            </span>
          ))}
        </div>

        {/* Typewriter Bio Preview */}
        <div className="mt-4 rounded-xl bg-[#07030d] border border-purple-500/20 px-3.5 py-2.5 font-mono text-xs text-slate-200 leading-relaxed">
          {profile.bio}
          <span className="inline-block w-1.5 h-3.5 ml-1 align-middle bg-purple-400 animate-pulse" />
        </div>

        {/* Mini Background Audio Player */}
        <div className="mt-3.5 rounded-xl bg-[#160b29] border border-purple-500/25 px-3.5 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setPlaying((prev) => !prev)}
              aria-label={playing ? 'Pause track' : 'Play track'}
              className="w-8 h-8 rounded-full bg-purple-600 hover:bg-purple-500 flex items-center justify-center text-white shrink-0 transition-colors cursor-pointer"
            >
              {playing ? (
                <Pause className="w-3.5 h-3.5" />
              ) : (
                <Play className="w-3.5 h-3.5 ml-0.5" />
              )}
            </button>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">
                {profile.trackTitle}
              </p>
              <p className="text-[11px] text-purple-300 truncate">
                {profile.trackArtist}
              </p>
            </div>
          </div>
          <span className="font-mono text-[11px] text-slate-400 shrink-0 tabular-nums">
            {playing ? 'Playing' : 'Paused'}
          </span>
        </div>

        {/* Demo Links */}
        <div className="mt-4 space-y-2">
          {profile.links.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between rounded-xl bg-[#0a0414] border border-purple-500/20 px-3.5 py-2.5 text-sm"
            >
              <span className="font-medium text-slate-100">{item.label}</span>
              <span className="inline-flex items-center gap-1 font-mono text-xs text-purple-300">
                <span>{item.meta}</span>
                <ExternalLink className="w-3 h-3" aria-hidden="true" />
              </span>
            </div>
          ))}
        </div>

        {/* Action Footer */}
        <div className="mt-5 flex items-center gap-2.5">
          <Link
            to={`/signup?handle=${encodeURIComponent(`${profile.handle}-page`)}`}
            onClick={onClose}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#6d28d9] to-[#8b5cf6] hover:brightness-110 py-2.5 text-sm font-semibold text-white transition-all"
          >
            <span>Build Yours Free</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  );
}
