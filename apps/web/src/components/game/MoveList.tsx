"use client";

import { useEffect, useRef } from "react";

interface MoveListProps {
  moves: string[];
  /**
   * Index of the highlighted move (0 is White's first move, -1 the start
   * position). Defaults to the last move.
   */
  current?: number;
  /** Makes each move a button that jumps to that position (the review page). */
  onSelect?: (index: number) => void;
}

/** Two-column scoresheet, scrolled to the highlighted move. */
export function MoveList({ moves, current = moves.length - 1, onSelect }: MoveListProps) {
  const box = useRef<HTMLDivElement>(null);
  const pairs: [string, string | undefined][] = [];
  for (let i = 0; i < moves.length; i += 2) pairs.push([moves[i]!, moves[i + 1]]);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    if (!onSelect) {
      el.scrollTop = el.scrollHeight;
      return;
    }
    const cell = el.querySelector<HTMLElement>(`[data-ply="${current}"]`);
    if (!cell) return el.scrollTo({ top: 0 });
    // Keep the highlighted move in view without scrolling the whole page.
    const top = cell.offsetTop - el.clientHeight / 2 + cell.clientHeight / 2;
    el.scrollTo({ top });
  }, [moves.length, current, onSelect]);

  if (!moves.length) {
    return (
      <p className="px-5 py-6 text-[13px] text-muted">Moves appear here as the game is played.</p>
    );
  }

  const cell = (san: string | undefined, ply: number, extra: string) => {
    if (san === undefined) return <td className={extra} />;
    const on = ply === current;
    if (!onSelect) {
      return <td className={`py-1.5 font-medium ${on ? "text-brass" : ""} ${extra}`}>{san}</td>;
    }
    return (
      <td className={`py-0.5 ${extra}`}>
        <button
          type="button"
          data-ply={ply}
          aria-label={`${Math.floor(ply / 2) + 1}${ply % 2 ? "..." : "."} ${san}`}
          aria-current={on ? "step" : undefined}
          onClick={() => onSelect(ply)}
          className={`-ml-2 rounded-md px-2 py-1 font-medium ${
            on ? "bg-brass text-brass-ink" : "hover:bg-raised"
          }`}
        >
          {san}
        </button>
      </td>
    );
  };

  return (
    <div ref={box} className="relative max-h-[320px] overflow-y-auto">
      <table className="w-full text-[14px] tabular-nums">
        <caption className="sr-only">Moves played</caption>
        <tbody>
          {pairs.map(([white, black], i) => (
            <tr key={i} className="odd:bg-raised/50">
              <th scope="row" className="w-12 py-1.5 pl-5 text-left font-normal text-faint">
                {i + 1}
              </th>
              {cell(white, i * 2, "")}
              {cell(black, i * 2 + 1, "pr-5")}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
