import {createClient, SupabaseClient} from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() ?? '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;

export interface ProfileLinkItem {
  label: string;
  url: string;
}

export interface ProfileRecord {
  id: string;
  firebase_uid: string | null;
  email: string | null;
  username: string;
  global_name: string | null;
  avatar_url: string | null;
  avatar_decoration_url: string | null;
  discord_id: string | null;
  discord_username: string | null;
  discord_global_name: string | null;
  discord_avatar: string | null;
  discord_avatar_decoration: string | null;
  bio: string | null;
  theme_color: string | null;
  badges: string[] | null;
  links: ProfileLinkItem[] | null;
  music_title: string | null;
  music_artist: string | null;
  music_url: string | null;
  views: number;
  monthly_views: number;
  plan: string | null;
  created_at?: string;
}

export async function isUsernameAvailableInSupabase(
  username: string,
): Promise<{available: boolean; error?: string}> {
  if (!supabase) {
    return {
      available: true,
    };
  }

  const {data, error} = await supabase
    .from('profiles')
    .select('id, username')
    .ilike('username', username)
    .maybeSingle();

  if (error) {
    return {
      available: false,
      error: error.message || 'Failed to verify username availability.',
    };
  }

  if (data) {
    return {
      available: false,
      error: 'Username is already taken',
    };
  }

  return {available: true};
}

export async function getProfileByUsername(
  username: string,
): Promise<{data: ProfileRecord | null; error?: string}> {
  if (!supabase) {
    return {data: null, error: 'Supabase is not configured.'};
  }

  const {data, error} = await supabase
    .from('profiles')
    .select('*')
    .ilike('username', username)
    .maybeSingle();

  if (error) {
    return {data: null, error: error.message};
  }

  return {data: (data as ProfileRecord) ?? null};
}

export async function getProfileByFirebaseOrEmail(
  firebaseUid: string,
  email: string | null,
): Promise<{data: ProfileRecord | null; error?: string}> {
  if (!supabase) {
    return {data: null, error: 'Supabase is not configured.'};
  }

  const {data: byUid, error: uidErr} = await supabase
    .from('profiles')
    .select('*')
    .eq('firebase_uid', firebaseUid)
    .maybeSingle();

  if (uidErr) {
    return {data: null, error: uidErr.message};
  }
  if (byUid) {
    return {data: byUid as ProfileRecord};
  }

  if (email) {
    const {data: byEmail, error: emailErr} = await supabase
      .from('profiles')
      .select('*')
      .ilike('email', email)
      .maybeSingle();

    if (emailErr) {
      return {data: null, error: emailErr.message};
    }
    if (byEmail) {
      return {data: byEmail as ProfileRecord};
    }
  }

  return {data: null};
}

export async function getProfileByDiscordId(
  discordId: string,
): Promise<{data: ProfileRecord | null; error?: string}> {
  if (!supabase) {
    return {data: null, error: 'Supabase is not configured.'};
  }

  const {data, error} = await supabase
    .from('profiles')
    .select('*')
    .eq('discord_id', discordId)
    .maybeSingle();

  if (error) {
    return {data: null, error: error.message};
  }

  return {data: (data as ProfileRecord) ?? null};
}

