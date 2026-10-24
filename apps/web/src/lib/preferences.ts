"use client";

import { create } from "zustand";
import {
  DEFAULT_PREFERENCES,
  normalizePreferences,
  type Color,
  type PieceSet,
  type Preferences,
} from "@chess/shared";
import { env } from "./env";
import { PREFS_STORAGE_KEY } from "./theme-boot";

/**
 * Board, piece, sound and theme settings. The server is the source of truth for
 * signed-in players (saved per user); a copy in localStorage lets the theme
 * apply before the first paint and covers signed-out visitors.
 */

export function readCache(): Preferences {
  try {
    return normalizePreferences(JSON.parse(localStorage.getItem(PREFS_STORAGE_KEY) ?? "null"));
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

function writeCache(prefs: Preferences) {
  try {
    localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Storage blocked: settings still apply for this page and are saved on the server.
  }
}

interface PreferencesStore {
  prefs: Preferences;
  /** True once the signed-in player's saved settings have arrived. */
  synced: boolean;
  signedIn: boolean;
  /** Changes settings now and saves them; resolves with an error message on failure. */
  update: (patch: Partial<Preferences>) => Promise<string | null>;
  hydrate: (prefs: Preferences, signedIn: boolean) => void;
}

export const usePreferencesStore = create<PreferencesStore>((set, get) => ({
  // Defaults on first render on both server and client (so hydration matches);
  // PreferencesSync swaps in the cached copy straight after.
  prefs: DEFAULT_PREFERENCES,
  synced: false,
  signedIn: false,
  hydrate: (prefs, signedIn) => {
    writeCache(prefs);
    set({ prefs, synced: signedIn, signedIn });
  },
  update: async (patch) => {
    const before = get().prefs;
    const next = { ...before, ...patch };
    set({ prefs: next });
    writeCache(next);
    if (!get().signedIn) return null;
    try {
      const res = await fetch(`${env.serverUrl}/api/me/preferences`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error(String(res.status));
      return null;
    } catch {
      // Put back what was there, unless something else changed it meanwhile.
      if (get().prefs === next) {
        set({ prefs: before });
        writeCache(before);
      }
      return "Couldn't save that setting. Check your connection and try again.";
    }
  },
}));

export function usePreferences() {
  return usePreferencesStore((s) => s.prefs);
}

export function resolvedTheme(theme: Preferences["theme"]): "dark" | "light" {
  if (theme !== "system") return theme;
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
}

/** URL of a piece image in the chosen set. */
export function pieceSrc(set: PieceSet, color: Color | "w" | "b", type: string) {
  const c = color === "white" || color === "w" ? "w" : "b";
  return set === "classic" ? `/pieces/${c}${type}.png` : `/pieces/${set}/${c}${type}.svg`;
}
