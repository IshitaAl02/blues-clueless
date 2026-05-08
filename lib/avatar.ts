// Deterministic per-user color + avatar URL.
// Colors hand-picked to play well with the new palette.

const ACCENT_COLORS = [
  "#5DF8D8", // mint
  "#6FD1D7", // sky
  "#3B7597", // ocean
  "#FFB84D", // warm amber
  "#FF8FB1", // pink
  "#A78BFA", // purple
  "#FFD93D", // yellow
  "#7CE38B", // grass
  "#F87171", // coral
  "#60A5FA", // azure
];

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export function colorForUser(seed: string): string {
  return ACCENT_COLORS[hashString(seed) % ACCENT_COLORS.length];
}

// DiceBear "fun-emoji" — colorful round cartoon faces. No API key needed.
// If `seed` is already a data: URL or full http(s) URL, it's returned as-is —
// that lets custom uploaded images flow through the same render paths.
export function avatarUrlForUser(seed: string): string {
  if (seed && (seed.startsWith("data:") || seed.startsWith("http"))) return seed;
  const safe = encodeURIComponent(seed || "anon");
  return `https://api.dicebear.com/7.x/fun-emoji/svg?seed=${safe}&backgroundType=gradientLinear&radius=50`;
}
