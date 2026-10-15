import type { ReactNode } from "react";
import { Logo } from "@/components/ui/Logo";
import { Board } from "@/components/board/Board";

// Italian Game after 3...Bc5: a familiar position for the sign-in screen.
const ITALIAN = "r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="flex flex-col px-6 py-6 sm:px-10">
        <Logo />
        <div className="flex flex-1 items-center justify-center py-12">
          <div className="w-full max-w-[380px]">{children}</div>
        </div>
      </div>
      <div className="hidden flex-col justify-center border-l border-line bg-panel px-16 lg:flex">
        <div className="mx-auto w-full max-w-[440px]">
          <Board fen={ITALIAN} interactive={false} lastMove={{ from: "f8", to: "c5" }} />
          <p className="mt-8 text-[18px] font-medium">
            Rated games from one-minute bullet to fifteen-minute rapid.
          </p>
          <p className="mt-2 text-muted">
            Every move is checked by the server, so the clock and the result are the same for both
            players.
          </p>
        </div>
      </div>
    </div>
  );
}
