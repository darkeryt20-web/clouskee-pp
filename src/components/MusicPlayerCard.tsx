import {Disc3, Music, Pause, Play} from 'lucide-react';
import {CSSProperties} from 'react';
import {ProfileRecord} from '../lib/supabase';

export const MUSIC_POSITIONS = [
  {id: 'profile_top', label: 'Profile Card Top'},
  {id: 'profile_bottom', label: 'Profile Card Bottom'},
  {id: 'page_top_left', label: 'Page Top Left'},
  {id: 'page_top_right', label: 'Page Top Right'},
  {id: 'page_bottom_left', label: 'Page Bottom Left'},
  {id: 'page_bottom_right', label: 'Page Bottom Right'},
] as const;

export const MUSIC_STYLES = [
  {id: 1, label: 'Style 1 · Classic Glass'},
  {id: 2, label: 'Style 2 · Compact Pill'},
  {id: 3, label: 'Style 3 · Centered Minimal'},
  {id: 4, label: 'Style 4 · Vinyl Spotlight'},
  {id: 5, label: 'Style 5 · Micro HUD'},
] as const;

function formatClock(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0:00';
  const total = Math.floor(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

interface MusicPlayerCardProps {
  profile: ProfileRecord;
  safeMusicCover: string | null;
  accentColor: string;
  cardOpacity: number;
  cardBlur: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onTogglePlay: () => void;
  onSeek: (nextTime: number) => void;
  className?: string;
}

export function MusicPlayerCard({
  profile,
  safeMusicCover,
  accentColor,
  cardOpacity,
  cardBlur,
  isPlaying,
  currentTime,
  duration,
  onTogglePlay,
  onSeek,
  className = '',
}: MusicPlayerCardProps) {
  const styleId = Math.min(5, Math.max(1, Number(profile.music_style || 1)));
  const showCover = profile.music_show_cover !== false;
  const showProgress = profile.music_show_progress !== false;
  const showCountdown = profile.music_show_countdown !== false;
  const showControls = profile.music_show_controls !== false;
  const showTitle = profile.music_show_title !== false;
  const showArtist = profile.music_show_artist !== false;

  const titleText = profile.music_title?.trim() || 'Profile Track';
  const artistText =
    profile.music_artist?.trim() || profile.global_name || profile.username;

  const progressPct =
    duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;
  const remainingSec = duration > 0 ? Math.max(0, duration - currentTime) : 0;
  const countdownText = `-${formatClock(remainingSec)}`;

  const glassStyle: CSSProperties = {
    backgroundColor: `rgba(12, 12, 16, ${Math.min(0.95, Math.max(0.32, cardOpacity))})`,
    backdropFilter: `blur(${cardBlur}px)`,
    WebkitBackdropFilter: `blur(${cardBlur}px)`,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    boxShadow: '0 14px 36px rgba(0, 0, 0, 0.42)',
  };

  const renderCover = (sizeClass: string, roundClass = 'rounded-xl', spin = false) => {
    if (!showCover) return null;
    if (safeMusicCover) {
      return (
        <img
          src={safeMusicCover}
          alt={titleText}
          referrerPolicy="no-referrer"
          className={`${sizeClass} ${roundClass} object-cover shrink-0 border border-white/15 ${
            spin && isPlaying ? 'animate-[spin_9s_linear_infinite]' : ''
          }`}
        />
      );
    }
    return (
      <div
        className={`${sizeClass} ${roundClass} bg-white/8 border border-white/12 flex items-center justify-center shrink-0 text-zinc-200 ${
          spin && isPlaying ? 'animate-[spin_9s_linear_infinite]' : ''
        }`}
      >
        {spin ? (
          <Disc3 className="w-5 h-5" style={{color: accentColor}} />
        ) : (
          <Music className="w-4 h-4" style={{color: accentColor}} />
        )}
      </div>
    );
  };

  const renderProgressBar = (heightClass = 'h-1.5') => {
    if (!showProgress) return null;
    return (
      <div className="relative flex-1 flex items-center group">
        <div
          className={`w-full ${heightClass} rounded-full bg-white/12 overflow-hidden`}
        >
          <div
            className="h-full rounded-full transition-[width] duration-150"
            style={{
              width: `${progressPct}%`,
              backgroundColor: accentColor,
            }}
          />
        </div>
        {duration > 0 && (
          <input
            type="range"
            aria-label="Seek track position"
            min={0}
            max={duration}
            step={0.1}
            value={Math.min(duration, currentTime)}
            onChange={(e) => onSeek(Number(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        )}
      </div>
    );
  };

  const renderPlayButton = (sizeClass = 'w-9 h-9', iconSize = 'w-3.5 h-3.5') => {
    if (!showControls) return null;
    return (
      <button
        type="button"
        onClick={onTogglePlay}
        aria-label={isPlaying ? 'Pause music' : 'Play music'}
        className={`${sizeClass} rounded-full flex items-center justify-center text-white shrink-0 cursor-pointer transition-transform hover:scale-105`}
        style={{backgroundColor: accentColor}}
      >
        {isPlaying ? (
          <Pause className={iconSize} />
        ) : (
          <Play className={`${iconSize} ml-0.5`} />
        )}
      </button>
    );
  };

  // STYLE 2: Compact Pill Bar
  if (styleId === 2) {
    return (
      <div
        className={`rounded-full border px-3 py-2 flex items-center gap-2.5 ${className}`}
        style={glassStyle}
      >
        {renderCover('w-8 h-8', 'rounded-full')}
        {renderPlayButton('w-8 h-8', 'w-3 h-3')}
        <div className="flex-1 min-w-0 space-y-1">
          {(showTitle || showArtist) && (
            <div className="flex items-center gap-1.5 min-w-0 text-xs">
              {showTitle && (
                <span className="font-semibold text-white truncate">
                  {titleText}
                </span>
              )}
              {showTitle && showArtist && (
                <span className="text-zinc-500 shrink-0">·</span>
              )}
              {showArtist && (
                <span className="text-[11px] text-zinc-400 truncate">
                  {artistText}
                </span>
              )}
            </div>
          )}
          {showProgress && renderProgressBar('h-1')}
        </div>
        {showCountdown && (
          <span className="font-mono text-[11px] text-zinc-300 tabular-nums shrink-0 pr-1">
            {countdownText}
          </span>
        )}
      </div>
    );
  }

  // STYLE 3: Centered Waveform / Minimalist Dark
  if (styleId === 3) {
    return (
      <div
        className={`rounded-2xl border p-3.5 text-center space-y-2.5 ${className}`}
        style={glassStyle}
      >
        <div className="flex flex-col items-center gap-1.5">
          {renderCover('w-10 h-10', 'rounded-lg')}
          {(showTitle || showArtist) && (
            <div className="min-w-0 max-w-full">
              {showTitle && (
                <p className="text-xs sm:text-sm font-semibold text-white truncate">
                  {titleText}
                </p>
              )}
              {showArtist && (
                <p className="text-[11px] text-zinc-400 truncate">
                  {artistText}
                </p>
              )}
            </div>
          )}
        </div>

        {(showProgress || showCountdown) && (
          <div className="flex items-center gap-2">
            {showProgress && (
              <span className="font-mono text-[10px] text-zinc-400 tabular-nums shrink-0">
                {formatClock(currentTime)}
              </span>
            )}
            {renderProgressBar('h-1')}
            {showCountdown && (
              <span className="font-mono text-[10px] text-zinc-300 tabular-nums shrink-0">
                {countdownText}
              </span>
            )}
          </div>
        )}

        {showControls && (
          <div className="flex items-center justify-center">
            {renderPlayButton('w-8 h-8', 'w-3 h-3')}
          </div>
        )}
      </div>
    );
  }

  // STYLE 4: Vinyl / Album Spotlight
  if (styleId === 4) {
    return (
      <div
        className={`rounded-2xl border p-3.5 space-y-3 ${className}`}
        style={glassStyle}
      >
        <div className="flex items-center gap-3.5">
          {renderCover('w-13 h-13', 'rounded-full', true)}
          <div className="flex-1 min-w-0">
            {showTitle && (
              <p className="text-xs sm:text-sm font-bold text-white truncate">
                {titleText}
              </p>
            )}
            {showArtist && (
              <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                {artistText}
              </p>
            )}
            {showCountdown && (
              <p
                className="font-mono text-[11px] tabular-nums mt-1"
                style={{color: accentColor}}
              >
                {countdownText}
              </p>
            )}
          </div>
          {renderPlayButton('w-9 h-9', 'w-3.5 h-3.5')}
        </div>
        {showProgress && renderProgressBar('h-1.5')}
      </div>
    );
  }

  // STYLE 5: Micro HUD Widget
  if (styleId === 5) {
    return (
      <div
        className={`rounded-xl border px-3 py-2.5 space-y-2 ${className}`}
        style={glassStyle}
      >
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            {renderCover('w-8 h-8', 'rounded-md')}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{backgroundColor: isPlaying ? '#34d399' : accentColor}}
                />
                <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-400">
                  {isPlaying ? 'Now Playing' : 'Audio Ready'}
                </span>
              </div>
              {showTitle && (
                <p className="text-xs font-semibold text-white truncate">
                  {titleText}
                </p>
              )}
              {showArtist && (
                <p className="text-[10px] text-zinc-400 truncate">
                  {artistText}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {showCountdown && (
              <span className="font-mono text-[10px] text-zinc-300 tabular-nums">
                {countdownText}
              </span>
            )}
            {renderPlayButton('w-7 h-7', 'w-3 h-3')}
          </div>
        </div>
        {showProgress && renderProgressBar('h-1')}
      </div>
    );
  }

  // STYLE 1 (Default): Classic Glass Player
  return (
    <div
      className={`rounded-2xl border p-3.5 space-y-2.5 ${className}`}
      style={glassStyle}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {renderCover('w-11 h-11', 'rounded-xl')}
          <div className="min-w-0">
            {showTitle && (
              <p className="text-xs sm:text-sm font-semibold text-white truncate">
                {titleText}
              </p>
            )}
            {showArtist && (
              <p className="text-[11px] text-zinc-400 truncate">
                {artistText}
              </p>
            )}
          </div>
        </div>
        {renderPlayButton('w-9 h-9', 'w-3.5 h-3.5')}
      </div>

      {(showProgress || showCountdown) && (
        <div className="flex items-center gap-2.5">
          {showProgress && renderProgressBar('h-1.5')}
          {showCountdown && (
            <span className="font-mono text-[11px] text-zinc-300 tabular-nums shrink-0">
              {countdownText}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
