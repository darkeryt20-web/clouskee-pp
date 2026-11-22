import {
  isSupabaseConfigured,
  isUsernameAvailableInSupabase,
} from '../lib/supabase';

const RESERVED_HANDLES = new Set([
  'admin',
  'api',
  'auth',
  'clouskee',
  'compare',
  'discord',
  'help',
  'leaderboard',
  'login',
  'pricing',
  'root',
  'signup',
  'support',
]);

const LOCAL_CLAIMED_KEY = 'clouskee_claimed_usernames_v1';

export function sanitizeHandle(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9._-]/g, '').slice(0, 28);
}

export function markUsernameClaimed(handle: string): void {
  const cleaned = sanitizeHandle(handle);
  if (!cleaned || typeof window === 'undefined') return;
  try {
    const raw = window.localStorage.getItem(LOCAL_CLAIMED_KEY);
    const list: string[] = raw ? JSON.parse(raw) : [];
    if (!list.includes(cleaned)) {
      list.push(cleaned);
      window.localStorage.setItem(LOCAL_CLAIMED_KEY, JSON.stringify(list));
    }
  } catch {
    // Ignore storage errors
  }
}

export interface UsernameCheckResult {
  valid: boolean;
  available: boolean;
  cleaned: string;
  message?: string;
}

export function validateUsernameFormat(raw: string): UsernameCheckResult {
  const cleaned = sanitizeHandle(raw.trim());

  if (!cleaned) {
    return {
      valid: false,
      available: false,
      cleaned,
      message: 'Please enter a username to check availability.',
    };
  }

  if (cleaned.length < 2) {
    return {
      valid: false,
      available: false,
      cleaned,
      message: 'Username must be at least 2 characters long.',
    };
  }

  if (RESERVED_HANDLES.has(cleaned)) {
    return {
      valid: true,
      available: false,
      cleaned,
      message: 'Username is already taken',
    };
  }

  return {
    valid: true,
    available: true,
    cleaned,
  };
}

export async function checkUsernameAvailability(
  raw: string,
  excludeProfileId?: string,
): Promise<UsernameCheckResult> {
  const formatCheck = validateUsernameFormat(raw);
  if (!formatCheck.available) {
    return formatCheck;
  }

  if (isSupabaseConfigured) {
    const supabaseCheck = await isUsernameAvailableInSupabase(
      formatCheck.cleaned,
      excludeProfileId,
    );
    if (!supabaseCheck.available) {
      return {
        valid: true,
        available: false,
        cleaned: formatCheck.cleaned,
        message: supabaseCheck.error || 'Username is already taken',
      };
    }
  }

  return {
    valid: true,
    available: true,
    cleaned: formatCheck.cleaned,
  };
}

export function generateSafeFallbackHandle(
  displayName: string | null | undefined,
  email: string | null | undefined,
): string {
  const baseSource =
    displayName?.trim() || email?.split('@')[0] || `user${Date.now()}`;
  const cleaned = sanitizeHandle(baseSource.replace(/\s+/g, ''));
  if (cleaned.length >= 2 && !RESERVED_HANDLES.has(cleaned)) {
    return cleaned;
  }
  return `creator${String(Date.now()).slice(-5)}`;
}
