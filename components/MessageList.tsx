"use client";

import { useEffect, useRef, useState } from "react";
import type { ChatMessage, PresenceUser, ReadReceipt } from "@/lib/types";
import { avatarUrlForUser, colorForUser } from "@/lib/avatar";

function Avatar({ seed, size = 36 }: { seed: string; size?: number }) {
  return (
    <div className="avatar-ring" style={{ width: size, height: size }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={avatarUrlForUser(seed)} alt={seed} width={size} height={size} />
    </div>
  );
}

function SeenBy({
  readers,
}: {
  readers: ReadReceipt[];
}) {
  if (readers.length === 0) return null;
  return (
    <div className="flex items-center gap-1 mt-1 mr-1 justify-end" title={`Seen by ${readers.map((r) => r.username).join(", ")}`}>
      <span className="text-[10px] opacity-60 font-semibold">seen by</span>
      <div className="flex -space-x-1">
        {readers.slice(0, 6).map((r) => (
          <span
            key={r.userId}
            className="w-3 h-3 rounded-full border-2"
            style={{ background: colorForUser(r.userId), borderColor: "#093C5D" }}
            title={r.username}
          />
        ))}
        {readers.length > 6 && (
          <span className="text-[10px] opacity-60 ml-1 font-semibold">+{readers.length - 6}</span>
        )}
      </div>
    </div>
  );
}

export default function MessageList({
  messages,
  myUserId,
  typingUsers,
  reads,
  onlineUsers,
  onEdit,
  onDelete,
}: {
  messages: ChatMessage[];
  myUserId: string;
  typingUsers: string[];
  reads: Record<string, ReadReceipt>;
  onlineUsers: PresenceUser[];
  onEdit: (id: string, newText: string) => void;
  onDelete: (id: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, typingUsers.length]);

  // Find the index of the last message I sent — that's where we show "seen by"
  let lastMineIdx = -1;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].userId === myUserId) { lastMineIdx = i; break; }
  }

  function startEdit(m: ChatMessage) {
    setEditingId(m.id);
    setDraft(m.text ?? "");
  }
  function commitEdit(m: ChatMessage) {
    const t = draft.trim();
    if (t && t !== m.text) onEdit(m.id, t);
    setEditingId(null);
    setDraft("");
  }
  function cancelEdit() { setEditingId(null); setDraft(""); }

  function handleDelete(m: ChatMessage) {
    if (confirm("Delete this message? It'll vanish for everyone in the room.")) {
      onDelete(m.id);
    }
  }

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
        const editing = editingId === m.id;

        // For the last message I sent, find users (other than me) whose lastReadTs >= m.ts
        const isLastMine = idx === lastMineIdx;
        const readers = isLastMine
          ? Object.values(reads).filter((r) => r.userId !== myUserId && r.lastReadTs >= m.ts)
          : [];

        return (
          <div key={m.id} className={`flex gap-2 ${mine ? "justify-end" : "justify-start"}`}>
            {!mine && (
              <div className="w-9">
                {showHeader ? <Avatar seed={m.username} /> : null}
              </div>
            )}

            <div className="max-w-[75%] group">
              {showHeader && (
                <div className={`text-xs font-bold mb-1 ${mine ? "text-right mr-1" : "ml-1"}`}>
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

              <div className="flex items-center gap-1">
                {mine && !editing && m.kind === "text" && (
                  <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => startEdit(m)}
                      className="text-xs bg-white border border-ink rounded-full w-7 h-7 flex items-center justify-center hover:bg-mint"
                      title="Edit"
                      aria-label="Edit message"
                    >✏️</button>
                    <button
                      onClick={() => handleDelete(m)}
                      className="text-xs bg-white border border-ink rounded-full w-7 h-7 flex items-center justify-center hover:bg-red-200"
                      title="Delete"
                      aria-label="Delete message"
                    >🗑️</button>
                  </div>
                )}
                {mine && !editing && m.kind !== "text" && (
                  <button
                    onClick={() => handleDelete(m)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-xs bg-white border border-ink rounded-full w-7 h-7 flex items-center justify-center hover:bg-red-200"
                    title="Delete"
                    aria-label="Delete message"
                  >🗑️</button>
                )}

                <div
                  className={`${mine ? "bubble-me" : "bubble-them"} px-3 py-2 break-words flex-1`}
                  style={!mine ? { borderColor: accent, boxShadow: `0 3px 0 0 ${accent}` } : undefined}
                >
                  {editing ? (
                    <div className="flex flex-col gap-1">
                      <textarea
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); commitEdit(m); }
                          if (e.key === "Escape") cancelEdit();
                        }}
                        className="bg-white text-ink rounded-md p-1 border border-ink resize-none min-w-[200px]"
                        rows={2}
                        autoFocus
                      />
                      <div className="flex gap-1 justify-end text-[11px]">
                        <button onClick={cancelEdit} className="px-2 py-0.5 bg-white text-ink rounded">cancel</button>
                        <button onClick={() => commitEdit(m)} className="px-2 py-0.5 bg-mint text-ink rounded font-bold">save</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {m.kind === "text" && <span>{m.text}</span>}
                      {m.kind === "image" && m.imageData && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={m.imageData} alt="shared" className="rounded-lg max-h-72" />
                      )}
                      {m.kind === "gif" && m.gifUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={m.gifUrl} alt="gif" className="rounded-lg max-h-60" />
                      )}
                      {m.edited && <span className="text-[10px] opacity-60 ml-1 italic">(edited)</span>}
                    </>
                  )}
                </div>
              </div>

              <div className={`text-[10px] opacity-50 mt-1 ${mine ? "text-right mr-2" : "ml-2"}`}>
                {new Date(m.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>

              {isLastMine && readers.length > 0 && <SeenBy readers={readers} />}
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
