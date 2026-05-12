"use client";

import { useEffect, useState } from "react";
import Modal from "../Modal";
import { Conversation } from "@/lib/conversations";
import { GAME_META, GameKind } from "@/lib/games";

export default function GamePicker({
  open,
  conversation,
  myUserId,
  onClose,
  onStart,
}: {
  open: boolean;
  conversation: Conversation | null;
  myUserId: string;
  onClose: () => void;
  onStart: (kind: GameKind, opponentId: string) => Promise<void>;
}) {
  const [kind, setKind] = useState<GameKind>("tic_tac_toe");
  const [opponentId, setOpponentId] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const others = (conversation?.members ?? []).filter((m) => m.user_id !== myUserId);

  useEffect(() => {
    if (!open) return;
    setKind("tic_tac_toe");
    setErr(null);
    setOpponentId(others[0]?.user_id ?? "");
  }, [open, conversation?.id]);

  async function start() {
    if (!opponentId) { setErr("Pick an opponent."); return; }
    setBusy(true); setErr(null);
    try {
      await onStart(kind, opponentId);
      onClose();
    } catch (e: any) {
      setErr(e.message ?? "Couldn't start game.");
    }
    setBusy(false);
  }

  const canPlay = conversation && (conversation.kind === "dm" || conversation.kind === "group");

  return (
    <Modal open={open} onClose={onClose} title="Start a game 🎮">
      {!canPlay ? (
        <p className="text-sm opacity-70">Games can only be played inside a DM or group chat, not the lobby.</p>
      ) : others.length === 0 ? (
        <p className="text-sm opacity-70">You need at least one other person in this chat to start a game.</p>
      ) : (
        <>
          <div className="text-[11px] uppercase tracking-wider opacity-60 font-bold mb-2">Pick a game</div>
          <div className="grid grid-cols-1 gap-2 mb-4">
            {(Object.entries(GAME_META) as [GameKind, typeof GAME_META[GameKind]][]).map(([k, meta]) => (
              <button
                key={k}
                type="button"
                onClick={() => setKind(k)}
                className={`flex items-center gap-3 p-3 rounded-xl border-2 transition text-left ${
                  kind === k ? "border-ink bg-mint shadow-popSm" : "border-ink/40 bg-white hover:border-ink"
                }`}
              >
                <span className="text-2xl">{meta.emoji}</span>
                <div className="flex-1 leading-tight">
                  <div className="font-display text-base">{meta.name}</div>
                  <div className="text-[11px] italic opacity-70">{meta.blurb}</div>
                </div>
              </button>
            ))}
          </div>

          <div className="text-[11px] uppercase tracking-wider opacity-60 font-bold mb-2">Opponent</div>
          <select
            className="field w-full mb-3"
            value={opponentId}
            onChange={(e) => setOpponentId(e.target.value)}
          >
            {others.map((m) => (
              <option key={m.user_id} value={m.user_id}>@{m.username}</option>
            ))}
          </select>

          {err && <div className="text-xs text-red-500 mb-2">{err}</div>}
          <div className="flex justify-end gap-2">
            <button className="btn-ghost !py-1.5 !px-3 text-sm" onClick={onClose} disabled={busy}>Cancel</button>
            <button className="btn-primary !py-1.5 !px-4 text-sm" onClick={start} disabled={busy || !opponentId}>
              {busy ? "Starting…" : "Challenge"}
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}
