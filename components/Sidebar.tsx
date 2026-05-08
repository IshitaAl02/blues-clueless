"use client";

import { useEffect, useRef, useState } from "react";
import { Conversation, displayName, LOBBY } from "@/lib/conversations";
import { avatarUrlForUser, colorForUser } from "@/lib/avatar";
import { PawLogo } from "./Cartoons";

export default function Sidebar({
  conversations,
  activeId,
  myUserId,
  myUsername,
  myAvatarSeed,
  unreadByConv,
  onSelect,
  onNewGroup,
  onNewDM,
  onOpenProfile,
  onLogout,
}: {
  conversations: Conversation[];
  activeId: string;
  myUserId: string;
  myUsername: string;
  myAvatarSeed: string;
  unreadByConv: Record<string, number>;
  onSelect: (c: Conversation) => void;
  onNewGroup: () => void;
  onNewDM: () => void;
  onOpenProfile: () => void;
  onLogout: () => void;
}) {
  const groups = conversations.filter((c) => c.kind === "group");
  const dms = conversations.filter((c) => c.kind === "dm");

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  function ConvRow({ c }: { c: Conversation }) {
    const active = c.id === activeId;
    const label = displayName(c, myUserId);
    const seed =
      c.kind === "dm"
        ? c.members.find((m) => m.user_id !== myUserId)?.username ?? label
        : label;
    const accent =
      c.kind === "dm"
        ? colorForUser(c.members.find((m) => m.user_id !== myUserId)?.user_id ?? c.id)
        : "#3B7597";
    const unread = unreadByConv[c.id] ?? 0;

    return (
      <button
        onClick={() => onSelect(c)}
        className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-left transition ${active ? "bg-mint/60 font-bold" : "hover:bg-cloud"}`}
      >
        {c.kind === "lobby" ? (
          <PawLogo size={28} />
        ) : c.kind === "dm" ? (
          <div className="avatar-ring" style={{ width: 28, height: 28, borderColor: accent }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={avatarUrlForUser(seed)} alt="" width={28} height={28} />
          </div>
        ) : (
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-sm border-2 border-ink"
            style={{ background: "#5DF8D8" }}
          >👥</div>
        )}
        <span className="truncate flex-1">{label}</span>
        {unread > 0 && (
          <span className="min-w-[20px] h-[20px] px-1.5 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center border-2 border-ink">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>
    );
  }

  return (
    <aside className="w-64 shrink-0 glass-card flex flex-col h-full overflow-hidden">
      <div className="px-3 py-3 border-b-2 border-ink flex items-center gap-2 bg-gradient-to-br from-mint to-sky relative">
        <PawLogo size={32} />
        <div className="leading-tight flex-1 min-w-0">
          <div className="font-display text-lg truncate">Blue's Clueless</div>
          <div className="text-[10px] italic opacity-80 truncate">"We have no idea either."</div>
        </div>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((s) => !s)}
            className="btn-primary !py-1 !px-3 text-base"
            title="New chat"
            aria-label="New chat"
          >＋</button>
          {menuOpen && (
            <div className="absolute right-0 top-[calc(100%+6px)] z-30 solid-card p-1 w-44">
              <button
                className="w-full text-left px-2 py-2 rounded-md hover:bg-cloud flex items-center gap-2 text-sm font-semibold"
                onClick={() => { setMenuOpen(false); onNewGroup(); }}
              >
                <span>👥</span> New group
              </button>
              <button
                className="w-full text-left px-2 py-2 rounded-md hover:bg-cloud flex items-center gap-2 text-sm font-semibold"
                onClick={() => { setMenuOpen(false); onNewDM(); }}
              >
                <span>💌</span> New DM
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-3">
        <ConvRow c={LOBBY} />

        <div>
          <div className="px-2 mb-1">
            <span className="text-[11px] uppercase tracking-wider opacity-60 font-bold">Groups</span>
          </div>
          {groups.length === 0 && <div className="text-[11px] italic opacity-50 px-2">No groups yet.</div>}
          {groups.map((c) => <ConvRow key={c.id} c={c} />)}
        </div>

        <div>
          <div className="px-2 mb-1">
            <span className="text-[11px] uppercase tracking-wider opacity-60 font-bold">Direct messages</span>
          </div>
          {dms.length === 0 && <div className="text-[11px] italic opacity-50 px-2">No DMs yet.</div>}
          {dms.map((c) => <ConvRow key={c.id} c={c} />)}
        </div>
      </div>

      <div className="border-t-2 border-ink p-2 flex items-center gap-2">
        <button
          onClick={onOpenProfile}
          className="flex items-center gap-2 flex-1 min-w-0 px-1 py-1 rounded-lg hover:bg-cloud transition text-left"
          title="Edit your profile"
        >
          <div className="avatar-ring shrink-0" style={{ width: 32, height: 32, borderColor: colorForUser(myUserId) }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={avatarUrlForUser(myAvatarSeed)} alt="" width={32} height={32} />
          </div>
          <div className="leading-tight min-w-0">
            <div className="text-[11px] opacity-60 font-bold uppercase tracking-wider">You</div>
            <div className="text-sm font-bold truncate">{myUsername}</div>
          </div>
        </button>
        <button onClick={onLogout} className="btn-ghost !py-1 !px-2 text-xs shrink-0">Leave</button>
      </div>
    </aside>
  );
}
