import { Redis } from "ioredis";
import { env } from "../config/env";
import { logger } from "../config/logger";

const create = () => {
  const client = new Redis(env.REDIS_URL);
  client.on("error", (err) => logger.error({ err: err.message }, "redis error"));
  return client;
};

export const redis = create();

/** Socket.IO's Redis adapter needs its own pub/sub connections. */
export const createPubSub = () => {
  const pub = create();
  const sub = pub.duplicate();
  sub.on("error", (err) => logger.error({ err: err.message }, "redis error"));
  return { pub, sub };
};

export const keys = {
  game: (id: string) => `game:${id}`,
  queue: (timeControl: string) => `mm:queue:${timeControl}`,
  queuedAt: (timeControl: string) => `mm:queued-at:${timeControl}`,
  userActiveGame: (userId: string) => `user:${userId}:active-game`,
};
