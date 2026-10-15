import type { Metadata } from "next";
import { BotGame } from "@/components/game/BotGame";

export const metadata: Metadata = { title: "Play the computer" };

export default function PlayBotPage() {
  return <BotGame />;
}
