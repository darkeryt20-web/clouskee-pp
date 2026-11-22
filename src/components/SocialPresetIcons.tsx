import {Globe} from 'lucide-react';
import {ProfileLinkItem, SocialPresetKey} from '../lib/supabase';
import {sanitizeExternalUrl} from '../lib/domain';

export interface SocialPresetMeta {
  key: SocialPresetKey;
  label: string;
  placeholderUrl: string;
}

export const SOCIAL_PRESETS: SocialPresetMeta[] = [
  {key: 'github', label: 'GitHub', placeholderUrl: 'https://github.com/username'},
  {key: 'youtube', label: 'YouTube', placeholderUrl: 'https://youtube.com/@handle'},
  {key: 'discord', label: 'Discord', placeholderUrl: 'https://discord.gg/invite'},
  {key: 'x', label: 'X (Twitter)', placeholderUrl: 'https://x.com/handle'},
  {key: 'instagram', label: 'Instagram', placeholderUrl: 'https://instagram.com/handle'},
  {key: 'tiktok', label: 'TikTok', placeholderUrl: 'https://tiktok.com/@handle'},
  {key: 'twitch', label: 'Twitch', placeholderUrl: 'https://twitch.tv/handle'},
  {key: 'spotify', label: 'Spotify', placeholderUrl: 'https://open.spotify.com/user/...'},
  {key: 'steam', label: 'Steam', placeholderUrl: 'https://steamcommunity.com/id/...'},
  {key: 'linkedin', label: 'LinkedIn', placeholderUrl: 'https://linkedin.com/in/handle'},
  {key: 'globe', label: 'Globe / Link', placeholderUrl: 'https://example.com'},
  {key: 'custom', label: 'Custom Logo', placeholderUrl: 'https://example.com'},
];

export function getPresetMeta(key: SocialPresetKey): SocialPresetMeta {
  return (
    SOCIAL_PRESETS.find((item) => item.key === key) ?? SOCIAL_PRESETS[10]
  );
}

export function inferPresetFromLink(item: ProfileLinkItem): SocialPresetKey {
  if (item.preset) return item.preset;
  if (item.customIconUrl) return 'custom';

  const haystack = `${item.label} ${item.url}`.toLowerCase();
  if (haystack.includes('github')) return 'github';
  if (haystack.includes('youtube') || haystack.includes('youtu.be')) return 'youtube';
  if (haystack.includes('discord')) return 'discord';
  if (haystack.includes('twitter') || haystack.includes('x.com')) return 'x';
  if (haystack.includes('instagram')) return 'instagram';
  if (haystack.includes('tiktok')) return 'tiktok';
  if (haystack.includes('twitch')) return 'twitch';
  if (haystack.includes('spotify')) return 'spotify';
  if (haystack.includes('steam')) return 'steam';
  if (haystack.includes('linkedin')) return 'linkedin';
  return 'globe';
}

