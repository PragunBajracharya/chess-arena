"use client";

import type { KeyboardEvent, ReactNode } from "react";
import { useDrop } from "react-dnd";
import { PIECE, type DragItem } from "./Piece";

interface DropSquareProps {
  square: string;
  label: string;
  selected: boolean;
  className: string;
  onClick: () => void;
  /** Whether a piece dragged from `from` may land here. */
  canAccept: (from: string, to: string) => boolean;
  onDropPiece: (from: string, to: string) => void;
  children: ReactNode;
}

/**
 * One interactive square: a click target and a drop target.
 * A div with role="button" rather than a <button>, because some browsers do not
 * start a drag on elements nested inside a <button>.
 */
export function DropSquare({
  square,
  label,
  selected,
  className,
  onClick,
  canAccept,
  onDropPiece,
  children,
}: DropSquareProps) {
  const [{ isOver, canDrop }, drop] = useDrop<
    DragItem,
    void,
    { isOver: boolean; canDrop: boolean }
  >(
    () => ({
      accept: PIECE,
      canDrop: (item) => canAccept(item.from, square),
      drop: (item) => onDropPiece(item.from, square),
      collect: (monitor) => ({ isOver: monitor.isOver(), canDrop: monitor.canDrop() }),
    }),
    [square, canAccept, onDropPiece],
  );

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick();
    }
  }

  return (
    <div
      ref={(node) => {
        drop(node);
      }}
      role="button"
      tabIndex={0}
      aria-label={label}
      aria-pressed={selected}
      onClick={onClick}
      onKeyDown={onKeyDown}
      className={`${className} focus-visible:z-30 focus-visible:outline-offset-[-2px]`}
    >
      {children}
      {isOver && canDrop && (
        <span className="pointer-events-none absolute inset-0 z-20 shadow-[inset_0_0_0_4px_rgba(255,255,255,0.75)]" />
      )}
    </div>
  );
}
