export type MessageKind = "text" | "image" | "gif";

export interface ChatMessage {
  id: string;
  kind: MessageKind;
  username: string;
  userId: string;
  text?: string;
  imageData?: string; // data URL (base64) — ephemeral, never stored
  gifUrl?: string;
  ts: number;
  edited?: boolean;
  replyTo?: ReplyRef;
}

export interface ReplyRef {
  id: string;
  userId: string;
  username: string;
  kind: MessageKind;
  preview: string;
}

export interface PresenceUser {
  userId: string;
  username: string;
  online_at: string;
}

export interface ReadReceipt {
  userId: string;
  username: string;
  lastReadTs: number;
}
