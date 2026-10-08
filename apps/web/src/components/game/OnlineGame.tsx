"use client";

import { sideToMove } from "@chess/chess-core";
import { useGameSocket } from "@/hooks/useGameSocket";
import { Board } from "@/components/board/Board";
import { Clock } from "./Clock";
import { MoveList } from "./MoveList";

export function OnlineGame({ gameId }: { gameId: string }) {
  const { game, myColor, drawOfferFrom, gameOver, error, move, resign, offerDraw, respondDraw } =
    useGameSocket(gameId);

  if (error) return <p className="p-8 text-red-500">{error}</p>;
  if (!game) return <p className="p-8">Loading game…</p>;

  const orientation = myColor ?? "white";
  const top = orientation === "white" ? game.black : game.white;
  const bottom = orientation === "white" ? game.white : game.black;
  const toMove = sideToMove(game.fen);
  const active = game.status === "active";
  const last = game.moves.at(-1);
  const clockFor = (color: "white" | "black") =>
    color === "white" ? game.clock.whiteMs : game.clock.blackMs;
  const topColor = orientation === "white" ? "black" : "white";

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-4 lg:flex-row">
      <div className="flex w-full max-w-[640px] flex-col gap-2">
        <Clock
          label={`${top.name} (${top.rating})`}
          ms={clockFor(topColor)}
          running={active && toMove === topColor}
          since={game.clock.lastMoveAt}
        />
        <Board
          fen={game.fen}
          orientation={orientation}
          playerColor={myColor}
          disabled={!active || !myColor}
          lastMove={last ?? null}
          onMove={(m) => move(m).catch((e: Error) => alert(e.message))}
        />
        <Clock
          label={`${bottom.name} (${bottom.rating})`}
          ms={clockFor(orientation)}
          running={active && toMove === orientation}
          since={game.clock.lastMoveAt}
        />
      </div>

      <aside className="flex flex-1 flex-col gap-4">
        <MoveList moves={game.moves.map((m) => m.san)} />

        {gameOver && (
          <div className="rounded-md bg-neutral-100 p-4 dark:bg-neutral-800">
            <p className="text-lg font-semibold">{gameOver.result}</p>
            <p className="text-sm capitalize">{gameOver.reason.replaceAll("_", " ")}</p>
          </div>
        )}

        {active && myColor && (
          <div className="flex gap-2">
            <button className="btn" onClick={() => offerDraw()}>
              Offer draw
            </button>
            <button className="btn" onClick={() => confirm("Resign?") && resign()}>
              Resign
            </button>
          </div>
        )}

        {active && drawOfferFrom && drawOfferFrom !== myColor && (
          <div className="flex items-center gap-2">
            <span>Opponent offers a draw</span>
            <button className="btn" onClick={() => respondDraw(true)}>
              Accept
            </button>
            <button className="btn" onClick={() => respondDraw(false)}>
              Decline
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
