import {
  MATCHMAKING,
  TIME_CONTROL_IDS,
  type Color,
  type PlayerInfo,
  type TimeControlId,
} from "@chess/shared";
import { keys, redis } from "../redis/client";

const PLAYERS_HASH = "mm:players";

export type MatchResult = { white: PlayerInfo; black: PlayerInfo } | null;

/**
 * Rating-based queue per time control, stored in Redis sorted sets
 * (score = rating). ZREM is atomic, so two servers can't claim the same opponent.
 */
export class MatchmakingService {
  async join(player: PlayerInfo, timeControl: TimeControlId): Promise<MatchResult> {
    const queue = keys.queue(timeControl);
    const queuedAt = keys.queuedAt(timeControl);

    const candidates = await redis.zrangebyscore(
      queue,
      player.rating - MATCHMAKING.maxRatingWindow,
      player.rating + MATCHMAKING.maxRatingWindow,
      "WITHSCORES",
    );

    for (let i = 0; i < candidates.length; i += 2) {
      const opponentId = candidates[i]!;
      const opponentRating = Number(candidates[i + 1]);
      if (opponentId === player.id) continue;

      // Window grows with the opponent's waiting time.
      const waitedSec =
        (Date.now() - Number((await redis.hget(queuedAt, opponentId)) ?? Date.now())) / 1000;
      const window = Math.min(
        MATCHMAKING.maxRatingWindow,
        MATCHMAKING.initialRatingWindow + waitedSec * MATCHMAKING.windowGrowthPerSecond,
      );
      if (Math.abs(opponentRating - player.rating) > window) continue;

      const claimed = await redis.zrem(queue, opponentId);
      if (claimed !== 1) continue; // someone else got them first

      const raw = await redis.hget(PLAYERS_HASH, opponentId);
      await redis.multi().hdel(PLAYERS_HASH, opponentId).hdel(queuedAt, opponentId).exec();
      if (!raw) continue;

      const opponent = JSON.parse(raw) as PlayerInfo;
      const playerColor: Color = Math.random() < 0.5 ? "white" : "black";
      return playerColor === "white"
        ? { white: player, black: opponent }
        : { white: opponent, black: player };
    }

    await redis
      .multi()
      .zadd(queue, player.rating, player.id)
      .hset(PLAYERS_HASH, player.id, JSON.stringify(player))
      .hset(queuedAt, player.id, Date.now())
      .exec();
    return null;
  }

  async leave(userId: string, timeControl?: TimeControlId) {
    const tcs = timeControl ? [timeControl] : TIME_CONTROL_IDS;
    const tx = redis.multi().hdel(PLAYERS_HASH, userId);
    for (const tc of tcs) tx.zrem(keys.queue(tc), userId).hdel(keys.queuedAt(tc), userId);
    await tx.exec();
  }
}
