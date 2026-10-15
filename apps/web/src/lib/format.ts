import { TIME_CONTROLS, type GameEndReason, type TimeControlId } from "@chess/shared";

export function greeting(date = new Date()) {
  const h = date.getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

/** "3 + 2" style label for a time control. */
export function clockLabel(tc: TimeControlId) {
  const { initialMs, incrementMs } = TIME_CONTROLS[tc];
  return `${initialMs / 60_000} + ${incrementMs / 1000}`;
}

export function category(tc: TimeControlId): "Bullet" | "Blitz" | "Rapid" {
  const min = TIME_CONTROLS[tc].initialMs / 60_000;
  if (min < 3) return "Bullet";
  if (min < 10) return "Blitz";
  return "Rapid";
}

const reasons: Record<GameEndReason, string> = {
  checkmate: "checkmate",
  resignation: "resignation",
  timeout: "time",
  stalemate: "stalemate",
  insufficient_material: "insufficient material",
  threefold_repetition: "repetition",
  fifty_move_rule: "the 50-move rule",
  agreement: "agreement",
  abandoned: "abandonment",
};

export function reasonLabel(reason: GameEndReason) {
  return reasons[reason];
}

export function relativeDate(iso: string, now = new Date()) {
  const then = new Date(iso);
  const mins = Math.round((now.getTime() - then.getTime()) / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return then.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function formatClock(ms: number) {
  const total = Math.max(0, ms);
  if (total < 10_000) return (total / 1000).toFixed(1);
  const sec = Math.ceil(total / 1000);
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
}
