"use client";

import Link from "next/link";
import { MATCHMAKING } from "@chess/shared";
import { RequireAuth } from "@/components/layout/RequireAuth";
import { Panel } from "@/components/ui/Panel";
import { buttonClass } from "@/components/ui/Button";
import { QuickPairing } from "@/components/play/QuickPairing";
import { useSession } from "@/lib/auth-client";

function Lobby() {
    const { data: session } = useSession();
    const rating = session!.user.rating;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-[32px] leading-tight font-semibold tracking-tight">
                    Play online
                </h1>
                <p className="mt-1 text-muted">
                    Rated games against players near your rating of {rating}.
                </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                <Panel
                    title="Choose a time control"
                    description="Minutes per player, plus seconds added after each move. Pick one, then start the search."
                >
                    <QuickPairing rating={rating} large />
                </Panel>

                <Panel title="How pairing works">
                    <ul className="space-y-3 text-[14px] text-muted">
                        <li>
                            You start matched against players within{" "}
                            {MATCHMAKING.initialRatingWindow} points of your rating.
                        </li>
                        <li>
                            The range widens by {MATCHMAKING.windowGrowthPerSecond} points every
                            second you wait, up to {MATCHMAKING.maxRatingWindow}.
                        </li>
                        <li>You can cancel at any time before an opponent is found.</li>
                        <li>
                            Colours are assigned at random. Each side has 30 seconds to make a first
                            move, or the game is aborted.
                        </li>
                    </ul>
                    <div className="mt-5 border-t border-line pt-5">
                        <Link href="/play/bot" className={buttonClass("secondary", "md", "w-full")}>
                            Play the computer instead
                        </Link>
                    </div>
                </Panel>
            </div>
        </div>
    );
}

export default function PlayOnlinePage() {
    return (
        <RequireAuth>
            <Lobby />
        </RequireAuth>
    );
}
