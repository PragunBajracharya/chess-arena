"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { BotLevel, MoveInput, PromotionPiece } from "@chess/shared";

const ENGINE_URL = "/stockfish/stockfish-19-lite-single.js";

/**
 * Runs Stockfish (WASM) in a Web Worker and talks UCI to it.
 * `getBestMove(fen)` resolves with the engine's move for the given level.
 */
export function useStockfish(level: BotLevel) {
  const worker = useRef<Worker | null>(null);
  const pending = useRef<((move: MoveInput) => void) | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const w = new Worker(ENGINE_URL);
    worker.current = w;

    w.onmessage = (e: MessageEvent<string>) => {
      const line = typeof e.data === "string" ? e.data : "";
      if (line === "uciok") setReady(true);
      if (line.startsWith("bestmove")) {
        const uci = line.split(" ")[1] ?? "";
        pending.current?.({
          from: uci.slice(0, 2),
          to: uci.slice(2, 4),
          ...(uci[4] && { promotion: uci[4] as PromotionPiece }),
        });
        pending.current = null;
      }
    };
    w.postMessage("uci");

    return () => {
      w.terminate();
      worker.current = null;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    worker.current?.postMessage(`setoption name Skill Level value ${level.skill}`);
    worker.current?.postMessage("ucinewgame");
  }, [ready, level.skill]);

  const getBestMove = useCallback(
    (fen: string) =>
      new Promise<MoveInput>((resolve) => {
        pending.current = resolve;
        worker.current?.postMessage(`position fen ${fen}`);
        worker.current?.postMessage(`go movetime ${level.movetimeMs}`);
      }),
    [level.movetimeMs],
  );

  return { ready, getBestMove };
}
