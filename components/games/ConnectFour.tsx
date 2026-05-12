"use client";

import { useState } from "react";
import { ChatGame, pushMove } from "@/lib/games";

const COLOR = ["#ef4444", "#facc15"]; // red, yellow

export default function ConnectFour({
  game,
  meIdx,
  myTurn,
  usernameOf,
}: {
  game: ChatGame;
  meIdx: 0 | 1 | -1;
  myTurn: boolean;
  usernameOf: (id: string) => string;
}) {
  const [busy, setBusy] = useState(false);
  const board: (0 | 1 | null)[][] = game.state.board ?? [];
  const cols = board[0]?.length ?? 7;

  async function drop(col: number) {
    if (!myTurn || busy || game.status !== "active") return;
    if (board[0][col] !== null) return; // column full
    setBusy(true);
    await pushMove(game, game.players[meIdx as 0 | 1], { col });
    setBusy(false);
  }

  return (
    <div>
      <div className="inline-block rounded-lg p-1.5 bg-blue-600 border-2 border-ink">
        <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${cols}, 28px)` }}>
          {board.map((row, r) =>
            row.map((v, c) => (
              <button
                key={`${r}-${c}`}
                onClick={() => drop(c)}
                disabled={!myTurn || busy || game.status !== "active" || board[0][c] !== null}
                className="w-7 h-7 rounded-full border border-ink/40 bg-white flex items-center justify-center"
                title={`column ${c + 1}`}
              >
                {v !== null && (
                  <span
                    className="block w-5 h-5 rounded-full border border-black/30"
                    style={{ background: COLOR[v] }}
                  />
                )}
              </button>
            )),
          )}
        </div>
      </div>
      <div className="text-xs mt-2 opacity-80">
        {game.status === "active" && (
          myTurn
            ? <b>Your turn (<span style={{ color: COLOR[meIdx as 0 | 1] }}>●</span>)</b>
            : <>Waiting for @{usernameOf(game.turn || "")}…</>
        )}
      </div>
    </div>
  );
}
