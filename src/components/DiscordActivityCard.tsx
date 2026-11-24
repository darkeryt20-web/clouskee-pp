import {CSSProperties, useEffect, useMemo, useState} from 'react';
import {
  Eye,
  Gamepad2,
  Headphones,
  MessageCircle,
  Radio,
  Sparkles,
  Trophy,
} from 'lucide-react';
import {
  clampDiscordActivityZIndex,
  DiscordActivityData,
  MusicCardPosition,
  ProfileRecord,
} from '../lib/supabase';
import {sanitizeExternalUrl} from '../lib/domain';

export const DISCORD_ACTIVITY_POSITIONS: {
  id: MusicCardPosition;
  label: string;
}[] = [
  {id: 'profile_card_on', label: 'Inside Profile Card'},
  {id: 'profile_card_bottom', label: 'Below Profile Card'},
  {id: 'page_top_left', label: 'Page Top Left'},
  {id: 'page_top_right', label: 'Page Top Right'},
  {id: 'page_bottom_left', label: 'Page Bottom Left'},
  {id: 'page_bottom_right', label: 'Page Bottom Right'},
];

export interface ParsedDiscordActivity {
  name: string;
  verb: string;
  typeCode: number;
  details: string | null;
  state: string | null;
  largeImage: string | null;
  largeText: string | null;
  smallImage: string | null;
  smallText: string | null;
  emojiText: string | null;
  startMs: number | null;
  endMs: number | null;
  isPreviewSample?: boolean;
}

function normalizeEpochMs(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === '') return null;
  const num = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isFinite(num) || num <= 0) return null;
  // Convert Unix seconds -> milliseconds when needed
  return num < 1_000_000_000_000 ? Math.round(num * 1000) : Math.round(num);
}

function resolveDiscordAssetUrl(
  rawAsset: unknown,
  applicationId?: string | null,
): string | null {
  if (typeof rawAsset !== 'string') return null;
  const trimmed = rawAsset.trim();
  if (!trimmed) return null;

  if (/^https?:\/\//i.test(trimmed)) {
    return sanitizeExternalUrl(trimmed);
  }

  if (trimmed.startsWith('spotify:')) {
    const id = trimmed.slice('spotify:'.length).trim();
    if (/^[a-zA-Z0-9_-]+$/.test(id)) {
      return sanitizeExternalUrl(`https://i.scdn.co/image/${id}`);
    }
    return null;
  }

  if (trimmed.startsWith('mp:external/')) {
    const httpsIdx = trimmed.indexOf('/https/');
    if (httpsIdx !== -1) {
      return sanitizeExternalUrl(`https://${trimmed.slice(httpsIdx + 7)}`);
    }
    const httpIdx = trimmed.indexOf('/http/');
    if (httpIdx !== -1) {
      return sanitizeExternalUrl(`http://${trimmed.slice(httpIdx + 6)}`);
    }
    return null;
  }

  if (
    applicationId &&
    /^[0-9]{15,22}$/.test(applicationId.trim()) &&
    /^[a-zA-Z0-9_-]+$/.test(trimmed)
  ) {
    return sanitizeExternalUrl(
      `https://cdn.discordapp.com/app-assets/${applicationId.trim()}/${trimmed}.png`,
    );
  }

  return null;
}

function normalizeActivityType(rawType: unknown): {
  code: number;
  verb: string;
} {
  if (typeof rawType === 'number') {
    switch (rawType) {
      case 1:
        return {code: 1, verb: 'Streaming'};
      case 2:
        return {code: 2, verb: 'Listening to'};
      case 3:
        return {code: 3, verb: 'Watching'};
      case 4:
        return {code: 4, verb: 'Status'};
      case 5:
        return {code: 5, verb: 'Competing in'};
      default:
        return {code: 0, verb: 'Playing'};
    }
  }

  const label = typeof rawType === 'string' ? rawType.trim().toLowerCase() : '';
  if (label === '1' || label.includes('stream')) {
    return {code: 1, verb: 'Streaming'};
  }
  if (label === '2' || label.includes('listen') || label === 'spotify') {
    return {code: 2, verb: 'Listening to'};
  }
  if (label === '3' || label.includes('watch')) {
    return {code: 3, verb: 'Watching'};
  }
  if (label === '4' || label.includes('custom') || label === 'status') {
    return {code: 4, verb: 'Status'};
  }
  if (label === '5' || label.includes('compet')) {
    return {code: 5, verb: 'Competing in'};
  }
  return {code: 0, verb: 'Playing'};
}

