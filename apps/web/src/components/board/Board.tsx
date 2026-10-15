"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import type { Color, MoveInput } from "@chess/shared";
import { isPromotionMove, legalTargets, sideToMove, toBoardMatrix } from "@chess/chess-core";

const PIECE_NAMES = { p: "pawn", n: "knight", b: "bishop", r: "rook", q: "queen", k: "king" };

interface BoardProps {
  fen: string;
  orientation?: Color;
  /** Only this color can move pieces. Omit for local two-player. */
  playerColor?: Color | null;
  disabled?: boolean;
  lastMove?: { from: string; to: string } | null;
  onMove?: (move: MoveInput) => void;
  /** Static boards (previews) render no buttons and no coordinates. */
  interactive?: boolean;
  showCoordinates?: boolean;
  className?: string;
}

/**
 * Click-to-move board driven entirely by FEN, in a maple and walnut finish.
 * TODO: port the react-dnd drag & drop from chess-v2's ChessBoard.jsx and add a
 * promotion picker (auto-queens for now).
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

  function handleClick(square: string, pieceColor: Color | undefined) {
    if (!canMove) return;
    if (selected && targets.includes(square)) {
      onMove?.({
        from: selected,
        to: square,
        ...(isPromotionMove(fen, selected, square) && { promotion: "q" as const }),
      });
      setSelected(null);
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
        const label = piece ? `${square}, ${piece.color} ${PIECE_NAMES[piece.type]}` : square;

        const content = (
          <>
            {isLast && <span className="absolute inset-0 bg-[#d4b14f]/55" />}
            {selected === square && <span className="absolute inset-0 bg-[#d4b14f]/85" />}
            {showCoordinates && interactive && col === 0 && (
              <span className={`absolute top-0.5 left-1 text-[11px] font-semibold ${coordColor}`}>
                {rank}
              </span>
            )}
            {showCoordinates && interactive && row === 7 && (
              <span className={`absolute right-1 bottom-0 text-[11px] font-semibold ${coordColor}`}>
                {square[0]}
              </span>
            )}
            {piece && (
              <Image
                src={piece.image}
                alt=""
                width={80}
                height={80}
                className="relative z-10 h-[88%] w-[88%]"
                draggable={false}
              />
            )}
            {isTarget && (
              <span
                className={
                  piece
                    ? "absolute inset-[3px] z-20 rounded-full border-[5px] border-black/25"
                    : "z-20 size-[28%] rounded-full bg-black/25"
                }
              />
            )}
          </>
        );

        const squareClass = `relative flex min-h-0 min-w-0 items-center justify-center ${isLight ? "bg-board-light" : "bg-board-dark"}`;

        return interactive ? (
          <button
            key={square}
            type="button"
            aria-label={label}
            aria-pressed={selected === square}
            onClick={() => handleClick(square, piece?.color)}
            className={`${squareClass} ${canMove ? "cursor-pointer" : "cursor-default"} focus-visible:z-30 focus-visible:outline-offset-[-2px]`}
          >
            {content}
          </button>
        ) : (
          <div key={square} className={squareClass}>
            {content}
          </div>
        );
      })}
    </div>
  );
}
