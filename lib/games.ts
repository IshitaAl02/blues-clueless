import { supabase } from "./supabase";

export type GameKind = "tic_tac_toe" | "rps" | "connect_four";
export type GameStatus = "pending" | "active" | "won" | "draw" | "declined" | "abandoned";

export interface ChatGame {
  id: string;
  conversation_id: string;
  kind: GameKind;
  players: [string, string]; // [host, opponent]
  turn: string | null;
  state: any;
  status: GameStatus;
  winner_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export const GAME_META: Record<GameKind, { name: string; emoji: string; blurb: string }> = {
  tic_tac_toe:  { name: "Tic-tac-toe",       emoji: "❌⭕", blurb: "Three in a row." },
  rps:          { name: "Rock · Paper · Scissors", emoji: "✊✋✌️", blurb: "Best of 5." },
  connect_four: { name: "Connect Four",      emoji: "🔴🟡",  blurb: "Four in a row, gravity drops." },
};

// ──── Initial state per game ──────────────────────────────────────────
function initialState(kind: GameKind): any {
  switch (kind) {
    case "tic_tac_toe":
      return { board: Array(9).fill(null) as (0 | 1 | null)[] };
    case "rps":
      return { rounds: [] as { p0?: "r" | "p" | "s"; p1?: "r" | "p" | "s" }[], score: [0, 0] };
    case "connect_four":
      return {
        rows: 6,
        cols: 7,
        // 6 rows × 7 cols, top row = 0
        board: Array.from({ length: 6 }, () => Array(7).fill(null) as (0 | 1 | null)[]),
      };
  }
}

// ──── Win checks ───────────────────────────────────────────────────────
const TTT_LINES = [
  [0,1,2],[3,4,5],[6,7,8],          // rows
  [0,3,6],[1,4,7],[2,5,8],          // cols
  [0,4,8],[2,4,6],                  // diagonals
];

export function tttWinner(board: (0|1|null)[]): 0 | 1 | null {
  for (const [a, b, c] of TTT_LINES) {
    if (board[a] !== null && board[a] === board[b] && board[b] === board[c]) {
      return board[a]!;
    }
  }
  return null;
}

export function tttIsDraw(board: (0|1|null)[]): boolean {
  return board.every((c) => c !== null) && tttWinner(board) === null;
}

function rpsRoundWinner(p0: "r"|"p"|"s", p1: "r"|"p"|"s"): 0 | 1 | null {
  if (p0 === p1) return null;
  const beats: Record<string, string> = { r: "s", p: "r", s: "p" };
  return beats[p0] === p1 ? 0 : 1;
}

function c4DropRow(board: (0|1|null)[][], col: number): number {
  for (let r = board.length - 1; r >= 0; r--) {
    if (board[r][col] === null) return r;
  }
  return -1;
}

function c4WinnerAt(board: (0|1|null)[][], r: number, c: number): 0 | 1 | null {
  const v = board[r]?.[c];
  if (v === null || v === undefined) return null;
  const dirs: [number, number][] = [[0, 1], [1, 0], [1, 1], [1, -1]];
  for (const [dr, dc] of dirs) {
    let count = 1;
    for (let k = 1; k < 4; k++) {
      if (board[r + dr * k]?.[c + dc * k] === v) count++; else break;
    }
    for (let k = 1; k < 4; k++) {
      if (board[r - dr * k]?.[c - dc * k] === v) count++; else break;
    }
    if (count >= 4) return v;
  }
  return null;
}

function c4IsFull(board: (0|1|null)[][]): boolean {
  return board[0].every((c) => c !== null);
}

// ──── Public move helpers (compute next-state; caller persists) ───────
export interface MoveResult {
  state: any;
  status: GameStatus;
  winnerIdx: 0 | 1 | null;
  nextTurnIdx: 0 | 1 | null;
}

export function applyMove(game: ChatGame, playerIdx: 0 | 1, move: any): MoveResult | null {
  if (game.status !== "active") return null;
  if (game.kind === "tic_tac_toe") {
    const cell: number = move.cell;
    const board: (0|1|null)[] = [...game.state.board];
    if (cell < 0 || cell > 8 || board[cell] !== null) return null;
    board[cell] = playerIdx;
    const w = tttWinner(board);
    if (w !== null) return { state: { board }, status: "won", winnerIdx: w, nextTurnIdx: null };
    if (tttIsDraw(board)) return { state: { board }, status: "draw", winnerIdx: null, nextTurnIdx: null };
    return { state: { board }, status: "active", winnerIdx: null, nextTurnIdx: (playerIdx === 0 ? 1 : 0) };
  }
  if (game.kind === "rps") {
    const choice: "r"|"p"|"s" = move.choice;
    if (!["r","p","s"].includes(choice)) return null;
    const rounds = (game.state.rounds ?? []).map((r: any) => ({ ...r }));
    const score: [number, number] = [...(game.state.score ?? [0, 0])] as [number, number];
    let current = rounds[rounds.length - 1];
    if (!current || (current.p0 !== undefined && current.p1 !== undefined)) {
      current = {};
      rounds.push(current);
    }
    const key = playerIdx === 0 ? "p0" : "p1";
    if (current[key] !== undefined) return null; // already submitted this round
    current[key] = choice;
    let status: GameStatus = "active";
    let winnerIdx: 0 | 1 | null = null;
    if (current.p0 && current.p1) {
      const w = rpsRoundWinner(current.p0, current.p1);
      if (w === 0) score[0]++;
      if (w === 1) score[1]++;
      if (score[0] === 3) { status = "won"; winnerIdx = 0; }
      else if (score[1] === 3) { status = "won"; winnerIdx = 1; }
    }
    return { state: { rounds, score }, status, winnerIdx, nextTurnIdx: status === "active" ? (playerIdx === 0 ? 1 : 0) : null };
  }
  if (game.kind === "connect_four") {
    const col: number = move.col;
    const board: (0|1|null)[][] = game.state.board.map((row: any[]) => [...row]);
    const r = c4DropRow(board, col);
    if (r < 0) return null;
    board[r][col] = playerIdx;
    const w = c4WinnerAt(board, r, col);
    if (w !== null) return { state: { ...game.state, board }, status: "won", winnerIdx: w, nextTurnIdx: null };
    if (c4IsFull(board)) return { state: { ...game.state, board }, status: "draw", winnerIdx: null, nextTurnIdx: null };
    return { state: { ...game.state, board }, status: "active", winnerIdx: null, nextTurnIdx: (playerIdx === 0 ? 1 : 0) };
  }
  return null;
}

// ──── DB ops ───────────────────────────────────────────────────────────
export async function createGame(opts: {
  conversation_id: string;
  kind: GameKind;
  host_id: string;
  opponent_id: string;
}): Promise<ChatGame> {
  const row = {
    conversation_id: opts.conversation_id,
    kind: opts.kind,
    players: [opts.host_id, opts.opponent_id],
    turn: null,
    state: initialState(opts.kind),
    status: "pending" as GameStatus,
    created_by: opts.host_id,
  };
  const { data, error } = await supabase
    .from("chat_games")
    .insert(row)
    .select("*")
    .single();
  if (error) throw error;
  return data as ChatGame;
}

export async function getGame(id: string): Promise<ChatGame | null> {
  const { data, error } = await supabase
    .from("chat_games")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) { console.error("[games.get]", error); return null; }
  return (data as ChatGame) ?? null;
}

