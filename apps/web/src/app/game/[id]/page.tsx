import { OnlineGame } from "@/components/game/OnlineGame";

export default async function GamePage({ params }: PageProps<"/game/[id]">) {
  const { id } = await params;
  return <OnlineGame gameId={id} />;
}
