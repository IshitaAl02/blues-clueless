import type { ChatMessage, ReplyRef } from "./types";

export function buildReplyRef(m: ChatMessage): ReplyRef {
  let preview = "";
  if (m.kind === "text") preview = (m.text ?? "").slice(0, 80);
  else if (m.kind === "image") preview = "📷 Photo";
  else if (m.kind === "gif") preview = "🎬 GIF";
  return {
    id: m.id,
    userId: m.userId,
    username: m.username,
    kind: m.kind,
    preview,
  };
}
