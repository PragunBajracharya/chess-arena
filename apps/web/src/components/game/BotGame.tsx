"use client";

import { useEffect, useState } from "react";
import { Bot } from "lucide-react";
import { BOT_LEVELS, type Color, type GameOverPayload, type MoveInput } from "@chess/shared";
import { START_FEN, applyMove, sideToMove } from "@chess/chess-core";
import { useStockfish } from "@/hooks/useStockfish";
import { useSession } from "@/lib/auth-client";
import { reasonLabel } from "@/lib/format";
import { Board } from "@/components/board/Board";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { GameLayout, StatusLine } from "./GameLayout";
import { MoveList } from "./MoveList";
import { PlayerStrip } from "./PlayerStrip";

interface Played {
  san: string;
  from: string;
  to: string;
  fen: string;
}

type Outcome = Omit<GameOverPayload, "gameId">;

function resultFor(outcome: Outcome, me: Color) {
  const how = reasonLabel(outcome.reason);
  if (outcome.result === "1/2-1/2") return { text: `Draw by ${how}`, tone: "neutral" as const };
  const winner: Color = outcome.result === "1-0" ? "white" : "black";
  return winner === me
    ? { text: `You won by ${how}`, tone: "win" as const }
    : { text: `Stockfish won by ${how}`, tone: "loss" as const };
}

/** Local game vs Stockfish; no server round-trip (and unrated). */
export function BotGame() {
  const { data: session } = useSession();
  // Settings chosen in the panel; applied when a new game starts.
  const [pickLevel, setPickLevel] = useState(2);
  const [pickColor, setPickColor] = useState<Color>("white");
  // The game being played.
  const [levelIdx, setLevelIdx] = useState(2);
  const [playerColor, setPlayerColor] = useState<Color>("white");
  const [moves, setMoves] = useState<Played[]>([]);
  const [result, setResult] = useState<Outcome | null>(null);
  const level = BOT_LEVELS[levelIdx]!;
  const { ready, getBestMove } = useStockfish(level);

  const fen = moves.at(-1)?.fen ?? START_FEN;
  const botTurn = !result && sideToMove(fen) !== playerColor;
  const botColor: Color = playerColor === "white" ? "black" : "white";

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

  function startGame() {
    setLevelIdx(pickLevel);
    setPlayerColor(pickColor);
    setMoves([]);
    setResult(null);
  }

  function resign() {
    setResult({ result: playerColor === "white" ? "0-1" : "1-0", reason: "resignation" });
  }

  const outcome = result ? resultFor(result, playerColor) : null;
  const myName = session?.user.name ?? "You";

  return (
    <GameLayout
      top={
        <PlayerStrip
          name={`Stockfish, ${level.name.toLowerCase()}`}
          detail={`About ${level.approxRating}, playing ${botColor}`}
          icon={<Bot size={18} className="text-brass" aria-hidden="true" />}
          aside={
            botTurn && ready ? (
              <span className="flex items-center gap-2 text-[13px] text-muted">
                <Spinner size={12} /> Thinking
              </span>
            ) : null
          }
        />
      }
      board={
        <Board
          fen={fen}
          orientation={playerColor}
          playerColor={playerColor}
          disabled={!!result || !ready}
          lastMove={moves.at(-1) ?? null}
          onMove={play}
        />
      }
      bottom={<PlayerStrip name={myName} you={!!session} detail={`Playing ${playerColor}`} />}
      side={
        <>
          <section className="rounded-xl border border-line bg-panel">
            <div className="border-b border-line px-5 py-4">
              <p className="text-[13px] text-muted">Unrated practice game</p>
              <div className="mt-1">
                {!ready ? (
                  <StatusLine>Loading the engine</StatusLine>
                ) : outcome ? (
                  <StatusLine tone={outcome.tone}>{outcome.text}</StatusLine>
                ) : botTurn ? (
                  <StatusLine>Stockfish is thinking</StatusLine>
                ) : (
                  <StatusLine tone="accent">Your move</StatusLine>
                )}
              </div>
            </div>
            <MoveList moves={moves.map((m) => m.san)} />
            {!result && moves.length > 0 && (
              <div className="border-t border-line px-5 py-4">
                <Button size="sm" variant="secondary" onClick={resign}>
                  Resign
                </Button>
              </div>
            )}
          </section>

          <section className="rounded-xl border border-line bg-panel p-5">
            <h2 className="text-[18px] font-semibold">New game</h2>

            <fieldset className="mt-4">
              <legend className="text-[13px] text-muted">Opponent strength</legend>
              <div className="mt-2 space-y-1">
                {BOT_LEVELS.map((l, i) => (
                  <label
                    key={l.level}
                    className={`flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2 text-[14px] ${
                      pickLevel === i
                        ? "border-brass bg-brass/10"
                        : "border-transparent hover:bg-raised"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="level"
                        className="accent-brass"
                        checked={pickLevel === i}
                        onChange={() => setPickLevel(i)}
                      />
                      {l.name}
                    </span>
                    <span className="text-[13px] text-muted tabular-nums">
                      about {l.approxRating}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="mt-4">
              <legend className="text-[13px] text-muted">Play as</legend>
              <div className="mt-2 grid grid-cols-2 gap-1 rounded-lg bg-raised p-1">
                {(["white", "black"] as const).map((c) => (
                  <label
                    key={c}
                    className={`cursor-pointer rounded-md py-1.5 text-center text-[14px] capitalize ${
                      pickColor === c ? "bg-panel font-medium text-text shadow-sm" : "text-muted"
                    }`}
                  >
                    <input
                      type="radio"
                      name="color"
                      className="sr-only"
                      checked={pickColor === c}
                      onChange={() => setPickColor(c)}
                    />
                    {c}
                  </label>
                ))}
              </div>
            </fieldset>

            <Button className="mt-5 w-full" onClick={startGame}>
              Start new game
            </Button>
          </section>
        </>
      }
    />
  );
}
