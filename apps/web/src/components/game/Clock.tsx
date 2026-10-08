"use client";

import { useEffect, useState } from "react";

interface ClockProps {
  /** Milliseconds left as of `since` (server snapshot). */
  ms: number;
  running: boolean;
  since?: number | null;
  label: string;
}

export function Clock({ ms, running, since, label }: ClockProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, [running]);

  const left = running && since ? Math.max(0, ms - (now - since)) : ms;
  const totalSec = Math.ceil(left / 1000);
  const text = `${Math.floor(totalSec / 60)}:${String(totalSec % 60).padStart(2, "0")}`;

  return (
    <div className="flex items-center justify-between rounded-md bg-neutral-800 px-4 py-2 text-white">
      <span className="truncate">{label}</span>
      <span
        className={`font-mono text-2xl tabular-nums ${running ? "text-white" : "text-neutral-400"} ${left < 10_000 ? "text-red-400" : ""}`}
      >
        {text}
      </span>
    </div>
  );
}
