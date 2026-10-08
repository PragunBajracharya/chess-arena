import { randomUUID } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import {
  TIME_CONTROLS,
  type Color,
  type GameEndReason,
  type GameOverPayload,
  type GameResult,
  type GameState,
  type MoveInput,
  type MoveRecord,
  type PlayerInfo,
  type TimeControlId,
} from "@chess/shared";
import {
  START_FEN,
  applyMove,
  createClock,
  pressClock,
  remainingMs,
  resultForLoss,
  sideToMove,
  toPgn,
} from "@chess/chess-core";
import { db } from "../db/client";
import { game as gameTable, user as userTable } from "../db/schema";
import { keys, redis } from "../redis/client";
import { logger } from "../config/logger";
import { eloDelta } from "./rating.service";

const GAME_TTL_SECONDS = 60 * 60 * 6;

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

/**
 * Owns the lifecycle of live games. State is stored in Redis so any server
 * instance can serve a reconnecting player.
 *
 * Scaling notes (fine to ignore until you run more than one server process):
 *  - `withLock` is per-process. Use a Redis lock (e.g. Redlock) across nodes.
 *  - Flag timers are in-memory. Move them to a delayed job queue (BullMQ) across nodes.
 */
export class GameService {
  private locks = new Map<string, Promise<unknown>>();
  private flagTimers = new Map<string, NodeJS.Timeout>();

  constructor(private readonly onGameOver: (payload: GameOverPayload, state: GameState) => void) {}

  async create(
    white: PlayerInfo,
    black: PlayerInfo,
    timeControl: TimeControlId,
  ): Promise<GameState> {
    const tc = TIME_CONTROLS[timeControl];
    const state: GameState = {
      id: randomUUID(),
      white,
      black,
      timeControl,
      status: "active",
      fen: START_FEN,
      moves: [],
      clock: createClock(tc.initialMs, tc.incrementMs),
      drawOfferedBy: null,
      result: null,
      endReason: null,
      createdAt: Date.now(),
    };
    await this.save(state);
    await redis
      .multi()
      .set(keys.userActiveGame(white.id), state.id, "EX", GAME_TTL_SECONDS)
      .set(keys.userActiveGame(black.id), state.id, "EX", GAME_TTL_SECONDS)
      .exec();
    return state;
  }

  async get(gameId: string): Promise<GameState | null> {
    const raw = await redis.get(keys.game(gameId));
    return raw ? (JSON.parse(raw) as GameState) : null;
  }

  colorOf(state: GameState, userId: string): Color | null {
    if (state.white.id === userId) return "white";
    if (state.black.id === userId) return "black";
    return null;
  }

  async move(
    gameId: string,
    userId: string,
    move: MoveInput,
  ): Promise<Result<{ state: GameState; record: MoveRecord }>> {
    return this.withLock(gameId, async () => {
      const state = await this.get(gameId);
      if (!state || state.status !== "active") return { ok: false, error: "Game is not active" };

      const color = this.colorOf(state, userId);
      if (!color) return { ok: false, error: "You are not in this game" };
      if (sideToMove(state.fen) !== color) return { ok: false, error: "Not your turn" };

      const now = Date.now();
      const clock = pressClock(state.clock, color, now);
      if (clock.flagged) {
        state.clock = clock.clock;
        await this.end(state, resultForLoss(color), "timeout");
        return { ok: false, error: "Time out" };
      }

      const res = applyMove(
        state.fen,
        move,
        state.moves.map((m) => m.san),
      );
      if (!res.ok) return res;

      const record: MoveRecord = {
        san: res.san,
        from: move.from,
        to: move.to,
        fen: res.fen,
        timeSpentMs: clock.timeSpentMs,
        playedAt: now,
      };
      state.fen = res.fen;
      state.moves.push(record);
      state.clock = clock.clock;
      state.drawOfferedBy = null;

      if (res.outcome) {
        await this.end(state, res.outcome.result, res.outcome.reason);
      } else {
        await this.save(state);
        this.scheduleFlag(state);
      }
      return { ok: true, data: { state, record } };
    });
  }

  async resign(gameId: string, userId: string): Promise<Result<undefined>> {
    return this.withLock(gameId, async () => {
      const state = await this.get(gameId);
      const color = state && this.colorOf(state, userId);
      if (!state || !color || state.status !== "active")
        return { ok: false, error: "Cannot resign" };
      await this.end(state, resultForLoss(color), "resignation");
      return { ok: true, data: undefined };
    });
  }