export function SocialPresetIcon({
  preset,
  customIconUrl,
  label,
  className = 'w-6 h-6',
}: {
  preset: SocialPresetKey;
  customIconUrl?: string;
  label?: string;
  className?: string;
}) {
  if (preset === 'custom') {
    const safeCustomUrl = sanitizeExternalUrl(customIconUrl);
    if (safeCustomUrl) {
      return (
        <img
          src={safeCustomUrl}
          alt={label || 'Custom link logo'}
          referrerPolicy="no-referrer"
          className={`${className} object-contain rounded-sm select-none`}
        />
      );
    }
    return <Globe className={className} aria-hidden="true" />;
  }

  switch (preset) {
    case 'github':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
          <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.69-3.87-1.54-3.87-1.54-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.69 1.25 3.35.96.1-.74.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.18-3.09-.12-.29-.51-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11.03 11.03 0 0 1 5.76 0c2.2-1.49 3.16-1.18 3.16-1.18.63 1.59.24 2.76.12 3.05.74.81 1.18 1.83 1.18 3.09 0 4.42-2.69 5.39-5.25 5.68.41.36.78 1.06.78 2.14 0 1.54-.01 2.79-.01 3.17 0 .31.21.68.8.56A11.52 11.52 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z" />
        </svg>
      );
    case 'youtube':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
          <path d="M23.5 6.2a3.01 3.01 0 0 0-2.12-2.13C19.5 3.56 12 3.56 12 3.56s-7.5 0-9.38.51A3.01 3.01 0 0 0 .5 6.2 31.3 31.3 0 0 0 0 12a31.3 31.3 0 0 0 .5 5.8 3.01 3.01 0 0 0 2.12 2.13c1.88.51 9.38.51 9.38.51s7.5 0 9.38-.51a3.01 3.01 0 0 0 2.12-2.13A31.3 31.3 0 0 0 24 12a31.3 31.3 0 0 0-.5-5.8zM9.6 15.6V8.4l6.24 3.6-6.24 3.6z" />
        </svg>
      );
    case 'discord':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
          <path d="M20.32 4.37a19.8 19.8 0 0 0-4.89-1.52.07.07 0 0 0-.08.04c-.21.38-.44.87-.61 1.25a18.27 18.27 0 0 0-5.48 0c-.17-.39-.41-.87-.62-1.25a.08.08 0 0 0-.08-.04A19.74 19.74 0 0 0 3.67 4.37a.07.07 0 0 0-.03.03C.53 9.05-.32 13.58.1 18.06a.08.08 0 0 0 .03.05 19.9 19.9 0 0 0 5.99 3.03.08.08 0 0 0 .08-.03c.46-.63.87-1.3 1.23-2a.08.08 0 0 0-.04-.11 13.1 13.1 0 0 1-1.87-.89.08.08 0 0 1-.01-.13c.13-.09.25-.19.37-.29a.08.08 0 0 1 .08-.01c3.93 1.79 8.18 1.79 12.06 0a.08.08 0 0 1 .08.01c.12.1.25.2.37.29a.08.08 0 0 1-.01.13c-.6.35-1.22.65-1.87.89a.08.08 0 0 0-.04.11c.36.7.77 1.37 1.23 2a.08.08 0 0 0 .08.03 19.83 19.83 0 0 0 6-3.03.08.08 0 0 0 .03-.05c.5-5.18-.84-9.68-3.55-13.66a.06.06 0 0 0-.03-.03zM8.02 15.33c-1.18 0-2.16-1.08-2.16-2.42 0-1.33.96-2.42 2.16-2.42 1.21 0 2.18 1.1 2.16 2.42 0 1.34-.96 2.42-2.16 2.42zm7.96 0c-1.18 0-2.16-1.08-2.16-2.42 0-1.33.96-2.42 2.16-2.42 1.21 0 2.18 1.1 2.16 2.42 0 1.34-.95 2.42-2.16 2.42z" />
        </svg>
      );
    case 'x':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    case 'instagram':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
          <path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2zm0 2A3.75 3.75 0 0 0 4 7.75v8.5A3.75 3.75 0 0 0 7.75 20h8.5A3.75 3.75 0 0 0 20 16.25v-8.5A3.75 3.75 0 0 0 16.25 4h-8.5zM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6zm5.25-3.25a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5z" />
        </svg>
      );
    case 'tiktok':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z" />
        </svg>
      );
    case 'twitch':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
          <path d="M4.26 2L2 5.8v14.8h5.2V23l2.6-2.4h4.1L21 13.7V2H4.26zm14.94 10.9-3.1 3.1h-4.7l-2.5 2.3V16H4.6V4h14.6v8.9zm-3.1-5.7v5.2h-2V7.2h2zm-5.4 0v5.2h-2V7.2h2z" />
        </svg>
      );
    case 'spotify':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
          <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm4.59 14.42a.62.62 0 0 1-.86.21c-2.35-1.44-5.31-1.76-8.8-.96a.62.62 0 1 1-.28-1.22c3.82-.87 7.1-.5 9.73 1.11a.62.62 0 0 1 .21.86zm1.22-2.72a.78.78 0 0 1-1.07.26c-2.69-1.65-6.79-2.13-9.97-1.17a.78.78 0 1 1-.45-1.49c3.64-1.1 8.16-.57 11.24 1.32a.78.78 0 0 1 .25 1.08zm.11-2.84c-3.23-1.92-8.55-2.09-11.63-1.16a.94.94 0 1 1-.54-1.79c3.54-1.07 9.42-.86 13.13 1.34a.94.94 0 0 1-.96 1.61z" />
        </svg>
      );
    case 'steam':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
          <path d="M11.98 2a10 10 0 0 0-9.91 8.69l5.35 2.21a2.84 2.84 0 0 1 1.61-.5l2.44-3.54v-.05a3.78 3.78 0 1 1 3.78 3.78h-.09l-3.48 2.48a2.86 2.86 0 0 1-5.67.59l-3.83-1.58A10 10 0 1 0 11.98 2zm-3.2 14.37-1.22-.5a2.14 2.14 0 0 0 3.92.25 2.14 2.14 0 0 0-1.13-2.81l1.26.52a1.57 1.57 0 1 1-2.83 2.54zm6.47-5.12a2.52 2.52 0 1 0 0-5.04 2.52 2.52 0 0 0 0 5.04zm0-4.08a1.56 1.56 0 1 1 0 3.12 1.56 1.56 0 0 1 0-3.12z" />
        </svg>
      );
    case 'linkedin':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14zm-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75zM6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68zm1.39 9.94v-8.37H5.5v8.37h2.77z" />
        </svg>
      );
    case 'globe':
    default:
      return <Globe className={className} aria-hidden="true" />;
  }
}
