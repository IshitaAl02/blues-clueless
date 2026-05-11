"use client";

import { useEffect } from "react";

export default function CopyToast({
  message,
  onDismiss,
}: {
  message: string | null;
  onDismiss: () => void;
}) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onDismiss, 1800);
    return () => clearTimeout(t);
  }, [message, onDismiss]);

  if (!message) return null;
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] pointer-events-none">
      <div className="solid-card px-4 py-2 flex items-center gap-2 animate-[floaty_2s_ease-in-out]">
        <span className="w-6 h-6 rounded-full bg-mint border-2 border-ink flex items-center justify-center font-bold text-ink text-sm">✓</span>
        <span className="font-bold text-sm">{message}</span>
      </div>
    </div>
  );
}
