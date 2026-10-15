import type { GameSummary } from "@chess/shared";
import { Avatar } from "@/components/ui/Avatar";
import { RatingDelta, ResultChip } from "@/components/ui/ResultChip";
import { category, clockLabel, reasonLabel, relativeDate } from "@/lib/format";

/** Finished games as a scoresheet-style table. */
export function GamesTable({ games }: { games: GameSummary[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-[14px]">
        <thead>
          <tr className="border-b border-line text-[13px] text-muted">
            <th scope="col" className="py-3 pl-5 font-normal">
              Result
            </th>
            <th scope="col" className="py-3 font-normal">
              Opponent
            </th>
            <th scope="col" className="py-3 font-normal">
              Time control
            </th>
            <th scope="col" className="py-3 text-right font-normal">
              Moves
            </th>
            <th scope="col" className="py-3 text-right font-normal">
              Rating
            </th>
            <th scope="col" className="py-3 pr-5 text-right font-normal">
              Played
            </th>
          </tr>
        </thead>
        <tbody>
          {games.map((g) => (
            <tr key={g.id} className="border-b border-line last:border-0">
              <td className="py-3 pl-5">
                <div className="flex items-center gap-3">
                  <ResultChip outcome={g.outcome} />
                  <span className="text-[13px] text-muted">by {reasonLabel(g.endReason)}</span>
                </div>
              </td>
              <td className="py-3">
                <div className="flex items-center gap-2.5">
                  <Avatar name={g.opponent.name} size={28} />
                  <span className="font-medium">{g.opponent.name}</span>
                  <span className="text-[13px] text-muted">
                    as {g.color === "white" ? "Black" : "White"}
                  </span>
                </div>
              </td>
              <td className="py-3 tabular-nums">
                {clockLabel(g.timeControl)}
                <span className="ml-2 text-[13px] text-muted">{category(g.timeControl)}</span>
              </td>
              <td className="py-3 text-right tabular-nums">{g.moveCount}</td>
              <td className="py-3 text-right">
                <span className="mr-2 tabular-nums">{g.ratingAfter}</span>
                <RatingDelta before={g.ratingBefore} after={g.ratingAfter} />
              </td>
              <td className="py-3 pr-5 text-right text-muted">{relativeDate(g.endedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
