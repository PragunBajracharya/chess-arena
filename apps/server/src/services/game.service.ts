import { randomUUID } from "node:crypto";
import { eq, inArray, sql } from "drizzle-orm";
import {
  GAME_TIMEOUTS,
  TIME_CONTROLS,
  type AbortReason,
  type Color,
  type GameAbortedPayload,
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
/** Finished and aborted games stay readable this long, which is also the rematch window. */
const ENDED_TTL_SECONDS = GAME_TIMEOUTS.rematchMs / 1000;

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

export interface GameEvents {
  over: (payload: GameOverPayload, state: GameState) => void;
  aborted: (payload: GameAbortedPayload, state: GameState) => void;
}

export type RematchOutcome =
  { kind: "offered"; by: Color } | { kind: "declined" } | { kind: "started"; newGameId: string };

const other = (c: Color): Color => (c === "white" ? "black" : "white");

/** Has this colour made its first move yet? White moves first, so Black's is move 2. */
const hasMoved = (state: GameState, color: Color) =>
  state.moves.length >= (color === "white" ? 1 : 2);

/**
 * Owns the lifecycle of live games. State is stored in Redis so any server
 * instance can serve a reconnecting player.
 *
 * Scaling notes (fine to ignore until you run more than one server process):
 *  - `withLock` is per-process. Use a Redis lock (e.g. Redlock) across nodes.
 *  - Flag, abort and absence timers are in-memory. Move them to a delayed job
 *    queue (BullMQ) across nodes.
 */
export class GameService {
  private locks = new Map<string, Promise<unknown>>();
  private flagTimers = new Map<string, NodeJS.Timeout>();
  private abortTimers = new Map<string, NodeJS.Timeout>();
  /** Keyed by `${gameId}:${color}`. */
  private absenceTimers = new Map<string, NodeJS.Timeout>();

  constructor(private readonly events: GameEvents) {}

  async create(
    white: PlayerInfo,
    black: PlayerInfo,
    timeControl: TimeControlId,
  ): Promise<GameState> {
    const tc = TIME_CONTROLS[timeControl];
    const now = Date.now();
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
      createdAt: now,
      abortAt: now + GAME_TIMEOUTS.firstMoveMs,
      absent: {},
    };
    await this.save(state);
    await redis
      .multi()
      .set(keys.userActiveGame(white.id), state.id, "EX", GAME_TTL_SECONDS)
      .set(keys.userActiveGame(black.id), state.id, "EX", GAME_TTL_SECONDS)
      .exec();
    this.scheduleAbort(state);
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

      // White has moved: Black now gets the same window. Both have moved: no more abort.
      if (state.moves.length === 1) state.abortAt = now + GAME_TIMEOUTS.firstMoveMs;
      if (state.moves.length === 2) state.abortAt = null;

      if (res.outcome) {
        await this.end(state, res.outcome.result, res.outcome.reason);
      } else {
        await this.save(state);
        this.scheduleFlag(state);
        this.scheduleAbort(state);
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

  /** A player calls the game off before making their first move. Nobody is rated. */
  async abort(gameId: string, userId: string): Promise<Result<undefined>> {
    return this.withLock(gameId, async () => {
      const state = await this.get(gameId);
      const color = state && this.colorOf(state, userId);
      if (!state || !color || state.status !== "active")
        return { ok: false, error: "Cannot abort" };
      if (hasMoved(state, color))
        return { ok: false, error: "You can only abort before your first move" };
      await this.doAbort(state, "player_aborted", color);
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

  // --- Presence ----------------------------------------------------------------

  /**
   * The user's last connection dropped. If they are in a live game, start their
   * forfeit timer and return what to tell the room.
   */
  async playerLeft(
    userId: string,
  ): Promise<{ gameId: string; color: Color; deadline: number } | null> {
    const gameId = await redis.get(keys.userActiveGame(userId));
    if (!gameId) return null;
    return this.withLock(gameId, async () => {
      const state = await this.get(gameId);
      const color = state && this.colorOf(state, userId);
      if (!state || !color || state.status !== "active") return null;

      const deadline = Date.now() + GAME_TIMEOUTS.reconnectMs;
      state.absent = { ...state.absent, [color]: deadline };
      await this.save(state);

      const key = `${gameId}:${color}`;
      clearTimeout(this.absenceTimers.get(key));
      this.absenceTimers.set(
        key,
        setTimeout(() => {
          this.absenceTimers.delete(key);
          void this.withLock(gameId, async () => {
            const fresh = await this.get(gameId);
            if (!fresh || fresh.status !== "active" || !fresh.absent?.[color]) return;
            // Leaving before your first move aborts; leaving later loses the game.
            if (!hasMoved(fresh, color)) await this.doAbort(fresh, "player_left", color);
            else await this.end(fresh, resultForLoss(color), "abandoned");
          }).catch((err) => logger.error({ err }, "absence timer failed"));
        }, GAME_TIMEOUTS.reconnectMs),
      );
      return { gameId, color, deadline };
    });
  }

  /** The user connected again. Cancels their forfeit timer if one was running. */
  async playerReturned(userId: string): Promise<{ gameId: string; color: Color } | null> {
    const gameId = await redis.get(keys.userActiveGame(userId));
    if (!gameId) return null;
    return this.withLock(gameId, async () => {
      const state = await this.get(gameId);
      const color = state && this.colorOf(state, userId);
      if (!state || !color || state.status !== "active" || !state.absent?.[color]) return null;
      const absent = { ...state.absent };
      delete absent[color];
      state.absent = absent;
      await this.save(state);
      this.clearAbsence(gameId, color);
      return { gameId, color };
    });
  }

  // --- Rematch -----------------------------------------------------------------

  /** Offer a rematch. If the opponent already offered one, this accepts it. */
  async offerRematch(gameId: string, userId: string): Promise<Result<RematchOutcome>> {
    return this.withLock(gameId, async () => {
      const state = await this.get(gameId);
      const color = state && this.colorOf(state, userId);
      if (!state || !color || state.status !== "finished")
        return { ok: false, error: "A rematch is no longer available for this game" };

      const offeredBy = (await redis.get(keys.rematch(gameId))) as Color | null;
      if (offeredBy === other(color)) return this.startRematch(state);
      await redis.set(keys.rematch(gameId), color, "EX", ENDED_TTL_SECONDS);
      return { ok: true, data: { kind: "offered", by: color } };
    });
  }

  async respondRematch(
    gameId: string,
    userId: string,
    accept: boolean,
  ): Promise<Result<RematchOutcome>> {
    return this.withLock(gameId, async () => {
      const state = await this.get(gameId);
      const color = state && this.colorOf(state, userId);
      const offeredBy = (await redis.get(keys.rematch(gameId))) as Color | null;
      if (!state || !color || offeredBy !== (color && other(color)))
        return { ok: false, error: "There is no rematch offer to answer" };
      if (!accept) {
        await redis.del(keys.rematch(gameId));
        return { ok: true, data: { kind: "declined" } };
      }
      return this.startRematch(state);
    });
  }

  private async startRematch(state: GameState): Promise<Result<RematchOutcome>> {
    const [busyWhite, busyBlack] = await redis.mget(
      keys.userActiveGame(state.white.id),
      keys.userActiveGame(state.black.id),
    );
    if (busyWhite || busyBlack)
      return { ok: false, error: "One of the players is already in another game" };

    // Ratings changed when the last game ended, so read them fresh.
    const rows = await db
      .select({ id: userTable.id, rating: userTable.rating })
      .from(userTable)
      .where(inArray(userTable.id, [state.white.id, state.black.id]));
    const rating = new Map(rows.map((r) => [r.id, r.rating]));
    const withRating = (p: PlayerInfo): PlayerInfo => ({
      ...p,
      rating: rating.get(p.id) ?? p.rating,
    });

    // Colours swap: last game's Black plays White.
    const next = await this.create(
      withRating(state.black),
      withRating(state.white),
      state.timeControl,
    );
    await redis.del(keys.rematch(state.id));
    return { ok: true, data: { kind: "started", newGameId: next.id } };
  }

  // -----------------------------------------------------------------------------

  private async end(state: GameState, result: GameResult, reason: GameEndReason) {
    this.clearTimers(state.id);
    state.status = "finished";
    state.result = result;
    state.endReason = reason;
    state.abortAt = null;
    state.absent = {};

    const scoreWhite = result === "1-0" ? 1 : result === "0-1" ? 0 : 0.5;
    const delta = eloDelta(state.white.rating, state.black.rating, scoreWhite);
    const tc = TIME_CONTROLS[state.timeControl];
    const started = new Date(state.createdAt);

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
          {
            Event: "Rated game",
            Site: "Chess Arena",
            Date: started.toISOString().slice(0, 10).replaceAll("-", "."),
            White: state.white.name,
            Black: state.black.name,
            Result: result,
            WhiteElo: String(state.white.rating),
            BlackElo: String(state.black.rating),
            TimeControl: `${tc.initialMs / 1000}+${tc.incrementMs / 1000}`,
            Termination:
              reason === "timeout"
                ? "time forfeit"
                : reason === "abandoned"
                  ? "abandoned"
                  : "normal",
          },
        ),
        finalFen: state.fen,
        moves: state.moves,
        whiteRatingBefore: state.white.rating,
        blackRatingBefore: state.black.rating,
        whiteRatingAfter: state.white.rating + delta.a,
        blackRatingAfter: state.black.rating + delta.b,
        startedAt: started,
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

    // Keep the finished state for the rematch window so clients can still load it.
    await redis
      .multi()
      .set(keys.game(state.id), JSON.stringify(state), "EX", ENDED_TTL_SECONDS)
      .del(keys.userActiveGame(state.white.id), keys.userActiveGame(state.black.id))
      .exec();

    this.events.over(
      { gameId: state.id, result, reason, ratingChange: { white: delta.a, black: delta.b } },
      state,
    );
  }

  /** Calls a game off: no result, no rating change, nothing written to Postgres. */
  private async doAbort(state: GameState, reason: AbortReason, by: Color | null) {
    this.clearTimers(state.id);
    state.status = "aborted";
    state.abortAt = null;
    state.absent = {};
    await redis
      .multi()
      .set(keys.game(state.id), JSON.stringify(state), "EX", ENDED_TTL_SECONDS)
      .del(keys.userActiveGame(state.white.id), keys.userActiveGame(state.black.id))
      .exec();
    this.events.aborted({ gameId: state.id, reason, by }, state);
  }

  private async save(state: GameState) {
    await redis.set(keys.game(state.id), JSON.stringify(state), "EX", GAME_TTL_SECONDS);
  }

  private scheduleFlag(state: GameState) {
    this.clearTimer(this.flagTimers, state.id);
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

  /** Aborts the game if the side to move still hasn't played when `abortAt` passes. */
  private scheduleAbort(state: GameState) {
    this.clearTimer(this.abortTimers, state.id);
    if (!state.abortAt) return;
    const movesAtSchedule = state.moves.length;
    const timer = setTimeout(
      () => {
        this.abortTimers.delete(state.id);
        void this.withLock(state.id, async () => {
          const fresh = await this.get(state.id);
          if (!fresh || fresh.status !== "active" || fresh.moves.length !== movesAtSchedule) return;
          await this.doAbort(fresh, "no_first_move", sideToMove(fresh.fen));
        }).catch((err) => logger.error({ err }, "abort timer failed"));
      },
      Math.max(0, state.abortAt - Date.now()),
    );
    this.abortTimers.set(state.id, timer);
  }

  private clearAbsence(gameId: string, color: Color) {
    this.clearTimer(this.absenceTimers, `${gameId}:${color}`);
  }

  private clearTimers(gameId: string) {
    this.clearTimer(this.flagTimers, gameId);
    this.clearTimer(this.abortTimers, gameId);
    this.clearAbsence(gameId, "white");
    this.clearAbsence(gameId, "black");
  }

  private clearTimer(map: Map<string, NodeJS.Timeout>, key: string) {
    clearTimeout(map.get(key));
    map.delete(key);
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
