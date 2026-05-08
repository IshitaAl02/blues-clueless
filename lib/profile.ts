// Tiny localStorage-backed store for the user's chosen avatar "seed".
// The DiceBear avatar URL is generated from this seed — different seed = different face.
// Stored client-side only for now; can be promoted to a DB column later.

const KEY = "bc:my-avatar-seed";
const EVENT = "bc:profile-changed";

export function getSavedSeed(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(KEY);
}

export function saveSeed(seed: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, seed);
  window.dispatchEvent(new Event(EVENT));
}

export function onSeedChange(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(EVENT, cb);
  return () => window.removeEventListener(EVENT, cb);
}

// 12 fun seed options — paired with the DiceBear "fun-emoji" style.
// Plus the user's username at index 0 as the default.
export const SEED_OPTIONS = [
  "blue", "sparkle", "cookie", "rocket", "cloud", "sunshine",
  "peach", "ocean", "mint", "wink", "bouncy", "noodle",
];
