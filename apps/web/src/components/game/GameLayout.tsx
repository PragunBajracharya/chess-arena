import type { ReactNode } from "react";

interface GameLayoutProps {
  top: ReactNode;
  board: ReactNode;
  bottom: ReactNode;
  side: ReactNode;
}

/** Board column (opponent above, you below) and a side panel. */
export function GameLayout({ top, board, bottom, side }: GameLayoutProps) {
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="mx-auto flex w-full max-w-[min(680px,calc(100vh-240px))] min-w-[280px] flex-col gap-3">
        {top}
        {board}
        {bottom}
      </div>
      <aside className="flex flex-col gap-4 lg:sticky lg:top-24">{side}</aside>
    </div>
  );
}

/** One line under the panel title saying what is happening now. */
export function StatusLine({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "accent" | "win" | "loss";
  children: ReactNode;
}) {
  const color = {
    neutral: "text-muted",
    accent: "text-brass",
    win: "text-win",
    loss: "text-loss",
  }[tone];
  return (
    <p aria-live="polite" className={`text-[15px] font-medium ${color}`}>
      {children}
    </p>
  );
}
