"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import GifPicker from "./GifPicker";
import { fileToCompressedDataUrl } from "@/lib/image";
import type { ChatMessage, ReplyRef } from "@/lib/types";
import { avatarUrlForUser, colorForUser } from "@/lib/avatar";
import type { MentionCandidate } from "./Mentions";

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
  mentionCandidates,
  onComposingChange,
  onOpenGames,
}: {
  onSend: (m: Outbound) => void;
  onTyping: () => void;
  replyingTo: ReplyRef | null;
  onCancelReply: () => void;
  mentionCandidates: MentionCandidate[];
  onComposingChange?: (composing: boolean) => void;
  onOpenGames?: () => void;
}) {
  const [text, setText] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [showGif, setShowGif] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<Pending>(null);
  const [mention, setMention] = useState<{ start: number; query: string } | null>(null);
  const [mentionIdx, setMentionIdx] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const filteredMentions = mention
    ? mentionCandidates
        .filter((c) => c.username.toLowerCase().startsWith(mention.query.toLowerCase()))
        .slice(0, 6)
    : [];

  function updateMentionFromCaret(value: string, caret: number) {
    const before = value.slice(0, caret);
    // Match @<query> at end of text or after whitespace
    const m = before.match(/(?:^|\s)@([a-z0-9_]{0,20})$/i);
    if (m) {
      setMention({ start: caret - m[1].length - 1, query: m[1] });
      setMentionIdx(0);
    } else {
      setMention(null);
    }
  }

  function insertMention(username: string) {
    if (!mention) return;
    const before = text.slice(0, mention.start);
    const after = text.slice(mention.start + 1 + mention.query.length);
    const newText = `${before}@${username} ${after}`;
    setText(newText);
    setMention(null);
    // restore caret position right after the inserted mention
    requestAnimationFrame(() => {
      const ta = taRef.current;
      if (!ta) return;
      const pos = before.length + 1 + username.length + 1;
      ta.focus();
      ta.setSelectionRange(pos, pos);
    });
  }

  // Auto-focus on mount so the user can start typing immediately
  useEffect(() => {
    taRef.current?.focus();
  }, []);

  // Re-focus when reply target changes (so replying jumps straight to typing)
  useEffect(() => {
    if (replyingTo) taRef.current?.focus();
  }, [replyingTo]);

  // Re-focus when an attachment (image / gif) is staged so the caption field is ready.
  useEffect(() => {
    if (pending) taRef.current?.focus();
  }, [pending]);

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
    // Keep focus on the input after sending so user can keep typing
    requestAnimationFrame(() => taRef.current?.focus());
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
    <div className="border-t-2 border-ink bg-white/80 backdrop-blur p-2 sm:p-3 relative z-20" ref={popRef}>
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
        <div className="absolute bottom-20 left-3 z-[100]">
          <EmojiPicker
            onEmojiClick={(d) => {
              setText((t) => t + d.emoji);
              setShowEmoji(false);
              requestAnimationFrame(() => taRef.current?.focus());
            }}
            height={350}
            width={300}
          />
        </div>
      )}
      {showGif && (
        <div className="absolute bottom-20 left-3 z-[100] solid-card">
          <GifPicker
            onSelect={(url) => {
              setPending({ kind: "gif", gifUrl: url });
              setShowGif(false);
            }}
          />
        </div>
      )}

      {mention && filteredMentions.length > 0 && (
        <div className="absolute bottom-full mb-1 left-2 right-2 sm:left-3 sm:right-auto z-[55] solid-card max-w-xs p-1 max-h-60 overflow-y-auto">
          <div className="text-[10px] uppercase tracking-wider opacity-60 px-2 py-1 font-bold">Mention</div>
          {filteredMentions.map((c, i) => (
            <button
              key={c.userId}
              onMouseDown={(e) => { e.preventDefault(); insertMention(c.username); }}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left ${i === mentionIdx ? "bg-mint on-accent" : "hover:bg-cloud"}`}
            >
              <div
                className="avatar-ring shrink-0"
                style={{ width: 24, height: 24, borderColor: colorForUser(c.userId) }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={avatarUrlForUser(c.username)} alt="" width={24} height={24} />
              </div>
              <span className="font-semibold text-sm">@{c.username}</span>
            </button>
          ))}
        </div>
      )}

      <div className="flex items-end gap-1 sm:gap-2">
        <button
          type="button"
          className="btn-ghost !px-2 !py-1 sm:!px-3 sm:!py-2 text-base sm:text-lg shrink-0"
          onClick={() => { setShowEmoji((s) => !s); setShowGif(false); }}
          aria-label="Emoji"
        >😊</button>
        <button
          type="button"
          className="btn-ghost !px-2 !py-1 sm:!px-3 sm:!py-2 text-xs sm:text-lg font-bold shrink-0"
          onClick={() => { setShowGif((s) => !s); setShowEmoji(false); }}
          aria-label="GIF"
        >GIF</button>
        <button
          type="button"
          className="btn-ghost !px-2 !py-1 sm:!px-3 sm:!py-2 text-base sm:text-lg shrink-0"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          aria-label="Image"
        >🖼️</button>
        {onOpenGames && (
          <button
            type="button"
            className="btn-ghost !px-2 !py-1 sm:!px-3 sm:!py-2 text-base sm:text-lg shrink-0"
            onClick={onOpenGames}
            aria-label="Start a game"
            title="Start a game"
          >🎮</button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFile}
        />
        <textarea
          ref={taRef}
          className="field flex-1 resize-none min-w-0 !px-2 sm:!px-4 !py-1.5 sm:!py-2.5"
          rows={1}
          autoFocus
          spellCheck
          autoCorrect="on"
          autoCapitalize="sentences"
          placeholder={pending ? "Add a caption…" : "Got a clue? Type it (or paste an image)…"}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            onTyping();
            updateMentionFromCaret(e.target.value, e.target.selectionStart ?? e.target.value.length);
          }}
          onKeyUp={(e) => {
            const t = e.currentTarget;
            updateMentionFromCaret(t.value, t.selectionStart ?? t.value.length);
          }}
          onClick={(e) => {
            const t = e.currentTarget;
            updateMentionFromCaret(t.value, t.selectionStart ?? t.value.length);
          }}
          onFocus={() => onComposingChange?.(true)}
          onBlur={() => onComposingChange?.(false)}
          onPaste={handlePaste}
          onKeyDown={(e) => {
            // Mention dropdown navigation
            if (mention && filteredMentions.length > 0) {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setMentionIdx((i) => Math.min(filteredMentions.length - 1, i + 1));
                return;
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                setMentionIdx((i) => Math.max(0, i - 1));
                return;
              }
              if (e.key === "Enter" || e.key === "Tab") {
                e.preventDefault();
                insertMention(filteredMentions[mentionIdx].username);
                return;
              }
              if (e.key === "Escape") {
                e.preventDefault();
                setMention(null);
                return;
              }
            }
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            } else if (e.key === "Escape") {
              if (pending) { e.preventDefault(); setPending(null); }
              else if (replyingTo) { e.preventDefault(); onCancelReply(); }
            }
          }}
        />
        <button
          className="btn-primary !px-3 sm:!px-5 !py-1.5 sm:!py-2.5 text-sm sm:text-base shrink-0"
          onClick={send}
          disabled={!canSend || busy}
        >
          Send
        </button>
      </div>
    </div>
  );
}
