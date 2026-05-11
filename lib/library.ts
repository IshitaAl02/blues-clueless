import { supabase } from "./supabase";

export type CardKind = "endpoint" | "form_key" | "report" | "guide" | "link";
export type Scope = "mine" | "shared";

export interface LibrarySection {
  id: string;
  owner_id: string | null;
  name: string;
  position: number;
}

export interface LibraryCard {
  id: string;
  section_id: string;
  owner_id: string | null;
  created_by: string;
  kind: CardKind;
  data: Record<string, any>;
  bg_color: string;
  text_color: string;
  custom_colors: boolean;
  position: number;
}

export interface LibraryPrefs {
  user_id: string;
  page_bg: string | null;
  page_image: string | null;
  card_bg: string | null;
  card_text: string | null;
  theme_key: string | null;
  chat_bg: string | null;
  chat_image: string | null;
  chat_text: string | null;
  chat_chrome: string | null;
}

export function hexA(hex: string, alpha: number): string {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

// ─── Color math: derive a coherent palette from a single base color ───
function hexToRgb(hex: string): [number, number, number] | null {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgbToHex(r: number, g: number, b: number): string {
  const c = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}
function srgbToLin(c: number) {
  const x = c / 255;
  return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
}
export function relativeLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0.5;
  const [r, g, b] = rgb.map(srgbToLin) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
// Choose a readable text color (dark navy or off-white) for any background.
export function contrastText(bgHex: string, dark = "#0b1f33", light = "#f5fbff"): string {
  return relativeLuminance(bgHex) > 0.55 ? dark : light;
}
function mix(a: string, b: string, t: number): string {
  const ra = hexToRgb(a), rb = hexToRgb(b);
  if (!ra || !rb) return a;
  return rgbToHex(
    ra[0] + (rb[0] - ra[0]) * t,
    ra[1] + (rb[1] - ra[1]) * t,
    ra[2] + (rb[2] - ra[2]) * t,
  );
}
export function lighten(hex: string, amount: number): string {
  return mix(hex, "#ffffff", amount);
}
export function darken(hex: string, amount: number): string {
  return mix(hex, "#000000", amount);
}

// Derive a coherent chat palette from a single accent (chrome) color.
// Caller-supplied chrome/text/bg act as overrides; everything else is computed.
export interface DerivedChatPalette {
  chromeBg: string;
  chromeText: string;
  bubbleMeBg: string;
  bubbleMeText: string;
  accentMine: string;
  paneTint: string; // soft hint for glass-card backgrounds when no image
}
export function deriveChatPalette(opts: {
  chrome?: string | null;
  text?: string | null;
  bg?: string | null;
}): DerivedChatPalette | null {
  const chrome = opts.chrome || (opts.bg ? darken(opts.bg, 0.25) : null);
  if (!chrome || !hexToRgb(chrome)) return null;
  const isLight = relativeLuminance(chrome) > 0.55;
  const chromeText = opts.text || contrastText(chrome);
  const bubbleMeBg = isLight ? darken(chrome, 0.1) : lighten(chrome, 0.05);
  const bubbleMeText = contrastText(bubbleMeBg);
  const accentMine = isLight ? lighten(chrome, 0.1) : lighten(chrome, 0.2);
  const paneTint = isLight ? lighten(chrome, 0.7) : lighten(chrome, 0.85);
  return { chromeBg: chrome, chromeText, bubbleMeBg, bubbleMeText, accentMine, paneTint };
}

export interface Theme {
  key: string;
  name: string;
  page_bg: string;
  card_bg: string;
  card_text: string;
}

export const THEMES: Theme[] = [
  { key: "alpine",   name: "Alpine paper",   page_bg: "linear-gradient(180deg,#ede5d6 0%,#d8c9ad 100%)", card_bg: "#fbf6ea", card_text: "#1a3320" },
  { key: "ocean",    name: "Ocean breeze",   page_bg: "linear-gradient(180deg,#ECFCFB 0%,#DFF5F7 100%)", card_bg: "#ffffff", card_text: "#093c5d" },
  { key: "sunset",   name: "Soft sunset",    page_bg: "linear-gradient(135deg,#fde68a 0%,#fca5a5 100%)", card_bg: "#fffaf0", card_text: "#7a2e2e" },
  { key: "lavender", name: "Lavender haze",  page_bg: "linear-gradient(135deg,#dbeafe 0%,#a78bfa 100%)", card_bg: "#f5f3ff", card_text: "#3b1d6e" },
  { key: "forest",   name: "Forest moss",    page_bg: "linear-gradient(135deg,#064e3b 0%,#10b981 100%)", card_bg: "#0f2e25", card_text: "#d1fae5" },
  { key: "midnight", name: "Midnight",       page_bg: "linear-gradient(135deg,#0f172a 0%,#1e293b 100%)", card_bg: "#1f2a44", card_text: "#e2e8f0" },
  { key: "rose",     name: "Rose petal",     page_bg: "linear-gradient(135deg,#fce7f3 0%,#fbcfe8 100%)", card_bg: "#fff5fa", card_text: "#7a1a4d" },
];

function ownerFilter(scope: Scope, userId: string) {
  return scope === "mine" ? userId : null;
}

export async function listSections(scope: Scope, userId: string): Promise<LibrarySection[]> {
  const q = supabase.from("library_sections").select("*").order("position", { ascending: true });
  const { data, error } = scope === "mine"
    ? await q.eq("owner_id", userId)
    : await q.is("owner_id", null);
  if (error) throw error;
  return (data ?? []) as LibrarySection[];
}

export async function listCards(sectionIds: string[]): Promise<LibraryCard[]> {
  if (sectionIds.length === 0) return [];
  const { data, error } = await supabase
    .from("library_cards")
    .select("*")
    .in("section_id", sectionIds)
    .order("position", { ascending: true });
  if (error) throw error;
  return (data ?? []) as LibraryCard[];
}

export async function createSection(scope: Scope, userId: string, name: string, position: number) {
  const { data, error } = await supabase
    .from("library_sections")
    .insert({ owner_id: ownerFilter(scope, userId), name, position })
    .select()
    .single();
  if (error) throw error;
  return data as LibrarySection;
}

export async function renameSection(id: string, name: string) {
  const { error } = await supabase.from("library_sections").update({ name }).eq("id", id);
  if (error) throw error;
}

export async function deleteSection(id: string) {
  const { error } = await supabase.from("library_sections").delete().eq("id", id);
  if (error) throw error;
}

export async function createCard(
  scope: Scope,
  userId: string,
  input: Omit<LibraryCard, "id" | "owner_id" | "created_by">
) {
  const { data, error } = await supabase
    .from("library_cards")
    .insert({ ...input, owner_id: ownerFilter(scope, userId), created_by: userId })
    .select()
    .single();
  if (error) throw error;
  return data as LibraryCard;
}

export async function updateCard(id: string, patch: Partial<LibraryCard>) {
  const { error } = await supabase
    .from("library_cards")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteCard(id: string) {
  const { error } = await supabase.from("library_cards").delete().eq("id", id);
  if (error) throw error;
}

export async function reorderSections(ids: string[]) {
  await Promise.all(
    ids.map((id, i) =>
      supabase.from("library_sections").update({ position: i }).eq("id", id)
    )
  );
}

export async function reorderCards(updates: { id: string; section_id: string; position: number }[]) {
  await Promise.all(
    updates.map((u) =>
      supabase
        .from("library_cards")
        .update({ section_id: u.section_id, position: u.position })
        .eq("id", u.id)
    )
  );
}

export async function getPrefs(userId: string): Promise<LibraryPrefs | null> {
  const { data, error } = await supabase
    .from("library_prefs")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as LibraryPrefs | null;
}

export async function setPageBg(userId: string, page_bg: string | null) {
  const { error } = await supabase
    .from("library_prefs")
    .upsert({ user_id: userId, page_bg, updated_at: new Date().toISOString() });
  if (error) throw error;
}

export async function setPageImage(userId: string, page_image: string | null) {
  const { error } = await supabase
    .from("library_prefs")
    .upsert({ user_id: userId, page_image, updated_at: new Date().toISOString() });
  if (error) throw error;
}

export async function setChatBg(userId: string, chat_bg: string | null) {
  const { error } = await supabase
    .from("library_prefs")
    .upsert({ user_id: userId, chat_bg, updated_at: new Date().toISOString() });
  if (error) throw error;
}

export async function setChatImage(userId: string, chat_image: string | null) {
  const { error } = await supabase
    .from("library_prefs")
    .upsert({ user_id: userId, chat_image, updated_at: new Date().toISOString() });
  if (error) throw error;
}

export async function setChatText(userId: string, chat_text: string | null) {
  const { error } = await supabase
    .from("library_prefs")
    .upsert({ user_id: userId, chat_text, updated_at: new Date().toISOString() });
  if (error) throw error;
}

export async function setChatChrome(userId: string, chat_chrome: string | null) {
  const { error } = await supabase
    .from("library_prefs")
    .upsert({ user_id: userId, chat_chrome, updated_at: new Date().toISOString() });
  if (error) throw error;
}

export async function setChatTheme(
  userId: string,
  prefs: { chat_bg: string | null; chat_text: string | null; chat_image: string | null; chat_chrome: string | null }
) {
  const { error } = await supabase
    .from("library_prefs")
    .upsert({ user_id: userId, ...prefs, updated_at: new Date().toISOString() });
  if (error) throw error;
}

export async function setTheme(
  userId: string,
  prefs: { page_bg: string | null; card_bg: string | null; card_text: string | null; theme_key: string | null }
) {
  const { error } = await supabase
    .from("library_prefs")
    .upsert({ user_id: userId, ...prefs, updated_at: new Date().toISOString() });
  if (error) throw error;
}

// Apply theme card defaults to any cards in the given sections that haven't been
// explicitly recolored (custom_colors = false). Mine-scope cards only.
export async function applyThemeToCards(
  sectionIds: string[],
  card_bg: string,
  card_text: string
) {
  if (sectionIds.length === 0) return;
  const { error } = await supabase
    .from("library_cards")
    .update({ bg_color: card_bg, text_color: card_text, updated_at: new Date().toISOString() })
    .in("section_id", sectionIds)
    .eq("custom_colors", false);
  if (error) throw error;
}

// Curated swatches inspired by the user's chrome-customizer screenshot.
export const PALETTE = [
  "#1d4ed8", "#475569", "#1e6091", "#64748b",
  "#1f6b5b", "#0fb39a", "#3e8b50", "#73886a",
  "#a98b1c", "#c3651e", "#8a6a4e", "#9b2c44",
  "#6b4a45", "#9b4d7a", "#a78bfa", "#7c3aed",
  "#ffffff", "#f5f5f4", "#0f172a", "#093c5d",
];

export const PAGE_BG_PRESETS = [
  "linear-gradient(180deg,#ECFCFB 0%,#DFF5F7 100%)",
  "linear-gradient(135deg,#fef3c7 0%,#fde68a 100%)",
  "linear-gradient(135deg,#dbeafe 0%,#a78bfa 100%)",
  "linear-gradient(135deg,#fce7f3 0%,#fbcfe8 100%)",
  "linear-gradient(135deg,#0f172a 0%,#1e293b 100%)",
  "linear-gradient(135deg,#064e3b 0%,#10b981 100%)",
];
