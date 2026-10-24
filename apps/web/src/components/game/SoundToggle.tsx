"use client";

import { Volume2, VolumeX } from "lucide-react";
import { usePreferences, usePreferencesStore } from "@/lib/preferences";
import { setMuted } from "@/lib/sounds";

/** Quick sound switch in game panels; the same setting as on the Settings page. */
export function SoundToggle() {
  const { sound } = usePreferences();
  const update = usePreferencesStore((s) => s.update);
  return (
    <button
      type="button"
      onClick={() => {
        setMuted(sound);
        void update({ sound: !sound });
      }}
      aria-pressed={sound}
      aria-label={sound ? "Turn sounds off" : "Turn sounds on"}
      title={sound ? "Sounds on" : "Sounds off"}
      className="rounded-md p-1.5 text-muted hover:bg-raised hover:text-text"
    >
      {sound ? <Volume2 size={16} aria-hidden="true" /> : <VolumeX size={16} aria-hidden="true" />}
    </button>
  );
}
