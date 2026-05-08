"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, ROOM } from "@/lib/supabase";
import type { ChatMessage, PresenceUser } from "@/lib/types";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import { PawLogo } from "./Cartoons";
import { avatarUrlForUser, colorForUser } from "@/lib/avatar";

export default function ChatRoom({ userId, username }: { userId: string; username: string }) {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [online, setOnline] = useState<PresenceUser[]>([]);
  const [typing, setTyping] = useState<Record<string, number>>({}); // userId -> last ts
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const typingSentAt = useRef(0);

  useEffect(() => {
    const channel = supabase.channel(ROOM, {
      config: { presence: { key: userId }, broadcast: { self: false } },
    });

    channel
      .on("broadcast", { event: "message" }, ({ payload }) => {
        setMessages((prev) => [...prev, payload as ChatMessage]);
      })
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        const { userId: uid } = payload as { userId: string; username: string };
        setTyping((prev) => ({ ...prev, [uid]: Date.now() }));
      })
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<PresenceUser>();
        const users: PresenceUser[] = [];
        for (const key of Object.keys(state)) {
          const arr = state[key];
          if (arr && arr[0]) users.push(arr[0]);
        }
        setOnline(users);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ userId, username, online_at: new Date().toISOString() });
        }
      });

    channelRef.current = channel;
    return () => {
      channel.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [userId, username]);

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
        ...m,
      };
      // Optimistic local append + broadcast to others
      setMessages((prev) => [...prev, msg]);
      ch.send({ type: "broadcast", event: "message", payload: msg });
    },
    [userId, username],
  );

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

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  const typingNames = Object.keys(typing)
    .filter((uid) => uid !== userId)
    .map((uid) => online.find((u) => u.userId === uid)?.username)
    .filter((x): x is string => !!x);

  return (
    <main className="min-h-screen flex justify-center p-3 sm:p-6">
      <div className="glass-card flex flex-col w-full max-w-3xl h-[92vh] overflow-hidden">
        <header
          className="flex items-center justify-between px-4 py-3 border-b-2 border-ink"
          style={{ background: "linear-gradient(135deg, #5DF8D8 0%, #6FD1D7 100%)" }}
        >
          <div className="flex items-center gap-3">
            <PawLogo size={42} />
            <div>
              <h1 className="text-2xl leading-tight">Blue's Clueless</h1>
              <p className="text-[11px] italic opacity-80">"We have no idea either."</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
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
            <span className="chip">🐾 {online.length} online</span>
            <button onClick={logout} className="btn-ghost !py-1 !px-3 text-sm">Leave</button>
          </div>
        </header>

        <MessageList messages={messages} myUserId={userId} typingUsers={typingNames} />
        <MessageInput onSend={send} onTyping={onTyping} />
      </div>
    </main>
  );
}
