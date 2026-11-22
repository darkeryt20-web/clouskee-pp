import {getRuntimeDomainInfo} from './domain';

const DISCORD_CLIENT_ID = import.meta.env.VITE_DISCORD_CLIENT_ID?.trim() ?? '';

export const isDiscordConfigured = Boolean(DISCORD_CLIENT_ID);

const DISCORD_STATE_KEY = 'clouskee_discord_oauth_state';
const DISCORD_INTENT_KEY = 'clouskee_discord_oauth_intent';
const CLAIMED_USERNAME_KEY = 'clouskee_claimed_username';
const CLAIMED_PLAN_KEY = 'clouskee_claimed_plan';

export interface DiscordUserPayload {
  id: string;
  username: string;
  global_name: string | null;
  avatar: string | null;
  avatar_decoration_data?: {
    asset?: string | null;
  } | null;
  email?: string | null;
}

export interface NormalizedDiscordIdentity {
  discord_id: string;
  discord_username: string;
  discord_global_name: string;
  discord_avatar: string | null;
  discord_avatar_decoration: string | null;
  email: string | null;
}

function generateOAuthState(): string {
  const bytes = new Uint8Array(16);
  window.crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function setPendingDiscordSignup(
  username: string | null,
  plan: string | null,
  intent: 'auth' | 'link' = 'auth',
) {
  if (typeof window === 'undefined') return;
  if (username) {
    window.sessionStorage.setItem(CLAIMED_USERNAME_KEY, username);
  } else {
    window.sessionStorage.removeItem(CLAIMED_USERNAME_KEY);
  }
  if (plan) {
    window.sessionStorage.setItem(CLAIMED_PLAN_KEY, plan);
  } else {
    window.sessionStorage.removeItem(CLAIMED_PLAN_KEY);
  }
  window.sessionStorage.setItem(DISCORD_INTENT_KEY, intent);
}

export function consumePendingDiscordContext(): {
  claimedUsername: string | null;
  claimedPlan: string | null;
  intent: 'auth' | 'link';
} {
  if (typeof window === 'undefined') {
    return {claimedUsername: null, claimedPlan: null, intent: 'auth'};
  }
  const claimedUsername = window.sessionStorage.getItem(CLAIMED_USERNAME_KEY);
  const claimedPlan = window.sessionStorage.getItem(CLAIMED_PLAN_KEY);
  const intent =
    window.sessionStorage.getItem(DISCORD_INTENT_KEY) === 'link'
      ? 'link'
      : 'auth';

  window.sessionStorage.removeItem(CLAIMED_USERNAME_KEY);
  window.sessionStorage.removeItem(CLAIMED_PLAN_KEY);
  window.sessionStorage.removeItem(DISCORD_INTENT_KEY);

  return {claimedUsername, claimedPlan, intent};
}

export function buildDiscordAuthorizeUrl(): string {
  const {discordRedirectUri} = getRuntimeDomainInfo();
  const state = generateOAuthState();
  window.sessionStorage.setItem(DISCORD_STATE_KEY, state);

  const params = new URLSearchParams({
    client_id: DISCORD_CLIENT_ID,
    redirect_uri: discordRedirectUri,
    response_type: 'token',
    scope: 'identify email',
    state,
  });

  return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
}

export function verifyDiscordOAuthState(returnedState: string | null): boolean {
  if (typeof window === 'undefined') return false;
  const expected = window.sessionStorage.getItem(DISCORD_STATE_KEY);
  window.sessionStorage.removeItem(DISCORD_STATE_KEY);
  if (!expected) return true; // allow direct callback testing if state was not set
  return returnedState === expected;
}

export function constructDiscordAvatarUrl(
  userId: string,
  avatarHash: string | null,
): string | null {
  if (!avatarHash) return null;
  const ext = avatarHash.startsWith('a_') ? 'gif' : 'png';
  return `https://cdn.discordapp.com/avatars/${encodeURIComponent(userId)}/${encodeURIComponent(avatarHash)}.${ext}?size=256`;
}

export function constructDiscordDecorationUrl(
  asset: string | null | undefined,
): string | null {
  if (!asset) return null;
  return `https://cdn.discordapp.com/avatar-decoration-presets/${encodeURIComponent(asset)}.png?size=256`;
}

export async function fetchDiscordUser(
  accessToken: string,
): Promise<NormalizedDiscordIdentity> {
  const response = await fetch('https://discord.com/api/users/@me', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch Discord user profile.');
  }

  const user = (await response.json()) as DiscordUserPayload;

  return {
    discord_id: user.id,
    discord_username: user.username,
    discord_global_name: user.global_name || user.username,
    discord_avatar: constructDiscordAvatarUrl(user.id, user.avatar),
    discord_avatar_decoration: constructDiscordDecorationUrl(
      user.avatar_decoration_data?.asset,
    ),
    email: user.email ?? null,
  };
}
