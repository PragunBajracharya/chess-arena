"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TIME_CONTROLS, TIME_CONTROL_IDS, type TimeControlId } from "@chess/shared";
import { useSession } from "@/lib/auth-client";
import { useMatchmaking } from "@/hooks/useMatchmaking";

export default function PlayOnlinePage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [tc, setTc] = useState<TimeControlId>("5+0");

  const onMatched = useCallback((gameId: string) => router.push(`/game/${gameId}`), [router]);

  useEffect(() => {
    if (!isPending && !session) router.replace("/login");
  }, [isPending, session, router]);

  if (!session) return null;
  return <Lobby tc={tc} setTc={setTc} onMatched={onMatched} />;
}

function Lobby({
  tc,
  setTc,
  onMatched,
}: {
  tc: TimeControlId;
  setTc: (tc: TimeControlId) => void;
  onMatched: (gameId: string) => void;
}) {
  const { status, error, join, leave } = useMatchmaking(onMatched);

  return (
    <section className="mx-auto flex max-w-md flex-col gap-6 px-6 py-16">
      <h1 className="text-3xl font-bold">Play online</h1>
      <div className="grid grid-cols-2 gap-3">
        {TIME_CONTROL_IDS.map((id) => (
          <button
            key={id}
            disabled={status === "searching"}
            onClick={() => setTc(id)}
            className={`rounded-md border p-3 ${tc === id ? "border-[#779556] bg-[#779556]/10" : "border-neutral-300 dark:border-neutral-700"}`}
          >
            {TIME_CONTROLS[id].label}
          </button>
        ))}
      </div>
      {status === "searching" ? (
        <button className="btn" onClick={leave}>
          Searching… (cancel)
        </button>
      ) : (
        <button className="btn" onClick={() => join(tc)}>
          Find opponent
        </button>
      )}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </section>
  );
}