function parseSingleActivityObject(
  candidate: Record<string, unknown>,
): ParsedDiscordActivity | null {
  if (candidate.active === false) return null;

  const rawTypeStr =
    typeof candidate.type === 'string'
      ? candidate.type.trim().toLowerCase()
      : '';
  if (rawTypeStr === 'offline' || rawTypeStr === 'invisible') {
    return null;
  }

  const rawName = typeof candidate.name === 'string' ? candidate.name.trim() : '';
  const rawDetails =
    typeof candidate.details === 'string' ? candidate.details.trim() : '';
  const rawState =
    typeof candidate.state === 'string' ? candidate.state.trim() : '';

  const emojiObj =
    candidate.emoji && typeof candidate.emoji === 'object'
      ? (candidate.emoji as Record<string, unknown>)
      : null;
  const emojiText =
    typeof candidate.emoji === 'string'
      ? candidate.emoji.trim() || null
      : typeof emojiObj?.name === 'string' && !emojiObj?.id
        ? emojiObj.name.trim() || null
        : null;

  const hasMeaningfulContent = Boolean(rawName || rawDetails || rawState);
  if (!hasMeaningfulContent) return null;

  const lowerName = rawName.toLowerCase();
  if (
    (lowerName === 'offline' || lowerName === 'idle' || lowerName === 'none') &&
    !rawDetails &&
    !rawState
  ) {
    return null;
  }

  const {code, verb} = normalizeActivityType(candidate.type);
  const applicationId =
    typeof candidate.application_id === 'string'
      ? candidate.application_id.trim()
      : null;

  const assets =
    candidate.assets && typeof candidate.assets === 'object'
      ? (candidate.assets as Record<string, unknown>)
      : {};
  const timestamps =
    candidate.timestamps && typeof candidate.timestamps === 'object'
      ? (candidate.timestamps as Record<string, unknown>)
      : {};

  const largeImage = resolveDiscordAssetUrl(
    assets.large_image ?? candidate.large_image,
    applicationId,
  );
  const smallImage = resolveDiscordAssetUrl(
    assets.small_image ?? candidate.small_image,
    applicationId,
  );
  const largeText =
    typeof assets.large_text === 'string' ? assets.large_text.trim() || null : null;
  const smallText =
    typeof assets.small_text === 'string' ? assets.small_text.trim() || null : null;

  const startMs = normalizeEpochMs(timestamps.start ?? candidate.start_timestamp);
  const endMs = normalizeEpochMs(timestamps.end ?? candidate.end_timestamp);

  // For Custom Status (type 4), Discord puts status text in `state` and `name` = "Custom Status"
  const displayName =
    code === 4 && rawName.toLowerCase() === 'custom status' && rawState
      ? rawState
      : rawName || rawDetails || rawState;
  const displayDetails = rawDetails || null;
  const displayState =
    code === 4 && displayName === rawState ? null : rawState || null;

  return {
    name: displayName,
    verb,
    typeCode: code,
    details: displayDetails,
    state: displayState,
    largeImage,
    largeText,
    smallImage,
    smallText,
    emojiText,
    startMs,
    endMs,
  };
}

export function parseDiscordActivity(
  raw: DiscordActivityData | string | unknown,
): ParsedDiscordActivity | null {
  if (!raw) return null;

  let value: unknown = raw;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    try {
      value = JSON.parse(trimmed);
    } catch {
      return null;
    }
  }

  if (Array.isArray(value)) {
    const parsedList = value
      .map((item) =>
        item && typeof item === 'object'
          ? parseSingleActivityObject(item as Record<string, unknown>)
          : null,
      )
      .filter((item): item is ParsedDiscordActivity => item !== null);
    if (parsedList.length === 0) return null;
    return parsedList.find((item) => item.typeCode !== 4) ?? parsedList[0];
  }

  if (typeof value === 'object' && value !== null) {
    return parseSingleActivityObject(value as Record<string, unknown>);
  }

  return null;
}

