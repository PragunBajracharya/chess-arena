"use client";

import { useEffect, useState } from "react";

/** Seconds left until `deadline` (epoch ms), as m:ss, updating every second. */
export function Countdown({ deadline }: { deadline: number }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const s = Math.max(0, Math.ceil((deadline - now) / 1000));
  return (
    <span className="font-medium text-text tabular-nums">
      {Math.floor(s / 60)}:{String(s % 60).padStart(2, "0")}
    </span>
  );
}
