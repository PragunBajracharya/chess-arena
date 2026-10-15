"use client";

import Link from "next/link";
import { Bot, Swords, Timer } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { buttonClass } from "@/components/ui/Button";
import { Board } from "@/components/board/Board";
import { PlayerStrip } from "@/components/game/PlayerStrip";
import { useSession } from "@/lib/auth-client";

// Queen's Gambit Declined, a calm and recognisable position.
const QGD = "rnbqkb1r/ppp2ppp/4pn2/3p4/2PP4/2N5/PP2PPPP/R1BQKBNR w KQkq - 2 4";

const features = [
  {
    icon: Swords,
    title: "Rated pairing",
    body: "Choose bullet, blitz or rapid and you are matched with a player near your rating.",
  },
  {
    icon: Timer,
    title: "One official clock",
    body: "The server checks every move and keeps the clock for both players.",
  },
  {
    icon: Bot,
    title: "Practise any time",
    body: "Six computer levels, from beginner to master, running in your browser.",
  },
];

function StaticClock({ value, running }: { value: string; running?: boolean }) {
  return (
    <span
      className={`inline-flex min-w-[88px] justify-end rounded-lg px-3 py-1.5 text-[20px] leading-none font-semibold tabular-nums ${
        running ? "bg-brass text-brass-ink" : "bg-raised text-muted"
      }`}
    >
      {value}
    </span>
  );
}

export default function LandingPage() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex h-20 max-w-[1200px] items-center justify-between px-6 sm:px-10">
        <Logo />
        <nav className="flex items-center gap-2">
          {session ? (
            <Link href="/home" className={buttonClass("primary", "sm")}>
              Open Chess Arena
            </Link>
          ) : (
            <>
              <Link href="/login" className={buttonClass("ghost", "sm")}>
                Log in
              </Link>
              <Link href="/register" className={buttonClass("primary", "sm")}>
                Create account
              </Link>
            </>
          )}
        </nav>
      </header>

      <main className="mx-auto max-w-[1200px] px-6 sm:px-10">
        <section className="grid items-center gap-14 py-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,500px)] lg:py-20">
          <div className="max-w-[560px]">
            <h1 className="text-[40px] leading-[1.08] font-semibold tracking-tight sm:text-[52px]">
              Serious chess against real opponents, on any clock.
            </h1>
            <p className="mt-6 text-[18px] text-muted">
              Rated games from one-minute bullet to fifteen-minute rapid, a rating that moves with
              every result, and a built-in engine for practice.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link href={session ? "/play" : "/register"} className={buttonClass("primary", "lg")}>
                {session ? "Find a game" : "Create a free account"}
              </Link>
              <Link href="/play/bot" className={buttonClass("secondary", "lg")}>
                Play the computer
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-panel p-4 sm:p-5">
            <PlayerStrip
              name="Opponent"
              detail="Rating 1512"
              aside={<StaticClock value="4:41" />}
            />
            <div className="my-3">
              <Board fen={QGD} interactive={false} lastMove={{ from: "g8", to: "f6" }} />
            </div>
            <PlayerStrip
              name="You"
              detail="Rating 1500"
              aside={<StaticClock value="4:56" running />}
            />
          </div>
        </section>

        <section className="grid gap-10 border-t border-line py-16 md:grid-cols-3">
          {features.map(({ icon: Icon, title, body }) => (
            <div key={title}>
              <Icon size={22} className="text-brass" aria-hidden="true" />
              <h2 className="mt-4 text-[18px] font-semibold">{title}</h2>
              <p className="mt-2 text-muted">{body}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-line">
        <p className="mx-auto max-w-[1200px] px-6 py-8 text-[13px] text-faint sm:px-10">
          Chess Arena. Computer opponents are powered by Stockfish 19.
        </p>
      </footer>
    </div>
  );
}
