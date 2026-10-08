import { joinQueueSchema } from "@chess/shared";
import type { GameService } from "../../services/game.service";
import type { MatchmakingService } from "../../services/matchmaking.service";
import { handler } from "../handler";
import { rooms, type AppSocket, type IO } from "../types";

export function registerMatchmakingHandlers(
  io: IO,
  socket: AppSocket,
  games: GameService,
  matchmaking: MatchmakingService,
) {
  const user = socket.data.user;

  socket.on(
    "queue:join",
    handler(joinQueueSchema, async ({ timeControl }) => {
      const match = await matchmaking.join(user, timeControl);
      if (match) {
        const game = await games.create(match.white, match.black, timeControl);
        io.to(rooms.user(match.white.id)).emit("queue:matched", {
          gameId: game.id,
          color: "white",
        });
        io.to(rooms.user(match.black.id)).emit("queue:matched", {
          gameId: game.id,
          color: "black",
        });
      }
      return { ok: true, data: undefined };
    }),
  );

  socket.on("queue:leave", async (ack) => {
    await matchmaking.leave(user.id);
    ack({ ok: true, data: undefined });
  });

  socket.on("disconnect", async () => {
    // Only drop from the queue if this was the user's last open tab.
    const sockets = await io.in(rooms.user(user.id)).fetchSockets();
    if (sockets.length === 0) await matchmaking.leave(user.id);
  });
}
