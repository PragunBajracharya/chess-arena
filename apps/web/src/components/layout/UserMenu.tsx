"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, History, LogOut } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { signOut } from "@/lib/auth-client";
import { resetSocket } from "@/lib/socket";

export function UserMenu({ name, rating }: { name: string; rating: number }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-3 rounded-lg py-1 pr-2 pl-1 hover:bg-raised"
      >
        <Avatar name={name} size={32} />
        <span className="hidden text-left sm:block">
          <span className="block text-[14px] leading-tight font-medium">{name}</span>
          <span className="block text-[12px] leading-tight text-muted tabular-nums">
            Rating {rating}
          </span>
        </span>
        <ChevronDown size={16} className="text-muted" aria-hidden="true" />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-52 rounded-xl border border-line bg-panel p-1.5 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.7)]"
        >
          <Link
            role="menuitem"
            href="/history"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[14px] hover:bg-raised"
          >
            <History size={16} className="text-muted" aria-hidden="true" />
            Game history
          </Link>
          <button
            role="menuitem"
            type="button"
            onClick={async () => {
              resetSocket();
              await signOut();
              router.push("/");
            }}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[14px] hover:bg-raised"
          >
            <LogOut size={16} className="text-muted" aria-hidden="true" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
