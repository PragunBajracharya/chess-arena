"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { TIME_CONTROL_IDS, type TimeControlId } from "@chess/shared";
import { useMatchmaking } from "@/hooks/useMatchmaking";
import { category, clockLabel } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

const LAST_PICK_KEY = "chess-arena:time-control";
const DEFAULT_PICK: TimeControlId = "5+0";

function readLastPick(): TimeControlId {
  try {
    const v = localStorage.getItem(LAST_PICK_KEY);
    return v && (TIME_CONTROL_IDS as string[]).includes(v) ? (v as TimeControlId) : DEFAULT_PICK;
  } catch {
    return DEFAULT_PICK;
  }
}

function Elapsed({ since }: { since: number }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const s = Math.max(0, Math.floor((now - since) / 1000));
  return (
    <span className="tabular-nums">
      {Math.floor(s / 60)}:{String(s % 60).padStart(2, "0")}
    </span>
  );
}

/**
 * Time-control tiles plus a Start button. Picking a tile only selects it; the
 * search begins on Start and stops on Cancel. Tiles look like the face of a
 * chess clock: the time is the headline.
 */
export function QuickPairing({ rating, large = false }: { rating: number; large?: boolean }) {
  const router = useRouter();
  const { status, timeControl, startedAt, error, join, leave } = useMatchmaking((gameId) =>
    router.push(`/game/${gameId}`),
  );
  const [picked, setPicked] = useState<TimeControlId>(DEFAULT_PICK);
  const [cancelling, setCancelling] = useState(false);
  const searching = status !== "idle";
  const active = searching ? (timeControl ?? picked) : picked;

  // The last time control you played is preselected next time.
  useEffect(() => setPicked(readLastPick()), []);

  function pick(tc: TimeControlId) {
    setPicked(tc);
    try {
      localStorage.setItem(LAST_PICK_KEY, tc);
    } catch {
      // Storage unavailable: the pick still works for this visit.
    }
  }

  async function cancel() {
    setCancelling(true);
    try {
      await leave();
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div>
      <div
        role="radiogroup"
        aria-label="Time control"
        className={`grid gap-3 ${large ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2 sm:grid-cols-3 2xl:grid-cols-5"}`}
      >
        {TIME_CONTROL_IDS.map((tc) => {
          const on = active === tc;
          return (
            <button
              key={tc}
              type="button"
              role="radio"
              aria-checked={on}
              aria-label={`${category(tc)} ${clockLabel(tc)}`}
              disabled={searching && !on}
              onClick={() => !searching && pick(tc)}
              className={`flex w-full flex-col items-start rounded-[10px] border px-4 text-left transition-colors disabled:opacity-40 ${
                large ? "py-5" : "py-4"
              } ${
                on
                  ? "border-brass bg-brass/10 shadow-[inset_0_0_0_1px_var(--color-brass)]"
                  : "border-line-strong bg-raised hover:border-brass/70"
              } ${searching ? "cursor-default" : ""}`}
            >
              <span
                className={`leading-none font-semibold tracking-tight whitespace-nowrap tabular-nums ${large ? "text-[32px]" : "text-[26px]"}`}
              >
                {clockLabel(tc)}
              </span>
              <span className={`mt-2 text-[13px] ${on ? "text-brass" : "text-muted"}`}>
                {category(tc)}
              </span>
            </button>
          );
        })}
      </div>

      <div
        className={`mt-4 flex flex-col gap-3 rounded-[10px] border px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${
          searching ? "border-brass/50 bg-brass/5" : "border-line bg-raised/40"
        }`}
      >
        <div aria-live="polite" className="min-w-0 text-[14px]">
          {searching ? (
            <>
              <p className="flex items-center gap-2 font-medium">
                <Spinner size={13} /> Searching for a {category(active).toLowerCase()}{" "}
                {clockLabel(active)} game
                <span className="font-normal text-muted">
                  <Elapsed since={startedAt ?? Date.now()} />
                </span>
              </p>
              <p className="mt-0.5 text-[13px] text-muted">
                Looking for a player rated near {rating}. The range widens the longer you wait.
              </p>
            </>
          ) : (
            <>
              <p className="font-medium">
                Rated {category(active).toLowerCase()}, {clockLabel(active)}
              </p>
              <p className="mt-0.5 text-[13px] text-muted">
                Against a player near your rating of {rating}.
              </p>
            </>
          )}
          {error && <p className="mt-1 text-[13px] text-loss">{error}</p>}
        </div>
        {searching ? (
          <Button
            variant="secondary"
            size={large ? "lg" : "md"}
            className="shrink-0"
            disabled={cancelling || status === "matched"}
            onClick={cancel}
          >
            <X size={16} aria-hidden="true" />
            {status === "matched" ? "Opponent found" : cancelling ? "Cancelling" : "Cancel"}
          </Button>
        ) : (
          <Button size={large ? "lg" : "md"} className="shrink-0" onClick={() => join(active)}>
            <Search size={16} aria-hidden="true" /> Start search
          </Button>
        )}
      </div>
    </div>
  );
}
