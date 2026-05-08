// Username-only auth shim. Supabase requires an email — we synthesize one from
// the chosen username so users only ever see/type their username.

export const SECRET_KEY = "8090";
const EMAIL_DOMAIN = "bluesclueless.chat";

export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
}

export function emailFromUsername(username: string): string {
  return `${normalizeUsername(username)}@${EMAIL_DOMAIN}`;
}

export function isValidUsername(name: string): string | null {
  const n = normalizeUsername(name);
  if (n.length < 2) return "Username must be at least 2 characters.";
  if (n.length > 20) return "Username must be 20 characters or fewer.";
  if (!/^[a-z0-9_]+$/.test(n)) return "Use only letters, numbers, and underscores.";
  return null;
}
