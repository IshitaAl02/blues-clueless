"use client";

import { useEffect } from "react";
import { avatarUrlForUser, colorForUser } from "@/lib/avatar";

export interface ToastItem {
  id: string;
  username: string;
  userId: string;
  text: string;
}

export default function Toasts({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}) {
  // Auto-dismiss each toast after 3.5s
  useEffect(() => {
    const timers = toasts.map((t) =>
      setTimeout(() => onDismiss(t.id), 3500),
    );
    return () => { timers.forEach(clearTimeout); };
  }, [toasts, onDismiss]);

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 items-center pointer-events-none">
      {toasts.map((t) => {
        const accent = colorForUser(t.userId);
        return (
          <div
            key={t.id}
            className="solid-card px-3 py-2 flex items-center gap-2 max-w-[90vw] sm:max-w-md pointer-events-auto cursor-pointer"
            style={{ borderColor: accent, boxShadow: `0 4px 0 0 ${accent}` }}
            onClick={() => onDismiss(t.id)}
          >
            <div className="avatar-ring" style={{ width: 28, height: 28, borderColor: accent }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={avatarUrlForUser(t.username)} alt="" width={28} height={28} />
            </div>
            <div className="text-sm">
              <span className="font-bold" style={{ color: "#093C5D" }}>{t.username}</span>
              <span className="opacity-70 ml-1.5">{t.text}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
