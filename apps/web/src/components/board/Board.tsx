"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import type { Color, MoveInput } from "@chess/shared";
import { isPromotionMove, legalTargets, sideToMove, toBoardMatrix } from "@chess/chess-core";

interface BoardProps {
  fen: string;
  orientation?: Color;
  /** Only this color can move pieces. Omit for local two-player. */
  playerColor?: Color | null;
  disabled?: boolean;
  lastMove?: { from: string; to: string } | null;
  onMove: (move: MoveInput) => void;
}

/**
 * Click-to-move board driven entirely by FEN.
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
}: BoardProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const cells = useMemo(() => toBoardMatrix(fen, orientation), [fen, orientation]);
  const targets = useMemo(() => (selected ? legalTargets(fen, selected) : []), [fen, selected]);
  const turn = sideToMove(fen);
  const canMove = !disabled && (playerColor == null || playerColor === turn);

  function handleClick(square: string, pieceColor: Color | undefined) {
    if (!canMove) return;
    if (selected && targets.includes(square)) {
      onMove({
        from: selected,
        to: square,
        ...(isPromotionMove(fen, selected, square) && { promotion: "q" as const }),
      });
      setSelected(null);
      return;
    }
    setSelected(pieceColor === turn ? square : null);
  }

  return (
    <div className="grid aspect-square w-full max-w-[640px] grid-cols-8 overflow-hidden rounded-md shadow-lg select-none">
      {cells.flat().map(({ square, piece }) => {
        const file = square.charCodeAt(0) - 97;
        const rank = Number(square[1]);
        const isLight = (file + rank) % 2 === 1;
        const isLast = lastMove && (lastMove.from === square || lastMove.to === square);
        return (
          <button
            key={square}
            type="button"
            aria-label={square}
            onClick={() => handleClick(square, piece?.color)}
            className={[
              "relative flex items-center justify-center",
              isLight ? "bg-[#ebecd0]" : "bg-[#779556]",
              isLast && "after:absolute after:inset-0 after:bg-yellow-300/40",
              selected === square && "ring-4 ring-inset ring-yellow-400",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {piece && (
              <Image
                src={piece.image}
                alt={`${piece.color} ${piece.type}`}
                width={80}
                height={80}
                className="relative z-10 h-[90%] w-[90%]"
                draggable={false}
              />
            )}
            {targets.includes(square) && (
              <span
                className={
                  piece
                    ? "absolute inset-1 rounded-full border-4 border-black/20"
                    : "h-1/4 w-1/4 rounded-full bg-black/20"
                }
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
