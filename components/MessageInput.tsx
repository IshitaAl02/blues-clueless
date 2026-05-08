"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import GifPicker from "./GifPicker";
import { fileToCompressedDataUrl } from "@/lib/image";
import type { ChatMessage } from "@/lib/types";

const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false });

type Outbound = Omit<ChatMessage, "id" | "ts" | "userId" | "username">;

export default function MessageInput({
  onSend,
  onTyping,
}: {
  onSend: (m: Outbound) => void;
  onTyping: () => void;
}) {
  const [text, setText] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [showGif, setShowGif] = useState(false);
  const [busy, setBusy] = useState(false);
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

  function sendText() {
    const t = text.trim();
    if (!t) return;
    onSend({ kind: "text", text: t });
    setText("");
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      alert("Only images please.");
      return;
    }
    setBusy(true);
    try {
      const dataUrl = await fileToCompressedDataUrl(f);
      onSend({ kind: "image", imageData: dataUrl });
    } catch {
      alert("Couldn't read that image.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="border-t-2 border-ink bg-white/80 backdrop-blur p-3 relative" ref={popRef}>
      {showEmoji && (
        <div className="absolute bottom-20 left-3 z-20">
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
        <div className="absolute bottom-20 left-3 z-20 solid-card">
          <GifPicker
            onSelect={(url) => {
              onSend({ kind: "gif", gifUrl: url });
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
          placeholder="Got a clue? Type it…"
          value={text}
          onChange={(e) => { setText(e.target.value); onTyping(); }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendText();
            }
          }}
        />
        <button className="btn-primary" onClick={sendText} disabled={!text.trim() || busy}>
          Send
        </button>
      </div>
    </div>
  );
}
