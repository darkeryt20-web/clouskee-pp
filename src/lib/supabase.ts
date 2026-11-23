import {createClient, SupabaseClient} from '@supabase/supabase-js';
import {sanitizeExternalUrl} from './domain';

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

export interface CustomRoleBadge {
  name: string;
  color: string;
}

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
  lightning_trail_length: number | null;
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
  is_admin?: boolean | null;
  custom_roles?: (string | CustomRoleBadge)[] | null;
  created_at?: string;
}

export function hasPremiumAccess(
  profile: Pick<ProfileRecord, 'plan' | 'is_admin'> | null | undefined,
  verifiedIsAdmin = false,
): boolean {
  if (!profile) return false;
  return (
    profile.plan === 'premium' ||
    profile.is_admin === true ||
    verifiedIsAdmin === true
  );
}

export interface SessionIdentity {
  firebaseUid?: string | null;
  discordId?: string | null;
}

const PROTECTED_PROFILE_KEYS = new Set<string>([
  'id',
  'is_admin',
  'plan',
  'custom_roles',
  'views',
  'monthly_views',
  'created_at',
  'firebase_uid',
  'discord_id',
]);

const URL_PROFILE_KEYS = [
  'avatar_url',
  'avatar_decoration_url',
  'bg_url',
  'music_url',
  'music_cover',
  'custom_cursor_url',
] as const;

export function sanitizeUserProfilePayload(
  updates: Partial<ProfileRecord>,
): Partial<ProfileRecord> {
  const safe: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(updates)) {
    if (PROTECTED_PROFILE_KEYS.has(key)) continue;
    safe[key] = value;
  }

  for (const urlKey of URL_PROFILE_KEYS) {
    if (urlKey in safe) {
      const raw = safe[urlKey] as string | null | undefined;
      if (raw && typeof raw === 'string' && raw.trim()) {
        const cleaned = sanitizeExternalUrl(raw);
        if (!cleaned) {
          throw new Error(
            `Blocked unsafe URL in ${urlKey}. Only https:// and http:// URLs are allowed.`,
          );
        }
        safe[urlKey] = cleaned;
      } else {
        safe[urlKey] = null;
      }
    }
  }

  if (Array.isArray(safe.links)) {
    const cleanLinks: ProfileLinkItem[] = [];
    for (const rawItem of safe.links as ProfileLinkItem[]) {
      if (!rawItem || typeof rawItem !== 'object') continue;
      const safeUrl = sanitizeExternalUrl(rawItem.url);
      if (!safeUrl) {
        throw new Error(
          `Blocked unsafe link URL "${rawItem.label || rawItem.url}". Only https:// and http:// URLs are allowed.`,
        );
      }
      let safeIcon: string | undefined;
      if (rawItem.customIconUrl && rawItem.customIconUrl.trim()) {
        const checkedIcon = sanitizeExternalUrl(rawItem.customIconUrl);
        if (!checkedIcon) {
          throw new Error(
            'Blocked unsafe custom link icon URL. Only https:// and http:// URLs are allowed.',
          );
        }
        safeIcon = checkedIcon;
      }
      cleanLinks.push({
        label: typeof rawItem.label === 'string' ? rawItem.label.trim() : '',
        url: safeUrl,
        ...(rawItem.preset ? {preset: rawItem.preset} : {}),
        ...(safeIcon ? {customIconUrl: safeIcon} : {}),
      });
    }
    safe.links = cleanLinks;
  }

  return safe as Partial<ProfileRecord>;
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
    lightning_trail_length: payload.lightning_trail_length ?? 120,
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
    is_admin: false,
    custom_roles: [],
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
      lightning_trail_length: defaultProfile.lightning_trail_length,
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

