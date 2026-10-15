import type { TimeControlId } from "../constants";

export type Color = "white" | "black";
export type PromotionPiece = "q" | "r" | "b" | "n";

export type GameStatus = "waiting" | "active" | "finished" | "aborted";
export type GameResult = "1-0" | "0-1" | "1/2-1/2";
export type GameEndReason =
  | "checkmate"
  | "resignation"
  | "timeout"
  | "stalemate"
  | "insufficient_material"
  | "threefold_repetition"
  | "fifty_move_rule"
  | "agreement"
  | "abandoned";

/** A move as sent over the wire. Squares use algebraic notation, e.g. "e2". */
export interface MoveInput {
  from: string;
  to: string;
  promotion?: PromotionPiece;
}

export interface MoveRecord {
  san: string;
  from: string;
  to: string;
  fen: string;
  /** Milliseconds the mover spent on this move. */
  timeSpentMs: number;
  playedAt: number;
}

export interface PlayerInfo {
  id: string;
  name: string;
  rating: number;
}

export interface ClockState {
  whiteMs: number;
  blackMs: number;
  /** Epoch ms when the side to move started thinking; null before the first move. */
  lastMoveAt: number | null;
  incrementMs: number;
}

/** Authoritative game state. Lives in Redis while active, Postgres once finished. */
export interface GameState {
  id: string;
  white: PlayerInfo;
  black: PlayerInfo;
  timeControl: TimeControlId;
  status: GameStatus;
  fen: string;
  moves: MoveRecord[];
  clock: ClockState;
  drawOfferedBy: Color | null;
  result: GameResult | null;
  endReason: GameEndReason | null;
  createdAt: number;
}

export interface GameOverPayload {
  gameId: string;
  result: GameResult;
  reason: GameEndReason;
  ratingChange?: { white: number; black: number };
}

/** One finished game from the current user's point of view (GET /api/games/me). */
export interface GameSummary {
  id: string;
  timeControl: TimeControlId;
  color: Color;
  outcome: "win" | "loss" | "draw";
  endReason: GameEndReason;
  opponent: { id: string; name: string };
  ratingBefore: number;
  ratingAfter: number;
  moveCount: number;
  endedAt: string;
}
