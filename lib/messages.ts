import { supabase } from "./supabase";
import type { ChatMessage } from "./types";

const ONE_HOUR_MS = 60 * 60 * 1000;

interface DbRow {
  id: string;
  conversation_id: string;
  user_id: string;
  username: string;
  kind: "text" | "image" | "gif";
  text: string | null;
  image_data: string | null;
  gif_url: string | null;
  reply_to: any;
  edited: boolean | null;
  created_at: string;
}

function toMessage(r: DbRow): ChatMessage {
  return {
    id: r.id,
    userId: r.user_id,
    username: r.username,
    kind: r.kind,
    text: r.text ?? undefined,
    imageData: r.image_data ?? undefined,
    gifUrl: r.gif_url ?? undefined,
    replyTo: r.reply_to ?? undefined,
    edited: r.edited ?? false,
    ts: new Date(r.created_at).getTime(),
  };
}

// Fetch last 1 hour of messages for a conversation.
export async function fetchRecentMessages(conversationId: string): Promise<ChatMessage[]> {
  const since = new Date(Date.now() - ONE_HOUR_MS).toISOString();
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .gt("created_at", since)
    .order("created_at", { ascending: true });
  if (error) {
    console.error("[messages.fetchRecent]", error);
    return [];
  }
  return (data ?? []).map(toMessage);
}

export async function insertMessageDb(conversationId: string, m: ChatMessage): Promise<void> {
  const { error } = await supabase.from("messages").insert({
    id: m.id,
    conversation_id: conversationId,
    user_id: m.userId,
    username: m.username,
    kind: m.kind,
    text: m.text ?? null,
    image_data: m.imageData ?? null,
    gif_url: m.gifUrl ?? null,
    reply_to: m.replyTo ?? null,
    edited: m.edited ?? false,
    created_at: new Date(m.ts).toISOString(),
  });
  if (error) console.error("[messages.insert]", error);
}

export async function updateMessageTextDb(id: string, text: string): Promise<void> {
  const { error } = await supabase
    .from("messages")
    .update({ text, edited: true })
    .eq("id", id);
  if (error) console.error("[messages.update]", error);
}

export async function deleteMessageDb(id: string): Promise<void> {
  const { error } = await supabase.from("messages").delete().eq("id", id);
  if (error) console.error("[messages.delete]", error);
}