export async function updateOwnedProfileRecord(
  profileId: string,
  updates: Partial<ProfileRecord>,
  session: SessionIdentity,
): Promise<{data: ProfileRecord | null; error?: string}> {
  if (!supabase) {
    return {data: null, error: 'Supabase is not configured.'};
  }

  const firebaseUid = session.firebaseUid?.trim() || null;
  const discordId = session.discordId?.trim() || null;
  if (!firebaseUid && !discordId) {
    return {
      data: null,
      error: 'Authentication required before saving profile changes.',
    };
  }

  let safeUpdates: Partial<ProfileRecord>;
  try {
    safeUpdates = sanitizeUserProfilePayload(updates);
  } catch (err: unknown) {
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Invalid profile payload.',
    };
  }

  // Verify the target profile row belongs to the authenticated user session
  const {data: targetRow, error: lookupError} = await supabase
    .from('profiles')
    .select('id, firebase_uid, discord_id')
    .eq('id', profileId)
    .maybeSingle();

  if (lookupError || !targetRow) {
    return {
      data: null,
      error: lookupError?.message || 'Target profile could not be verified.',
    };
  }

  const ownsViaFirebase = Boolean(
    firebaseUid && targetRow.firebase_uid === firebaseUid,
  );
  const ownsViaDiscord = Boolean(
    discordId && targetRow.discord_id === discordId,
  );

  if (!ownsViaFirebase && !ownsViaDiscord) {
    return {
      data: null,
      error: 'Unauthorized: profile ownership check failed.',
    };
  }

  let query = supabase.from('profiles').update(safeUpdates).eq('id', profileId);
  if (ownsViaFirebase && firebaseUid) {
    query = query.eq('firebase_uid', firebaseUid);
  } else if (ownsViaDiscord && discordId) {
    query = query.eq('discord_id', discordId);
  }

  const {data, error} = await query.select('*').single();

  if (error) {
    return {data: null, error: error.message};
  }

  return {data: data as ProfileRecord};
}

export async function verifyAdminAccessInSupabase(
  session: SessionIdentity,
): Promise<{isAdmin: boolean; profileId?: string; username?: string}> {
  if (!supabase) {
    return {isAdmin: false};
  }

  const firebaseUid = session.firebaseUid?.trim() || null;
  const discordId = session.discordId?.trim() || null;
  if (!firebaseUid && !discordId) {
    return {isAdmin: false};
  }

  if (firebaseUid) {
    const {data, error} = await supabase
      .from('profiles')
      .select('id, is_admin, username')
      .eq('firebase_uid', firebaseUid)
      .maybeSingle();

    if (!error && data && data.is_admin === true) {
      return {
        isAdmin: true,
        profileId: String(data.id),
        username: String(data.username ?? ''),
      };
    }
  }

  if (discordId) {
    const {data, error} = await supabase
      .from('profiles')
      .select('id, is_admin, username')
      .eq('discord_id', discordId)
      .maybeSingle();

    if (!error && data && data.is_admin === true) {
      return {
        isAdmin: true,
        profileId: String(data.id),
        username: String(data.username ?? ''),
      };
    }
  }

  return {isAdmin: false};
}

export interface AdminProfileSummary {
  id: string;
  username: string;
  global_name: string | null;
  avatar_url: string | null;
  email: string | null;
  discord_username: string | null;
  plan: string | null;
  views: number;
  monthly_views: number;
  is_admin: boolean | null;
  custom_roles: (string | CustomRoleBadge)[] | null;
  created_at?: string;
}

export interface DailySiteVisitRow {
  visit_date: string;
  total_visits: number;
  unique_visitors: number;
}

export async function fetchAdminProfilesList(
  session: SessionIdentity,
): Promise<{data: AdminProfileSummary[]; error?: string}> {
  const adminCheck = await verifyAdminAccessInSupabase(session);
  if (!adminCheck.isAdmin || !supabase) {
    return {data: [], error: 'Administrator access denied.'};
  }

  const {data, error} = await supabase
    .from('profiles')
    .select(
      'id, username, global_name, avatar_url, email, discord_username, plan, views, monthly_views, is_admin, custom_roles, created_at',
    )
    .order('created_at', {ascending: false})
    .limit(200);

  if (error) {
    return {data: [], error: error.message};
  }

  return {data: (data as AdminProfileSummary[]) ?? []};
}

