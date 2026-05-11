"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Conversation, displayName, LOBBY } from "@/lib/conversations";
import { avatarUrlForUser, colorForUser } from "@/lib/avatar";
import { getTheme, toggleTheme, type Theme } from "@/lib/theme";
import { PawLogo } from "./Cartoons";
import { ProfileMap, seedFor } from "@/lib/profilesCache";

export default function Sidebar({
  conversations,
  activeId,
  myUserId,
  myUsername,
  myAvatarSeed,
  profiles,
  unreadByConv,
  isOpen,
  onClose,
  onSelect,
  onNewGroup,
  onNewDM,
  onOpenProfile,
  onLogout,
  onOpenBg,
}: {
  conversations: Conversation[];
  activeId: string;
  myUserId: string;
  myUsername: string;
  myAvatarSeed: string;
  profiles: ProfileMap;
  unreadByConv: Record<string, number>;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (c: Conversation) => void;
  onNewGroup: () => void;
  onNewDM: () => void;
  onOpenProfile: () => void;
  onLogout: () => void;
  onOpenBg?: () => void;
}) {
  const groups = conversations.filter((c) => c.kind === "group");
  const dms = conversations.filter((c) => c.kind === "dm");

  const [menuOpen, setMenuOpen] = useState(false);
  const [footerMenuOpen, setFooterMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const footerMenuRef = useRef<HTMLDivElement>(null);
  const [theme, setThemeState] = useState<Theme>("light");
  useEffect(() => { setThemeState(getTheme()); }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
      if (footerMenuRef.current && !footerMenuRef.current.contains(e.target as Node)) {
        setFooterMenuOpen(false);
      }
    }
    if (menuOpen || footerMenuOpen) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen, footerMenuOpen]);

  function ConvRow({ c }: { c: Conversation }) {
    const active = c.id === activeId;
    const label = displayName(c, myUserId);
    const otherUser = c.members.find((m) => m.user_id !== myUserId);
    const seed =
      c.kind === "dm"
        ? (otherUser ? seedFor(profiles, otherUser.user_id, otherUser.username) : label)
        : label;
    const accent =
      c.kind === "dm"
        ? colorForUser(c.members.find((m) => m.user_id !== myUserId)?.user_id ?? c.id)
        : "#3B7597";
    const unread = unreadByConv[c.id] ?? 0;

    return (
      <button
        onClick={() => onSelect(c)}
        className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-left transition ${active ? "bg-mint font-bold on-accent" : "hover:bg-cloud"}`}
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
    <aside
      className={`
        w-72 max-w-[85vw] lg:w-64 shrink-0 glass-card flex flex-col overflow-hidden
        h-[100dvh] lg:h-full
        fixed lg:static inset-y-0 left-0 z-40
        transition-transform duration-200
        ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
    >
      <div
        className="px-3 py-3 border-b-2 border-ink flex items-center gap-2 relative on-accent"
        style={{ background: "var(--chrome-bg, linear-gradient(135deg,#5DF8D8 0%,#6FD1D7 100%))", color: "var(--chrome-text, #093C5D)" }}
      >
        <PawLogo size={32} />
        <div className="leading-tight flex-1 min-w-0">
          <div className="font-display text-lg truncate">Blue's Clueless</div>
          <div className="text-[10px] italic opacity-80 truncate">"We have no idea either."</div>
        </div>

        <button
          onClick={onClose}
          className="lg:hidden btn-ghost !py-1 !px-2 text-base"
          aria-label="Close sidebar"
          title="Close"
        >✕</button>

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
        <Link
          href="/library"
          className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-left transition bg-gradient-to-r from-sky/40 to-mint/40 hover:from-sky/60 hover:to-mint/60 border-2 border-ink on-accent font-bold"
        >
          <span className="w-7 h-7 rounded-full flex items-center justify-center text-sm border-2 border-ink bg-white">📚</span>
          <span className="truncate flex-1">My Lib</span>
        </Link>

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
        <div className="relative shrink-0" ref={footerMenuRef}>
          <button
            onClick={() => setFooterMenuOpen((s) => !s)}
            className="btn-ghost !py-1 !px-2 text-base"
            title="Options"
            aria-label="Options"
          >⋯</button>
          {footerMenuOpen && (
            <div className="absolute right-0 bottom-[calc(100%+6px)] z-30 solid-card p-1 w-48">
              {onOpenBg && (
                <button
                  className="w-full text-left px-2 py-2 rounded-md hover:bg-cloud flex items-center gap-2 text-sm font-semibold"
                  onClick={() => { setFooterMenuOpen(false); onOpenBg(); }}
                >
                  <span>🎨</span> Chat theme
                </button>
              )}
              <button
                className="w-full text-left px-2 py-2 rounded-md hover:bg-cloud flex items-center gap-2 text-sm font-semibold"
                onClick={() => { setFooterMenuOpen(false); setThemeState(toggleTheme()); }}
              >
                <span>{theme === "dark" ? "☀️" : "🌙"}</span>
                {theme === "dark" ? "Light mode" : "Dark mode"}
              </button>
              <div className="border-t-2 border-ink/10 my-1" />
              <button
                className="w-full text-left px-2 py-2 rounded-md hover:bg-red-100 flex items-center gap-2 text-sm font-semibold text-red-700"
                onClick={() => { setFooterMenuOpen(false); onLogout(); }}
              >
                <span>🚪</span> Leave
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
