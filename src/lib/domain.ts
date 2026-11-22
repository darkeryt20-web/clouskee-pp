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

export function sanitizeExternalUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return parsed.toString();
    }
    return null;
  } catch {
    return null;
  }
}