  async offerDraw(gameId: string, userId: string): Promise<Result<Color>> {
    return this.withLock(gameId, async () => {
      const state = await this.get(gameId);
      const color = state && this.colorOf(state, userId);
      if (!state || !color || state.status !== "active")
        return { ok: false, error: "Cannot offer draw" };
      state.drawOfferedBy = color;
      await this.save(state);
      return { ok: true, data: color };
    });
  }

  async respondDraw(gameId: string, userId: string, accept: boolean): Promise<Result<undefined>> {
    return this.withLock(gameId, async () => {
      const state = await this.get(gameId);
      const color = state && this.colorOf(state, userId);
      if (!state || !color || !state.drawOfferedBy || state.drawOfferedBy === color) {
        return { ok: false, error: "No draw offer to respond to" };
      }
      if (accept) {
        await this.end(state, "1/2-1/2", "agreement");
      } else {
        state.drawOfferedBy = null;
        await this.save(state);
      }
      return { ok: true, data: undefined };
    });
  }

  // ---------------------------------------------------------------------------

  private async end(state: GameState, result: GameResult, reason: GameEndReason) {
    this.clearFlag(state.id);
    state.status = "finished";
    state.result = result;
    state.endReason = reason;

    const scoreWhite = result === "1-0" ? 1 : result === "0-1" ? 0 : 0.5;
    const delta = eloDelta(state.white.rating, state.black.rating, scoreWhite);

    await db.transaction(async (tx) => {
      await tx.insert(gameTable).values({
        id: state.id,
        whiteId: state.white.id,
        blackId: state.black.id,
        timeControl: state.timeControl,
        result,
        endReason: reason,
        pgn: toPgn(
          state.moves.map((m) => m.san),
          { White: state.white.name, Black: state.black.name, Result: result },
        ),
        finalFen: state.fen,
        moves: state.moves,
        whiteRatingBefore: state.white.rating,
        blackRatingBefore: state.black.rating,
        whiteRatingAfter: state.white.rating + delta.a,
        blackRatingAfter: state.black.rating + delta.b,
        startedAt: new Date(state.createdAt),
      });
      await tx
        .update(userTable)
        .set({ rating: sql`${userTable.rating} + ${delta.a}` })
        .where(eq(userTable.id, state.white.id));
      await tx
        .update(userTable)
        .set({ rating: sql`${userTable.rating} + ${delta.b}` })
        .where(eq(userTable.id, state.black.id));
    });

    // Keep the finished state briefly so reconnecting clients see the result.
    await redis
      .multi()
      .set(keys.game(state.id), JSON.stringify(state), "EX", 300)
      .del(keys.userActiveGame(state.white.id), keys.userActiveGame(state.black.id))
      .exec();

    this.onGameOver(
      { gameId: state.id, result, reason, ratingChange: { white: delta.a, black: delta.b } },
      state,
    );
  }

  private async save(state: GameState) {
    await redis.set(keys.game(state.id), JSON.stringify(state), "EX", GAME_TTL_SECONDS);
  }

  private scheduleFlag(state: GameState) {
    this.clearFlag(state.id);
    const toMove = sideToMove(state.fen);
    const ms = remainingMs(state.clock, toMove, toMove);
    const timer = setTimeout(() => {
      void this.withLock(state.id, async () => {
        const fresh = await this.get(state.id);
        if (!fresh || fresh.status !== "active" || fresh.moves.length !== state.moves.length)
          return;
        await this.end(fresh, resultForLoss(toMove), "timeout");
      }).catch((err) => logger.error({ err }, "flag timer failed"));
    }, ms + 50);
    this.flagTimers.set(state.id, timer);
  }

  private clearFlag(gameId: string) {
    clearTimeout(this.flagTimers.get(gameId));
    this.flagTimers.delete(gameId);
  }

  /** Serialises operations on one game within this process. */
  private withLock<T>(gameId: string, fn: () => Promise<T>): Promise<T> {
    const prev = this.locks.get(gameId) ?? Promise.resolve();
    const next = prev.then(fn, fn);
    this.locks.set(
      gameId,
      next.catch(() => undefined),
    );
    return next;
  }
}
