import { Chess } from "chess.js";
import type { Color } from "@chess/shared";

/** UI-friendly board cell. `image` matches the /public/pieces/{w|b}{p|n|b|r|q|k}.png files from chess-v2. */
export interface BoardCell {
  square: string;
  piece: { type: "p" | "n" | "b" | "r" | "q" | "k"; color: Color; image: string } | null;
}

/**
 * 8x8 matrix for rendering, row 0 = top of the screen.
 * Orientation "black" flips the board, replacing chess-v2's separate initialBoardBlack().
 */
export function toBoardMatrix(fen: string, orientation: Color = "white"): BoardCell[][] {
  const rows = new Chess(fen).board();
  const matrix: BoardCell[][] = rows.map((row, r) =>
    row.map((p, c) => {
      const square = `${"abcdefgh"[c]}${8 - r}`;
      if (!p) return { square, piece: null };
      const color: Color = p.color === "w" ? "white" : "black";
      return { square, piece: { type: p.type, color, image: `/pieces/${p.color}${p.type}.png` } };
    }),
  );
  return orientation === "white" ? matrix : matrix.reverse().map((row) => row.reverse());
}
