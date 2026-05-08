import { supabase } from "./supabase";

// DB-backed avatar seed per user. localStorage is used as a sync cache so
// the user's own seed is available before the DB round-trip resolves.

const KEY = "bc:my-avatar-seed";
const EVENT = "bc:profile-changed";

export function getSavedSeed(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(KEY);
}

export async function loadMySeedFromDb(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("avatar_seed")
    .eq("id", userId)
    .maybeSingle();
  if (error) {
    console.error("[profile.loadMySeed]", error);
    return null;
  }
  return data?.avatar_seed ?? null;
}

export async function saveSeed(userId: string, seed: string): Promise<void> {
  if (typeof window !== "undefined") {
    localStorage.setItem(KEY, seed);
    window.dispatchEvent(new Event(EVENT));
  }
  const { error } = await supabase
    .from("profiles")
    .update({ avatar_seed: seed })
    .eq("id", userId);
  if (error) console.error("[profile.saveSeed]", error);
}

export function onSeedChange(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(EVENT, cb);
  return () => window.removeEventListener(EVENT, cb);
}

// 12 fun seed options
export const SEED_OPTIONS = [
  "blue", "sparkle", "cookie", "rocket", "cloud", "sunshine",
  "peach", "ocean", "mint", "wink", "bouncy", "noodle",
];
