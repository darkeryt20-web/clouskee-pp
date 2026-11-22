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

export type SocialPresetKey =
  | 'github'
  | 'youtube'
  | 'discord'
  | 'x'
  | 'instagram'
  | 'tiktok'
  | 'twitch'
  | 'spotify'
  | 'steam'
  | 'linkedin'
  | 'globe'
  | 'custom';

export interface ProfileLinkItem {
  label: string;
  url: string;
  preset?: SocialPresetKey;
  customIconUrl?: string;
}

export type MusicCardPosition =
  | 'profile_card_on'
  | 'profile_card_bottom'
  | 'page_top_left'
  | 'page_top_right'
  | 'page_bottom_left'
  | 'page_bottom_right';

export type CustomCursorStyle =
  | 'dot_ring'
  | 'glow_orb'
  | 'crosshair'
  | 'custom_image';

export type PageTitleMode = 'username' | 'global_name';

export type GlobalNameEffect =
  | 'none'
  | 'gradient_shimmer'
  | 'neon_pulse'
  | 'typewriter_cursor'
  | 'floating_letter';

export interface ProfileRecord {
  id: string;
  firebase_uid: string | null;
  email: string | null;
  username: string;
  global_name: string | null;
  global_name_typewriter: boolean | null;
  global_name_texts: string[] | null;
  global_name_effect: GlobalNameEffect | null;
  global_name_color: string | null;
  global_name_glow: boolean | null;
  page_title_mode: PageTitleMode | null;
  page_title_typewriter: boolean | null;
  page_title_texts: string[] | null;
  custom_cursor_enabled: boolean | null;
  custom_cursor_style: CustomCursorStyle | null;
  custom_cursor_url: string | null;
  lightning_cursor_enabled: boolean | null;
  lightning_cursor_color: string | null;
  avatar_url: string | null;
  avatar_decoration_url: string | null;
  discord_id: string | null;
  discord_username: string | null;
  discord_global_name: string | null;
  discord_avatar: string | null;
  discord_avatar_decoration: string | null;
  bio: string | null;
  typewriter_enabled: boolean | null;
  typewriter_texts: string[] | null;
  click_to_enter_enabled: boolean | null;
  click_to_enter_text: string | null;
  show_profile_link: boolean | null;
  show_views_count: boolean | null;
  bg_type: 'none' | 'image' | 'video' | null;
  bg_url: string | null;
  bg_opacity: number | null;
  bg_blur: number | null;
  card_opacity: number | null;
  card_blur: number | null;
  accent_color: string | null;
  theme_color: string | null;
  font_family: string | null;
  badges: string[] | null;
  links: ProfileLinkItem[] | null;
  music_card_enabled: boolean | null;
  music_title: string | null;
  music_artist: string | null;
  music_url: string | null;
  music_cover: string | null;
  music_autoplay: boolean | null;
  music_position: MusicCardPosition | null;
  music_style: number | null;
  music_show_cover: boolean | null;
  music_show_progress: boolean | null;
  music_show_countdown: boolean | null;
  music_show_controls: boolean | null;
  music_show_title: boolean | null;
  music_show_artist: boolean | null;
  views: number;
  monthly_views: number;
  plan: string | null;
  created_at?: string;
}

