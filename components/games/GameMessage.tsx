"use client";

import { useEffect, useState } from "react";
import { abandonGame, acceptGame, ChatGame, declineGame, GAME_META, getGame, subscribeGame } from "@/lib/games";
import TicTacToe from "./TicTacToe";
import RockPaperScissors from "./RockPaperScissors";
import ConnectFour from "./ConnectFour";

export default function GameMessage({
  gameId,
  myUserId,
  usernameOf,
  onRestart,
  onNewGame,
}: {
  gameId: string;
  myUserId: string;
  usernameOf: (id: string) => string;
  onRestart?: (kind: ChatGame["kind"], opponentId: string) => void;
  onNewGame?: () => void;
}) {
  const [game, setGame] = useState<ChatGame | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getGame(gameId).then((g) => { if (!cancelled) setGame(g); });
    const unsub = subscribeGame(gameId, (g) => { if (!cancelled) setGame(g); });
    return () => { cancelled = true; unsub(); };
  }, [gameId]);

  if (!game) {
    return <div className="text-xs italic opacity-70">Loading game…</div>;
  }

  const isPlayer = game.players.includes(myUserId);
  const meIdx = game.players.indexOf(myUserId) as 0 | 1 | -1;
  const oppId = isPlayer ? game.players[meIdx === 0 ? 1 : 0] : null;
  const meta = GAME_META[game.kind];

  async function accept() {
    setBusy(true); setErr(null);
    try { await acceptGame(game!); } catch (e: any) { setErr(e.message); }
    setBusy(false);
  }
  async function decline() {
    setBusy(true); setErr(null);
    try { await declineGame(game!.id); } catch (e: any) { setErr(e.message); }
    setBusy(false);
  }
  async function abandon() {
    if (!confirm("Forfeit this game?")) return;
    setBusy(true); setErr(null);
    try { await abandonGame(game!.id); } catch (e: any) { setErr(e.message); }
    setBusy(false);
  }

  // ── Pending: opponent decides
  if (game.status === "pending") {
    const hostName = usernameOf(game.players[0]);
    const oppName = usernameOf(game.players[1]);
    const iAmOpp = myUserId === game.players[1];
    return (
      <Wrapper meta={meta} subtitle={`${hostName} ⚔ ${oppName}`}>
        {iAmOpp ? (
          <div className="flex flex-col gap-2">
            <p className="text-sm">@{hostName} challenged you to <b>{meta.name}</b>.</p>
            <div className="flex gap-2">
              <button className="btn-primary !py-1 !px-3 text-xs" disabled={busy} onClick={accept}>Accept</button>
              <button className="btn-ghost !py-1 !px-3 text-xs" disabled={busy} onClick={decline}>Decline</button>
            </div>
          </div>
        ) : (
          <p className="text-sm italic opacity-70">Waiting for @{oppName} to accept…</p>
        )}
        {err && <div className="text-xs text-red-500 mt-1">{err}</div>}
      </Wrapper>
    );
  }

  function PlayAgainBar() {
    if (!isPlayer || !onRestart || !oppId) return null;
    return (
      <div className="mt-3 pt-2 border-t border-ink/10 flex flex-wrap gap-2">
        <button
          className="btn-primary !py-1 !px-3 text-xs"
          onClick={() => onRestart(game!.kind, oppId)}
          title={`Start another ${meta.name} with @${usernameOf(oppId)}`}
        >🔁 Rematch</button>
        {onNewGame && (
          <button className="btn-ghost !py-1 !px-3 text-xs" onClick={onNewGame}>🎮 New game</button>
        )}
      </div>
    );
  }

  if (game.status === "declined") {
    return (
      <Wrapper meta={meta}>
        <p className="text-sm italic opacity-70">Challenge declined.</p>
        <PlayAgainBar />
      </Wrapper>
    );
  }
  if (game.status === "abandoned") {
    return (
      <Wrapper meta={meta}>
        <p className="text-sm italic opacity-70">Game abandoned.</p>
        <PlayAgainBar />
      </Wrapper>
    );
  }

  const myTurn = isPlayer && game.status === "active" && (game.kind === "rps" || game.turn === myUserId);

  let body: React.ReactNode = null;
  if (game.kind === "tic_tac_toe") {
    body = <TicTacToe game={game} meIdx={meIdx} myTurn={myTurn} usernameOf={usernameOf} />;
  } else if (game.kind === "rps") {
    body = <RockPaperScissors game={game} meIdx={meIdx} myUserId={myUserId} usernameOf={usernameOf} />;
  } else if (game.kind === "connect_four") {
    body = <ConnectFour game={game} meIdx={meIdx} myTurn={myTurn} usernameOf={usernameOf} />;
  }

  return (
    <Wrapper
      meta={meta}
      subtitle={`${usernameOf(game.players[0])} ⚔ ${usernameOf(game.players[1])}`}
    >
      {body}
      {game.status === "active" && isPlayer && (
        <div className="mt-2 text-right">
          <button onClick={abandon} className="text-[10px] opacity-50 hover:opacity-100 underline">forfeit</button>
        </div>
      )}
      {game.status === "won" && (
        <div className="mt-2 text-sm font-bold">
          🏆 {usernameOf(game.winner_id!) || "Winner"} wins!
        </div>
      )}
      {game.status === "draw" && (
        <div className="mt-2 text-sm font-bold opacity-80">🤝 It's a draw.</div>
      )}
      {(game.status === "won" || game.status === "draw") && <PlayAgainBar />}
    </Wrapper>
  );
}

function Wrapper({ meta, subtitle, children }: { meta: { name: string; emoji: string }; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border-2 border-ink p-3 bg-white/85 backdrop-blur min-w-[240px]">
      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-ink/20">
        <span className="text-xl leading-none">{meta.emoji}</span>
        <div className="leading-tight">
          <div className="font-display text-base">{meta.name}</div>
          {subtitle && <div className="text-[10px] italic opacity-70">{subtitle}</div>}
        </div>
      </div>
      {children}
    </div>
  );
}
