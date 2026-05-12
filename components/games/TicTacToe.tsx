"use client";

import { useState } from "react";
import { ChatGame, pushMove } from "@/lib/games";

const MARK = ["✕", "◯"];

export default function TicTacToe({
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
  const board: (0 | 1 | null)[] = game.state.board ?? Array(9).fill(null);

  async function play(cell: number) {
    if (!myTurn || busy || board[cell] !== null) return;
    setBusy(true);
    await pushMove(game, game.players[meIdx as 0 | 1], { cell });
    setBusy(false);
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-1 w-[180px]">
        {board.map((v, i) => (
          <button
            key={i}
            onClick={() => play(i)}
            disabled={!myTurn || v !== null || busy || game.status !== "active"}
            className={`aspect-square rounded-md border-2 border-ink flex items-center justify-center text-2xl font-bold transition ${
              v === null && myTurn && game.status === "active" ? "bg-white hover:bg-mint cursor-pointer" : "bg-white"
            } ${v === null ? "opacity-90" : ""}`}
            aria-label={`Cell ${i + 1}`}
          >
            {v === null ? "" : MARK[v]}
          </button>
        ))}
      </div>
      <div className="text-xs mt-2 opacity-80">
        {game.status === "active" ? (
          myTurn ? <b>Your turn ({MARK[meIdx as 0 | 1]})</b> : <>Waiting for @{usernameOf(game.turn || "")}…</>
        ) : null}
      </div>
    </div>
  );
}
