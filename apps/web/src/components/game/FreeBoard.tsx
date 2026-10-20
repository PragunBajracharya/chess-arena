"use client";

import { useMemo, useState, type FormEvent } from "react";
import type { Color, MoveInput } from "@chess/shared";
import {
    START_FEN,
    applyMove,
    isInCheck,
    sideToMove,
    toBoardMatrix,
    type GameOutcome,
} from "@chess/chess-core";
import { reasonLabel } from "@/lib/format";
import { Board } from "@/components/board/Board";
import { Button } from "@/components/ui/Button";
import { GameLayout, StatusLine } from "./GameLayout";
import { MoveList } from "./MoveList";
import { PlayerStrip } from "./PlayerStrip";

interface Played {
    san: string;
    from: string;
    to: string;
    fen: string;
    outcome: GameOutcome | null;
}

function isValidFen(fen: string) {
    try {
        toBoardMatrix(fen);
        return true;
    } catch {
        return false;
    }
}

/**
 * A board with no opponent: whoever's turn it is can move, so you can play both
 * sides. Uses the same rules code as real games. Promotions auto-queen.
 */
export function FreeBoard() {
    const [startFen, setStartFen] = useState(START_FEN);
    const [moves, setMoves] = useState<Played[]>([]);
    const [orientation, setOrientation] = useState<Color>("white");
    const [fenInput, setFenInput] = useState("");
    const [fenError, setFenError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const fen = moves.at(-1)?.fen ?? startFen;
    const outcome = moves.at(-1)?.outcome ?? null;
    const toMove = sideToMove(fen);
    const check = useMemo(() => isInCheck(fen), [fen]);
    const sans = moves.map((m) => m.san);

    function play(move: MoveInput) {
        // Repetition is only detectable from the standard start, where the full history replays.
        const res = applyMove(fen, move, startFen === START_FEN ? sans : []);
        if (!res.ok) return;
        setMoves((prev) => [
            ...prev,
            { san: res.san, from: move.from, to: move.to, fen: res.fen, outcome: res.outcome },
        ]);
    }

    function reset(newStart = START_FEN) {
        setStartFen(newStart);
        setMoves([]);
    }

    function loadFen(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const value = fenInput.trim();
        if (!isValidFen(value)) {
            setFenError("That isn't a valid FEN. Check it has six space-separated fields.");
            return;
        }
        setFenError(null);
        setFenInput("");
        reset(value);
        setOrientation(sideToMove(value));
    }

    async function copyFen() {
        await navigator.clipboard.writeText(fen);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    }

    const name = (c: Color) => (c === "white" ? "White" : "Black");
    const status = outcome ? (
        <StatusLine tone="accent">
            {outcome.result === "1/2-1/2"
                ? `Draw by ${reasonLabel(outcome.reason)}`
                : `${outcome.result === "1-0" ? "White" : "Black"} wins by ${reasonLabel(outcome.reason)}`}
        </StatusLine>
    ) : (
        <StatusLine tone={check ? "loss" : "neutral"}>
            {name(toMove)} to move{check ? ", in check" : ""}
        </StatusLine>
    );
    const top: Color = orientation === "white" ? "black" : "white";

    return (
        <GameLayout
            top={
                <PlayerStrip
                    name={name(top)}
                    detail={toMove === top && !outcome ? "To move" : undefined}
                />
            }
            board={
                <Board
                    fen={fen}
                    orientation={orientation}
                    disabled={!!outcome}
                    lastMove={moves.at(-1) ?? null}
                    onMove={play}
                />
            }
            bottom={
                <PlayerStrip
                    name={name(orientation)}
                    detail={toMove === orientation && !outcome ? "To move" : undefined}
                />
            }
            side={
                <>
                    <section className="rounded-xl border border-line bg-panel">
                        <div className="border-b border-line px-5 py-4">
                            <p className="text-[13px] text-muted">Test board, both sides</p>
                            <div className="mt-1">{status}</div>
                        </div>
                        <MoveList moves={sans} />
                        <div className="flex flex-wrap gap-2 border-t border-line px-5 py-4">
                            <Button
                                size="sm"
                                variant="secondary"
                                disabled={!moves.length}
                                onClick={() => setMoves((prev) => prev.slice(0, -1))}
                            >
                                Undo
                            </Button>
                            <Button
                                size="sm"
                                variant="secondary"
                                onClick={() =>
                                    setOrientation((o) => (o === "white" ? "black" : "white"))
                                }
                            >
                                Flip board
                            </Button>
                            <Button size="sm" variant="secondary" onClick={() => reset()}>
                                Reset
                            </Button>
                        </div>
                    </section>

                    <section className="rounded-xl border border-line bg-panel p-5">
                        <h2 className="text-[18px] font-semibold">Position</h2>
                        <p className="mt-3 text-[13px] text-muted">Current FEN</p>
                        <p className="mt-1 rounded-lg bg-raised px-3 py-2 font-mono text-[12px] break-all">
                            {fen}
                        </p>
                        <Button size="sm" variant="ghost" className="mt-2 -ml-3" onClick={copyFen}>
                            {copied ? "Copied" : "Copy FEN"}
                        </Button>

                        <form onSubmit={loadFen} className="mt-4 border-t border-line pt-4">
                            <label htmlFor="fen" className="text-[13px] text-muted">
                                Start from a FEN
                            </label>
                            <input
                                id="fen"
                                value={fenInput}
                                onChange={(e) => setFenInput(e.target.value)}
                                placeholder="e.g. 8/P7/8/8/8/8/8/k6K w - - 0 1"
                                className="mt-1.5 h-10 w-full rounded-lg border border-line-strong bg-raised px-3 font-mono text-[12px] placeholder:text-faint focus:border-brass focus:outline-none"
                            />
                            {fenError && <p className="mt-1.5 text-[13px] text-loss">{fenError}</p>}
                            <Button
                                type="submit"
                                size="sm"
                                className="mt-3"
                                disabled={!fenInput.trim()}
                            >
                                Load position
                            </Button>
                        </form>
                    </section>
                </>
            }
        />
    );
}
