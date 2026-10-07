import { Chess } from "chess.js";
import type { Color } from "@chess/shared";

export function slideToMove(fen: string): Color {
    return new Chess(fen).turn() === "w" ? "white" : "black";
}
