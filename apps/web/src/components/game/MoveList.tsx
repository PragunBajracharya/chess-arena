"use client";

import { useEffect, useRef } from "react";

/** Two-column scoresheet, scrolled to the latest move. */
export function MoveList({ moves }: { moves: string[] }) {
  const box = useRef<HTMLDivElement>(null);
  const pairs: [string, string | undefined][] = [];
  for (let i = 0; i < moves.length; i += 2) pairs.push([moves[i]!, moves[i + 1]]);

  useEffect(() => {
    if (box.current) box.current.scrollTop = box.current.scrollHeight;
  }, [moves.length]);

  if (!moves.length) {
    return (
      <p className="px-5 py-6 text-[13px] text-muted">Moves appear here as the game is played.</p>
    );
  }

  return (
    <div ref={box} className="max-h-[320px] overflow-y-auto">
      <table className="w-full text-[14px] tabular-nums">
        <caption className="sr-only">Moves played</caption>
        <tbody>
          {pairs.map(([white, black], i) => {
            const isLastRow = i === pairs.length - 1;
            const lastIsWhite = moves.length % 2 === 1;
            return (
              <tr key={i} className="odd:bg-raised/50">
                <th scope="row" className="w-12 py-1.5 pl-5 text-left font-normal text-faint">
                  {i + 1}
                </th>
                <td
                  className={`py-1.5 font-medium ${isLastRow && lastIsWhite ? "text-brass" : ""}`}
                >
                  {white}
                </td>
                <td
                  className={`py-1.5 pr-5 font-medium ${isLastRow && !lastIsWhite ? "text-brass" : ""}`}
                >
                  {black ?? ""}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
