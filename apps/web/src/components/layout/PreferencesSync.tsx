"use client";

import { useEffect, useState } from "react";
import { normalizePreferences } from "@chess/shared";
import { apiGet } from "@/lib/api";
import { useSession } from "@/lib/auth-client";
import { readCache, resolvedTheme, usePreferencesStore } from "@/lib/preferences";
import { setMuted } from "@/lib/sounds";

/**
 * Loads the signed-in player's saved settings and applies settings to the page:
 * theme and board colours as attributes on <html> (read by globals.css), and the
 * sound switch. Renders nothing.
 */
export function PreferencesSync() {
  const { data: session, isPending } = useSession();
  const userId = session?.user.id ?? null;
  const prefs = usePreferencesStore((s) => s.prefs);
  // Until the cached copy is loaded, the boot script in <head> has already set
  // the right theme; applying the defaults here would make it flicker.
  const [cacheLoaded, setCacheLoaded] = useState(false);

  useEffect(() => {
    usePreferencesStore.setState({ prefs: readCache() });
    setCacheLoaded(true);
  }, []);

  useEffect(() => {
    if (isPending) return;
    const { hydrate, prefs: current } = usePreferencesStore.getState();
    if (!userId) {
      hydrate(current, false);
      return;
    }
    let cancelled = false;
    apiGet<unknown>("/api/me/preferences")
      .then((saved) => !cancelled && hydrate(normalizePreferences(saved), true))
      .catch(() => {
        // Server unreachable: keep the cached copy, but still save changes when it's back.
        if (!cancelled) usePreferencesStore.setState({ signedIn: true });
      });
    return () => {
      cancelled = true;
    };
  }, [userId, isPending]);

  useEffect(() => {
    if (!cacheLoaded) return;
    const root = document.documentElement;
    const apply = () => {
      root.dataset.theme = resolvedTheme(prefs.theme);
      root.dataset.board = prefs.boardTheme;
    };
    apply();
    setMuted(!prefs.sound);
    if (prefs.theme !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: light)");
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [cacheLoaded, prefs.theme, prefs.boardTheme, prefs.sound]);

  return null;
}
