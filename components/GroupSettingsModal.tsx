"use client";

import { useEffect, useState } from "react";
import Modal from "./Modal";
import {
  Conversation,
  ConversationMember,
  addMembers,
  listAllProfiles,
  removeMember,
  renameGroup,
} from "@/lib/conversations";
import { avatarUrlForUser, colorForUser } from "@/lib/avatar";

export default function GroupSettingsModal({
  open,
  onClose,
  conversation,
  myUserId,
  onChanged,
}: {
  open: boolean;
  onClose: () => void;
  conversation: Conversation | null;
  myUserId: string;
  onChanged: () => Promise<void> | void;
}) {
  const [name, setName] = useState("");
  const [allUsers, setAllUsers] = useState<ConversationMember[]>([]);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !conversation) return;
    setName(conversation.name ?? "");
    setPicked(new Set());
    setErr(null);
    listAllProfiles().then(setAllUsers).catch((e) => setErr(e.message));
  }, [open, conversation]);

  if (!conversation) return null;

  const memberIds = new Set(conversation.members.map((m) => m.user_id));
  const nonMembers = allUsers.filter((u) => !memberIds.has(u.user_id));

  function togglePick(id: string) {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function handleRemove(uid: string) {
    if (uid === myUserId) {
      if (!confirm("Leave this group? You'll need to be re-added to come back.")) return;
    } else {
      if (!confirm("Remove this person from the group?")) return;
    }
    setBusy(true);
    setErr(null);
    try {
      await removeMember(conversation.id, uid);
      await onChanged();
    } catch (e: any) {
      setErr(e.message ?? "Couldn't remove that user.");
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    setBusy(true);
    setErr(null);
    try {
      const nameChanged = (conversation.name ?? "") !== name.trim() && name.trim().length > 0;
      if (nameChanged) await renameGroup(conversation.id, name.trim());
      if (picked.size > 0) await addMembers(conversation.id, Array.from(picked));
      await onChanged();
      onClose();
    } catch (e: any) {
      setErr(e.message ?? "Couldn't save changes.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Group settings ⚙️">
      <label className="block text-sm font-bold mb-1">Group name</label>
      <input
        className="field mb-4"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={40}
      />

      <div className="text-sm font-bold mb-1">Members ({conversation.members.length})</div>
      <div className="max-h-48 overflow-y-auto border-2 border-ink rounded-md mb-4">
        {conversation.members.map((m) => (
          <div key={m.user_id} className="flex items-center gap-2 p-2 hover:bg-cloud">
            <div className="avatar-ring" style={{ width: 28, height: 28, borderColor: colorForUser(m.user_id) }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={avatarUrlForUser(m.username)} alt="" width={28} height={28} />
            </div>
            <span className="font-semibold flex-1 truncate">
              {m.username}{m.user_id === myUserId && " (you)"}
            </span>
            <button
              onClick={() => handleRemove(m.user_id)}
              disabled={busy}
              className="text-xs px-2 py-0.5 rounded-full border border-ink hover:bg-red-200"
              title={m.user_id === myUserId ? "Leave group" : "Remove"}
            >
              {m.user_id === myUserId ? "Leave" : "Remove"}
            </button>
          </div>
        ))}
      </div>

      <div className="text-sm font-bold mb-1">Add people</div>
      {nonMembers.length === 0 ? (
        <div className="text-xs italic opacity-60 mb-3">No one else to add.</div>
      ) : (
        <div className="max-h-44 overflow-y-auto border-2 border-ink rounded-md mb-3">
          {nonMembers.map((u) => {
            const checked = picked.has(u.user_id);
            return (
              <label
                key={u.user_id}
                className={`flex items-center gap-2 p-2 cursor-pointer ${checked ? "bg-mint/40 on-accent" : "hover:bg-cloud"}`}
              >
                <input type="checkbox" checked={checked} onChange={() => togglePick(u.user_id)} />
                <div className="avatar-ring" style={{ width: 24, height: 24, borderColor: colorForUser(u.user_id) }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={avatarUrlForUser(u.username)} alt="" width={24} height={24} />
                </div>
                <span className="font-semibold">{u.username}</span>
              </label>
            );
          })}
        </div>
      )}

      {err && <p className="text-red-600 text-sm mb-3">{err}</p>}

      <div className="flex justify-end gap-2">
        <button className="btn-ghost" onClick={onClose} disabled={busy}>Cancel</button>
        <button className="btn-primary" onClick={save} disabled={busy}>
          {busy ? "Saving..." : "Save"}
        </button>
      </div>
    </Modal>
  );
}