export async function isUsernameAvailableInSupabase(
  username: string,
  excludeProfileId?: string,
): Promise<{available: boolean; error?: string}> {
  if (!supabase) {
    return {
      available: true,
    };
  }

  let query = supabase
    .from('profiles')
    .select('id, username')
    .ilike('username', username);

  if (excludeProfileId && !excludeProfileId.startsWith('local-')) {
    query = query.neq('id', excludeProfileId);
  }

  const {data, error} = await query.maybeSingle();

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
  const defaultProfile: ProfileRecord = {
    id: `local-${Date.now()}`,
    firebase_uid: payload.firebase_uid ?? null,
    email: payload.email ?? null,
    username: payload.username.toLowerCase(),
    global_name: payload.global_name ?? payload.username,
    global_name_typewriter: payload.global_name_typewriter ?? false,
    global_name_texts: payload.global_name_texts ?? [],
    global_name_effect: payload.global_name_effect ?? 'none',
    global_name_color: payload.global_name_color ?? '#ffffff',
    global_name_glow: payload.global_name_glow ?? false,
    page_title_mode: payload.page_title_mode ?? 'global_name',
    page_title_typewriter: payload.page_title_typewriter ?? false,
    page_title_texts: payload.page_title_texts ?? [],
    custom_cursor_enabled: payload.custom_cursor_enabled ?? false,
    custom_cursor_style: payload.custom_cursor_style ?? 'dot_ring',
    custom_cursor_url: payload.custom_cursor_url ?? null,
    lightning_cursor_enabled: payload.lightning_cursor_enabled ?? false,
    lightning_cursor_color: payload.lightning_cursor_color ?? '#f43f5e',
    avatar_url: payload.avatar_url ?? null,
    avatar_decoration_url: payload.avatar_decoration_url ?? null,
    discord_id: payload.discord_id ?? null,
    discord_username: payload.discord_username ?? null,
    discord_global_name: payload.discord_global_name ?? null,
    discord_avatar: payload.discord_avatar ?? null,
    discord_avatar_decoration: payload.discord_avatar_decoration ?? null,
    bio: payload.bio ?? '',
    typewriter_enabled: payload.typewriter_enabled ?? false,
    typewriter_texts: payload.typewriter_texts ?? [],
    click_to_enter_enabled: payload.click_to_enter_enabled ?? true,
    click_to_enter_text: payload.click_to_enter_text ?? 'Click to Enter',
    show_profile_link: payload.show_profile_link ?? false,
    show_views_count: payload.show_views_count ?? true,
    bg_type: payload.bg_type ?? 'none',
    bg_url: payload.bg_url ?? null,
    bg_opacity: payload.bg_opacity ?? 55,
    bg_blur: payload.bg_blur ?? 0,
    card_opacity: payload.card_opacity ?? 88,
    card_blur: payload.card_blur ?? 16,
    accent_color: payload.accent_color ?? payload.theme_color ?? '#8b5cf6',
    theme_color: payload.theme_color ?? payload.accent_color ?? '#8b5cf6',
    font_family: payload.font_family ?? 'Plus Jakarta Sans',
    badges: payload.badges ?? [],
    links: payload.links ?? [],
    music_card_enabled: payload.music_card_enabled ?? true,
    music_title: payload.music_title ?? null,
    music_artist: payload.music_artist ?? null,
    music_url: payload.music_url ?? null,
    music_cover: payload.music_cover ?? null,
    music_autoplay: payload.music_autoplay ?? false,
    music_position: payload.music_position ?? 'profile_card_on',
    music_style: payload.music_style ?? 1,
    music_show_cover: payload.music_show_cover ?? true,
    music_show_progress: payload.music_show_progress ?? true,
    music_show_countdown: payload.music_show_countdown ?? true,
    music_show_controls: payload.music_show_controls ?? true,
    music_show_title: payload.music_show_title ?? true,
    music_show_artist: payload.music_show_artist ?? true,
    views: payload.views ?? 0,
    monthly_views: payload.monthly_views ?? 0,
    plan: payload.plan ?? 'free',
  };

  if (!supabase) {
    return {data: defaultProfile};
  }

  const {data, error} = await supabase
    .from('profiles')
    .insert({
      firebase_uid: defaultProfile.firebase_uid,
      email: defaultProfile.email,
      username: defaultProfile.username,
      global_name: defaultProfile.global_name,
      global_name_typewriter: defaultProfile.global_name_typewriter,
      global_name_texts: defaultProfile.global_name_texts,
      global_name_effect: defaultProfile.global_name_effect,
      global_name_color: defaultProfile.global_name_color,
      global_name_glow: defaultProfile.global_name_glow,
      page_title_mode: defaultProfile.page_title_mode,
      page_title_typewriter: defaultProfile.page_title_typewriter,
      page_title_texts: defaultProfile.page_title_texts,
      custom_cursor_enabled: defaultProfile.custom_cursor_enabled,
      custom_cursor_style: defaultProfile.custom_cursor_style,
      custom_cursor_url: defaultProfile.custom_cursor_url,
      lightning_cursor_enabled: defaultProfile.lightning_cursor_enabled,
      lightning_cursor_color: defaultProfile.lightning_cursor_color,
      avatar_url: defaultProfile.avatar_url,
      avatar_decoration_url: defaultProfile.avatar_decoration_url,
      discord_id: defaultProfile.discord_id,
      discord_username: defaultProfile.discord_username,
      discord_global_name: defaultProfile.discord_global_name,
      discord_avatar: defaultProfile.discord_avatar,
      discord_avatar_decoration: defaultProfile.discord_avatar_decoration,
      bio: defaultProfile.bio,
      typewriter_enabled: defaultProfile.typewriter_enabled,
      typewriter_texts: defaultProfile.typewriter_texts,
      click_to_enter_enabled: defaultProfile.click_to_enter_enabled,
      click_to_enter_text: defaultProfile.click_to_enter_text,
      show_profile_link: defaultProfile.show_profile_link,
      show_views_count: defaultProfile.show_views_count,
      bg_type: defaultProfile.bg_type,
      bg_url: defaultProfile.bg_url,
      bg_opacity: defaultProfile.bg_opacity,
      bg_blur: defaultProfile.bg_blur,
      card_opacity: defaultProfile.card_opacity,
      card_blur: defaultProfile.card_blur,
      accent_color: defaultProfile.accent_color,
      theme_color: defaultProfile.theme_color,
      font_family: defaultProfile.font_family,
      badges: defaultProfile.badges,
      links: defaultProfile.links,
      music_card_enabled: defaultProfile.music_card_enabled,
      music_title: defaultProfile.music_title,
      music_artist: defaultProfile.music_artist,
      music_url: defaultProfile.music_url,
      music_cover: defaultProfile.music_cover,
      music_autoplay: defaultProfile.music_autoplay,
      music_position: defaultProfile.music_position,
      music_style: defaultProfile.music_style,
      music_show_cover: defaultProfile.music_show_cover,
      music_show_progress: defaultProfile.music_show_progress,
      music_show_countdown: defaultProfile.music_show_countdown,
      music_show_controls: defaultProfile.music_show_controls,
      music_show_title: defaultProfile.music_show_title,
      music_show_artist: defaultProfile.music_show_artist,
      views: defaultProfile.views,
      monthly_views: defaultProfile.monthly_views,
      plan: defaultProfile.plan,
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

export async function uploadProfileMedia(
  profileId: string,
  file: File,
  folder:
    | 'backgrounds'
    | 'audio'
    | 'covers'
    | 'icons'
    | 'cursors' = 'backgrounds',
): Promise<{url: string | null; error?: string}> {
  if (!supabase) {
    return {
      url: null,
      error:
        'Supabase Storage is unavailable until VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are configured.',
    };
  }

  const maxBytes = 50 * 1024 * 1024; // 50MB client guard
  if (file.size > maxBytes) {
    return {
      url: null,
      error: 'File exceeds 50MB limit. Use a smaller file or direct media URL.',
    };
  }

  const safeExt = file.name.split('.').pop()?.replace(/[^a-zA-Z0-9]/g, '') || 'bin';
  const filePath = `${profileId}/${folder}/${Date.now()}.${safeExt}`;

  const {error: uploadErr} = await supabase.storage
    .from('profile-media')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (uploadErr) {
    return {url: null, error: uploadErr.message};
  }

  const {data: publicData} = supabase.storage
    .from('profile-media')
    .getPublicUrl(filePath);

  return {url: publicData.publicUrl};
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
    // Blocked by adblocker or network timeout
  }

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
