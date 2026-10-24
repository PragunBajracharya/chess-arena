"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Flag, Handshake, RotateCcw, Unplug, X } from "lucide-react";
import type {
  Color,
  GameAbortedPayload,
  GameEndReason,
  GameResult,
  GameState,
  MoveInput,
  PlayerInfo,
} from "@chess/shared";
import { applyMove, sideToMove } from "@chess/chess-core";
import { usePreferences } from "@/lib/preferences";
import { useGameSocket } from "@/hooks/useGameSocket";
import { useMoveSounds } from "@/lib/sounds";
import { Board } from "@/components/board/Board";
import { Button, buttonClass } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { RatingDelta } from "@/components/ui/ResultChip";
import { category, clockLabel, reasonLabel } from "@/lib/format";
import { Clock } from "./Clock";
import { Countdown } from "./Countdown";
import { GameLayout, StatusLine } from "./GameLayout";
import { MoveList } from "./MoveList";
import { PlayerStrip } from "./PlayerStrip";
import { SoundToggle } from "./SoundToggle";

const other = (c: Color): Color => (c === "white" ? "black" : "white");
const name = (c: Color) => (c === "white" ? "White" : "Black");
const hasMoved = (game: GameState, c: Color) => game.moves.length >= (c === "white" ? 1 : 2);

function resultText(result: GameResult, reason: GameEndReason, me: Color | null) {
  const how = reasonLabel(reason);
  if (result === "1/2-1/2") return { text: `Draw by ${how}`, tone: "neutral" as const };
  const winner: Color = result === "1-0" ? "white" : "black";
  if (!me) return { text: `${name(winner)} won by ${how}`, tone: "neutral" as const };
  if (winner === me) return { text: `You won by ${how}`, tone: "win" as const };
  if (reason === "timeout") return { text: "You lost on time", tone: "loss" as const };
  if (reason === "abandoned") return { text: "You lost: you left the game", tone: "loss" as const };
  return { text: `You lost by ${how}`, tone: "loss" as const };
}

function abortText(
  a: GameAbortedPayload | null,
  me: Color | null,
  player: (c: Color) => PlayerInfo,
) {
  if (!a?.by) return "Nobody's rating changed.";
  const who = a.by === me ? "You" : player(a.by).name;
  switch (a.reason) {
    case "no_first_move":
      return `${who} didn't make a first move in time. Nobody's rating changed.`;
    case "player_left":
      return `${who} left before making a move. Nobody's rating changed.`;
    case "player_aborted":
      return `${who} aborted the game. Nobody's rating changed.`;
  }
}

