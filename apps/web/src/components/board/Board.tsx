"use client";

import { useCallback, useMemo, useState } from "react";
import Image from "next/image";
import type { Color, MoveInput } from "@chess/shared";
import { isPromotionMove, legalTargets, sideToMove, toBoardMatrix } from "@chess/chess-core";
import { DropSquare } from "./DropSquare";
import { Piece } from "./Piece";

const PIECE_NAMES = { p: "pawn", n: "knight", b: "bishop", r: "rook", q: "queen", k: "king" };

export interface BoardProps {
    fen: string;
    orientation?: Color;
    /** Only this color can move pieces. Omit for local two-player. */
    playerColor?: Color | null;
    disabled?: boolean;
    lastMove?: { from: string; to: string } | null;
    onMove?: (move: MoveInput) => void;
    /** Static boards (previews) render no drag, no buttons and no coordinates. */
    interactive?: boolean;
    showCoordinates?: boolean;
    className?: string;
}

/**
 * FEN-driven board, maple and walnut. Move by clicking a piece then a square, or by
 * dragging. Needs the app-wide <DndProvider> from app/providers.tsx when interactive.
 * Promotions auto-queen until a promotion picker is added.
 */
export function Board({
    fen,
    orientation = "white",
    playerColor,
    disabled,
    lastMove,
    onMove,
    interactive = true,
    showCoordinates = true,
    className = "",
}: BoardProps) {
    const [selected, setSelected] = useState<string | null>(null);
    const cells = useMemo(() => toBoardMatrix(fen, orientation), [fen, orientation]);
    const targets = useMemo(() => (selected ? legalTargets(fen, selected) : []), [fen, selected]);
    const turn = sideToMove(fen);
    const canMove = interactive && !disabled && (playerColor == null || playerColor === turn);

    const play = useCallback(
        (from: string, to: string) => {
            setSelected(null);
            if (!legalTargets(fen, from).includes(to)) return;
            onMove?.({
                from,
                to,
                ...(isPromotionMove(fen, from, to) && { promotion: "q" as const }),
            });
        },
        [fen, onMove],
    );

    const canAccept = useCallback(
        (from: string, to: string) => canMove && legalTargets(fen, from).includes(to),
        [canMove, fen],
    );
    const onDragStart = useCallback((square: string) => setSelected(square), []);
    const onDragEnd = useCallback(() => setSelected(null), []);

    function handleClick(square: string, pieceColor: Color | undefined) {
        if (!canMove) return;
        if (selected && targets.includes(square)) {
            play(selected, square);
            return;
        }
        setSelected(pieceColor === turn && selected !== square ? square : null);
    }

    return (
        <div
            role={interactive ? "grid" : "img"}
            aria-label={interactive ? "Chess board" : "Chess position"}
            className={`grid aspect-square w-full grid-cols-8 grid-rows-8 overflow-hidden rounded-[10px] shadow-[0_12px_32px_-12px_rgba(0,0,0,0.6)] select-none ${className}`}
        >
            {cells.flat().map(({ square, piece }, index) => {
                const file = square.charCodeAt(0) - 97;
                const rank = Number(square[1]);
                const isLight = (file + rank) % 2 === 1;
                const isLast = lastMove && (lastMove.from === square || lastMove.to === square);
                const isTarget = targets.includes(square);
                const col = index % 8;
                const row = Math.floor(index / 8);
                const coordColor = isLight ? "text-board-dark" : "text-board-light";
                const label = piece
                    ? `${square}, ${piece.color} ${PIECE_NAMES[piece.type]}`
                    : square;
                const squareClass = `relative flex min-h-0 min-w-0 items-center justify-center ${isLight ? "bg-board-light" : "bg-board-dark"}`;

                const pieceImage = piece ? (
                    interactive ? (
                        <Piece
                            image={piece.image}
                            square={square}
                            canDrag={canMove && piece.color === turn}
                            onDragStart={onDragStart}
                            onDragEnd={onDragEnd}
                        />
                    ) : (
                        <Image
                            src={piece.image}
                            alt=""
                            width={80}
                            height={80}
                            draggable={false}
                            className="relative z-10 h-[88%] w-[88%]"
                        />
                    )
                ) : null;

                const content = (
                    <>
                        {isLast && <span className="absolute inset-0 bg-[#d4b14f]/55" />}
                        {selected === square && (
                            <span className="absolute inset-0 bg-[#d4b14f]/85" />
                        )}
                        {showCoordinates && interactive && col === 0 && (
                            <span
                                className={`absolute top-0.5 left-1 text-[11px] font-semibold ${coordColor}`}
                            >
                                {rank}
                            </span>
                        )}
                        {showCoordinates && interactive && row === 7 && (
                            <span
                                className={`absolute right-1 bottom-0 text-[11px] font-semibold ${coordColor}`}
                            >
                                {square[0]}
                            </span>
                        )}
                        {pieceImage}
                        {isTarget && (
                            <span
                                className={
                                    piece
                                        ? "pointer-events-none absolute inset-[3px] z-20 rounded-full border-[5px] border-black/25"
                                        : "pointer-events-none z-20 size-[28%] rounded-full bg-black/25"
                                }
                            />
                        )}
                    </>
                );

                return interactive ? (
                    <DropSquare
                        key={square}
                        square={square}
                        label={label}
                        selected={selected === square}
                        className={`${squareClass} ${canMove ? "cursor-pointer" : "cursor-default"}`}
                        onClick={() => handleClick(square, piece?.color)}
                        canAccept={canAccept}
                        onDropPiece={play}
                    >
                        {content}
                    </DropSquare>
                ) : (
                    <div key={square} className={squareClass}>
                        {content}
                    </div>
                );
            })}
        </div>
    );
}
