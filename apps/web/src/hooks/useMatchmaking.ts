"use client";

import { useEffect, useState } from "react";
import type { Color, TimeControlId } from "@chess/shared";
import { emitAck, getSocket } from "@/lib/socket";

type Status = "idle" | "searching" | "matched";

export function useMatchmaking(onMatched: (gameId: string, color: Color) => void) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const socket = getSocket();
    const handler = ({ gameId, color }: { gameId: string; color: Color }) => {
      setStatus("matched");
      onMatched(gameId, color);
    };
    socket.on("queue:matched", handler);
    socket.on("connect_error", (err) => setError(err.message));
    return () => {
      socket.off("queue:matched", handler);
      socket.off("connect_error");
    };
  }, [onMatched]);

  return {
    status,
    error,
    join: async (timeControl: TimeControlId) => {
      setError(null);
      setStatus("searching");
      try {
        await emitAck((ack) => getSocket().emit("queue:join", { timeControl }, ack));
      } catch (e) {
        setStatus("idle");
        setError((e as Error).message);
      }
    },
    leave: async () => {
      await emitAck((ack) => getSocket().emit("queue:leave", ack));
      setStatus("idle");
    },
  };
}
