"use client";

import { useEffect, useRef, type KeyboardEvent as ReactKeyboardEvent } from "react";
import Image from "next/image";
import type { Color, PieceSet, PromotionPiece } from "@chess/shared";
import { pieceSrc } from "@/lib/preferences";

/** Queen first, so it sits on the promotion square itself. */
const OPTIONS: { piece: PromotionPiece; name: string }[] = [
  { piece: "q", name: "queen" },
  { piece: "n", name: "knight" },
  { piece: "r", name: "rook" },
  { piece: "b", name: "bishop" },
];

interface PromotionMoveProps {
  /** Colour of the pawn being promoted; decides which piece images to show. */
  color: Color;
  pieceSet: PieceSet;
  /**
   * "down" when the promotion square is on the top row of the board as drawn,
   * "up" when it is on the bottom row, so the strip always stays on the board.
   */
  direction: "down" | "up";
  onPick: (piece: PromotionPiece) => void;
  onCancel: () => void;
}

/**
 * Replaces the promotion square with a 1x4 strip of pieces: queen on the square,
 * then knight, rook and bishop toward the middle of the board.
 * Render it as the content of that square (which is `relative`); Escape cancels.
 */
export function PromotionMove({
  color,
  pieceSet,
  direction,
  onPick,
  onCancel,
}: PromotionMoveProps) {
  const first = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    first.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  // The square underneath turns Enter and Space into a click and cancels the key's
  // default action, which would stop these buttons working from the keyboard.
  function onKeyDown(e: ReactKeyboardEvent<HTMLDivElement>) {
    e.stopPropagation();
    if (e.key === "Escape") onCancel();
  }

  return (
    <div
      role="dialog"
      aria-label="Choose a piece to promote to"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={onKeyDown}
      className={`absolute left-0 z-50 flex h-[400%] w-full overflow-hidden rounded-[4px] bg-board-light shadow-[0_0_0_3px_var(--color-brass),0_12px_32px_-8px_rgba(0,0,0,0.7)] ${
        direction === "down" ? "top-0 flex-col" : "bottom-0 flex-col-reverse"
      }`}
    >
      {OPTIONS.map(({ piece, name }, i) => (
        <button
          key={piece}
          ref={i === 0 ? first : undefined}
          type="button"
          aria-label={`Promote to ${name}`}
          onClick={() => onPick(piece)}
          className="flex min-h-0 flex-1 items-center justify-center hover:bg-black/10 focus-visible:bg-black/10 focus-visible:outline-offset-[-2px]"
        >
          <Image
            src={pieceSrc(pieceSet, color, piece)}
            alt=""
            width={80}
            height={80}
            draggable={false}
            className="h-[88%] w-[88%]"
          />
        </button>
      ))}
    </div>
  );
}