export async function acceptGame(game: ChatGame): Promise<void> {
  const firstTurn = game.players[Math.floor(Math.random() * 2)];
  const { error } = await supabase
    .from("chat_games")
    .update({ status: "active", turn: firstTurn, updated_at: new Date().toISOString() })
    .eq("id", game.id);
  if (error) throw error;
}

export async function declineGame(gameId: string): Promise<void> {
  const { error } = await supabase
    .from("chat_games")
    .update({ status: "declined", turn: null, updated_at: new Date().toISOString() })
    .eq("id", gameId);
  if (error) throw error;
}

export async function abandonGame(gameId: string): Promise<void> {
  const { error } = await supabase
    .from("chat_games")
    .update({ status: "abandoned", turn: null, updated_at: new Date().toISOString() })
    .eq("id", gameId);
  if (error) throw error;
}

export async function pushMove(
  game: ChatGame,
  playerId: string,
  move: any,
): Promise<ChatGame | null> {
  const playerIdx = game.players.indexOf(playerId) as 0 | 1 | -1;
  if (playerIdx < 0) return null;
  // For tic_tac_toe & connect_four, server-side turn check; for rps, both can submit any time.
  if (game.kind !== "rps" && game.turn !== playerId) return null;
  const next = applyMove(game, playerIdx as 0 | 1, move);
  if (!next) return null;
  const turn = next.nextTurnIdx === null ? null : game.players[next.nextTurnIdx];
  const winner_id = next.winnerIdx === null ? null : game.players[next.winnerIdx];
  const { data, error } = await supabase
    .from("chat_games")
    .update({
      state: next.state,
      status: next.status,
      turn,
      winner_id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", game.id)
    .select("*")
    .single();
  if (error) { console.error("[games.move]", error); return null; }
  return data as ChatGame;
}

// Subscribe to one game's updates via Supabase Realtime.
export function subscribeGame(gameId: string, cb: (g: ChatGame) => void) {
  const channel = supabase
    .channel(`game:${gameId}`)
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "chat_games", filter: `id=eq.${gameId}` },
      (payload) => cb(payload.new as ChatGame),
    )
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}
