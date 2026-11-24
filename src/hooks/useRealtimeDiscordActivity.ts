import {useEffect, useRef} from 'react';
import {
  clampDiscordActivityZIndex,
  DiscordActivitySnapshot,
  fetchDiscordActivitySnapshot,
  isSupabaseConfigured,
  MusicCardPosition,
  normalizeDiscordActivityPosition,
  ProfileRecord,
  supabase,
} from '../lib/supabase';

interface UseRealtimeDiscordActivityOptions {
  profileId: string | null | undefined;
  onUpdate: (patch: DiscordActivitySnapshot) => void;
  fallbackIntervalMs?: number;
}

export function useRealtimeDiscordActivity({
  profileId,
  onUpdate,
  fallbackIntervalMs = 25_000,
}: UseRealtimeDiscordActivityOptions): void {
  const onUpdateRef = useRef(onUpdate);

  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    const client = supabase;
    if (
      !client ||
      !isSupabaseConfigured ||
      !profileId ||
      profileId.startsWith('local-')
    ) {
      return;
    }

    let disposed = false;
    let isSubscribed = false;

    const channel = client
      .channel(`profile-discord-activity:${profileId}:${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${profileId}`,
        },
        (payload) => {
          if (disposed) return;
          const nextRow = (payload.new ?? {}) as Record<string, unknown>;
          const patch: DiscordActivitySnapshot = {};

          if ('discord_activity' in nextRow) {
            patch.discord_activity =
              (nextRow.discord_activity as ProfileRecord['discord_activity']) ??
              null;
          }
          if ('discord_activity_enabled' in nextRow) {
            patch.discord_activity_enabled =
              typeof nextRow.discord_activity_enabled === 'boolean'
                ? nextRow.discord_activity_enabled
                : null;
          }
          if ('discord_activity_position' in nextRow) {
            patch.discord_activity_position =
              typeof nextRow.discord_activity_position === 'string'
                ? normalizeDiscordActivityPosition(
                    nextRow.discord_activity_position,
                  )
                : (nextRow.discord_activity_position as MusicCardPosition | null) ??
                  null;
          }
          if ('discord_activity_z_index' in nextRow) {
            patch.discord_activity_z_index =
              typeof nextRow.discord_activity_z_index === 'number'
                ? clampDiscordActivityZIndex(nextRow.discord_activity_z_index)
                : null;
          }

          if (Object.keys(patch).length > 0) {
            onUpdateRef.current(patch);
          }
        },
      )
      .subscribe((status) => {
        isSubscribed = status === 'SUBSCRIBED';
      });

    const runFallbackSync = async () => {
      if (
        disposed ||
        isSubscribed ||
        typeof document === 'undefined' ||
        document.visibilityState !== 'visible'
      ) {
        return;
      }
      const snapshot = await fetchDiscordActivitySnapshot(profileId);
      if (!disposed && snapshot) {
        onUpdateRef.current(snapshot);
      }
    };

    const intervalId = window.setInterval(runFallbackSync, fallbackIntervalMs);
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !isSubscribed) {
        void runFallbackSync();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      disposed = true;
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      void client.removeChannel(channel);
    };
  }, [profileId, fallbackIntervalMs]);
}
