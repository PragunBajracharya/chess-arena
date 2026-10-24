"use client";

import { useEffect, useRef } from "react";

/**
 * Game sounds, synthesised with the Web Audio API so there are no audio files
 * to license or load. Browsers only allow audio after the user has interacted
 * with the page; before that, sounds are skipped silently.
 */

export type SoundKind = "move" | "capture" | "check" | "end";

let ctx: AudioContext | null = null;
/** Set from the player's sound setting by PreferencesSync. */
let muted = false;

function audio(): AudioContext | null {
  if (typeof window === "undefined" || !("AudioContext" in window)) return null;
  ctx ??= new AudioContext();
  if (ctx.state === "suspended") void ctx.resume().catch(() => {});
  return ctx;
}

function tone(
  a: AudioContext,
  freq: number,
  start: number,
  length: number,
  type: OscillatorType,
  peak: number,
) {
  const osc = a.createOscillator();
  const gain = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(peak, start + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + length);
  osc.connect(gain).connect(a.destination);
  osc.start(start);
  osc.stop(start + length + 0.02);
}

/** A short burst of filtered noise: the "knock" of a piece on wood. */
function knock(a: AudioContext, start: number, centre: number, length: number, peak: number) {
  const buffer = a.createBuffer(1, Math.ceil(a.sampleRate * length), a.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++)
    data[i] = (Math.random() * 2 - 1) * (1 - i / data.length) ** 3;
  const src = a.createBufferSource();
  const filter = a.createBiquadFilter();
  const gain = a.createGain();
  src.buffer = buffer;
  filter.type = "bandpass";
  filter.frequency.value = centre;
  filter.Q.value = 1.2;
  gain.gain.value = peak;
  src.connect(filter).connect(gain).connect(a.destination);
  src.start(start);
}

export function playSound(kind: SoundKind) {
  if (muted) return;
  const a = audio();
  if (!a || a.state !== "running") return;
  const t = a.currentTime + 0.01;
  switch (kind) {
    case "move":
      knock(a, t, 1800, 0.06, 0.9);
      tone(a, 210, t, 0.07, "sine", 0.25);
      break;
    case "capture":
      knock(a, t, 900, 0.1, 1.2);
      tone(a, 140, t, 0.12, "sine", 0.35);
      break;
    case "check":
      knock(a, t, 1800, 0.06, 0.8);
      tone(a, 660, t + 0.02, 0.09, "triangle", 0.18);
      tone(a, 880, t + 0.12, 0.12, "triangle", 0.18);
      break;
    case "end":
      [523.25, 659.25, 783.99].forEach((f, i) => tone(a, f, t + i * 0.12, 0.35, "triangle", 0.16));
      break;
  }
}

/** Which sound a move makes, from its SAN: check beats capture beats a plain move. */
export function soundFor(san: string): SoundKind {
  if (san.includes("#") || san.includes("+")) return "check";
  if (san.includes("x")) return "capture";
  return "move";
}

export function setMuted(value: boolean) {
  muted = value;
  // Creating the audio context during a click lets later sounds play.
  if (!value) audio();
}

/**
 * Plays a sound whenever a move is added, and once when the game ends.
 * Pass null while the game is still loading: whatever is on the board when it
 * first arrives makes no sound, so opening a game or a finished game is silent.
 */
export function useMoveSounds(sans: string[] | null, ended: boolean | null) {
  const seen = useRef<number | null>(null);
  const wasEnded = useRef<boolean | null>(null);
  const count = sans?.length ?? null;
  const last = sans?.at(-1) ?? null;

  useEffect(() => {
    const prev = seen.current;
    seen.current = count;
    if (prev !== null && count !== null && last && count > prev) playSound(soundFor(last));
  }, [count, last]);

  useEffect(() => {
    const prev = wasEnded.current;
    wasEnded.current = ended;
    if (prev === false && ended === true) setTimeout(() => playSound("end"), 250);
  }, [ended]);
}
