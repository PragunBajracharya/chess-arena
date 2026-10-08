import { gameIdSchema, makeMoveSchema } from "@chess/shared";
import { z } from "zod";
import type { GameService } from "../../services/game.service";
import { handler } from "../handler";
import { rooms, type AppSocket, type IO } from "../types";

export function registerGameHandlers(io: IO, socket: AppSocket, games: GameService) {
  const userId = socket.data.user.id;

  socket.on(
    "game:join",
    handler(gameIdSchema, async ({ gameId }) => {
      const state = await games.get(gameId);
      if (!state) return { ok: false, error: "Game not found" };
      await socket.join(rooms.game(gameId)); // players and spectators alike
      if (games.colorOf(state, userId)) {
        socket.to(rooms.game(gameId)).emit("game:opponent-connection", { gameId, connected: true });
      }
      return { ok: true, data: state };
    }),
  );

  socket.on(
    "game:move",
    handler(makeMoveSchema, async ({ gameId, move }) => {
      const res = await games.move(gameId, userId, move);
      if (!res.ok) return res;
      io.to(rooms.game(gameId)).emit("game:moved", {
        gameId,
        move: res.data.record,
        clock: res.data.state.clock,
      });
      return { ok: true, data: undefined };
    }),
  );

  socket.on(
    "game:resign",
    handler(gameIdSchema, ({ gameId }) => games.resign(gameId, userId)),
  );

  socket.on(
    "game:offer-draw",
    handler(gameIdSchema, async ({ gameId }) => {
      const res = await games.offerDraw(gameId, userId);
      if (!res.ok) return res;
      socket.to(rooms.game(gameId)).emit("game:draw-offered", { gameId, by: res.data });
      return { ok: true, data: undefined };
    }),
  );

  socket.on(
    "game:respond-draw",
    handler(gameIdSchema.extend({ accept: z.boolean() }), async ({ gameId, accept }) => {
      const res = await games.respondDraw(gameId, userId, accept);
      if (res.ok && !accept) socket.to(rooms.game(gameId)).emit("game:draw-declined", { gameId });
      return res;
    }),
  );
}
