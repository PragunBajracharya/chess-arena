"use client";

import { useEffect } from "react";
import type { GameState, MoveInput } from "@chess/shared";
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
    reset();

    emitAck<GameState>((ack) => socket.emit("game:join", { gameId }, ack))
      .then((game) => {
        const myColor =
          game.white.id === userId ? "white" : game.black.id === userId ? "black" : null;
        set({ game, myColor, drawOfferFrom: game.drawOfferedBy });
      })
      .catch((err: Error) => set({ error: err.message }));

    socket.on("game:moved", ({ gameId: id, move, clock }) => {
      if (id !== gameId) return;
      const { game } = useOnlineGameStore.getState();
      if (!game) return;
      set({
        game: { ...game, fen: move.fen, moves: [...game.moves, move], clock },
        drawOfferFrom: null,
      });
    });
    socket.on("game:over", (payload) => {
      if (payload.gameId !== gameId) return;
      const { game } = useOnlineGameStore.getState();
      set({
        gameOver: payload,
        game: game && {
          ...game,
          status: "finished",
          result: payload.result,
          endReason: payload.reason,
        },
      });
    });
    socket.on(
      "game:draw-offered",
      ({ gameId: id, by }) => id === gameId && set({ drawOfferFrom: by }),
    );
    socket.on(
      "game:draw-declined",
      ({ gameId: id }) => id === gameId && set({ drawOfferFrom: null }),
    );

    return () => {
      socket.off("game:moved");
      socket.off("game:over");
      socket.off("game:draw-offered");
      socket.off("game:draw-declined");
    };
  }, [gameId, userId]);

  const socket = () => getSocket();
  return {
    ...store,
    move: (move: MoveInput) => emitAck((ack) => socket().emit("game:move", { gameId, move }, ack)),
    resign: () => emitAck((ack) => socket().emit("game:resign", { gameId }, ack)),
    offerDraw: () => emitAck((ack) => socket().emit("game:offer-draw", { gameId }, ack)),
    respondDraw: (accept: boolean) =>
      emitAck((ack) => socket().emit("game:respond-draw", { gameId, accept }, ack)),
  };
}
