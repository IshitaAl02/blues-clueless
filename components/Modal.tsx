"use client";

import { useEffect } from "react";

export default function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Outer wrapper holds the close button so overflow on the card doesn't clip it */}
      <div
        className="relative max-w-md w-full max-h-[92dvh]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 z-10 w-8 h-8 rounded-full bg-white border-2 border-ink flex items-center justify-center text-ink hover:bg-red-200 shadow-popSm"
          aria-label="Close"
        >✕</button>

        <div className="solid-card p-5 sm:p-6 max-h-[92dvh] overflow-y-auto">
          <h2 className="text-2xl mb-4 pr-6">{title}</h2>
          {children}
        </div>
      </div>
    </div>
  );
}