export function OnlineGame({ gameId }: { gameId: string }) {
  const router = useRouter();
  const {
    game,
    myColor,
    drawOfferFrom,
    gameOver,
    aborted,
    rematch,
    rematchGameId,
    error,
    move,
    resign,
    abort,
    offerDraw,
    respondDraw,
    offerRematch,
    respondRematch,
  } = useGameSocket(gameId);
  const [confirmResign, setConfirmResign] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [offeredAtMove, setOfferedAtMove] = useState<number | null>(null);
  const { confirmMoves } = usePreferences();
  /** With "confirm moves" on: the move shown on the board but not sent yet. */
  const [proposed, setProposed] = useState<{ move: MoveInput; fen: string; san: string } | null>(
    null,
  );
  const moveCount = game?.moves.length ?? 0;
  const gameStatus = game?.status;

  // A proposal is only valid for the position it was made in.
  useEffect(() => setProposed(null), [moveCount, gameStatus]);

  useMoveSounds(game ? game.moves.map((m) => m.san) : null, game ? game.status !== "active" : null);

  useEffect(() => {
    if (rematchGameId) router.push(`/game/${rematchGameId}`);
  }, [rematchGameId, router]);

  // Reset per-game UI state when a rematch opens a new game on this same page.
  useEffect(() => {
    setConfirmResign(false);
    setNotice(null);
    setOfferedAtMove(null);
    setProposed(null);
  }, [gameId]);

  useEffect(() => {
    if (!proposed) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setProposed(null);
      if (
        e.key === "Enter" &&
        !(e.target as HTMLElement | null)?.closest("button, input, textarea")
      ) {
        e.preventDefault();
        sendProposed();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (error) {
    return (
      <div className="py-16 text-center">
        <p className="font-medium">This game couldn&apos;t be opened</p>
        <p className="mt-1 text-[13px] text-muted">
          {error}. It may have ended more than five minutes ago, or the link may be wrong.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Link href={`/game/${gameId}/review`} className={buttonClass("secondary", "md")}>
            Look for a saved game
          </Link>
          <Link href="/home" className={buttonClass("secondary", "md")}>
            Back to home
          </Link>
        </div>
      </div>
    );
  }
  if (!game) {
    return (
      <div className="flex justify-center py-24 text-muted">
        <Spinner size={20} />
      </div>
    );
  }

  const player = (c: Color) => (c === "white" ? game.white : game.black);
  const orientation = myColor ?? "white";
  const topColor = other(orientation);
  const top = player(topColor);
  const bottom = player(orientation);
  const toMove = sideToMove(game.fen);
  const active = game.status === "active";
  const finished = game.status === "finished";
  const ms = (c: Color) => (c === "white" ? game.clock.whiteMs : game.clock.blackMs);
  const result =
    finished && game.result && game.endReason
      ? resultText(game.result, game.endReason, myColor)
      : null;
  const myDelta = gameOver?.ratingChange && myColor ? gameOver.ratingChange[myColor] : null;
  const me = myColor ? player(myColor) : null;
  const opponentColor = myColor ? other(myColor) : null;
  const opponent = opponentColor ? player(opponentColor) : null;
  const drawOffered = drawOfferFrom === myColor || offeredAtMove === game.moves.length;
  const iHaveMoved = myColor ? hasMoved(game, myColor) : true;
  const bothMoved = game.moves.length >= 2;
  const fail = (e: Error) => setNotice(e.message);

  function submit(m: MoveInput) {
    setNotice(null);
    move(m).catch(fail);
  }

  function sendProposed() {
    if (!proposed) return;
    submit(proposed.move);
    setProposed(null);
  }

  function onBoardMove(m: MoveInput) {
    if (!confirmMoves || !game) return submit(m);
    const res = applyMove(
      game.fen,
      m,
      game.moves.map((x) => x.san),
    );
    if (res.ok) setProposed({ move: m, fen: res.fen, san: res.san });
  }

  // Players whose connection dropped: for a player, that's the opponent; spectators see both.
  const away = (Object.entries(game.absent ?? {}) as [Color, number][]).filter(
    ([c]) => active && c !== myColor,
  );

  let status;
  let detail: React.ReactNode = null;
  if (game.status === "aborted") {
    status = <StatusLine>Game aborted</StatusLine>;
    detail = abortText(aborted, myColor, player);
  } else if (result) {
    status = <StatusLine tone={result.tone}>{result.text}</StatusLine>;
  } else if (!myColor) {
    status = <StatusLine>{name(toMove)} to move</StatusLine>;
  } else if (toMove === myColor) {
    status = <StatusLine tone="accent">Your move</StatusLine>;
  } else {
    status = <StatusLine>Waiting for {top.name}</StatusLine>;
  }
  if (active && game.abortAt && !bothMoved) {
    detail =
      toMove === myColor ? (
        <>
          Make your first move within <Countdown deadline={game.abortAt} /> or the game is aborted.
        </>
      ) : (
        <>
          The game is aborted in <Countdown deadline={game.abortAt} /> if {player(toMove).name}{" "}
          doesn&apos;t make a first move.
        </>
      );
  }

  return (
    <GameLayout
      top={
        <PlayerStrip
          name={top.name}
          image={top.image}
          detail={`Rating ${top.rating}`}
          aside={
            <Clock
              ms={ms(topColor)}
              running={active && toMove === topColor}
              since={game.clock.lastMoveAt}
            />
          }
        />
      }
      board={
        <Board
          fen={proposed?.fen ?? game.fen}
          orientation={orientation}
          playerColor={myColor}
          disabled={!active || !myColor || !!proposed}
          lastMove={proposed?.move ?? game.moves.at(-1) ?? null}
          onMove={onBoardMove}
        />
      }
      bottom={
        <>
          {proposed && (
            <div
              role="group"
              aria-label="Confirm your move"
              className="flex items-center gap-2 rounded-[10px] border border-brass/60 bg-brass/10 px-3 py-2"
            >
              <p className="mr-auto text-[14px]">
                Play <span className="font-semibold">{proposed.san}</span>?
                <span className="ml-2 hidden text-[13px] text-muted sm:inline">
                  Enter to confirm, Esc to take back
                </span>
              </p>
              <Button size="sm" onClick={sendProposed} autoFocus>
                <Check size={15} aria-hidden="true" /> Confirm
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setProposed(null)}>
                Take back
              </Button>
            </div>
          )}
          <PlayerStrip
            name={bottom.name}
            image={bottom.image}
            you={!!myColor}
            detail={`Rating ${bottom.rating}`}
            aside={
              <Clock
                ms={ms(orientation)}
                running={active && toMove === orientation}
                since={game.clock.lastMoveAt}
              />
            }
          />
        </>
      }
      side={
        <section className="rounded-xl border border-line bg-panel">
          <div className="border-b border-line px-5 py-4">
            <div className="flex items-start justify-between gap-3">
              <p className="text-[13px] text-muted">
                Rated {category(game.timeControl)}, {clockLabel(game.timeControl)}
              </p>
              <SoundToggle />
            </div>
            <div className="mt-1">{status}</div>
            {detail && <p className="mt-1 text-[13px] text-muted">{detail}</p>}
            {myDelta !== null && me && (
              <p className="mt-1 text-[13px] text-muted">
                New rating <span className="text-text tabular-nums">{me.rating + myDelta}</span>{" "}
                <RatingDelta before={me.rating} after={me.rating + myDelta} />
              </p>
            )}
            {notice && <p className="mt-2 text-[13px] text-loss">{notice}</p>}
          </div>

          {away.map(([color, deadline]) => (
            <div
              key={color}
              role="status"
              className="flex gap-3 border-b border-line bg-loss/10 px-5 py-3 text-[13px]"
            >
              <Unplug size={16} className="mt-0.5 shrink-0 text-loss" aria-hidden="true" />
              <p>
                <span className="font-medium">{player(color).name} disconnected.</span>{" "}
                <span className="text-muted">
                  {hasMoved(game, color) ? "They lose" : "The game is aborted"} in{" "}
                  <Countdown deadline={deadline} /> unless they come back.
                </span>
              </p>
            </div>
          ))}

          <MoveList moves={game.moves.map((m) => m.san)} />

          {active && myColor && drawOfferFrom && drawOfferFrom !== myColor && (
            <div className="border-t border-line px-5 py-4">
              <p className="text-[14px] font-medium">{top.name} offers a draw</p>
              <div className="mt-3 flex gap-2">
                <Button size="sm" onClick={() => respondDraw(true).catch(fail)}>
                  Accept draw
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => respondDraw(false).catch(fail)}
                >
                  Decline
                </Button>
              </div>
            </div>
          )}

          {active && myColor && !iHaveMoved && (
            <div className="border-t border-line px-5 py-4">
              <Button size="sm" variant="secondary" onClick={() => abort().catch(fail)}>
                <X size={15} aria-hidden="true" /> Abort game
              </Button>
              <p className="mt-2 text-[13px] text-muted">
                You can abort until you make your first move. Nobody&apos;s rating changes.
              </p>
            </div>
          )}

          {active && myColor && iHaveMoved && (
            <div className="border-t border-line px-5 py-4">
              {confirmResign ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="mr-auto text-[14px]">Resign this game?</span>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() =>
                      resign()
                        .catch(fail)
                        .finally(() => setConfirmResign(false))
                    }
                  >
                    Resign
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setConfirmResign(false)}>
                    Keep playing
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  {bothMoved && (
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={drawOffered}
                      onClick={() =>
                        offerDraw()
                          .then(() => setOfferedAtMove(game.moves.length))
                          .catch(fail)
                      }
                    >
                      <Handshake size={15} aria-hidden="true" />
                      {drawOffered ? "Draw offered" : "Offer draw"}
                    </Button>
                  )}
                  <Button size="sm" variant="secondary" onClick={() => setConfirmResign(true)}>
                    <Flag size={15} aria-hidden="true" /> Resign
                  </Button>
                </div>
              )}
            </div>
          )}

          {finished && myColor && opponent && (
            <div className="border-t border-line px-5 py-4">
              {rematch.status === "offered-to-me" ? (
                <>
                  <p className="text-[14px] font-medium">{opponent.name} wants a rematch</p>
                  <p className="mt-0.5 text-[13px] text-muted">
                    Same time control, colours swapped.
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" onClick={() => respondRematch(true).catch(fail)}>
                      Accept rematch
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => respondRematch(false).catch(fail)}
                    >
                      Decline
                    </Button>
                  </div>
                </>
              ) : rematch.status === "offered-by-me" ? (
                <p className="flex items-center gap-2 text-[14px] text-muted">
                  <Spinner size={13} /> Rematch offered. Waiting for {opponent.name}.
                </p>
              ) : rematch.status === "declined" ? (
                <p className="text-[14px] text-muted">{opponent.name} declined the rematch.</p>
              ) : (
                <Button size="sm" onClick={() => offerRematch().catch(fail)}>
                  <RotateCcw size={15} aria-hidden="true" /> Rematch
                </Button>
              )}
            </div>
          )}

          {!active && (
            <div className="flex flex-wrap gap-2 border-t border-line px-5 py-4">
              {finished && (
                <Link href={`/game/${game.id}/review`} className={buttonClass("secondary", "sm")}>
                  Review game
                </Link>
              )}
              <Link href="/play" className={buttonClass("secondary", "sm")}>
                New opponent
              </Link>
              <Link href="/home" className={buttonClass("ghost", "sm")}>
                Back to home
              </Link>
            </div>
          )}
        </section>
      }
    />
  );
}
