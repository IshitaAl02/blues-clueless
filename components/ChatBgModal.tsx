"use client";

import { useEffect, useRef, useState } from "react";
import Modal from "./Modal";
import { PALETTE, THEMES, Theme } from "@/lib/library";

export default function ChatBgModal({
  open,
  initialBg,
  initialImage,
  initialText,
  onClose,
  onSaveTheme,
  onSaveBg,
  onSaveText,
  onSaveImage,
}: {
  open: boolean;
  initialBg: string | null;
  initialImage: string | null;
  initialText: string | null;
  onClose: () => void;
  onSaveTheme: (t: Theme) => Promise<void>;
  onSaveBg: (bg: string | null) => Promise<void>;
  onSaveText: (text: string | null) => Promise<void>;
  onSaveImage: (img: string | null) => Promise<void>;
}) {
  const [bg, setBg] = useState("");
  const [imgUrl, setImgUrl] = useState("");
  const [textColor, setTextColor] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setBg(initialBg ?? "");
    setImgUrl(initialImage ?? "");
    setTextColor(initialText ?? "");
  }, [open, initialBg, initialImage, initialText]);

  async function pickTheme(t: Theme) {
    setBusy(true);
    try { await onSaveTheme(t); onClose(); } finally { setBusy(false); }
  }

  async function saveTextOnly(value: string | null) {
    setBusy(true);
    try { await onSaveText(value); onClose(); } finally { setBusy(false); }
  }

  async function saveCustomBg(value: string | null) {
    setBusy(true);
    try { await onSaveBg(value); onClose(); } finally { setBusy(false); }
  }

  async function saveImage(value: string | null) {
    setBusy(true);
    try { await onSaveImage(value); onClose(); } finally { setBusy(false); }
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 2_500_000) { alert("Please pick an image under 2.5 MB."); return; }
    const reader = new FileReader();
    reader.onload = () => setImgUrl(String(reader.result));
    reader.readAsDataURL(f);
  }

  return (
    <Modal open={open} onClose={onClose} title="Chat theme 🎨">
      <p className="text-sm opacity-70 mb-3">
        Pick a theme — page background <em>and</em> text color update together. Or set each one yourself below.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
        {THEMES.map((t) => (
          <button
            key={t.key}
            type="button"
            disabled={busy}
            onClick={() => pickTheme(t)}
            className="rounded-2xl border-2 border-ink/40 p-2 text-left transition hover:scale-[1.02]"
            style={{ background: t.page_bg }}
          >
            <div
              className="text-[11px] font-bold inline-block px-1.5 py-0.5 rounded-full"
              style={{ color: t.card_text, background: t.card_bg }}
            >
              {t.name}
            </div>
          </button>
        ))}
      </div>

      <details className="mb-3">
        <summary className="text-sm font-bold cursor-pointer">🅰 Text color</summary>
        <p className="text-xs opacity-70 mt-2 mb-2">Applies to chat headers, message bubbles, and sidebar labels.</p>
        <div className="flex items-center gap-2 mb-2">
          <input
            type="color"
            value={/^#[0-9a-f]{6}$/i.test(textColor) ? textColor : "#093C5D"}
            onChange={(e) => setTextColor(e.target.value)}
            className="w-10 h-10 rounded border-2 border-ink cursor-pointer"
          />
          <input
            className="field"
            placeholder="#hex"
            value={textColor}
            onChange={(e) => setTextColor(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-10 gap-1.5 mb-2">
          {PALETTE.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setTextColor(c)}
              className={`w-7 h-7 rounded-full border-2 transition ${
                textColor.toLowerCase() === c.toLowerCase() ? "border-ink scale-110 shadow-popSm" : "border-ink/40 hover:scale-105"
              }`}
              style={{ background: c }}
              aria-label={c}
              title={c}
            />
          ))}
        </div>
        <div className="rounded-xl border-2 border-ink p-3 mb-2" style={{ color: textColor || undefined }}>
          <div className="font-display text-lg">The quick brown fox 🦊</div>
          <div className="text-sm opacity-80">jumps over the lazy dog.</div>
        </div>
        <div className="flex justify-between gap-2">
          <button className="btn-ghost !py-1 !px-3 text-xs" onClick={() => saveTextOnly(null)} disabled={busy}>Reset</button>
          <button className="btn-primary !py-1 !px-3 text-xs" onClick={() => saveTextOnly(textColor || null)} disabled={busy}>Save text</button>
        </div>
      </details>

      <details className="mb-3">
        <summary className="text-sm font-bold cursor-pointer">🖼 Background image</summary>
        <p className="text-xs opacity-70 mt-2 mb-2">Paste a URL or upload an image (under 2.5 MB).</p>
        <div className="flex items-center gap-2 mb-2">
          <input
            className="field"
            placeholder="https://…"
            value={imgUrl.startsWith("data:") ? "(uploaded image)" : imgUrl}
            onChange={(e) => setImgUrl(e.target.value)}
          />
          <button
            type="button"
            className="btn-ghost !py-1 !px-3 text-xs shrink-0"
            onClick={() => fileRef.current?.click()}
          >Upload</button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
        </div>
        {imgUrl && (
          <div
            className="rounded-xl border-2 border-ink h-24 mb-2"
            style={{ backgroundImage: `url(${imgUrl})`, backgroundSize: "cover", backgroundPosition: "center" }}
          />
        )}
        <div className="flex justify-between gap-2">
          <button className="btn-ghost !py-1 !px-3 text-xs" onClick={() => saveImage(null)} disabled={busy}>Remove image</button>
          <button className="btn-primary !py-1 !px-3 text-xs" onClick={() => saveImage(imgUrl || null)} disabled={busy || !imgUrl}>Save image</button>
        </div>
      </details>

      <details>
        <summary className="text-sm font-bold cursor-pointer">Custom color or gradient</summary>
        <div className="flex items-center gap-2 mt-2 mb-2">
          <input
            type="color"
            value={/^#[0-9a-f]{6}$/i.test(bg) ? bg : "#ffffff"}
            onChange={(e) => setBg(e.target.value)}
            className="w-10 h-10 rounded border-2 border-ink cursor-pointer"
          />
          <input
            className="field"
            placeholder="#hex or CSS gradient"
            value={bg}
            onChange={(e) => setBg(e.target.value)}
          />
        </div>
        <div className="rounded-xl border-2 border-ink h-16 mb-2" style={{ background: bg || "transparent" }} />
        <div className="flex justify-between gap-2">
          <button className="btn-ghost !py-1 !px-3 text-xs" onClick={() => saveCustomBg(null)} disabled={busy}>Reset</button>
          <button className="btn-primary !py-1 !px-3 text-xs" onClick={() => saveCustomBg(bg || null)} disabled={busy}>Save bg</button>
        </div>
      </details>
    </Modal>
  );
}
