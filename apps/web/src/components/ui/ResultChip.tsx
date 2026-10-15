import type { GameSummary } from "@chess/shared";

const styles: Record<GameSummary["outcome"], string> = {
  win: "bg-win/15 text-win",
  loss: "bg-loss/15 text-loss",
  draw: "bg-draw/15 text-draw",
};

const labels: Record<GameSummary["outcome"], string> = { win: "Win", loss: "Loss", draw: "Draw" };

export function ResultChip({ outcome }: { outcome: GameSummary["outcome"] }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-[13px] font-medium ${styles[outcome]}`}
    >
      {labels[outcome]}
    </span>
  );
}

export function RatingDelta({ before, after }: { before: number; after: number }) {
  const delta = after - before;
  const color = delta > 0 ? "text-win" : delta < 0 ? "text-loss" : "text-muted";
  return (
    <span className={`tabular-nums ${color}`}>
      {delta > 0 ? "+" : delta < 0 ? "−" : "±"}
      {Math.abs(delta)}
    </span>
  );
}