function formatDurationClock(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return '0:00';
  const totalSec = Math.floor(ms / 1000);
  const hrs = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  if (hrs > 0) {
    return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

function ActivityTypeIcon({
  typeCode,
  accentColor,
}: {
  typeCode: number;
  accentColor: string;
}) {
  const iconClass = 'w-4 h-4 shrink-0';
  switch (typeCode) {
    case 1:
      return <Radio className={iconClass} style={{color: accentColor}} />;
    case 2:
      return <Headphones className={iconClass} style={{color: accentColor}} />;
    case 3:
      return <Eye className={iconClass} style={{color: accentColor}} />;
    case 4:
      return <Sparkles className={iconClass} style={{color: accentColor}} />;
    case 5:
      return <Trophy className={iconClass} style={{color: accentColor}} />;
    default:
      return <Gamepad2 className={iconClass} style={{color: accentColor}} />;
  }
}

interface DiscordActivityCardProps {
  profile: ProfileRecord;
  accentColor: string;
  cardOpacity: number;
  cardBlur: number;
  isPreview?: boolean;
  className?: string;
}

export function DiscordActivityCard({
  profile,
  accentColor,
  cardOpacity,
  cardBlur,
  isPreview = false,
  className = '',
}: DiscordActivityCardProps) {
  const isEnabled = profile.discord_activity_enabled === true;
  const parsedLive = useMemo(
    () => parseDiscordActivity(profile.discord_activity),
    [profile.discord_activity],
  );

  // Strictly render nothing on public pages when disabled or no active Discord activity
  const activity: ParsedDiscordActivity | null = useMemo(() => {
    if (!isEnabled) return null;
    if (parsedLive) return parsedLive;
    if (!isPreview) return null;
    return {
      name: 'Visual Studio Code',
      verb: 'Playing',
      typeCode: 0,
      details: 'Editing Clouskee PP profile',
      state: 'Preview · Hidden on public page until active',
      largeImage: null,
      largeText: null,
      smallImage: null,
      smallText: null,
      emojiText: null,
      startMs: null,
      endMs: null,
      isPreviewSample: true,
    };
  }, [isEnabled, parsedLive, isPreview]);

  const hasTimers = Boolean(activity?.startMs || activity?.endMs);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    if (!hasTimers) return;
    setNowMs(Date.now());
    const interval = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => window.clearInterval(interval);
  }, [hasTimers, activity?.startMs, activity?.endMs]);

  if (!activity) return null;

  const clampedZIndex = clampDiscordActivityZIndex(
    profile.discord_activity_z_index,
  );

  const glassStyle: CSSProperties = {
    zIndex: clampedZIndex,
    backgroundColor: `rgba(12, 12, 16, ${Math.min(0.95, Math.max(0.32, cardOpacity))})`,
    backdropFilter: `blur(${cardBlur}px)`,
    WebkitBackdropFilter: `blur(${cardBlur}px)`,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    boxShadow: '0 14px 36px rgba(0, 0, 0, 0.44)',
  };

  let timeLabel: string | null = null;
  let progressPct: number | null = null;
  if (activity.startMs && activity.endMs && activity.endMs > activity.startMs) {
    const total = activity.endMs - activity.startMs;
    const elapsed = Math.min(total, Math.max(0, nowMs - activity.startMs));
    progressPct = Math.min(100, Math.max(0, (elapsed / total) * 100));
    timeLabel = `${formatDurationClock(elapsed)} / ${formatDurationClock(total)}`;
  } else if (activity.startMs) {
    const elapsed = Math.max(0, nowMs - activity.startMs);
    timeLabel = `${formatDurationClock(elapsed)} elapsed`;
  }

  return (
    <div
      style={glassStyle}
      className={`relative rounded-2xl border p-3.5 text-left transition-all ${className}`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="inline-flex items-center gap-1.5 min-w-0">
          <MessageCircle
            className="w-3.5 h-3.5 text-[#818cf8] shrink-0"
            aria-hidden="true"
          />
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-300 truncate">
            {activity.verb}
          </span>
        </div>

        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider shrink-0 ${
            activity.isPreviewSample
              ? 'bg-purple-500/15 border border-purple-400/30 text-purple-200'
              : 'bg-emerald-500/15 border border-emerald-400/30 text-emerald-300'
          }`}
        >
          <span
            aria-hidden="true"
            className={`w-1.5 h-1.5 rounded-full ${
              activity.isPreviewSample
                ? 'bg-purple-400'
                : 'bg-emerald-400 animate-pulse'
            }`}
          />
          <span>{activity.isPreviewSample ? 'Preview Sample' : 'Live'}</span>
        </span>
      </div>

      <div className="flex items-center gap-3">
        {/* Large + Small Rich Presence Asset */}
        <div className="relative w-12 h-12 rounded-xl bg-white/8 border border-white/12 flex items-center justify-center shrink-0">
          {activity.largeImage ? (
            <img
              src={activity.largeImage}
              alt={activity.largeText || activity.name}
              className="w-full h-full rounded-xl object-cover"
              loading="lazy"
            />
          ) : (
            <ActivityTypeIcon
              typeCode={activity.typeCode}
              accentColor={accentColor}
            />
          )}

          {activity.smallImage && (
            <img
              src={activity.smallImage}
              alt={activity.smallText || ''}
              title={activity.smallText || undefined}
              className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full object-cover border-2 border-[#0c0c10] bg-[#0c0c10]"
              loading="lazy"
            />
          )}
        </div>

        {/* Text Details */}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-white truncate flex items-center gap-1">
            {activity.emojiText && (
              <span aria-hidden="true">{activity.emojiText}</span>
            )}
            <span className="truncate">{activity.name}</span>
          </p>

          {activity.details && (
            <p className="mt-0.5 text-[11px] text-zinc-300 truncate">
              {activity.details}
            </p>
          )}

          {activity.state && (
            <p className="mt-0.5 text-[11px] text-zinc-400 truncate">
              {activity.state}
            </p>
          )}

          {timeLabel && progressPct === null && (
            <p className="mt-1 font-mono text-[10px] text-zinc-400 tabular-nums">
              {timeLabel}
            </p>
          )}
        </div>
      </div>

      {progressPct !== null && (
        <div className="mt-2.5 flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full bg-white/12 overflow-hidden">
            <div
              className="h-full rounded-full transition-[width] duration-300"
              style={{
                width: `${progressPct}%`,
                backgroundColor: accentColor,
              }}
            />
          </div>
          {timeLabel && (
            <span className="font-mono text-[10px] text-zinc-400 tabular-nums shrink-0">
              {timeLabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
