import { supabase } from "./supabase";

export interface ProfileEntry {
  id: string;
  username: string;
  avatar_seed: string | null;
}

export type ProfileMap = Record<string, ProfileEntry>;

export async function fetchAllProfiles(): Promise<ProfileMap> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, avatar_seed");
  if (error) {
    console.error("[profilesCache.fetchAll]", error);
    return {};
  }
  const map: ProfileMap = {};
  for (const r of data ?? []) {
    map[r.id] = { id: r.id, username: r.username, avatar_seed: r.avatar_seed };
  }
  return map;
}

// Resolve the avatar "seed" for a given user — prefer DB-stored avatar_seed,
// else fall back to username (which produces the default DiceBear avatar).
export function seedFor(map: ProfileMap, userId: string, fallbackUsername: string): string {
  const entry = map[userId];
  return entry?.avatar_seed || entry?.username || fallbackUsername;
}

// Subscribe to live profile changes (INSERT/UPDATE) and call back with updates.
export function subscribeProfiles(onChange: (entry: ProfileEntry) => void): () => void {
  const channel = supabase.channel("profiles-cache");
  channel.on(
    "postgres_changes" as any,
    { event: "*", schema: "public", table: "profiles" },
    (payload: any) => {
      const row = payload.new ?? payload.old;
      if (!row?.id) return;
      onChange({
        id: row.id,
        username: row.username,
        avatar_seed: row.avatar_seed ?? null,
      });
    },
  );
  channel.subscribe();
  return () => {
    channel.unsubscribe();
    supabase.removeChannel(channel);
  };
}
