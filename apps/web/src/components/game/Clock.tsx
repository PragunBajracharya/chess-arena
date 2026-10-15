"use client";

import { useEffect, useState } from "react";
import { formatClock } from "@/lib/format";

interface ClockProps {
  /** Milliseconds left as of `since` (server snapshot). */
  ms: number;
  running: boolean;
  since?: number | null;
}

export function Clock({ ms, running, since }: ClockProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, [running]);

  const left = running && since ? Math.max(0, ms - (now - since)) : ms;
  const low = left < 20_000;

  const tone = running
    ? low
      ? "bg-loss text-brass-ink"
      : "bg-brass text-brass-ink"
    : "bg-raised text-muted";

  return (
    <span
      role="timer"
      aria-live="off"
      className={`inline-flex min-w-[104px] justify-end rounded-lg px-3 py-1.5 text-[24px] leading-none font-semibold tabular-nums ${tone}`}
    >
      {formatClock(left)}
    </span>
  );
}
