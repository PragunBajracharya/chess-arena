import type { z } from "zod";
import type { Ack } from "@chess/shared";
import { logger } from "../config/logger";

/**
 * Wraps a socket handler: validates the payload with zod, catches errors and
 * always answers the ack so the client never hangs.
 */
export function handler<S extends z.ZodType, T = undefined>(
  schema: S,
  fn: (payload: z.infer<S>) => Promise<{ ok: true; data: T } | { ok: false; error: string }>,
) {
  return async (payload: unknown, ack: Ack<T>) => {
    const parsed = schema.safeParse(payload);
    if (!parsed.success) return ack({ ok: false, error: "Invalid payload" });
    try {
      ack(await fn(parsed.data));
    } catch (err) {
      logger.error({ err }, "socket handler failed");
      ack({ ok: false, error: "Server error" });
    }
  };
}
