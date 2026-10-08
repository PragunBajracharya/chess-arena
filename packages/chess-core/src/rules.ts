import { Chess, DEFAULT_POSITION } from "chess.js";
import type { Color, GameEndReason, GameResult, MoveInput } from "@chess/shared";

/**
 * Every function here is pure: FEN in, result out. No module-level state, so the
 * server can validate thousands of concurrent games with the same code the
 * browser uses for move highlighting.
 *
 * chess.js covers the full rules (castling rights, en passant, promotion,
 * checkmate/stalemate, repetition, 50-move rule, insufficient material).
 */

export const START_FEN = DEFAULT_POSITION;

export type MoveResult =
  | { ok: true; san: string; fen: string; outcome: GameOutcome | null }
  | { ok: false; error: string };

export interface GameOutcome {
  result: GameResult;
  reason: GameEndReason;
}

export function sideToMove(fen: string): Color {
  return fen.split(" ")[1] === "b" ? "black" : "white";
}

/** Validate and apply a move. Pass the full SAN history when repetition matters. */
export function applyMove(fen: string, move: MoveInput, history: string[] = []): MoveResult {
  const chess = history.length ? replay(history) : new Chess(fen);
  try {
    const played = chess.move({ from: move.from, to: move.to, promotion: move.promotion });
    return { ok: true, san: played.san, fen: chess.fen(), outcome: getOutcome(chess) };
  } catch {
    return { ok: false, error: `Illegal move ${move.from}-${move.to}` };
  }
}

export function legalTargets(fen: string, from: string): string[] {
  const chess = new Chess(fen);
  return chess
    .moves({ verbose: true })
    .filter((m) => m.from === from)
    .map((m) => m.to);
}

export function isPromotionMove(fen: string, from: string, to: string): boolean {
  const chess = new Chess(fen);
  return chess
    .moves({ verbose: true })
    .some((m) => m.from === from && m.to === to && !!m.promotion);
}

export function isInCheck(fen: string): boolean {
  return new Chess(fen).inCheck();
}

export function replay(sanMoves: string[]): Chess {
  const chess = new Chess();
  for (const san of sanMoves) chess.move(san);
  return chess;
}

export function toPgn(sanMoves: string[], headers: Record<string, string> = {}): string {
  const chess = replay(sanMoves);
  for (const [k, v] of Object.entries(headers)) chess.setHeader(k, v);
  return chess.pgn();
}

function getOutcome(chess: Chess): GameOutcome | null {
  if (chess.isCheckmate()) {
    // The side to move is the one that got mated.
    return { result: chess.turn() === "w" ? "0-1" : "1-0", reason: "checkmate" };
  }
  if (chess.isStalemate()) return { result: "1/2-1/2", reason: "stalemate" };
  if (chess.isInsufficientMaterial()) return { result: "1/2-1/2", reason: "insufficient_material" };
  if (chess.isThreefoldRepetition()) return { result: "1/2-1/2", reason: "threefold_repetition" };
  if (chess.isDraw()) return { result: "1/2-1/2", reason: "fifty_move_rule" };
  return null;
}

export function resultForLoss(loser: Color): GameResult {
  return loser === "white" ? "0-1" : "1-0";
}
