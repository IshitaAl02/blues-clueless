"use client";

import { useEffect, useRef, useState } from "react";
import type { ChatMessage, PresenceUser, ReadReceipt, ReplyRef } from "@/lib/types";
import { buildReplyRef } from "@/lib/reply";
import { ProfileMap, seedFor } from "@/lib/profilesCache";
import { RenderTextWithMentions } from "./Mentions";
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
  myAvatarSeed,
  profiles,
  typingUsers,
  reads,
  onlineUsers,
  onEdit,
  onDelete,
  onReply,
  onReact,
  replyingTo,
  composing,
}: {
  messages: ChatMessage[];
  myUserId: string;
  myAvatarSeed: string;
  profiles: ProfileMap;
  typingUsers: string[];
  reads: Record<string, ReadReceipt>;
  onlineUsers: PresenceUser[];
  onEdit: (id: string, newText: string) => void;
  onDelete: (id: string) => void;
  onReply: (ref: ReplyRef) => void;
  onReact: (messageId: string, emoji: string) => void;
  replyingTo: ReplyRef | null;
  composing: boolean;
}) {
  const QUICK_REACTIONS = ["❤️", "😂", "👍", "😮", "🐾"];
  const ref = useRef<HTMLDivElement>(null);
  const initialJumpDone = useRef(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [unseenCount, setUnseenCount] = useState(0);

  function isNearBottom(el: HTMLDivElement, threshold = 120) {
    return el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
  }

  // Track scroll position to decide whether the "jump to latest" arrow should show.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    function onScroll() {
      if (!el) return;
      const nearBottom = isNearBottom(el);
      setShowScrollDown(!nearBottom);
      if (nearBottom) setUnseenCount(0);
    }
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  // First time messages land for this conversation → jump instantly to the bottom.
  // Subsequent new messages: only auto-scroll if user is near the bottom.
  // Otherwise, surface a "new messages" arrow button.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!initialJumpDone.current) {
      el.scrollTo({ top: el.scrollHeight, behavior: "auto" });
      if (messages.length > 0) initialJumpDone.current = true;
      return;
    }
    // While the user is actively composing (input focused) or has a reply queued,
    // always follow incoming messages so they can see the conversation in real time.
    if (composing || replyingTo || isNearBottom(el)) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
      setUnseenCount(0);
      setShowScrollDown(false);
    } else {
      setUnseenCount((n) => n + 1);
      setShowScrollDown(true);
    }
  }, [messages.length, typingUsers.length]);

  // When the user starts a reply, jump them straight to the bottom so the
  // input is in view — no need to click the down-arrow.
  useEffect(() => {
    if (!replyingTo) return;
    const el = ref.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    setUnseenCount(0);
    setShowScrollDown(false);
  }, [replyingTo]);

  function jumpToBottom() {
    const el = ref.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    setUnseenCount(0);
    setShowScrollDown(false);
  }

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

  function scrollToMessage(id: string) {
    const el = document.getElementById(`msg-${id}`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("flash-highlight");
    setTimeout(() => el.classList.remove("flash-highlight"), 1400);
  }

  return (
    <div className="flex-1 relative min-h-0 flex flex-col">
    <div ref={ref} className="flex-1 overflow-y-auto p-4 space-y-3">
      {messages.length === 0 && (
        <div className="text-center opacity-60 italic mt-10">
          🐾 No clues yet. Say hi!
        </div>
      )}

      {messages.map((m, idx) => {
        const mine = m.userId === myUserId;
        const prev = idx > 0 ? messages[idx - 1] : null;
        const next = idx < messages.length - 1 ? messages[idx + 1] : null;
        const BURST_GAP_MS = 2 * 60 * 1000; // 2 minutes
        // First of burst: previous from someone else OR > 2min gap
        const showHeader = !prev || prev.userId !== m.userId || (m.ts - prev.ts) > BURST_GAP_MS;
        // Last of burst: next from someone else OR > 2min gap
        const showTimestamp = !next || next.userId !== m.userId || (next.ts - m.ts) > BURST_GAP_MS;
        const accent = colorForUser(m.userId);
        const editing = editingId === m.id;

        // For the last message I sent, find users (other than me) whose lastReadTs >= m.ts
        const isLastMine = idx === lastMineIdx;
        const readers = isLastMine
          ? Object.values(reads).filter((r) => r.userId !== myUserId && r.lastReadTs >= m.ts)
          : [];

        return (
          <div key={m.id} id={`msg-${m.id}`} className={`flex gap-2 rounded-xl transition-colors ${mine ? "justify-end" : "justify-start"}`}>
            {!mine && (
              <div className="w-9">
                {showHeader ? <Avatar seed={seedFor(profiles, m.userId, m.username)} /> : null}
              </div>
            )}
            {/* avatar for own messages on the right side is rendered after the bubble below */}

            <div className="max-w-[75%] group">
              {showHeader && (
                <div className={`text-xs font-bold mb-1 ${mine ? "text-right mr-1" : "ml-1"}`}>
                  <span
                    className={`px-2 py-0.5 rounded-full ${mine ? "on-accent" : ""}`}
                    style={{
                      background: mine ? "#5DF8D8" : `${accent}22`,
                      border: `1.5px solid ${mine ? "#093C5D" : accent}`,
                      color: mine ? undefined : accent,
                    }}
                  >
                    {m.username}{mine && " (you)"}
                  </span>
                </div>
              )}

              <div className="relative">
                {!editing && (
                  <div
                    className={`absolute bottom-full mb-1.5 z-[5] flex items-center gap-0.5 bg-white border-2 border-ink rounded-full px-1.5 py-0.5 shadow-popSm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto ${mine ? "right-0" : "left-0"}`}
                  >
                    {QUICK_REACTIONS.map((emo) => (
                      <button
                        key={emo}
                        onClick={() => onReact(m.id, emo)}
                        className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-sky/30 text-base leading-none transition hover:scale-125"
                        title={`React ${emo}`}
                        aria-label={`React with ${emo}`}
                      >{emo}</button>
                    ))}
                    <span className="w-px h-5 bg-ink/30 mx-0.5" />
                    <button
                      onClick={() => onReply(buildReplyRef(m))}
                      className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-sky text-sm leading-none"
                      title="Reply"
                      aria-label="Reply to message"
                    >↩️</button>
                    {mine && m.kind === "text" && (
                      <button
                        onClick={() => startEdit(m)}
                        className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-mint text-sm leading-none"
                        title="Edit"
                        aria-label="Edit message"
                      >✏️</button>
                    )}
                    {mine && (
                      <button
                        onClick={() => handleDelete(m)}
                        className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-red-200 text-sm leading-none"
                        title="Delete"
                        aria-label="Delete message"
                      >🗑️</button>
                    )}
                  </div>
                )}

                <div
                  className={`${mine ? "bubble-me" : "bubble-them"} px-3 py-2 break-words`}
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
                      {m.replyTo && (
                        <button
                          type="button"
                          onClick={() => scrollToMessage(m.replyTo!.id)}
                          className="block w-full text-left mb-1 rounded-md px-2 py-1 text-[11px] hover:brightness-95 transition"
                          style={{
                            background: mine ? "rgba(255,255,255,0.18)" : "var(--reply-bg)",
                            borderLeft: `3px solid ${colorForUser(m.replyTo.userId)}`,
                          }}
                          title="Jump to original message"
                        >
                          <span className="font-bold block" style={{ color: mine ? "#5DF8D8" : colorForUser(m.replyTo.userId) }}>
                            ↩ {m.replyTo.username}
                          </span>
                          <span className={`opacity-${mine ? "85" : "70"} block truncate`}>
                            {m.replyTo.preview || "—"}
                          </span>
                        </button>
                      )}
                      {m.kind === "text" && m.text && (
                        <span><RenderTextWithMentions text={m.text} mine={mine} /></span>
                      )}
                      {m.kind === "image" && m.imageData && (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={m.imageData} alt="shared" className="rounded-lg max-h-72" />
                          {m.text && (
                            <div className="mt-1 text-sm break-words">
                              <RenderTextWithMentions text={m.text} mine={mine} />
                            </div>
                          )}
                        </>
                      )}
                      {m.kind === "gif" && m.gifUrl && (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={m.gifUrl} alt="gif" className="rounded-lg max-h-60" />
                          {m.text && (
                            <div className="mt-1 text-sm break-words">
                              <RenderTextWithMentions text={m.text} mine={mine} />
                            </div>
                          )}
                        </>
                      )}
                      {m.edited && <span className="text-[10px] opacity-60 ml-1 italic">(edited)</span>}
                    </>
                  )}
                </div>
              </div>

              {m.reactions && Object.keys(m.reactions).length > 0 && (
                <div className={`flex flex-wrap gap-1 mt-1 ${mine ? "justify-end mr-1" : "ml-1"}`}>
                  {Object.entries(m.reactions).map(([emo, users]) => {
                    const reactedByMe = users.some((u) => u.userId === myUserId);
                    return (
                      <button
                        key={emo}
                        onClick={() => onReact(m.id, emo)}
                        className={`flex items-center gap-1 rounded-full px-1.5 py-0.5 text-xs border transition ${reactedByMe ? "bg-mint border-ink font-bold on-accent" : "bg-white border-ink/40 hover:border-ink on-accent"}`}
                        title={users.map((u) => u.username).join(", ")}
                      >
                        <span>{emo}</span>
                        <span className="text-[11px]">{users.length}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {showTimestamp && (
                <div className={`text-[10px] opacity-50 mt-1 ${mine ? "text-right mr-2" : "ml-2"}`}>
                  {new Date(m.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              )}

              {isLastMine && readers.length > 0 && <SeenBy readers={readers} />}
            </div>

            {mine && (
              <div className="w-9">
                {showHeader ? <Avatar seed={myAvatarSeed} /> : null}
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
    {showScrollDown && (
      <button
        type="button"
        onClick={jumpToBottom}
        className="absolute bottom-4 right-4 z-10 flex items-center gap-1 bg-white border-2 border-ink rounded-full px-3 py-1.5 shadow-popSm hover:bg-mint transition"
        title="Jump to latest"
        aria-label="Jump to latest message"
      >
        <span className="text-base leading-none">↓</span>
        {unseenCount > 0 && (
          <span className="text-[11px] font-bold bg-mint border border-ink rounded-full px-1.5 leading-tight">
            {unseenCount > 99 ? "99+" : unseenCount}
          </span>
        )}
      </button>
    )}
    </div>
  );
}
