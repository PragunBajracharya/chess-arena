import { create } from "zustand";
import type { Color, GameOverPayload, GameState } from "@chess/shared";

interface OnlineGameStore {
  game: GameState | null;
  myColor: Color | null;
  drawOfferFrom: Color | null;
  gameOver: GameOverPayload | null;
  error: string | null;
  set: (patch: Partial<Omit<OnlineGameStore, "set" | "reset">>) => void;
  reset: () => void;
}

const initial = { game: null, myColor: null, drawOfferFrom: null, gameOver: null, error: null };

export const useOnlineGameStore = create<OnlineGameStore>((set) => ({
  ...initial,
  set: (patch) => set(patch),
  reset: () => set(initial),
}));
