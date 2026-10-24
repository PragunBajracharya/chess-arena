import { z } from "zod";

/** Board colour schemes; the colours themselves live in the web app's globals.css. */
export const BOARD_THEMES = ["walnut", "green", "blue", "slate"] as const;
export type BoardTheme = (typeof BOARD_THEMES)[number];

/**
 * Piece sets. "classic" is the PNG set from chess-v2; the rest are SVG sets
 * from the Lichess repository under permissive licences (see public/pieces/LICENSES.md).
 */
export const PIECE_SETS = ["classic", "chessnut", "fantasy", "celtic"] as const;
export type PieceSet = (typeof PIECE_SETS)[number];

export const APP_THEMES = ["dark", "light", "system"] as const;
export type AppTheme = (typeof APP_THEMES)[number];

export const preferencesSchema = z.object({
  theme: z.enum(APP_THEMES),
  boardTheme: z.enum(BOARD_THEMES),
  pieceSet: z.enum(PIECE_SETS),
  sound: z.boolean(),
  /** Promote straight to a queen instead of opening the picker. */
  autoQueen: z.boolean(),
  /** In rated games, ask for confirmation before a move is sent. */
  confirmMoves: z.boolean(),
  showCoordinates: z.boolean(),
});

export type Preferences = z.infer<typeof preferencesSchema>;

export const DEFAULT_PREFERENCES: Preferences = {
  theme: "dark",
  boardTheme: "walnut",
  pieceSet: "classic",
  sound: true,
  autoQueen: false,
  confirmMoves: false,
  showCoordinates: true,
};

/** A partial update, as sent by the settings page. */
export const preferencesPatchSchema = preferencesSchema.partial();

/**
 * Fills gaps from the defaults and drops anything invalid, so a stored value
 * from an older version of the app never breaks the page.
 */
export function normalizePreferences(raw: unknown): Preferences {
  const out: Record<string, unknown> = { ...DEFAULT_PREFERENCES };
  if (raw && typeof raw === "object") {
    for (const [key, field] of Object.entries(preferencesSchema.shape)) {
      const parsed = field.safeParse((raw as Record<string, unknown>)[key]);
      if (parsed.success) out[key] = parsed.data;
    }
  }
  return out as Preferences;
}

/** Usernames: unique, used in profile links. Letters, digits and underscores. */
export const USERNAME_RULES = { min: 3, max: 20, pattern: /^[a-zA-Z0-9_]+$/ } as const;

export function usernameProblem(value: string): string | null {
  if (value.length < USERNAME_RULES.min) return `Use at least ${USERNAME_RULES.min} characters.`;
  if (value.length > USERNAME_RULES.max) return `Use at most ${USERNAME_RULES.max} characters.`;
  if (!USERNAME_RULES.pattern.test(value)) return "Use only letters, numbers and underscores.";
  return null;
}
