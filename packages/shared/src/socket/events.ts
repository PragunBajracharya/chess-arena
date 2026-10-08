import type { GameOverPayload, GameState, MoveRecord, ClockState, Color } from "../types/game";
import type { GameIdPayload, JoinQueuePayload, MakeMovePayload } from "../schemas/game";

/**
 * Typed Socket.IO contract. Both `apps/server` and `apps/web` import these, so
 * renaming an event or changing a payload is a compile error on both sides.
 */

export type Ack<T = undefined> = (
  response: { ok: true; data: T } | { ok: false; error: string },
) => void;

export interface ClientToServerEvents {
  "queue:join": (payload: JoinQueuePayload, ack: Ack) => void;
  "queue:leave": (ack: Ack) => void;

  "game:join": (payload: GameIdPayload, ack: Ack<GameState>) => void;
  "game:move": (payload: MakeMovePayload, ack: Ack) => void;
  "game:resign": (payload: GameIdPayload, ack: Ack) => void;
  "game:offer-draw": (payload: GameIdPayload, ack: Ack) => void;
  "game:respond-draw": (payload: GameIdPayload & { accept: boolean }, ack: Ack) => void;
}

export interface ServerToClientEvents {
  "queue:matched": (payload: { gameId: string; color: Color }) => void;

  "game:moved": (payload: { gameId: string; move: MoveRecord; clock: ClockState }) => void;
  "game:draw-offered": (payload: { gameId: string; by: Color }) => void;
  "game:draw-declined": (payload: { gameId: string }) => void;
  "game:over": (payload: GameOverPayload) => void;
  "game:opponent-connection": (payload: { gameId: string; connected: boolean }) => void;

  error: (payload: { message: string }) => void;
}

export type InterServerEvents = Record<string, never>;

export interface SocketData {
  user: { id: string; name: string; rating: number };
}
