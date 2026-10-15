"use client";

import Link from "next/link";
import { signOut, useSession } from "@/lib/auth-client";

export function Header() {
    const { data: session, isPending } = useSession();

    return !isPending && session ? (
        <header className="flex items-center justify-between border-b border-neutral-200 px-6 py-3 dark:border-neutral-800">
            <nav className="flex items-center gap-6">
                <Link href="/" className="text-lg font-bold">
                    ♞ Chess Arena
                </Link>
                <Link href="/play">Play online</Link>
                <Link href="/play/bot">Play bot</Link>
            </nav>
            <div className="flex items-center gap-4 text-sm">
                {isPending ? null : session ? (
                    <>
                        <span>
                            {session.user.name} · {session.user.rating}
                        </span>
                        <button className="btn" onClick={() => signOut()}>
                            Sign out
                        </button>
                    </>
                ) : (
                    <>
                        <Link href="/login">Log in</Link>
                        <Link href="/register" className="btn">
                            Sign up
                        </Link>
                    </>
                )}
            </div>
        </header>
    ) : (
        <></>
    );
}
