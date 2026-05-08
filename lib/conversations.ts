import { supabase } from "./supabase";

export type ConvKind = "dm" | "group" | "lobby";

export interface ConversationMember {
  user_id: string;
  username: string;
}

export interface Conversation {
  id: string;
  kind: ConvKind;
  name: string | null; // for groups; for DMs we resolve at display time
  created_by: string | null;
  created_at: string;
  members: ConversationMember[];
}

// The lobby is now a real conversation in the DB with this fixed UUID,
// seeded once + every signup auto-joins via a trigger.
export const LOBBY_ID = "00000000-0000-0000-0000-000000000001";

export const LOBBY: Conversation = {
  id: LOBBY_ID,
  kind: "lobby",
  name: "Blue's Clueless",
  created_by: null,
  created_at: new Date(0).toISOString(),
  members: [],
};

export function channelForConversation(c: Conversation): string {
  return `conv-${c.id}`;
}

// Display name: groups use their `name`, DMs use the *other* person's username
export function displayName(c: Conversation, myUserId: string): string {
  if (c.kind === "group" || c.kind === "lobby") return c.name ?? "(unnamed group)";
  if (c.kind === "dm") {
    const other = c.members.find((m) => m.user_id !== myUserId);
    return other?.username ?? "DM";
  }
  return "Chat";
}

export async function listAllProfiles(): Promise<ConversationMember[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username")
    .order("username", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => ({ user_id: r.id, username: r.username }));
}

export async function listConversations(myUserId: string): Promise<Conversation[]> {
  // 1. Fetch convs I'm a member of
  const { data: convs, error } = await supabase
    .from("conversations")
    .select("id, kind, name, created_by, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  const convIds = (convs ?? []).map((c) => c.id);
  if (convIds.length === 0) return [];

  // 2. Fetch all members for those convs in one shot
  const { data: members, error: mErr } = await supabase
    .from("conversation_members")
    .select("conversation_id, user_id, profiles ( username )")
    .in("conversation_id", convIds);
  if (mErr) throw mErr;

  const byConv = new Map<string, ConversationMember[]>();
  for (const row of members ?? []) {
    const username = (row as any).profiles?.username ?? "?";
    const list = byConv.get(row.conversation_id) ?? [];
    list.push({ user_id: row.user_id, username });
    byConv.set(row.conversation_id, list);
  }

  return (convs ?? [])
    .filter((c) => c.id !== LOBBY_ID) // lobby is rendered separately
    .map((c) => ({
      ...c,
      kind: c.kind as ConvKind,
      members: byConv.get(c.id) ?? [],
    }));
}

export async function createGroup(
  name: string,
  memberIds: string[],
  myUserId: string,
): Promise<string> {
  const { data, error } = await supabase
    .from("conversations")
    .insert({ kind: "group", name, created_by: myUserId })
    .select("id")
    .single();
  if (error) throw error;
  const convId = data.id as string;

  const allIds = Array.from(new Set([myUserId, ...memberIds]));
  const rows = allIds.map((uid) => ({ conversation_id: convId, user_id: uid }));
  const { error: mErr } = await supabase.from("conversation_members").insert(rows);
  if (mErr) throw mErr;
  return convId;
}

// Find an existing DM between me and other, or create one.
export async function findOrCreateDM(
  otherUserId: string,
  myUserId: string,
): Promise<string> {
  // List my DM convs and find one where the only other member is `otherUserId`
  const { data: myConvs, error } = await supabase
    .from("conversations")
    .select("id, kind, conversation_members ( user_id )")
    .eq("kind", "dm");
  if (error) throw error;
  for (const c of myConvs ?? []) {
    const ids = ((c as any).conversation_members ?? []).map((m: any) => m.user_id) as string[];
    if (ids.length === 2 && ids.includes(myUserId) && ids.includes(otherUserId)) {
      return c.id;
    }
  }

  // Create
  const { data: newConv, error: cErr } = await supabase
    .from("conversations")
    .insert({ kind: "dm", name: null, created_by: myUserId })
    .select("id")
    .single();
  if (cErr) throw cErr;
  const id = newConv.id as string;
  const { error: mErr } = await supabase
    .from("conversation_members")
    .insert([
      { conversation_id: id, user_id: myUserId },
      { conversation_id: id, user_id: otherUserId },
    ]);
  if (mErr) throw mErr;
  return id;
}
