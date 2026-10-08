import { describe, expect, it } from "vitest";
import { applyMove, START_FEN, toBoardMatrix } from "./index";

describe("applyMove", () => {
  it("accepts a legal move", () => {
    const res = applyMove(START_FEN, { from: "e2", to: "e4" });
    expect(res.ok && res.san).toBe("e4");
  });

  it("rejects an illegal move", () => {
    expect(applyMove(START_FEN, { from: "e2", to: "e5" }).ok).toBe(false);
  });

  it("detects fool's mate", () => {
    let fen = START_FEN;
    const moves = [
      ["f2", "f3"],
      ["e7", "e5"],
      ["g2", "g4"],
      ["d8", "h4"],
    ] as const;
    let outcome = null;
    for (const [from, to] of moves) {
      const res = applyMove(fen, { from, to });
      if (!res.ok) throw new Error(res.error);
      fen = res.fen;
      outcome = res.outcome;
    }
    expect(outcome).toEqual({ result: "0-1", reason: "checkmate" });
  });
});

describe("toBoardMatrix", () => {
  it("flips for black", () => {
    expect(toBoardMatrix(START_FEN, "white")[0]?.[0]?.square).toBe("a8");
    expect(toBoardMatrix(START_FEN, "black")[0]?.[0]?.square).toBe("h1");
  });
});
