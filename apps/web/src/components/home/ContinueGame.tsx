"use client";

import Link from "next/link";
import type { Color, GameState } from "@chess/shared";
import { sideToMove } from "@chess/chess-core";
import { Board } from "@/components/board/Board";
import { Clock } from "@/components/game/Clock";
import { buttonClass } from "@/components/ui/Button";
import { clockLabel } from "@/lib/format";

function ClockRow({
  label,
  ms,
  running,
  since,
}: {
  label: string;
  ms: number;
  running: boolean;
  since: number | null;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="truncate text-[14px] text-muted">{label}</span>
      <Clock ms={ms} running={running} since={since} />
    </div>
  );
}

export function ContinueGame({ game, userId }: { game: GameState; userId: string }) {
  const myColor: Color = game.white.id === userId ? "white" : "black";
  const theirColor: Color = myColor === "white" ? "black" : "white";
  const opponent = myColor === "white" ? game.black : game.white;
  const myTurn = sideToMove(game.fen) === myColor;
  const ms = (c: Color) => (c === "white" ? game.clock.whiteMs : game.clock.blackMs);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium">vs {opponent.name}</p>
          <p className="text-[13px] text-muted tabular-nums">
            Rated {opponent.rating}, {clockLabel(game.timeControl)}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-[13px] font-medium ${
            myTurn ? "bg-brass/15 text-brass" : "bg-raised text-muted"
          }`}
        >
          {myTurn ? "Your move" : "Their move"}
        </span>
      </div>

      <Board
        fen={game.fen}
        orientation={myColor}
        lastMove={game.moves.at(-1) ?? null}
        interactive={false}
        className="mx-auto max-w-[260px]"
      />

      <div className="space-y-2">
        <ClockRow
          label={opponent.name}
          ms={ms(theirColor)}
          running={!myTurn}
          since={game.clock.lastMoveAt}
        />
        <ClockRow label="You" ms={ms(myColor)} running={myTurn} since={game.clock.lastMoveAt} />
      </div>

      <Link href={`/game/${game.id}`} className={buttonClass("primary", "md", "w-full")}>
        Resume game
      </Link>
    </div>
  );
}
