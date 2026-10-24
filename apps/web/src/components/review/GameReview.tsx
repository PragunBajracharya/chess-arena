"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  Download,
  Repeat2,
} from "lucide-react";
import type { Color, GameRecord } from "@chess/shared";
import { START_FEN } from "@chess/chess-core";
import { apiGet } from "@/lib/api";
import { useSession } from "@/lib/auth-client";
import { category, clockLabel, reasonLabel } from "@/lib/format";
import { playSound, soundFor } from "@/lib/sounds";
import { Board } from "@/components/board/Board";
import { Button, buttonClass } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { RatingDelta } from "@/components/ui/ResultChip";
import { GameLayout, StatusLine } from "@/components/game/GameLayout";
import { MoveList } from "@/components/game/MoveList";
import { PlayerStrip } from "@/components/game/PlayerStrip";
import { SoundToggle } from "@/components/game/SoundToggle";

const other = (c: Color): Color => (c === "white" ? "black" : "white");

/** "Alice-vs-Bob-2026-10-22.pgn", safe for any file system. */
function pgnFileName(g: GameRecord) {
  const safe = (s: string) =>
    s.replace(/[^\p{L}\p{N}_-]+/gu, "_").replace(/^_+|_+$/g, "") || "player";
  return `${safe(g.white.name)}-vs-${safe(g.black.name)}-${g.endedAt.slice(0, 10)}.pgn`;
}

