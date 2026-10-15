"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TIME_CONTROL_IDS, type TimeControlId } from "@chess/shared";
import { useMatchmaking } from "@/hooks/useMatchmaking";
import { category, clockLabel } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

function Elapsed({ since }: { since: number }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const s = Math.floor((now - since) / 1000);
  return (
    <span className="tabular-nums">
      {Math.floor(s / 60)}:{String(s % 60).padStart(2, "0")}
    </span>
  );
}

/**
 * The time-control tiles. Choosing one joins the rated queue straight away.
 * Tiles look like the face of a chess clock: the time is the headline.
 */
export function QuickPairing({ rating, large = false }: { rating: number; large?: boolean }) {
  const router = useRouter();
  const { status, timeControl, startedAt, error, join, leave } = useMatchmaking((gameId) =>
    router.push(`/game/${gameId}`),
  );
  const searching = status !== "idle";

  return (
    <div>
      <ul
        className={`grid gap-3 ${large ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2 sm:grid-cols-3 xl:grid-cols-5"}`}
      >
        {TIME_CONTROL_IDS.map((tc: TimeControlId) => {
          const isThis = searching && timeControl === tc;
          return (
            <li key={tc}>
              <button
                type="button"
                disabled={searching && !isThis}
                onClick={() => (isThis ? leave() : join(tc))}
                aria-label={
                  isThis
                    ? `Cancel search for ${clockLabel(tc)}`
                    : `Play ${category(tc)} ${clockLabel(tc)}`
                }
                className={`group flex w-full flex-col items-start rounded-[10px] border px-4 text-left transition-colors disabled:opacity-40 ${
                  large ? "py-5" : "py-4"
                } ${
                  isThis
                    ? "border-brass bg-brass/10"
                    : "border-line-strong bg-raised hover:border-brass/70"
                }`}
              >
                <span
                  className={`font-semibold tracking-tight tabular-nums ${large ? "text-[32px]" : "text-[26px]"} leading-none`}
                >
                  {clockLabel(tc)}
                </span>
                <span className="mt-2 flex items-center gap-2 text-[13px] text-muted">
                  {isThis ? (
                    <>
                      <Spinner size={12} /> Searching <Elapsed since={startedAt ?? Date.now()} />
                    </>
                  ) : (
                    category(tc)
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <div aria-live="polite" className="mt-4 min-h-6 text-[13px]">
        {error ? (
          <p className="text-loss">{error}</p>
        ) : searching ? (
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-muted">
            Looking for a player rated near {rating}. The range widens the longer you wait.
            <Button variant="ghost" size="sm" onClick={leave} className="-ml-3">
              Cancel search
            </Button>
          </p>
        ) : (
          <p className="text-muted">
            Rated games. Pick a time control and you join the queue straight away.
          </p>
        )}
      </div>
    </div>
  );
}
