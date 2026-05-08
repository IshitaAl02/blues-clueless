"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { ChatMessage, PresenceUser, ReadReceipt, ReplyRef } from "@/lib/types";
import { Conversation, channelForConversation, displayName } from "@/lib/conversations";
import {
  fetchRecentMessages,
  insertMessageDb,
  updateMessageTextDb,
  deleteMessageDb,
} from "@/lib/messages";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import Toasts, { ToastItem } from "./Toasts";
import { PawLogo } from "./Cartoons";
import { avatarUrlForUser, colorForUser } from "@/lib/avatar";

export default function ChatRoom({
  userId,
  username,
  conversation,
}: {
  userId: string;
  username: string;
  conversation: Conversation;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [online, setOnline] = useState<PresenceUser[]>([]);
  const [typing, setTyping] = useState<Record<string, number>>({});
  const [reads, setReads] = useState<Record<string, ReadReceipt>>({}); // userId -> receipt
  const [unread, setUnread] = useState(0);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [focused, setFocused] = useState(true);
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ReplyRef | null>(null);

  const convLabel = displayName(conversation, userId);

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const typingSentAt = useRef(0);
  const lastReadSentAt = useRef(0);
  const notifEnabledRef = useRef(false);

  // Track window focus
  useEffect(() => {
    const onFocus = () => setFocused(true);
    const onBlur = () => setFocused(false);
    setFocused(typeof document !== "undefined" ? document.hasFocus() : true);
    window.addEventListener("focus", onFocus);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  // Update document title with unread count
  useEffect(() => {
    const base = `${convLabel} · Blue's Clueless`;
    document.title = unread > 0 ? `(${unread}) ${base}` : base;
  }, [unread, convLabel]);

  // Reset unread when window regains focus
  useEffect(() => {
    if (focused) setUnread(0);
  }, [focused]);

  // Load notification preference from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("bc:notif");
    if (saved === "1" && typeof Notification !== "undefined" && Notification.permission === "granted") {
      setNotifEnabled(true);
    }
  }, []);

  async function toggleNotifications() {
    if (typeof Notification === "undefined") {
      alert("Your browser doesn't support notifications.");
      return;
    }
    if (notifEnabled) {
      setNotifEnabled(false);
      localStorage.setItem("bc:notif", "0");
      return;
    }
    let perm = Notification.permission;
    if (perm === "default") perm = await Notification.requestPermission();
    if (perm !== "granted") {
      alert("Notifications are blocked. Enable them in your browser's site settings, then try again.");
      return;
    }
    setNotifEnabled(true);
    localStorage.setItem("bc:notif", "1");
  }

  // Keep ref in sync so the long-lived channel handler reads current value
  useEffect(() => { notifEnabledRef.current = notifEnabled; }, [notifEnabled]);

  function fireDesktopNotif(title: string, body: string) {
    if (!notifEnabledRef.current || typeof Notification === "undefined") return;
    if (Notification.permission !== "granted") return;
    // Only fire when tab is not visible (background tab, minimized window, etc.).
    // Use visibilityState — more reliable than document.hasFocus() across browsers.
    if (typeof document !== "undefined" && document.visibilityState === "visible") return;
    try {
      const n = new Notification(title, {
        body,
        icon: "/favicon.ico",
        // No tag — let each message produce its own popup instead of replacing.
      });
      n.onclick = () => {
        window.focus();
        n.close();
      };
    } catch { /* ignore */ }
  }

  function pushToast(t: ToastItem) {
    setToasts((prev) => [...prev.slice(-2), t]); // keep max 3
  }
  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Send a "read" receipt — throttled
  const sendRead = useCallback((lastReadTs: number) => {
    const now = Date.now();
    if (now - lastReadSentAt.current < 600) return;
    lastReadSentAt.current = now;
    channelRef.current?.send({
      type: "broadcast",
      event: "read",
      payload: { userId, username, lastReadTs } as ReadReceipt,
    });
    setReads((prev) => ({ ...prev, [userId]: { userId, username, lastReadTs } }));
  }, [userId, username]);

  // Auto-mark-as-read when window focused and there are messages
  useEffect(() => {
    if (!focused || messages.length === 0) return;
    const latestTs = messages[messages.length - 1].ts;
    sendRead(latestTs);
  }, [focused, messages, sendRead]);

  // Reset local state when switching conversations + load recent persisted messages
  useEffect(() => {
    setMessages([]);
    setReads({});
    setTyping({});
    setUnread(0);
    setReplyingTo(null);
    let cancelled = false;
    fetchRecentMessages(conversation.id).then((msgs) => {
      if (!cancelled) setMessages(msgs);
    });
    return () => { cancelled = true; };
  }, [conversation.id]);

  useEffect(() => {
    const channel = supabase.channel(channelForConversation(conversation), {
      config: { presence: { key: userId }, broadcast: { self: false } },
    });

    // Attach handlers separately — chaining mixed event-type .on() calls
    // confuses the TS overloads (especially "broadcast" → "presence").
    channel.on("broadcast", { event: "message" }, ({ payload }) => {
      const msg = payload as ChatMessage;
      setMessages((prev) => [...prev, msg]);
      if (msg.userId !== userId) {
        if (!document.hasFocus()) setUnread((u) => u + 1);
        const preview =
          msg.kind === "text" ? (msg.text ?? "")
          : msg.kind === "image" ? "📷 sent an image"
          : "🎬 sent a GIF";
        const trimmed = preview.length > 80 ? preview.slice(0, 80) + "…" : preview;
        pushToast({ id: msg.id, username: msg.username, userId: msg.userId, text: trimmed });
        fireDesktopNotif(`${msg.username} • Blue's Clueless`, trimmed);
      }
    });
    channel.on("broadcast", { event: "message:edit" }, ({ payload }) => {
      const { id, text } = payload as { id: string; text: string };
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, text, edited: true } : m)));
    });
    channel.on("broadcast", { event: "message:delete" }, ({ payload }) => {
      const { id } = payload as { id: string };
      setMessages((prev) => prev.filter((m) => m.id !== id));
    });
    channel.on("broadcast", { event: "reaction" }, ({ payload }) => {
      const { messageId, emoji, userId: rUid, username: rName, action } = payload as {
        messageId: string; emoji: string; userId: string; username: string; action: "add" | "remove";
      };
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== messageId) return m;
          const reactions = { ...(m.reactions ?? {}) };
          const existing = reactions[emoji] ?? [];
          if (action === "add") {
            if (!existing.find((u) => u.userId === rUid)) {
              reactions[emoji] = [...existing, { userId: rUid, username: rName }];
            }
          } else {
            const next = existing.filter((u) => u.userId !== rUid);
            if (next.length === 0) delete reactions[emoji];
            else reactions[emoji] = next;
          }
          return { ...m, reactions };
        }),
      );
    });
    channel.on("broadcast", { event: "read" }, ({ payload }) => {
      const r = payload as ReadReceipt;
      setReads((prev) => {
        const existing = prev[r.userId];
        if (existing && existing.lastReadTs >= r.lastReadTs) return prev;
        return { ...prev, [r.userId]: r };
      });
    });
    channel.on("broadcast", { event: "typing" }, ({ payload }) => {
      const { userId: uid } = payload as { userId: string; username: string };
      setTyping((prev) => ({ ...prev, [uid]: Date.now() }));
    });
    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState<PresenceUser>();
      const users: PresenceUser[] = [];
      for (const key of Object.keys(state)) {
        const arr = state[key];
        if (arr && arr[0]) users.push(arr[0]);
      }
      setOnline(users);
    });
    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({ userId, username, online_at: new Date().toISOString() });
      }
    });

    channelRef.current = channel;
    return () => {
      channel.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [userId, username, conversation.id]);

  // Reap stale typing indicators
  useEffect(() => {
    const t = setInterval(() => {
      setTyping((prev) => {
        const cutoff = Date.now() - 3000;
        const next: Record<string, number> = {};
        for (const k of Object.keys(prev)) if (prev[k] > cutoff) next[k] = prev[k];
        return next;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const send = useCallback(
    (m: Omit<ChatMessage, "id" | "ts" | "userId" | "username">) => {
      const ch = channelRef.current;
      if (!ch) return;
      const msg: ChatMessage = {
        id: crypto.randomUUID(),
        ts: Date.now(),
        userId,
        username,
        replyTo: replyingTo ?? undefined,
        ...m,
      };
      setMessages((prev) => [...prev, msg]);
      ch.send({ type: "broadcast", event: "message", payload: msg });
      setReplyingTo(null);
      insertMessageDb(conversation.id, msg);
    },
    [userId, username, replyingTo, conversation.id],
  );

  const editMessage = useCallback(
    (id: string, text: string) => {
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, text, edited: true } : m)));
      channelRef.current?.send({
        type: "broadcast",
        event: "message:edit",
        payload: { id, text },
      });
      updateMessageTextDb(id, text);
    },
    [],
  );

  const toggleReaction = useCallback(
    (messageId: string, emoji: string) => {
      // Determine next action based on current state (optimistic)
      let action: "add" | "remove" = "add";
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== messageId) return m;
          const reactions = { ...(m.reactions ?? {}) };
          const existing = reactions[emoji] ?? [];
          const already = existing.find((u) => u.userId === userId);
          if (already) {
            action = "remove";
            const next = existing.filter((u) => u.userId !== userId);
            if (next.length === 0) delete reactions[emoji];
            else reactions[emoji] = next;
          } else {
            action = "add";
            reactions[emoji] = [...existing, { userId, username }];
          }
          return { ...m, reactions };
        }),
      );
      channelRef.current?.send({
        type: "broadcast",
        event: "reaction",
        payload: { messageId, emoji, userId, username, action },
      });
    },
    [userId, username],
  );

  const deleteMessage = useCallback((id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
    channelRef.current?.send({
      type: "broadcast",
      event: "message:delete",
      payload: { id },
    });
    deleteMessageDb(id);
  }, []);

  const onTyping = useCallback(() => {
    const now = Date.now();
    if (now - typingSentAt.current < 1500) return;
    typingSentAt.current = now;
    channelRef.current?.send({
      type: "broadcast",
      event: "typing",
      payload: { userId, username },
    });
  }, [userId, username]);

  const typingNames = Object.keys(typing)
    .filter((uid) => uid !== userId)
    .map((uid) => online.find((u) => u.userId === uid)?.username)
    .filter((x): x is string => !!x);

  return (
    <div className="glass-card flex flex-col flex-1 h-full overflow-hidden">
      <Toasts toasts={toasts} onDismiss={dismissToast} />

      <header
        className="flex items-center justify-between px-4 py-3 border-b-2 border-ink"
        style={{ background: "linear-gradient(135deg, #5DF8D8 0%, #6FD1D7 100%)" }}
      >
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0">
              {conversation.kind === "dm" ? (
                <div className="avatar-ring" style={{ width: 38, height: 38 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={avatarUrlForUser(convLabel)} alt="" width={38} height={38} />
                </div>
              ) : (
                <PawLogo size={38} />
              )}
              {unread > 0 && (
                <span
                  className="absolute -top-1 -right-1 min-w-[20px] h-[20px] px-1 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center border-2 border-ink animate-pulse"
                  aria-label={`${unread} unread`}
                >
                  {unread > 99 ? "99+" : unread}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl leading-tight truncate">{convLabel}</h1>
              <p className="text-[11px] italic opacity-80 truncate">
                {conversation.kind === "dm"
                  ? "Direct message"
                  : conversation.kind === "group"
                    ? `${conversation.members.length} members`
                    : "Public lobby — everyone's here"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex -space-x-2">
              {online.slice(0, 5).map((u) => (
                <div
                  key={u.userId}
                  className="avatar-ring"
                  style={{ width: 30, height: 30, borderColor: colorForUser(u.userId) }}
                  title={u.username}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={avatarUrlForUser(u.username)} alt={u.username} width={30} height={30} />
                </div>
              ))}
              {online.length > 5 && (
                <div className="avatar-ring flex items-center justify-center text-[10px] font-bold" style={{ width: 30, height: 30 }}>
                  +{online.length - 5}
                </div>
              )}
            </div>
            <span className="chip">🐾 {online.length}</span>
            <button
              onClick={toggleNotifications}
              className="btn-ghost !py-1 !px-3 text-sm"
              title={notifEnabled ? "Notifications on" : "Notifications off"}
              aria-label="Toggle notifications"
            >
              {notifEnabled ? "🔔" : "🔕"}
            </button>
          </div>
        </header>

        <MessageList
          messages={messages}
          myUserId={userId}
          typingUsers={typingNames}
          reads={reads}
          onlineUsers={online}
          onEdit={editMessage}
          onDelete={deleteMessage}
          onReply={setReplyingTo}
          onReact={toggleReaction}
        />
        <MessageInput
          onSend={send}
          onTyping={onTyping}
          replyingTo={replyingTo}
          onCancelReply={() => setReplyingTo(null)}
        />
    </div>
  );
}
