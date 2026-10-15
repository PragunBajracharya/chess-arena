"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bot,
  GraduationCap,
  History,
  House,
  Menu,
  MessageSquare,
  Puzzle,
  Swords,
  Tv,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { buttonClass } from "@/components/ui/Button";
import { useSession } from "@/lib/auth-client";
import { useConnection } from "@/hooks/useConnection";
import { UserMenu } from "./UserMenu";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const playNav: NavItem[] = [
  { href: "/home", label: "Home", icon: House },
  { href: "/play", label: "Play online", icon: Swords },
  { href: "/play/bot", label: "Play the computer", icon: Bot },
  { href: "/history", label: "Game history", icon: History },
];

/** Shown so the roadmap is visible, but not clickable until built. */
const soonNav: Omit<NavItem, "href">[] = [
  { label: "Puzzles", icon: Puzzle },
  { label: "Lessons", icon: GraduationCap },
  { label: "Watch", icon: Tv },
  { label: "Friends", icon: Users },
  { label: "Messages", icon: MessageSquare },
];

const titles: [string, string][] = [
  ["/play/bot", "Play the computer"],
  ["/play", "Play online"],
  ["/history", "Game history"],
  ["/game/", "Live game"],
  ["/home", "Home"],
];

function isActive(pathname: string, href: string) {
  if (href === "/play") return pathname === "/play";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function Sidebar({ onNavigate, signedIn }: { onNavigate?: () => void; signedIn: boolean }) {
  const pathname = usePathname();
  const connected = useConnection(signedIn);

  return (
    <div className="flex h-full flex-col">
      <div className="px-5 pt-5 pb-6">
        <Logo href={signedIn ? "/home" : "/"} />
      </div>

      <nav aria-label="Main" className="flex-1 overflow-y-auto px-3">
        <ul className="space-y-0.5">
          {playNav.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] transition-colors ${
                    active
                      ? "bg-raised font-medium text-text before:absolute before:top-2 before:bottom-2 before:left-0 before:w-[3px] before:rounded-full before:bg-brass"
                      : "text-muted hover:bg-raised/60 hover:text-text"
                  }`}
                >
                  <Icon size={18} aria-hidden="true" className={active ? "text-brass" : ""} />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>

        <p className="mt-8 mb-2 px-3 text-[13px] text-faint">Coming soon</p>
        <ul className="space-y-0.5">
          {soonNav.map(({ label, icon: Icon }) => (
            <li
              key={label}
              aria-disabled="true"
              className="flex items-center gap-3 px-3 py-2 text-[15px] text-faint"
            >
              <Icon size={18} aria-hidden="true" />
              {label}
            </li>
          ))}
        </ul>
      </nav>

      {signedIn && (
        <p className="flex items-center gap-2 border-t border-line px-6 py-4 text-[13px] text-muted">
          <span
            aria-hidden="true"
            className={`size-2 rounded-full ${connected ? "bg-win" : "bg-faint"}`}
          />
          {connected ? "Connected" : "Connecting to server"}
        </p>
      )}
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { data: session, isPending } = useSession();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const title = titles.find(([prefix]) => pathname.startsWith(prefix))?.[1] ?? "";

  useEffect(() => setDrawerOpen(false), [pathname]);

  return (
    <div className="min-h-screen lg:pl-[248px]">
      <aside className="fixed inset-y-0 left-0 hidden w-[248px] border-r border-line bg-panel lg:block">
        <Sidebar signedIn={!!session} />
      </aside>

      {drawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-black/60"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-[272px] border-r border-line bg-panel">
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setDrawerOpen(false)}
              className="absolute top-5 right-3 rounded-lg p-1.5 text-muted hover:bg-raised"
            >
              <X size={18} aria-hidden="true" />
            </button>
            <Sidebar signedIn={!!session} onNavigate={() => setDrawerOpen(false)} />
          </aside>
        </div>
      )}

      <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-line bg-ink/90 px-4 backdrop-blur sm:px-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setDrawerOpen(true)}
            className="rounded-lg p-2 text-muted hover:bg-raised lg:hidden"
          >
            <Menu size={20} aria-hidden="true" />
          </button>
          <p className="text-[15px] font-medium">{title}</p>
        </div>
        {isPending ? null : session ? (
          <UserMenu name={session.user.name} rating={session.user.rating} />
        ) : (
          <div className="flex items-center gap-2">
            <Link href="/login" className={buttonClass("ghost", "sm")}>
              Log in
            </Link>
            <Link href="/register" className={buttonClass("primary", "sm")}>
              Create account
            </Link>
          </div>
        )}
      </header>

      <main className="mx-auto w-full max-w-[1200px] px-4 py-8 sm:px-8 sm:py-10">{children}</main>
    </div>
  );
}
