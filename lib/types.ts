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