export async function createProfileRecord(
  payload: Partial<ProfileRecord> & {username: string},
): Promise<{data: ProfileRecord | null; error?: string}> {
  if (!supabase) {
    return {
      data: {
        id: `local-${Date.now()}`,
        firebase_uid: payload.firebase_uid ?? null,
        email: payload.email ?? null,
        username: payload.username,
        global_name: payload.global_name ?? payload.username,
        avatar_url: payload.avatar_url ?? null,
        avatar_decoration_url: payload.avatar_decoration_url ?? null,
        discord_id: payload.discord_id ?? null,
        discord_username: payload.discord_username ?? null,
        discord_global_name: payload.discord_global_name ?? null,
        discord_avatar: payload.discord_avatar ?? null,
        discord_avatar_decoration: payload.discord_avatar_decoration ?? null,
        bio: payload.bio ?? '',
        theme_color: payload.theme_color ?? '#8b5cf6',
        badges: payload.badges ?? [],
        links: payload.links ?? [],
        music_title: payload.music_title ?? null,
        music_artist: payload.music_artist ?? null,
        music_url: payload.music_url ?? null,
        views: 0,
        monthly_views: 0,
        plan: payload.plan ?? 'free',
      },
    };
  }

  const {data, error} = await supabase
    .from('profiles')
    .insert({
      firebase_uid: payload.firebase_uid ?? null,
      email: payload.email ?? null,
      username: payload.username.toLowerCase(),
      global_name: payload.global_name ?? payload.username,
      avatar_url: payload.avatar_url ?? null,
      avatar_decoration_url: payload.avatar_decoration_url ?? null,
      discord_id: payload.discord_id ?? null,
      discord_username: payload.discord_username ?? null,
      discord_global_name: payload.discord_global_name ?? null,
      discord_avatar: payload.discord_avatar ?? null,
      discord_avatar_decoration: payload.discord_avatar_decoration ?? null,
      bio: payload.bio ?? '',
      theme_color: payload.theme_color ?? '#8b5cf6',
      badges: payload.badges ?? [],
      links: payload.links ?? [],
      music_title: payload.music_title ?? null,
      music_artist: payload.music_artist ?? null,
      music_url: payload.music_url ?? null,
      views: payload.views ?? 0,
      monthly_views: payload.monthly_views ?? 0,
      plan: payload.plan ?? 'free',
    })
    .select('*')
    .single();

  if (error) {
    return {data: null, error: error.message};
  }

  return {data: data as ProfileRecord};
}

export async function updateProfileRecord(
  id: string,
  updates: Partial<ProfileRecord>,
): Promise<{data: ProfileRecord | null; error?: string}> {
  if (!supabase) {
    return {data: null, error: 'Supabase is not configured.'};
  }

  const {data, error} = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    return {data: null, error: error.message};
  }

  return {data: data as ProfileRecord};
}

async function detectVisitorIp(): Promise<string> {
  try {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 2500);
    const res = await fetch('https://api.ipify.org?format=json', {
      signal: controller.signal,
    });
    window.clearTimeout(timer);
    if (res.ok) {
      const json = (await res.json()) as {ip?: string};
      if (json.ip && typeof json.ip === 'string') {
        return json.ip.trim();
      }
    }
  } catch {
    // Blocked by adblocker or network timeout — fall back below
  }

  // Safe deterministic fallback fingerprint when public IP lookup is blocked
  const nav = typeof navigator !== 'undefined' ? navigator.userAgent : 'web';
  const tz =
    typeof Intl !== 'undefined'
      ? Intl.DateTimeFormat().resolvedOptions().timeZone || 'utc'
      : 'utc';
  return `fallback-${tz}-${nav.length}`;
}

export async function recordUniqueProfileView(
  username: string,
): Promise<{counted: boolean}> {
  if (!supabase || typeof window === 'undefined') {
    return {counted: false};
  }

  const cleanUsername = username.trim().toLowerCase();
  const storageKey = `clouskee_viewed_${cleanUsername}`;

  try {
    if (window.localStorage.getItem(storageKey) === '1') {
      return {counted: false};
    }
  } catch {
    // Ignore localStorage read restrictions
  }

  try {
    const clientIp = await detectVisitorIp();
    const {data, error} = await supabase.rpc('record_unique_profile_view', {
      target_username: cleanUsername,
      client_ip: clientIp,
    });

    if (error) {
      return {counted: false};
    }

    try {
      window.localStorage.setItem(storageKey, '1');
    } catch {
      // Ignore localStorage write restrictions
    }

    // Return true unless the RPC explicitly returned false (duplicate IP in DB)
    return {counted: data !== false};
  } catch {
    return {counted: false};
  }
}

export async function fetchLeaderboardProfiles(
  timeframe: 'all' | 'month',
): Promise<{data: ProfileRecord[]; error?: string}> {
  if (!supabase) {
    return {data: [], error: 'Supabase is not configured.'};
  }

  const orderColumn = timeframe === 'all' ? 'views' : 'monthly_views';

  const {data, error} = await supabase
    .from('profiles')
    .select('*')
    .order(orderColumn, {ascending: false})
    .limit(50);

  if (error) {
    return {data: [], error: error.message};
  }

  return {data: (data as ProfileRecord[]) ?? []};
}
