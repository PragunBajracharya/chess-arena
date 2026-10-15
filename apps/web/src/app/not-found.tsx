"use client";

import Link from "next/link";
import { ArrowLeft, Home, Search, Sparkles } from "lucide-react";

export default function NotFound() {
    return (
        <main className="app-shell error-shell">
            <div className="error-orbit orbit-one" />
            <div className="error-orbit orbit-two" />
            <section className="error-card panel">
                <div className="error-piece" aria-hidden="true">
                    ♞
                </div>
                <p className="eyebrow coral">POSITION NOT FOUND</p>
                <h1>That move doesn&apos;t exist.</h1>
                <p className="error-copy">
                    The page you&apos;re looking for has been captured, blundered, or moved to
                    another board.
                </p>
                <div className="error-actions">
                    <Link href="/" className="ghost-button">
                        <Home /> Back to dashboard
                    </Link>
                    <Link href="/play" className="text-button">
                        <Sparkles /> Start a new game
                    </Link>
                </div>
                <div className="error-board" aria-label="Decorative chess board">
                    {Array.from({ length: 32 }, (_, i) => (
                        <span
                            key={i}
                            className={(Math.floor(i / 8) + i) % 2 === 0 ? "light" : "dark"}
                        >
                            {[10, 21].includes(i) ? "♟" : [13, 24].includes(i) ? "♞" : ""}
                        </span>
                    ))}
                </div>
                <Link href="/help" className="error-help">
                    <Search /> Need help finding something?
                </Link>
            </section>
        </main>
    );
}
