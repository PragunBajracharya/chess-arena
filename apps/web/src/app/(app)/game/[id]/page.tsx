import type { Metadata } from "next";
import { RequireAuth } from "@/components/layout/RequireAuth";
import { OnlineGame } from "@/components/game/OnlineGame";

export const metadata: Metadata = { title: "Live game" };

export default async function GamePage({ params }: PageProps<"/game/[id]">) {
  const { id } = await params;
  return (
    <RequireAuth>
      <OnlineGame gameId={id} />
    </RequireAuth>
  );
}
