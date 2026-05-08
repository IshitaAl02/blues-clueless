"use client";

import { useEffect, useState } from "react";
import Modal from "./Modal";
import {
  ConversationMember,
  createGroup,
  findOrCreateDM,
  listAllProfiles,
} from "@/lib/conversations";
import { avatarUrlForUser, colorForUser } from "@/lib/avatar";

export function NewGroupModal({
  open,
  onClose,
  onCreated,
  myUserId,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (convId: string) => void;
  myUserId: string;
}) {
  const [name, setName] = useState("");
  const [users, setUsers] = useState<ConversationMember[]>([]);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(""); setPicked(new Set()); setErr(null);
    listAllProfiles()
      .then((list) => setUsers(list.filter((u) => u.user_id !== myUserId)))
      .catch((e) => setErr(e.message));
  }, [open, myUserId]);

  function toggle(id: string) {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function submit() {
    setErr(null);
    if (!name.trim()) { setErr("Give your group a name."); return; }
    if (picked.size === 0) { setErr("Pick at least one friend."); return; }
    setBusy(true);
    try {
      const id = await createGroup(name.trim(), Array.from(picked), myUserId);
      onCreated(id);
      onClose();
    } catch (e: any) {
      setErr(e.message ?? "Couldn't create group.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="New group 🐾">
      <label className="block text-sm font-bold mb-1">Group name</label>
      <input
        className="field mb-3"
        placeholder="Friday night chaos"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={40}
      />
      <label className="block text-sm font-bold mb-1">Add friends</label>
      <div className="max-h-56 overflow-y-auto border-2 border-ink rounded-md p-1">
        {users.length === 0 && <div className="text-sm opacity-60 p-2 italic">No other users yet.</div>}
        {users.map((u) => {
          const checked = picked.has(u.user_id);
          return (
            <label
              key={u.user_id}
              className={`flex items-center gap-2 p-1.5 rounded cursor-pointer ${checked ? "bg-mint/40" : "hover:bg-cloud"}`}
            >
              <input type="checkbox" checked={checked} onChange={() => toggle(u.user_id)} />
              <div className="avatar-ring" style={{ width: 24, height: 24, borderColor: colorForUser(u.user_id) }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={avatarUrlForUser(u.username)} alt="" width={24} height={24} />
              </div>
              <span className="font-semibold">{u.username}</span>
            </label>
          );
        })}
      </div>
      {err && <p className="text-red-600 text-sm mt-3">{err}</p>}
      <div className="flex justify-end gap-2 mt-4">
        <button className="btn-ghost" onClick={onClose} disabled={busy}>Cancel</button>
        <button className="btn-primary" onClick={submit} disabled={busy}>
          {busy ? "Creating..." : "Create"}
        </button>
      </div>
    </Modal>
  );
}

export function NewDMModal({
  open,
  onClose,
  onCreated,
  myUserId,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (convId: string) => void;
  myUserId: string;
}) {
  const [users, setUsers] = useState<ConversationMember[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    if (!open) return;
    setErr(null); setFilter("");
    listAllProfiles()
      .then((list) => setUsers(list.filter((u) => u.user_id !== myUserId)))
      .catch((e) => setErr(e.message));
  }, [open, myUserId]);

  async function start(otherId: string) {
    setBusy(true);
    setErr(null);
    try {
      const id = await findOrCreateDM(otherId, myUserId);
      onCreated(id);
      onClose();
    } catch (e: any) {
      setErr(e.message ?? "Couldn't start DM.");
    } finally {
      setBusy(false);
    }
  }

  const filtered = users.filter((u) => u.username.includes(filter.trim().toLowerCase()));

  return (
    <Modal open={open} onClose={onClose} title="New DM 💌">
      <input
        className="field mb-3"
        placeholder="Search by username..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        autoFocus
      />
      <div className="max-h-72 overflow-y-auto border-2 border-ink rounded-md">
        {filtered.length === 0 && <div className="text-sm opacity-60 p-3 italic">No matches.</div>}
        {filtered.map((u) => (
          <button
            key={u.user_id}
            disabled={busy}
            className="w-full flex items-center gap-2 p-2 hover:bg-cloud transition text-left"
            onClick={() => start(u.user_id)}
          >
            <div className="avatar-ring" style={{ width: 30, height: 30, borderColor: colorForUser(u.user_id) }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={avatarUrlForUser(u.username)} alt="" width={30} height={30} />
            </div>
            <span className="font-semibold">{u.username}</span>
          </button>
        ))}
      </div>
      {err && <p className="text-red-600 text-sm mt-3">{err}</p>}
    </Modal>
  );
}
