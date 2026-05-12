"use client";

import { useState } from "react";
import { ChatGame, pushMove } from "@/lib/games";

const EMOJI = { r: "✊", p: "✋", s: "✌️" } as const;
type Choice = "r" | "p" | "s";

export default function RockPaperScissors({
  game,
  meIdx,
  myUserId,
  usernameOf,
}: {
  game: ChatGame;
  meIdx: 0 | 1 | -1;
  myUserId: string;
  usernameOf: (id: string) => string;
}) {
  const [busy, setBusy] = useState(false);
  const rounds = (game.state.rounds ?? []) as { p0?: Choice; p1?: Choice }[];
  const score = (game.state.score ?? [0, 0]) as [number, number];
  const myKey = meIdx === 0 ? "p0" : "p1";
  const oppKey = meIdx === 0 ? "p1" : "p0";

  const current = rounds[rounds.length - 1];
  const mySubmittedThisRound = current && current[myKey] !== undefined && current[oppKey] === undefined;

  async function submit(c: Choice) {
    if (busy || meIdx < 0 || game.status !== "active") return;
    setBusy(true);
    await pushMove(game, myUserId, { choice: c });
    setBusy(false);
  }

  const isPlayer = meIdx >= 0;
  const youName = isPlayer ? "You" : usernameOf(game.players[0]);

  return (
    <div className="text-sm">
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="text-[10px] uppercase tracking-wider opacity-60 font-bold">
            {isPlayer ? "You" : "@" + usernameOf(game.players[0])}
          </div>
          <div className="text-2xl font-bold">{isPlayer ? score[meIdx as 0 | 1] : score[0]}</div>
        </div>
        <div className="text-xs opacity-60">first to 3</div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-wider opacity-60 font-bold">
            @{usernameOf(isPlayer ? game.players[meIdx === 0 ? 1 : 0] : game.players[1])}
          </div>
          <div className="text-2xl font-bold">{isPlayer ? score[meIdx === 0 ? 1 : 0] : score[1]}</div>
        </div>
      </div>

      {/* Round history */}
      {rounds.length > 0 && (
        <div className="flex gap-1 flex-wrap mb-2">
          {rounds.map((r, i) => {
            const done = r.p0 && r.p1;
            return (
              <div key={i} className="rounded border border-ink/40 px-1.5 py-0.5 text-xs bg-white">
                {done ? (
                  <>
                    {isPlayer ? EMOJI[r[myKey]!] : EMOJI[r.p0!]}
                    <span className="opacity-50 mx-1">vs</span>
                    {isPlayer ? EMOJI[r[oppKey]!] : EMOJI[r.p1!]}
                  </>
                ) : (
                  <span className="italic opacity-50">…</span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {game.status === "active" && isPlayer && (
        <>
          <div className="flex gap-2 justify-center">
            {(["r","p","s"] as Choice[]).map((c) => (
              <button
                key={c}
                disabled={busy || !!mySubmittedThisRound}
                onClick={() => submit(c)}
                className="w-14 h-14 rounded-xl border-2 border-ink bg-white hover:bg-mint text-3xl flex items-center justify-center transition disabled:opacity-40"
                title={c === "r" ? "Rock" : c === "p" ? "Paper" : "Scissors"}
              >{EMOJI[c]}</button>
            ))}
          </div>
          {mySubmittedThisRound && (
            <div className="text-xs italic opacity-70 mt-2 text-center">
              You picked {EMOJI[current[myKey]!]}. Waiting for opponent…
            </div>
          )}
        </>
      )}
      {!isPlayer && game.status === "active" && (
        <div className="text-xs italic opacity-60 text-center">Spectating.</div>
      )}
    </div>
  );
}
