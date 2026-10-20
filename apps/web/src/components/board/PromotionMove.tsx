"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import type { Color, PromotionPiece } from "@chess/shared";

/** Queen first, so it sits on the promotion square itself, as on most sites. */
const OPTIONS: { piece: PromotionPiece; name: string }[] = [
  { piece: "q", name: "queen" },
  { piece: "n", name: "knight" },
  { piece: "r", name: "rook" },
  { piece: "b", name: "bishop" },
];

interface PromotionMoveProps {
  /** Colour of the pawn being promoted; decides which piece images to show. */
  color: Color;
  /** Column of the promotion square as drawn on screen, 0 = left edge. */
  column: number;
  /** True when the promotion square is on the top row of the board as drawn. */
  atTop: boolean;
  onPick: (piece: PromotionPiece) => void;
  onCancel: () => void;
}

/**
 * Four pieces stacked over the promotion square, running from the board edge
 * toward the middle. Clicking outside or pressing Escape cancels the move.
 * Render inside the board's `relative` container.
 */
export function PromotionMove({ color, column, atTop, onPick, onCancel }: PromotionMoveProps) {
  const first = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    first.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <>
      <button
        type="button"
        aria-label="Cancel promotion"
        onClick={onCancel}
        className="absolute inset-0 z-40 cursor-default bg-black/45"
      />
      <div
        role="dialog"
        aria-label="Choose a piece to promote to"
        className={`absolute z-50 flex h-1/2 w-[12.5%] overflow-hidden rounded-md bg-panel shadow-[0_12px_32px_-8px_rgba(0,0,0,0.7)] ${
          atTop ? "top-0 flex-col" : "bottom-0 flex-col-reverse"
        }`}
        style={{ left: `${column * 12.5}%` }}
      >
        {OPTIONS.map(({ piece, name }, i) => (
          <button
            key={piece}
            ref={i === 0 ? first : undefined}
            type="button"
            aria-label={`Promote to ${name}`}
            onClick={() => onPick(piece)}
            className="flex h-1/4 items-center justify-center hover:bg-raised focus-visible:bg-raised focus-visible:outline-offset-[-2px]"
          >
            <Image
              src={`/pieces/${color === "white" ? "w" : "b"}${piece}.png`}
              alt=""
              width={80}
              height={80}
              draggable={false}
              className="h-[85%] w-[85%]"
            />
          </button>
        ))}
      </div>
    </>
  );
}