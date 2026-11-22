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
  badges: string[] | null;
  links: ProfileLinkItem[] | null;
  music_title: string | null;
  music_artist: string | null;
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
        badges: payload.badges ?? [],
        links: payload.links ?? [],
        music_title: payload.music_title ?? null,
        music_artist: payload.music_artist ?? null,
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
      badges: payload.badges ?? [],
      links: payload.links ?? [],
      music_title: payload.music_title ?? null,
      music_artist: payload.music_artist ?? null,
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

export async function incrementProfileViews(username: string): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.rpc('increment_profile_views', {
      target_username: username.toLowerCase(),
    });
  } catch {
    // Ignore RPC failure if function not provisioned yet
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
