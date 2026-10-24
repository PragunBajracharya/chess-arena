import type {
  ClockState,
  Color,
  GameAbortedPayload,
  GameOverPayload,
  GameState,
  MoveRecord,
} from "../types/game";
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
  /** Allowed only before the caller has made their first move. */
  "game:abort": (payload: GameIdPayload, ack: Ack) => void;
  "game:rematch-offer": (payload: GameIdPayload, ack: Ack) => void;
  "game:rematch-respond": (payload: GameIdPayload & { accept: boolean }, ack: Ack) => void;
}

export interface ServerToClientEvents {
  "queue:matched": (payload: { gameId: string; color: Color }) => void;

  "game:moved": (payload: { gameId: string; move: MoveRecord; clock: ClockState }) => void;
  "game:draw-offered": (payload: { gameId: string; by: Color }) => void;
  "game:draw-declined": (payload: { gameId: string }) => void;
  "game:over": (payload: GameOverPayload) => void;
  "game:aborted": (payload: GameAbortedPayload) => void;
  /** A player's connection dropped (with the forfeit deadline) or came back. */
  "game:opponent-connection": (payload: {
    gameId: string;
    color: Color;
    connected: boolean;
    deadline?: number;
  }) => void;
  "game:rematch-offered": (payload: { gameId: string; by: Color }) => void;
  "game:rematch-declined": (payload: { gameId: string }) => void;
  /** Both players agreed; everyone in the old game's room should open the new one. */
  "game:rematch-started": (payload: { gameId: string; newGameId: string }) => void;

  error: (payload: { message: string }) => void;
}

export type InterServerEvents = Record<string, never>;

export interface SocketData {
  user: { id: string; name: string; rating: number; image: string | null };
}
