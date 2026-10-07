import { expect, test } from "vitest";
import { slideToMove } from "./index";

test("white moves first", () => {
    expect(slideToMove("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1")).toBe("white");
});
