"use client";

import { useEffect, useRef } from "react";
import type { ChatMessage } from "@/lib/types";
import { avatarUrlForUser, colorForUser } from "@/lib/avatar";

function Avatar({ seed, size = 36 }: { seed: string; size?: number }) {
  return (
    <div className="avatar-ring" style={{ width: size, height: size }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={avatarUrlForUser(seed)} alt={seed} width={size} height={size} />
    </div>
  );
}

export default function MessageList({
  messages,
  myUserId,
  typingUsers,
}: {
  messages: ChatMessage[];
  myUserId: string;
  typingUsers: string[];
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, typingUsers.length]);

  return (
    <div ref={ref} className="flex-1 overflow-y-auto p-4 space-y-3">
      {messages.length === 0 && (
        <div className="text-center opacity-60 italic mt-10">
          🐾 No clues yet. Say hi!
        </div>
      )}

      {messages.map((m, idx) => {
        const mine = m.userId === myUserId;
        const prev = idx > 0 ? messages[idx - 1] : null;
        const showHeader = !prev || prev.userId !== m.userId;
        const accent = colorForUser(m.userId);

        return (
          <div key={m.id} className={`flex gap-2 ${mine ? "justify-end" : "justify-start"}`}>
            {!mine && (
              <div className="w-9">
                {showHeader ? <Avatar seed={m.username} /> : null}
              </div>
            )}

            <div className="max-w-[75%]">
              {showHeader && (
                <div
                  className={`text-xs font-bold mb-1 ${mine ? "text-right mr-1" : "ml-1"}`}
                  style={{ color: mine ? "#093C5D" : accent }}
                >
                  <span
                    className="px-2 py-0.5 rounded-full"
                    style={{
                      background: mine ? "#5DF8D8" : `${accent}22`,
                      border: `1.5px solid ${mine ? "#093C5D" : accent}`,
                      color: "#093C5D",
                    }}
                  >
                    {m.username}{mine && " (you)"}
                  </span>
                </div>
              )}

              <div
                className={`${mine ? "bubble-me" : "bubble-them"} px-3 py-2 break-words`}
                style={!mine ? { borderColor: accent, boxShadow: `0 3px 0 0 ${accent}` } : undefined}
              >
                {m.kind === "text" && <span>{m.text}</span>}
                {m.kind === "image" && m.imageData && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.imageData} alt="shared" className="rounded-lg max-h-72" />
                )}
                {m.kind === "gif" && m.gifUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.gifUrl} alt="gif" className="rounded-lg max-h-60" />
                )}
              </div>

              <div className={`text-[10px] opacity-50 mt-1 ${mine ? "text-right mr-2" : "ml-2"}`}>
                {new Date(m.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>

            {mine && (
              <div className="w-9">
                {showHeader ? <Avatar seed={m.username} /> : null}
              </div>
            )}
          </div>
        );
      })}

      {typingUsers.length > 0 && (
        <div className="flex items-center gap-2 text-sm opacity-70 ml-2">
          <span>🐾 {typingUsers.join(", ")} {typingUsers.length === 1 ? "is" : "are"} thinking</span>
          <span><span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" /></span>
        </div>
      )}
    </div>
  );
}