function downloadPgn(g: GameRecord) {
  const url = URL.createObjectURL(new Blob([g.pgn], { type: "application/x-chess-pgn" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = pgnFileName(g);
  document.body.append(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function resultLine(g: GameRecord, me: Color | null) {
  const how = reasonLabel(g.endReason);
  if (g.result === "1/2-1/2") return { text: `Draw by ${how}`, tone: "neutral" as const };
  const winner: Color = g.result === "1-0" ? "white" : "black";
  if (!me) return { text: `${g[winner].name} won by ${how}`, tone: "neutral" as const };
  return winner === me
    ? { text: `You won by ${how}`, tone: "win" as const }
    : { text: `You lost by ${how}`, tone: "loss" as const };
}

export function GameReview({ gameId }: { gameId: string }) {
  const { data: session } = useSession();
  const {
    data: game,
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: ["games", gameId],
    queryFn: () => apiGet<GameRecord>(`/api/games/${gameId}`),
    retry: (count, err) => !err.message.includes("404") && count < 2,
  });
  // -1 is the start position; moves.length - 1 the final one.
  const [ply, setPly] = useState<number | null>(null);
  const [flipped, setFlipped] = useState(false);

  const total = game?.moves.length ?? 0;
  const current = ply ?? total - 1;

  const goTo = useCallback(
    (next: number, sound = true) => {
      if (!game) return;
      const target = Math.max(-1, Math.min(total - 1, next));
      // Only a single step forward makes a sound, like replaying the move.
      if (sound && target === current + 1 && target >= 0)
        playSound(soundFor(game.moves[target]!.san));
      setPly(target);
    },
    [game, total, current],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t?.closest("input, textarea, select, [contenteditable]")) return;
      const keys: Record<string, () => void> = {
        ArrowLeft: () => goTo(current - 1),
        ArrowRight: () => goTo(current + 1),
        Home: () => goTo(-1),
        End: () => goTo(total - 1, false),
        f: () => setFlipped((f) => !f),
      };
      const action = keys[e.key];
      if (!action || e.metaKey || e.ctrlKey || e.altKey) return;
      e.preventDefault();
      action();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goTo, current, total]);

  if (isPending) {
    return (
      <div className="flex justify-center py-24 text-muted">
        <Spinner size={20} />
      </div>
    );
  }
  if (isError) {
    const missing = error.message.includes("404");
    return (
      <div className="py-16 text-center">
        <p className="font-medium">{missing ? "No saved game here" : "Couldn't load this game"}</p>
        <p className="mt-1 text-[13px] text-muted">
          {missing
            ? "Only finished, rated games are saved. Aborted games aren't kept."
            : "Check that the server is running, then try again."}
        </p>
        <Link href="/history" className={buttonClass("secondary", "md", "mt-6")}>
          Game history
        </Link>
      </div>
    );
  }

  const myColor: Color | null =
    session?.user.id === game.white.id
      ? "white"
      : session?.user.id === game.black.id
        ? "black"
        : null;
  const base = myColor ?? "white";
  const orientation = flipped ? other(base) : base;
  const topColor = other(orientation);
  const fen = current >= 0 ? game.moves[current]!.fen : START_FEN;
  const lastMove = current >= 0 ? game.moves[current]! : null;
  const result = resultLine(game, myColor);
  const sans = game.moves.map((m) => m.san);
  const moveLabel =
    current < 0
      ? "Start position"
      : `${Math.floor(current / 2) + 1}${current % 2 === 0 ? "." : "..."} ${sans[current]}`;

  const strip = (c: Color, you: boolean) => {
    const p = game[c];
    return (
      <PlayerStrip
        name={p.name}
        image={p.image}
        you={you}
        detail={`${c === "white" ? "White" : "Black"}, rating ${p.ratingBefore}`}
        aside={
          <span className="flex items-center gap-2 text-[13px] tabular-nums">
            {p.ratingAfter}
            <RatingDelta before={p.ratingBefore} after={p.ratingAfter} />
          </span>
        }
      />
    );
  };

  const navButton = "h-10 flex-1 px-0";

  return (
    <GameLayout
      top={strip(topColor, topColor === myColor)}
      board={
        <Board fen={fen} orientation={orientation} disabled lastMove={lastMove} onMove={() => {}} />
      }
      bottom={strip(orientation, orientation === myColor)}
      side={
        <section className="rounded-xl border border-line bg-panel">
          <div className="border-b border-line px-5 py-4">
            <div className="flex items-start justify-between gap-3">
              <p className="text-[13px] text-muted">
                Rated {category(game.timeControl)}, {clockLabel(game.timeControl)},{" "}
                {new Date(game.endedAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
              <SoundToggle />
            </div>
            <div className="mt-1">
              <StatusLine tone={result.tone}>{result.text}</StatusLine>
            </div>
            <p className="mt-1 text-[13px] text-muted" aria-live="polite">
              {moveLabel}
              <span className="text-faint">
                {" "}
                · {current + 1} of {total}
              </span>
            </p>
          </div>

          <MoveList moves={sans} current={current} onSelect={(i) => goTo(i, false)} />

          <div className="flex gap-1 border-t border-line px-5 py-3">
            <Button
              variant="ghost"
              className={navButton}
              aria-label="First position"
              disabled={current < 0}
              onClick={() => goTo(-1)}
            >
              <ChevronFirst size={18} aria-hidden="true" />
            </Button>
            <Button
              variant="ghost"
              className={navButton}
              aria-label="Previous move"
              disabled={current < 0}
              onClick={() => goTo(current - 1)}
            >
              <ChevronLeft size={18} aria-hidden="true" />
            </Button>
            <Button
              variant="ghost"
              className={navButton}
              aria-label="Next move"
              disabled={current >= total - 1}
              onClick={() => goTo(current + 1)}
            >
              <ChevronRight size={18} aria-hidden="true" />
            </Button>
            <Button
              variant="ghost"
              className={navButton}
              aria-label="Last position"
              disabled={current >= total - 1}
              onClick={() => goTo(total - 1, false)}
            >
              <ChevronLast size={18} aria-hidden="true" />
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 border-t border-line px-5 py-4">
            <Button size="sm" variant="secondary" onClick={() => downloadPgn(game)}>
              <Download size={15} aria-hidden="true" /> Download PGN
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setFlipped((f) => !f)}>
              <Repeat2 size={15} aria-hidden="true" /> Flip board
            </Button>
          </div>
          <p className="border-t border-line px-5 py-3 text-[12px] text-faint">
            Keys: ← → step, Home and End jump, F flips the board.
          </p>
        </section>
      }
    />
  );
}
