"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Bot, MailWarning, Settings2 } from "lucide-react";
import type { GameState, GameSummary } from "@chess/shared";
import { RequireAuth } from "@/components/layout/RequireAuth";
import { Panel } from "@/components/ui/Panel";
import { buttonClass } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { QuickPairing } from "@/components/play/QuickPairing";
import { ContinueGame } from "@/components/home/ContinueGame";
import { GamesTable } from "@/components/history/GamesTable";
import { useSession } from "@/lib/auth-client";
import { apiGet } from "@/lib/api";
import { greeting } from "@/lib/format";

function Stat({ label, value }: { label: string; value: string | number }) {
    return (
        <div>
            <dt className="text-[13px] text-muted">{label}</dt>
            <dd className="mt-0.5 text-[24px] leading-tight font-semibold tabular-nums">{value}</dd>
        </div>
    );
}

function Dashboard() {
    const { data: session } = useSession();
    const user = session!.user;
    const history = useQuery({
        queryKey: ["games", "me"],
        queryFn: () => apiGet<GameSummary[]>("/api/games/me"),
    });
    const active = useQuery({
        queryKey: ["games", "active"],
        queryFn: () => apiGet<GameState | null>("/api/games/active"),
    });

    const games = history.data ?? [];
    const wins = games.filter((g) => g.outcome === "win").length;
    const draws = games.filter((g) => g.outcome === "draw").length;
    const losses = games.filter((g) => g.outcome === "loss").length;
    const firstName = user.name.split(" ")[0];

    return (
        <div className="space-y-8">
            {!user.emailVerified && (
                <p className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-line bg-panel px-4 py-3 text-[14px]">
                    <MailWarning size={16} className="text-brass" aria-hidden="true" />
                    <span className="mr-auto">
                        Confirm your email so you can reset your password if you forget it.
                    </span>
                    <Link href="/settings" className="font-medium text-brass hover:underline">
                        Confirm in Settings
                    </Link>
                </p>
            )}
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                <div>
                    <h1 className="text-[32px] leading-tight font-semibold tracking-tight">
                        {greeting()}, {firstName}
                    </h1>
                    <p className="mt-1 text-muted">
                        Pick a time control and start a search, or practise against the computer.
                    </p>
                </div>
                <dl className="flex gap-10">
                    <Stat label="Rating" value={user.rating} />
                    <Stat label="Games" value={games.length} />
                    <Stat label="Won, drawn, lost" value={`${wins} / ${draws} / ${losses}`} />
                </dl>
            </div>

            <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
                <Panel
                    title="Quick pairing"
                    action={
                        <Link href="/play" className={buttonClass("ghost", "sm")}>
                            <Settings2 size={15} aria-hidden="true" /> All options
                        </Link>
                    }
                >
                    <QuickPairing rating={user.rating} />
                    <div className="mt-5 flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="font-medium">Practise against the computer</p>
                            <p className="text-[13px] text-muted">
                                Six levels, from beginner to master. Unrated, no account needed.
                            </p>
                        </div>
                        <Link
                            href="/play/bot"
                            className={buttonClass("secondary", "md", "shrink-0")}
                        >
                            <Bot size={16} aria-hidden="true" /> Play the computer
                        </Link>
                    </div>
                </Panel>

                <Panel title="Continue playing">
                    {active.isPending ? (
                        <div className="flex justify-center py-10 text-muted">
                            <Spinner />
                        </div>
                    ) : active.data ? (
                        <ContinueGame game={active.data} userId={user.id} />
                    ) : (
                        <div className="py-6">
                            <p className="font-medium">No game in progress</p>
                            <p className="mt-1 text-[13px] text-muted">
                                When you start a game it shows here, so you can get back to it from
                                any page.
                            </p>
                        </div>
                    )}
                </Panel>
            </div>

            <Panel
                title="Recent games"
                flush
                action={
                    games.length > 5 ? (
                        <Link href="/history" className={buttonClass("ghost", "sm")}>
                            View all {games.length}
                        </Link>
                    ) : null
                }
            >
                {history.isPending ? (
                    <div className="flex justify-center py-10 text-muted">
                        <Spinner />
                    </div>
                ) : history.isError ? (
                    <p className="px-5 pb-5 text-[13px] text-loss">
                        Couldn&apos;t load your games. Check that the server is running.
                    </p>
                ) : games.length ? (
                    <GamesTable games={games.slice(0, 5)} />
                ) : (
                    <p className="px-5 pb-6 text-[13px] text-muted">
                        No finished games yet. Results and rating changes appear here after your
                        first game.
                    </p>
                )}
            </Panel>
        </div>
    );
}

export default function HomePage() {
    return (
        <RequireAuth>
            <Dashboard />
        </RequireAuth>
    );
}
