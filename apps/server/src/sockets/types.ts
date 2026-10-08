import type { Server, Socket } from "socket.io";
import type {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData,
} from "@chess/shared";

export type IO = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
export type AppSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

export const rooms = {
  user: (userId: string) => `user:${userId}`,
  game: (gameId: string) => `game:${gameId}`,
};
