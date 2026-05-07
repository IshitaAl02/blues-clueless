"use client";

import { useEffect, useRef } from "react";
import type { ChatMessage } from "@/lib/types";

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
      {messages.map((m) => {
        const mine = m.userId === myUserId;
        return (
          <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
            <div className="max-w-[75%]">
              {!mine && (
                <div className="text-xs font-semibold mb-1 ml-2 opacity-80">{m.username}</div>
              )}
              <div className={`${mine ? "bubble-me" : "bubble-them"} px-3 py-2 break-words`}>
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
