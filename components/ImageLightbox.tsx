"use client";

import { useEffect } from "react";

export default function ImageLightbox({
  src,
  alt = "image",
  onClose,
}: {
  src: string | null;
  alt?: string;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!src) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [src, onClose]);

  if (!src) return null;

  function suggestFilename(s: string): string {
    if (s.startsWith("data:")) {
      const m = /^data:image\/([a-z0-9]+)/i.exec(s);
      const ext = m ? m[1].replace("jpeg", "jpg") : "png";
      return `image-${Date.now()}.${ext}`;
    }
    try {
      const u = new URL(s);
      const last = u.pathname.split("/").filter(Boolean).pop();
      return last || `image-${Date.now()}.png`;
    } catch {
      return `image-${Date.now()}.png`;
    }
  }

  async function download() {
    const filename = suggestFilename(src!);
    try {
      // For data: URLs and same-origin, anchor download works directly.
      if (src!.startsWith("data:")) {
        const a = document.createElement("a");
        a.href = src!;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        return;
      }
      // For remote URLs, fetch and blob so the download attribute is honored.
      const res = await fetch(src!, { mode: "cors" });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      // CORS blocked or offline — fall back to opening in a new tab.
      window.open(src!, "_blank", "noopener,noreferrer");
    }
  }

  return (
    <div
      className="fixed inset-0 z-[80] bg-black/85 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute top-3 right-3 flex gap-2 z-10">
        <button
          onClick={(e) => { e.stopPropagation(); download(); }}
          className="px-3 py-1.5 rounded-full bg-white text-ink border-2 border-ink font-bold text-sm hover:scale-105 transition shadow-popSm flex items-center gap-1"
          title="Download image"
        >
          <span aria-hidden>⬇️</span> Download
        </button>
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="px-3 py-1.5 rounded-full bg-white/90 text-ink border-2 border-ink font-bold text-sm hover:scale-105 transition shadow-popSm flex items-center gap-1"
          title="Open in new tab"
        >
          <span aria-hidden>↗</span> Open
        </a>
        <button
          onClick={onClose}
          className="px-3 py-1.5 rounded-full bg-white text-ink border-2 border-ink font-bold text-sm hover:scale-105 transition shadow-popSm"
          title="Close (Esc)"
          aria-label="Close"
        >✕</button>
      </div>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        onClick={(e) => e.stopPropagation()}
        className="max-w-[95vw] max-h-[90vh] rounded-xl border-2 border-white shadow-2xl object-contain cursor-default"
      />
    </div>
  );
}
