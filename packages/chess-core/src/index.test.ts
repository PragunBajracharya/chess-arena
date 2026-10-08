import { expect, test } from "vitest";
import { sideToMove } from "./index";

test("white moves first", () => {
    expect(sideToMove("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1")).toBe("white");
});
