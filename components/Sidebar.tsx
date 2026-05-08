"use client";

import { Conversation, displayName, LOBBY } from "@/lib/conversations";
import { avatarUrlForUser, colorForUser } from "@/lib/avatar";
import { PawLogo } from "./Cartoons";

export default function Sidebar({
  conversations,
  activeId,
  myUserId,
  onSelect,
  onNewGroup,
  onNewDM,
  onLogout,
}: {
  conversations: Conversation[];
  activeId: string;
  myUserId: string;
  onSelect: (c: Conversation) => void;
  onNewGroup: () => void;
  onNewDM: () => void;
  onLogout: () => void;
}) {
  const groups = conversations.filter((c) => c.kind === "group");
  const dms = conversations.filter((c) => c.kind === "dm");

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
      </button>
    );
  }

  return (
    <aside className="w-64 shrink-0 glass-card flex flex-col h-full overflow-hidden">
      <div className="px-3 py-3 border-b-2 border-ink flex items-center gap-2 bg-gradient-to-br from-mint to-sky">
        <PawLogo size={32} />
        <div className="leading-tight">
          <div className="font-display text-lg">Blue's Clueless</div>
          <div className="text-[10px] italic opacity-80">"We have no idea either."</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-3">
        <ConvRow c={LOBBY} />

        <div>
          <div className="flex items-center justify-between px-2 mb-1">
            <span className="text-[11px] uppercase tracking-wider opacity-60 font-bold">Groups</span>
            <button onClick={onNewGroup} className="text-xs btn-ghost !py-0.5 !px-2" title="New group">＋</button>
          </div>
          {groups.length === 0 && <div className="text-[11px] italic opacity-50 px-2">No groups yet.</div>}
          {groups.map((c) => <ConvRow key={c.id} c={c} />)}
        </div>

        <div>
          <div className="flex items-center justify-between px-2 mb-1">
            <span className="text-[11px] uppercase tracking-wider opacity-60 font-bold">Direct messages</span>
            <button onClick={onNewDM} className="text-xs btn-ghost !py-0.5 !px-2" title="New DM">＋</button>
          </div>
          {dms.length === 0 && <div className="text-[11px] italic opacity-50 px-2">No DMs yet.</div>}
          {dms.map((c) => <ConvRow key={c.id} c={c} />)}
        </div>
      </div>

      <div className="border-t-2 border-ink p-2">
        <button onClick={onLogout} className="btn-ghost w-full !py-1 text-sm">Leave</button>
      </div>
    </aside>
  );
}
