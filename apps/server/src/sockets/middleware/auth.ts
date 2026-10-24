import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../../auth/auth";
import type { AppSocket } from "../types";

/**
 * Authenticates the socket handshake using the same Better Auth session cookie
 * as HTTP requests (client connects with `withCredentials: true`).
 */
export async function socketAuth(socket: AppSocket, next: (err?: Error) => void) {
    try {
        const session = await auth.api.getSession({
            headers: fromNodeHeaders(socket.handshake.headers),
        });
        if (!session) return next(new Error("Unauthorized"));

        socket.data.user = {
            id: session.user.id,
            name: session.user.name,
            rating: session.user.rating,
            image: session.user.image ?? null,
        };
        next();
    } catch (err) {
        next(err as Error);
    }
}
