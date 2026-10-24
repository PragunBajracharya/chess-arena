"use client";

import { useEffect } from "react";
import { GAME_TIMEOUTS, type GameState, type MoveInput } from "@chess/shared";
import { emitAck, getSocket } from "@/lib/socket";
import { useSession } from "@/lib/auth-client";
import { useOnlineGameStore } from "@/stores/online-game";

/** Joins a live game room and keeps the store in sync with server events. */
export function useGameSocket(gameId: string) {
  const { data: session } = useSession();
  const store = useOnlineGameStore();
  const userId = session?.user.id;

  useEffect(() => {
    if (!userId) return;
    const socket = getSocket();
    const { set, reset } = useOnlineGameStore.getState();
    const current = () => useOnlineGameStore.getState().game;
    reset();

    const join = () =>
      emitAck<GameState>((ack) => socket.emit("game:join", { gameId }, ack))
        .then((game) => {
          const myColor =
            game.white.id === userId ? "white" : game.black.id === userId ? "black" : null;
          set({ game, myColor, drawOfferFrom: game.drawOfferedBy, error: null });
        })
        .catch((err: Error) => set({ error: err.message }));
    void join();
    // After a dropped connection the server has a new socket: rejoin the room and resync.
    socket.io.on("reconnect", join);

    socket.on("game:moved", ({ gameId: id, move, clock }) => {
      const game = current();
      if (id !== gameId || !game) return;
      const moves = [...game.moves, move];
      // Mirrors the server: after White's first move Black gets a full window; after both, none.
      const abortAt =
        moves.length === 1
          ? Date.now() + GAME_TIMEOUTS.firstMoveMs
          : moves.length === 2
            ? null
            : game.abortAt;
      set({ game: { ...game, fen: move.fen, moves, clock, abortAt }, drawOfferFrom: null });
    });
    socket.on("game:over", (payload) => {
      const game = current();
      if (payload.gameId !== gameId) return;
      set({
        gameOver: payload,
        game: game && {
          ...game,
          status: "finished",
          result: payload.result,
          endReason: payload.reason,
          abortAt: null,
          absent: {},
        },
      });
    });
    socket.on("game:aborted", (payload) => {
      const game = current();
      if (payload.gameId !== gameId) return;
      set({
        aborted: payload,
        game: game && { ...game, status: "aborted", abortAt: null, absent: {} },
      });
    });
    socket.on("game:opponent-connection", ({ gameId: id, color, connected, deadline }) => {
      const game = current();
      if (id !== gameId || !game) return;
      const absent = { ...game.absent };
      if (connected) delete absent[color];
      else if (deadline) absent[color] = deadline;
      set({ game: { ...game, absent } });
    });
    socket.on(
      "game:draw-offered",
      ({ gameId: id, by }) => id === gameId && set({ drawOfferFrom: by }),
    );
    socket.on(
      "game:draw-declined",
      ({ gameId: id }) => id === gameId && set({ drawOfferFrom: null }),
    );
    socket.on(
      "game:rematch-offered",
      ({ gameId: id }) => id === gameId && set({ rematch: { status: "offered-to-me" } }),
    );
    socket.on(
      "game:rematch-declined",
      ({ gameId: id }) => id === gameId && set({ rematch: { status: "declined" } }),
    );
    socket.on(
      "game:rematch-started",
      ({ gameId: id, newGameId }) => id === gameId && set({ rematchGameId: newGameId }),
    );

    return () => {
      socket.io.off("reconnect", join);
      for (const event of [
        "game:moved",
        "game:over",
        "game:aborted",
        "game:opponent-connection",
        "game:draw-offered",
        "game:draw-declined",
        "game:rematch-offered",
        "game:rematch-declined",
        "game:rematch-started",
      ] as const) {
        socket.off(event);
      }
    };
  }, [gameId, userId]);

  const socket = () => getSocket();
  const set = useOnlineGameStore.getState().set;
  return {
    ...store,
    move: (move: MoveInput) => emitAck((ack) => socket().emit("game:move", { gameId, move }, ack)),
    resign: () => emitAck((ack) => socket().emit("game:resign", { gameId }, ack)),
    abort: () => emitAck((ack) => socket().emit("game:abort", { gameId }, ack)),
    offerDraw: () => emitAck((ack) => socket().emit("game:offer-draw", { gameId }, ack)),
    respondDraw: (accept: boolean) =>
      emitAck((ack) => socket().emit("game:respond-draw", { gameId, accept }, ack)),
    offerRematch: () =>
      emitAck((ack) => socket().emit("game:rematch-offer", { gameId }, ack)).then(() => {
        // If the opponent had already offered, the server starts the game instead.
        if (useOnlineGameStore.getState().rematch.status !== "offered-to-me")
          set({ rematch: { status: "offered-by-me" } });
      }),
    respondRematch: (accept: boolean) =>
      emitAck((ack) => socket().emit("game:rematch-respond", { gameId, accept }, ack)).then(
        () => !accept && set({ rematch: { status: "none" } }),
      ),
  };
}
