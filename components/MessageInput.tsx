"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import GifPicker from "./GifPicker";
import { fileToCompressedDataUrl } from "@/lib/image";
import type { ChatMessage, ReplyRef } from "@/lib/types";
import { colorForUser } from "@/lib/avatar";

const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false });

type Outbound = Omit<ChatMessage, "id" | "ts" | "userId" | "username">;

type Pending =
  | { kind: "image"; imageData: string }
  | { kind: "gif"; gifUrl: string }
  | null;

export default function MessageInput({
  onSend,
  onTyping,
  replyingTo,
  onCancelReply,
}: {
  onSend: (m: Outbound) => void;
  onTyping: () => void;
  replyingTo: ReplyRef | null;
  onCancelReply: () => void;
}) {
  const [text, setText] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [showGif, setShowGif] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<Pending>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const popRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (popRef.current && !popRef.current.contains(e.target as Node)) {
        setShowEmoji(false);
        setShowGif(false);
      }
    }
    if (showEmoji || showGif) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [showEmoji, showGif]);

  function send() {
    const t = text.trim();
    if (!pending && !t) return;

    if (pending?.kind === "image") {
      onSend({ kind: "image", imageData: pending.imageData, text: t || undefined });
    } else if (pending?.kind === "gif") {
      onSend({ kind: "gif", gifUrl: pending.gifUrl, text: t || undefined });
    } else if (t) {
      onSend({ kind: "text", text: t });
    }
    setText("");
    setPending(null);
  }

  async function attachImageFile(f: File) {
    if (!f.type.startsWith("image/")) {
      alert("Only images please.");
      return;
    }
    setBusy(true);
    try {
      const dataUrl = await fileToCompressedDataUrl(f);
      setPending({ kind: "image", imageData: dataUrl });
    } catch {
      alert("Couldn't read that image.");
    } finally {
      setBusy(false);
    }
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (f) await attachImageFile(f);
  }

  async function handlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (it.kind === "file" && it.type.startsWith("image/")) {
        const f = it.getAsFile();
        if (f) {
          e.preventDefault();
          await attachImageFile(f);
          return;
        }
      }
    }
    // No image in clipboard — let the default paste happen (text)
  }

  const canSend = !!pending || !!text.trim();

  return (
    <div className="border-t-2 border-ink bg-white/80 backdrop-blur p-3 relative" ref={popRef}>
      {replyingTo && (
        <div
          className="mb-2 flex items-center justify-between gap-2 rounded-md px-2 py-1.5"
          style={{
            background: "var(--reply-bg)",
            borderLeft: `4px solid ${colorForUser(replyingTo.userId)}`,
          }}
        >
          <div className="text-[12px] min-w-0">
            <div className="font-bold" style={{ color: colorForUser(replyingTo.userId) }}>
              ↩ Replying to {replyingTo.username}
            </div>
            <div className="opacity-70 truncate">{replyingTo.preview || "—"}</div>
          </div>
          <button
            type="button"
            onClick={onCancelReply}
            className="rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-200 border border-ink"
            title="Cancel reply"
            aria-label="Cancel reply"
          >✕</button>
        </div>
      )}

      {pending && (
        <div className="mb-2 flex items-start gap-2 rounded-md p-2 border-2 border-ink" style={{ background: "var(--reply-bg)" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={pending.kind === "image" ? pending.imageData : pending.gifUrl}
            alt="attachment preview"
            className="max-h-28 rounded-md border border-ink"
          />
          <div className="flex-1 text-xs">
            <div className="font-bold mb-0.5">
              {pending.kind === "image" ? "📷 Image attached" : "🎬 GIF attached"}
            </div>
            <div className="opacity-70 italic">Add a caption (optional) and hit Send.</div>
          </div>
          <button
            type="button"
            onClick={() => setPending(null)}
            className="rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-200 border border-ink shrink-0"
            title="Remove attachment"
            aria-label="Remove attachment"
          >✕</button>
        </div>
      )}

      {showEmoji && (
        <div className="absolute bottom-20 left-3 z-[60]">
          <EmojiPicker
            onEmojiClick={(d) => {
              setText((t) => t + d.emoji);
              setShowEmoji(false);
            }}
            height={350}
            width={300}
          />
        </div>
      )}
      {showGif && (
        <div className="absolute bottom-20 left-3 z-[60] solid-card">
          <GifPicker
            onSelect={(url) => {
              setPending({ kind: "gif", gifUrl: url });
              setShowGif(false);
            }}
          />
        </div>
      )}

      <div className="flex items-end gap-2">
        <button
          type="button"
          className="btn-ghost !px-3 !py-2 text-lg"
          onClick={() => { setShowEmoji((s) => !s); setShowGif(false); }}
          aria-label="Emoji"
        >😊</button>
        <button
          type="button"
          className="btn-ghost !px-3 !py-2 text-lg"
          onClick={() => { setShowGif((s) => !s); setShowEmoji(false); }}
          aria-label="GIF"
        >GIF</button>
        <button
          type="button"
          className="btn-ghost !px-3 !py-2 text-lg"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          aria-label="Image"
        >🖼️</button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFile}
        />
        <textarea
          className="field flex-1 resize-none"
          rows={1}
          placeholder={pending ? "Add a caption…" : "Got a clue? Type it (or paste an image)…"}
          value={text}
          onChange={(e) => { setText(e.target.value); onTyping(); }}
          onPaste={handlePaste}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            } else if (e.key === "Escape") {
              if (pending) { e.preventDefault(); setPending(null); }
              else if (replyingTo) { e.preventDefault(); onCancelReply(); }
            }
          }}
        />
        <button className="btn-primary" onClick={send} disabled={!canSend || busy}>
          Send
        </button>
      </div>
    </div>
  );
}
