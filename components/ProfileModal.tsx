"use client";

import { useEffect, useState } from "react";
import Modal from "./Modal";
import { avatarUrlForUser, colorForUser } from "@/lib/avatar";
import { SEED_OPTIONS, getSavedSeed, saveSeed } from "@/lib/profile";

export default function ProfileModal({
  open,
  onClose,
  username,
  userId,
}: {
  open: boolean;
  onClose: () => void;
  username: string;
  userId: string;
}) {
  // Default seed = username. Saved seed overrides if set.
  const [picked, setPicked] = useState<string>(username);

  useEffect(() => {
    if (!open) return;
    setPicked(getSavedSeed() ?? username);
  }, [open, username]);

  // Build option list: username first (default), then variety pack
  const options = [username, ...SEED_OPTIONS.map((s) => `${username}-${s}`)];

  function commit() {
    saveSeed(picked);
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Your profile 🐾">
      <div className="flex items-center gap-4 mb-5">
        <div
          className="avatar-ring"
          style={{ width: 72, height: 72, borderColor: colorForUser(userId) }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={avatarUrlForUser(picked)} alt="" width={72} height={72} />
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider opacity-60 font-bold">Username</div>
          <div className="text-2xl font-display">{username}</div>
          <div className="text-[11px] opacity-60 italic">Username can't be changed.</div>
        </div>
      </div>

      <div className="text-sm font-bold mb-2">Pick your avatar</div>
      <div className="grid grid-cols-4 gap-2 mb-4">
        {options.map((seed) => {
          const active = seed === picked;
          return (
            <button
              key={seed}
              onClick={() => setPicked(seed)}
              className={`p-1.5 rounded-xl border-2 transition ${active ? "border-ink bg-mint" : "border-ink/30 hover:border-ink"}`}
              title={`Avatar ${seed}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={avatarUrlForUser(seed)} alt="" className="w-full h-auto rounded-md" />
            </button>
          );
        })}
      </div>

      <div className="flex justify-end gap-2">
        <button className="btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn-primary" onClick={commit}>Save</button>
      </div>
    </Modal>
  );
}
