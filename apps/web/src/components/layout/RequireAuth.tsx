"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { Spinner } from "@/components/ui/Spinner";

/** Renders children only for signed-in users; sends everyone else to log in. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isPending && !session) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [isPending, session, router, pathname]);

  if (!session) {
    return (
      <div className="flex justify-center py-24 text-muted">
        <Spinner size={20} />
      </div>
    );
  }
  return <>{children}</>;
}
