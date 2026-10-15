"use client";

import { useQuery } from "@tanstack/react-query";
import type { GameSummary } from "@chess/shared";
import { RequireAuth } from "@/components/layout/RequireAuth";
import { Panel } from "@/components/ui/Panel";
import { Spinner } from "@/components/ui/Spinner";
import { GamesTable } from "@/components/history/GamesTable";
import { apiGet } from "@/lib/api";

function History() {
  const { data, isPending, isError } = useQuery({
    queryKey: ["games", "me"],
    queryFn: () => apiGet<GameSummary[]>("/api/games/me"),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[32px] leading-tight font-semibold tracking-tight">Game history</h1>
        <p className="mt-1 text-muted">Your last 50 rated games, newest first.</p>
      </div>
      <Panel flush className="pt-1">
        {isPending ? (
          <div className="flex justify-center py-12 text-muted">
            <Spinner />
          </div>
        ) : isError ? (
          <p className="p-5 text-[13px] text-loss">
            Couldn&apos;t load your games. Check that the server is running.
          </p>
        ) : data.length ? (
          <GamesTable games={data} />
        ) : (
          <p className="p-5 text-[13px] text-muted">No finished games yet.</p>
        )}
      </Panel>
    </div>
  );
}

export default function HistoryPage() {
  return (
    <RequireAuth>
      <History />
    </RequireAuth>
  );
}
