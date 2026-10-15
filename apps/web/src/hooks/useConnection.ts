"use client";

import { useEffect, useState } from "react";
import { getSocket } from "@/lib/socket";

/** Whether the live game connection to the server is up. Only call when signed in. */
export function useConnection(enabled: boolean) {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    const socket = getSocket();
    const update = () => setConnected(socket.connected);
    update();
    socket.on("connect", update);
    socket.on("disconnect", update);
    return () => {
      socket.off("connect", update);
      socket.off("disconnect", update);
    };
  }, [enabled]);

  return connected;
}
