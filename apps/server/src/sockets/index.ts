import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { env } from "../config/env";
import { logger } from "../config/logger";
import { createPubSub } from "../redis/client";
import { GameService } from "../services/game.service";
import { MatchmakingService } from "../services/matchmaking.service";
import { registerGameHandlers } from "./handlers/game.handler";
import { registerMatchmakingHandlers } from "./handlers/matchmaking.handler";
import { socketAuth } from "./middleware/auth";
import { rooms, type IO } from "./types";

export function createSocketServer(httpServer: HttpServer): IO {
  const { pub, sub } = createPubSub();

  const io: IO = new Server(httpServer, {
    cors: { origin: env.WEB_ORIGIN, credentials: true },
    // Lets clients that blip offline resume without missing events.
    connectionStateRecovery: { maxDisconnectionDuration: 2 * 60 * 1000 },
    adapter: createAdapter(pub, sub),
  });

  const games = new GameService((payload) => {
    io.to(rooms.game(payload.gameId)).emit("game:over", payload);
  });
  const matchmaking = new MatchmakingService();

  io.use(socketAuth);

  io.on("connection", (socket) => {
    const { user } = socket.data;
    logger.debug({ userId: user.id, socketId: socket.id }, "socket connected");
    void socket.join(rooms.user(user.id));

    registerMatchmakingHandlers(io, socket, games, matchmaking);
    registerGameHandlers(io, socket, games);
  });

  return io;
}
