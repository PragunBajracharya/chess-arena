"use client";

import { useEffect, useState } from "react";
import type { Preferences } from "@chess/shared";
import { RequireAuth } from "@/components/layout/RequireAuth";
import { ProfileSection } from "@/components/settings/ProfileSection";
import { AccountSection } from "@/components/settings/AccountSection";
import { AppearanceSection } from "@/components/settings/AppearanceSection";
import { Panel } from "@/components/ui/Panel";
import { Toggle } from "@/components/ui/Toggle";
import { usePreferences, usePreferencesStore } from "@/lib/preferences";
import { setMuted } from "@/lib/sounds";

function Settings() {
  const prefs = usePreferences();
  const update = usePreferencesStore((s) => s.update);
  const [status, setStatus] = useState<{ kind: "saved" | "error"; text: string } | null>(null);
  const [justVerified, setJustVerified] = useState(false);

  useEffect(() => {
    setJustVerified(new URLSearchParams(window.location.search).get("verified") === "1");
  }, []);

  // Every change saves straight away; the line under the title says how it went.
  async function save(patch: Partial<Preferences>) {
    if (patch.sound !== undefined) setMuted(!patch.sound);
    const error = await update(patch);
    setStatus(error ? { kind: "error", text: error } : { kind: "saved", text: "Saved" });
  }

  useEffect(() => {
    if (status?.kind !== "saved") return;
    const id = setTimeout(() => setStatus(null), 2000);
    return () => clearTimeout(id);
  }, [status]);

  return (
    <div className="mx-auto max-w-[880px] space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[32px] leading-tight font-semibold tracking-tight">Settings</h1>
          <p className="mt-1 text-muted">
            Your profile, sign-in, and how the board looks and plays.
          </p>
        </div>
        <p
          aria-live="polite"
          className={`min-h-6 text-[13px] ${status?.kind === "error" ? "text-loss" : "text-muted"}`}
        >
          {status?.text}
        </p>
      </div>

      <ProfileSection />
      <AppearanceSection save={save} />

      <Panel title="Gameplay">
        <div className="-my-3.5 divide-y divide-line">
          <Toggle
            label="Sounds"
            description="Moves, captures, checks and the end of a game."
            checked={prefs.sound}
            onChange={(sound) => save({ sound })}
          />
          <Toggle
            label="Always promote to a queen"
            description="Skip the piece picker. Turn off when you want a knight."
            checked={prefs.autoQueen}
            onChange={(autoQueen) => save({ autoQueen })}
          />
          <Toggle
            label="Confirm moves in rated games"
            description="Show each move on the board first and send it when you press Confirm. Your clock keeps running."
            checked={prefs.confirmMoves}
            onChange={(confirmMoves) => save({ confirmMoves })}
          />
          <Toggle
            label="Board coordinates"
            description="Files and ranks along the edge of the board."
            checked={prefs.showCoordinates}
            onChange={(showCoordinates) => save({ showCoordinates })}
          />
        </div>
      </Panel>

      <AccountSection justVerified={justVerified} />
    </div>
  );
}

export default function SettingsPage() {
  return (
    <RequireAuth>
      <Settings />
    </RequireAuth>
  );
}
