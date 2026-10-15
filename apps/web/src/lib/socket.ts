import { io, type Socket } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents } from "@chess/shared";
import { env } from "./env";

export type GameSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: GameSocket | null = null;

/** One shared, typed connection. The auth cookie is sent via withCredentials. */
export function getSocket(): GameSocket {
  if (!socket) {
    socket = io(env.serverUrl, { withCredentials: true, autoConnect: false });
  }
  if (!socket.connected) socket.connect();
  return socket;
}

/** Promise wrapper around emit-with-ack. */
export function emitAck<T>(
  send: (ack: (res: { ok: true; data: T } | { ok: false; error: string }) => void) => void,
): Promise<T> {
  return new Promise((resolve, reject) => {
    send((res) => (res.ok ? resolve(res.data) : reject(new Error(res.error))));
  });
}

/** Drop the connection, e.g. on sign-out, so the next user gets a fresh one. */
export function resetSocket() {
  socket?.disconnect();
  socket = null;
}
