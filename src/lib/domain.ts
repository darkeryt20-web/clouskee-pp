export interface DomainInfo {
  origin: string;
  host: string;
  discordRedirectUri: string;
  isIframe: boolean;
}

export function getRuntimeDomainInfo(): DomainInfo {
  if (typeof window === 'undefined') {
    return {
      origin: '',
      host: 'clouskee.pp',
      discordRedirectUri: '/auth/discord/callback',
      isIframe: false,
    };
  }

  const origin = window.location.origin;
  const host = window.location.host;
  let isIframe = false;
  try {
    isIframe = window.self !== window.top;
  } catch {
    isIframe = true;
  }

  return {
    origin,
    host,
    discordRedirectUri: `${origin}/auth/discord/callback`,
    isIframe,
  };
}

const DUPLICATE_VIDEO_EXT_RE =
  /(\.(?:mp4|webm|mov|m4v|ogv))(?:\.(?:mp4|webm|mov|m4v|ogv))+$/i;

export function sanitizeExternalUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed || /[\u0000-\u001F\u007F]/.test(trimmed)) return null;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      parsed.pathname = parsed.pathname.replace(DUPLICATE_VIDEO_EXT_RE, '$1');
      return parsed.toString();
    }
    return null;
  } catch {
    return null;
  }
}
