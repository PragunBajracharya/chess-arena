import Link from "next/link";
import { ChessKnight } from "lucide-react";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2.5 rounded-md">
      <span className="inline-flex size-8 items-center justify-center rounded-lg bg-brass text-brass-ink">
        <ChessKnight size={18} strokeWidth={2.25} aria-hidden="true" />
      </span>
      <span className="text-[17px] font-semibold tracking-tight">Chess Arena</span>
    </Link>
  );
}
