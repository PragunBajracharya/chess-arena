"use client";

import Image from "next/image";
import { useDrag } from "react-dnd";

/** react-dnd item type shared by every piece; the square it came from travels in the item. */
export const PIECE = "piece";

export interface DragItem {
  from: string;
}

interface PieceProps {
  image: string;
  /** The square this piece stands on. */
  square: string;
  canDrag: boolean;
  /** Called when a drag starts, so the board can show legal targets. */
  onDragStart: (square: string) => void;
  onDragEnd: () => void;
}

export function Piece({ image, square, canDrag, onDragStart, onDragEnd }: PieceProps) {
  const [{ isDragging }, drag] = useDrag<DragItem, void, { isDragging: boolean }>(
    () => ({
      type: PIECE,
      item: () => {
        onDragStart(square);
        return { from: square };
      },
      canDrag: () => canDrag,
      end: () => onDragEnd(),
      collect: (monitor) => ({ isDragging: monitor.isDragging() }),
    }),
    [square, canDrag, onDragStart, onDragEnd],
  );

  return (
    <Image
      ref={(node) => {
        drag(node);
      }}
      src={image}
      alt=""
      width={80}
      height={80}
      className={`relative z-10 h-[88%] w-[88%] ${canDrag ? "cursor-grab active:cursor-grabbing" : ""}`}
      style={{ opacity: isDragging ? 0.35 : 1 }}
    />
  );
}
