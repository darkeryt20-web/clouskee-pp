const INITIAL_TAKEN_USERNAMES = [
  'clouskee',
  'alex',
  'luna',
  'admin',
  'root',
  'support',
  'api',
  'discord',
  'login',
  'signup',
  'pricing',
  'compare',
  'leaderboard',
];

const STORAGE_KEY = 'clouskee_claimed_usernames_v1';

export function sanitizeHandle(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9._-]/g, '').slice(0, 28);
}

export function getTakenUsernames(): Set<string> {
  const taken = new Set(INITIAL_TAKEN_USERNAMES);
  if (typeof window !== 'undefined') {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          parsed.forEach((item) => {
            if (typeof item === 'string' && item.trim()) {
              taken.add(item.trim().toLowerCase());
            }
          });
        }
      }
    } catch {
      // Ignore storage read errors in restricted environments
    }
  }
  return taken;
}

export function markUsernameClaimed(handle: string): void {
  const cleaned = sanitizeHandle(handle);
  if (!cleaned || typeof window === 'undefined') return;
  try {
    const taken = getTakenUsernames();
    taken.add(cleaned);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(taken)));
  } catch {
    // Ignore storage write errors
  }
}

export interface UsernameCheckResult {
  valid: boolean;
  available: boolean;
  cleaned: string;
  reason?: 'empty' | 'too_short' | 'taken';
  message?: string;
}

export function validateAndCheckUsername(raw: string): UsernameCheckResult {
  const cleaned = sanitizeHandle(raw.trim());

  if (!cleaned) {
    return {
      valid: false,
      available: false,
      cleaned,
      reason: 'empty',
      message: 'Please enter a username to check availability.',
    };
  }

  if (cleaned.length < 2) {
    return {
      valid: false,
      available: false,
      cleaned,
      reason: 'too_short',
      message: 'Username must be at least 2 characters long.',
    };
  }

  const taken = getTakenUsernames();
  if (taken.has(cleaned)) {
    return {
      valid: true,
      available: false,
      cleaned,
      reason: 'taken',
      message: `clouskee.pp/${cleaned} is already taken. Try another username.`,
    };
  }

  return {
    valid: true,
    available: true,
    cleaned,
  };
}