export async function fetchDailySiteVisits(
  session: SessionIdentity,
): Promise<{data: DailySiteVisitRow[]; error?: string}> {
  const adminCheck = await verifyAdminAccessInSupabase(session);
  if (!adminCheck.isAdmin || !supabase) {
    return {data: [], error: 'Administrator access denied.'};
  }

  const {data, error} = await supabase
    .from('daily_site_visits')
    .select('visit_date, total_visits, unique_visitors')
    .order('visit_date', {ascending: false})
    .limit(30);

  if (error) {
    return {data: [], error: error.message};
  }

  return {data: (data as DailySiteVisitRow[]) ?? []};
}

export async function adminUpdateUserAccess(
  session: SessionIdentity,
  targetProfileId: string,
  updates: {
    plan?: string | null;
    is_admin?: boolean | null;
    custom_roles?: (string | CustomRoleBadge)[] | null;
  },
): Promise<{data: AdminProfileSummary | null; error?: string}> {
  const adminCheck = await verifyAdminAccessInSupabase(session);
  if (!adminCheck.isAdmin || !adminCheck.profileId || !supabase) {
    return {data: null, error: 'Administrator access denied.'};
  }

  const normalizedRoles: CustomRoleBadge[] = Array.isArray(updates.custom_roles)
    ? updates.custom_roles
        .map((r) =>
          typeof r === 'string'
            ? {name: r.trim().slice(0, 32), color: '#8b5cf6'}
            : {
                name: String(r?.name ?? '').trim().slice(0, 32),
                color: /^#[0-9a-fA-F]{6}$/.test(String(r?.color ?? '').trim())
                  ? String(r.color).trim()
                  : '#8b5cf6',
              },
        )
        .filter((r) => r.name.length > 0)
    : [];

  const nextPlan = updates.plan === 'premium' ? 'premium' : 'free';
  const nextIsAdmin =
    typeof updates.is_admin === 'boolean'
      ? updates.is_admin
      : Boolean(updates.is_admin);

  const {data, error} = await supabase.rpc('admin_update_user_access', {
    admin_profile_id: String(adminCheck.profileId),
    target_profile_id: String(targetProfileId),
    new_plan: nextPlan,
    new_is_admin: nextIsAdmin,
    new_roles: normalizedRoles,
  });

  if (error) {
    const details = [error.message, error.details, error.hint]
      .filter(Boolean)
      .join(' — ');
    return {
      data: null,
      error: details || 'Failed to update user access via admin_update_user_access.',
    };
  }

  const updatedRow = Array.isArray(data) ? data[0] : data;
  return {
    data: (updatedRow as AdminProfileSummary) ?? {
      id: targetProfileId,
      username: '',
      global_name: null,
      avatar_url: null,
      email: null,
      discord_username: null,
      plan: nextPlan,
      views: 0,
      monthly_views: 0,
      is_admin: nextIsAdmin,
      custom_roles: normalizedRoles,
    },
  };
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

export async function recordDailySiteVisitOncePerSession(): Promise<void> {
  if (!supabase || typeof window === 'undefined') return;
  const sessionKey = 'clouskee_daily_site_visit_recorded';

  try {
    if (window.sessionStorage.getItem(sessionKey) === '1') {
      return;
    }
    window.sessionStorage.setItem(sessionKey, '1');
  } catch {
    // Ignore sessionStorage restrictions
  }

  try {
    const clientIp = await detectVisitorIp();
    await supabase.rpc('record_daily_site_visit', {
      client_ip: clientIp,
    });
  } catch {
    // Ignore network or RPC restrictions silently
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
