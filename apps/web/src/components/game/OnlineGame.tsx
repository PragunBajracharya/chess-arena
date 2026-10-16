"use client";

import { useState } from "react";
import Link from "next/link";
import { Flag, Handshake } from "lucide-react";
import type { Color, GameOverPayload } from "@chess/shared";
import { sideToMove } from "@chess/chess-core";
import { useGameSocket } from "@/hooks/useGameSocket";
import { Board } from "@/components/board/Board";
import { Button, buttonClass } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { RatingDelta } from "@/components/ui/ResultChip";
import { category, clockLabel, reasonLabel } from "@/lib/format";
import { Clock } from "./Clock";
import { GameLayout, StatusLine } from "./GameLayout";
import { MoveList } from "./MoveList";
import { PlayerStrip } from "./PlayerStrip";

function resultText(over: GameOverPayload, me: Color | null) {
    const how = reasonLabel(over.reason);
    if (over.result === "1/2-1/2") return { text: `Draw by ${how}`, tone: "neutral" as const };
    const winner: Color = over.result === "1-0" ? "white" : "black";
    if (!me)
        return {
            text: `${winner === "white" ? "White" : "Black"} won by ${how}`,
            tone: "neutral" as const,
        };
    return winner === me
        ? { text: `You won by ${how}`, tone: "win" as const }
        : {
              text: over.reason === "timeout" ? "You lost on time" : `You lost by ${how}`,
              tone: "loss" as const,
          };
}

export function OnlineGame({ gameId }: { gameId: string }) {
    const { game, myColor, drawOfferFrom, gameOver, error, move, resign, offerDraw, respondDraw } =
        useGameSocket(gameId);
    const [confirmResign, setConfirmResign] = useState(false);
    const [notice, setNotice] = useState<string | null>(null);
    const [offeredAtMove, setOfferedAtMove] = useState<number | null>(null);

    if (error) {
        return (
            <div className="py-16 text-center">
                <p className="font-medium">This game couldn&apos;t be opened</p>
                <p className="mt-1 text-[13px] text-muted">
                    {error}. It may have ended or the link may be wrong.
                </p>
                <Link href="/home" className={buttonClass("secondary", "md", "mt-6")}>
                    Back to home
                </Link>
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

    const orientation = myColor ?? "white";
    const topColor: Color = orientation === "white" ? "black" : "white";
    const top = topColor === "white" ? game.white : game.black;
    const bottom = orientation === "white" ? game.white : game.black;
    const toMove = sideToMove(game.fen);
    const active = game.status === "active";
    const ms = (c: Color) => (c === "white" ? game.clock.whiteMs : game.clock.blackMs);
    const result = gameOver ? resultText(gameOver, myColor) : null;
    const myDelta = gameOver?.ratingChange && myColor ? gameOver.ratingChange[myColor] : null;
    const me = myColor === "white" ? game.white : myColor === "black" ? game.black : null;
    const drawOffered = drawOfferFrom === myColor || offeredAtMove === game.moves.length;

    const status = result ? (
        <StatusLine tone={result.tone}>{result.text}</StatusLine>
    ) : !myColor ? (
        <StatusLine>{toMove === "white" ? "White" : "Black"} to move</StatusLine>
    ) : toMove === myColor ? (
        <StatusLine tone="accent">Your move</StatusLine>
    ) : (
        <StatusLine>Waiting for {top.name}</StatusLine>
    );

    return (
        <GameLayout
            top={
                <PlayerStrip
                    name={top.name}
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
                    fen={game.fen}
                    orientation={orientation}
                    playerColor={myColor}
                    disabled={!active || !myColor}
                    lastMove={game.moves.at(-1) ?? null}
                    onMove={(m) => {
                        setNotice(null);
                        move(m).catch((e: Error) => setNotice(e.message));
                    }}
                />
            }
            bottom={
                <PlayerStrip
                    name={bottom.name}
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
            }
            side={
                <>
                    <section className="rounded-xl border border-line bg-panel">
                        <div className="border-b border-line px-5 py-4">
                            <p className="text-[13px] text-muted">
                                Rated {category(game.timeControl)}, {clockLabel(game.timeControl)}
                            </p>
                            <div className="mt-1">{status}</div>
                            {myDelta !== null && me && (
                                <p className="mt-1 text-[13px] text-muted">
                                    New rating{" "}
                                    <span className="text-text tabular-nums">
                                        {me.rating + myDelta}
                                    </span>{" "}
                                    <RatingDelta before={me.rating} after={me.rating + myDelta} />
                                </p>
                            )}
                            {notice && <p className="mt-2 text-[13px] text-loss">{notice}</p>}
                        </div>

                        <MoveList moves={game.moves.map((m) => m.san)} />

                        {active && myColor && drawOfferFrom && drawOfferFrom !== myColor && (
                            <div className="border-t border-line px-5 py-4">
                                <p className="text-[14px] font-medium">{top.name} offers a draw</p>
                                <div className="mt-3 flex gap-2">
                                    <Button size="sm" onClick={() => respondDraw(true)}>
                                        Accept draw
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        onClick={() => respondDraw(false)}
                                    >
                                        Decline
                                    </Button>
                                </div>
                            </div>
                        )}

                        {active && myColor && (
                            <div className="border-t border-line px-5 py-4">
                                {confirmResign ? (
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="mr-auto text-[14px]">
                                            Resign this game?
                                        </span>
                                        <Button
                                            size="sm"
                                            variant="danger"
                                            onClick={() =>
                                                resign().finally(() => setConfirmResign(false))
                                            }
                                        >
                                            Resign
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => setConfirmResign(false)}
                                        >
                                            Keep playing
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            disabled={drawOffered}
                                            onClick={() =>
                                                offerDraw()
                                                    .then(() => setOfferedAtMove(game.moves.length))
                                                    .catch((e: Error) => setNotice(e.message))
                                            }
                                        >
                                            <Handshake size={15} aria-hidden="true" />
                                            {drawOffered ? "Draw offered" : "Offer draw"}
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            onClick={() => setConfirmResign(true)}
                                        >
                                            <Flag size={15} aria-hidden="true" /> Resign
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}

                        {!active && (
                            <div className="flex gap-2 border-t border-line px-5 py-4">
                                <Link href="/play" className={buttonClass("primary", "sm")}>
                                    New game
                                </Link>
                                <Link href="/home" className={buttonClass("secondary", "sm")}>
                                    Back to home
                                </Link>
                            </div>
                        )}
                    </section>
                </>
            }
        />
    );
}
