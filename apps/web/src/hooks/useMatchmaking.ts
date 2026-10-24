"use client";

import { useEffect, useRef, useState } from "react";
import type { Color, TimeControlId } from "@chess/shared";
import { emitAck, getSocket } from "@/lib/socket";

type Status = "idle" | "searching" | "matched";

export function useMatchmaking(onMatched: (gameId: string, color: Color) => void) {
  const [status, setStatus] = useState<Status>("idle");
  const [timeControl, setTimeControl] = useState<TimeControlId | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const callback = useRef(onMatched);
  callback.current = onMatched;

  useEffect(() => {
    const socket = getSocket();
    const onMatch = ({ gameId, color }: { gameId: string; color: Color }) => {
      setStatus("matched");
      callback.current(gameId, color);
    };
    const onError = () => setError("Can't reach the game server. Check that it is running.");
    socket.on("queue:matched", onMatch);
    socket.on("connect_error", onError);
    return () => {
      socket.off("queue:matched", onMatch);
      socket.off("connect_error", onError);
    };
  }, []);

  // Leave the queue if the player navigates away mid-search.
  const statusRef = useRef(status);
  statusRef.current = status;
  useEffect(() => {
    return () => {
      if (statusRef.current === "searching") getSocket().emit("queue:leave", () => {});
    };
  }, []);

  return {
    status,
    timeControl,
    startedAt,
    error,
    join: async (tc: TimeControlId) => {
      setError(null);
      setTimeControl(tc);
      setStartedAt(Date.now());
      setStatus("searching");
      try {
        await emitAck((ack) => getSocket().emit("queue:join", { timeControl: tc }, ack));
      } catch (e) {
        setStatus("idle");
        setError((e as Error).message);
      }
    },
    leave: async () => {
      try {
        await emitAck((ack) => getSocket().emit("queue:leave", ack));
      } catch (e) {
        setError((e as Error).message);
        return;
      }
      // A match may have arrived while the cancel was in flight; the redirect wins.
      setStatus((s) => (s === "matched" ? s : "idle"));
      setTimeControl(null);
    },
  };
}
