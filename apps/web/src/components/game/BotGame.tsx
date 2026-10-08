"use client";

import { useEffect, useState } from "react";
import { BOT_LEVELS, type Color, type GameOverPayload, type MoveInput } from "@chess/shared";
import { START_FEN, applyMove, sideToMove } from "@chess/chess-core";
import { useStockfish } from "@/hooks/useStockfish";
import { Board } from "@/components/board/Board";
import { MoveList } from "./MoveList";

interface Played {
  san: string;
  from: string;
  to: string;
  fen: string;
}

/** Local game vs Stockfish; no server round-trip (and unrated). */
export function BotGame() {
  const [levelIdx, setLevelIdx] = useState(2);
  const [playerColor, setPlayerColor] = useState<Color>("white");
  const [moves, setMoves] = useState<Played[]>([]);
  const [result, setResult] = useState<Omit<GameOverPayload, "gameId"> | null>(null);
  const level = BOT_LEVELS[levelIdx]!;
  const { ready, getBestMove } = useStockfish(level);

  const fen = moves.at(-1)?.fen ?? START_FEN;
  const botTurn = !result && sideToMove(fen) !== playerColor;

  function play(move: MoveInput) {
    const res = applyMove(
      fen,
      move,
      moves.map((m) => m.san),
    );
    if (!res.ok) return;
    setMoves((prev) => [...prev, { san: res.san, from: move.from, to: move.to, fen: res.fen }]);
    if (res.outcome) setResult(res.outcome);
  }

  useEffect(() => {
    if (!ready || !botTurn) return;
    let cancelled = false;
    getBestMove(fen).then((m) => !cancelled && play(m));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, botTurn, fen]);

  function newGame(color: Color) {
    setPlayerColor(color);
    setMoves([]);
    setResult(null);
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-4 lg:flex-row">
      <div className="w-full max-w-[640px]">
        <Board
          fen={fen}
          orientation={playerColor}
          playerColor={playerColor}
          disabled={!!result}
          lastMove={moves.at(-1) ?? null}
          onMove={play}
        />
      </div>
      <aside className="flex flex-1 flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm text-neutral-500">Bot level</span>
          <select
            className="rounded border p-2"
            value={levelIdx}
            onChange={(e) => setLevelIdx(Number(e.target.value))}
          >
            {BOT_LEVELS.map((l, i) => (
              <option key={l.level} value={i}>
                {l.name} (~{l.approxRating})
              </option>
            ))}
          </select>
        </label>
        <div className="flex gap-2">
          <button className="btn" onClick={() => newGame("white")}>
            New game as white
          </button>
          <button className="btn" onClick={() => newGame("black")}>
            New game as black
          </button>
        </div>
        {!ready && <p className="text-sm text-neutral-500">Loading engine…</p>}
        {result && (
          <p className="text-lg font-semibold">
            {result.result} ·{" "}
            <span className="capitalize">{result.reason.replaceAll("_", " ")}</span>
          </p>
        )}
        <MoveList moves={moves.map((m) => m.san)} />
      </aside>
    </div>
  );
}
