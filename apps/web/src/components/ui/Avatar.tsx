const tones = ["#5b6b8c", "#6f5b8c", "#8c6a5b", "#5b8c7a", "#8c5b6e", "#7a8c5b"];

function initials(name: string) {
  const parts = name
    .trim()
    .split(/[\s_.-]+/)
    .filter(Boolean);
  const letters = parts.length > 1 ? parts[0]![0]! + parts[1]![0]! : name.slice(0, 2);
  return letters.toUpperCase();
}

function tone(name: string) {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return tones[hash % tones.length];
}

interface AvatarProps {
  name: string;
  size?: number;
  /** Shown instead of initials, e.g. a bot icon. */
  icon?: React.ReactNode;
}

export function Avatar({ name, size = 36, icon }: AvatarProps) {
  return (
    <span
      aria-hidden="true"
      className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white"
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.36),
        background: icon ? "var(--color-raised)" : tone(name),
      }}
    >
      {icon ?? initials(name)}
    </span>
  );
}
