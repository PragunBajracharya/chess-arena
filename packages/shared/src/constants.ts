export const DEFAULT_RATING = 400;

/** Rating window used by matchmaking; widens the longer a player waits. */
export const MATCHMAKING = {
  initialRatingWindow: 100,
  windowGrowthPerSecond: 10,
  maxRatingWindow: 600,
} as const;

export const TIME_CONTROLS = {
  "1+0": { label: "Bullet 1 min", initialMs: 60_000, incrementMs: 0 },
  "3+2": { label: "Blitz 3|2", initialMs: 180_000, incrementMs: 2_000 },
  "5+0": { label: "Blitz 5 min", initialMs: 300_000, incrementMs: 0 },
  "10+0": { label: "Rapid 10 min", initialMs: 600_000, incrementMs: 0 },
  "15+10": { label: "Rapid 15|10", initialMs: 900_000, incrementMs: 10_000 },
} as const;

export type TimeControlId = keyof typeof TIME_CONTROLS;
export const TIME_CONTROL_IDS = Object.keys(TIME_CONTROLS) as TimeControlId[];

/** Stockfish "Skill Level" (0–20) and think time per bot level. */
export const BOT_LEVELS = [
  { level: 1, name: "Beginner", skill: 0, movetimeMs: 100, approxRating: 400 },
  { level: 2, name: "Casual", skill: 3, movetimeMs: 200, approxRating: 800 },
  { level: 3, name: "Intermediate", skill: 8, movetimeMs: 300, approxRating: 1200 },
  { level: 4, name: "Advanced", skill: 13, movetimeMs: 500, approxRating: 1700 },
  { level: 5, name: "Expert", skill: 17, movetimeMs: 800, approxRating: 2200 },
  { level: 6, name: "Master", skill: 20, movetimeMs: 1500, approxRating: 2800 },
] as const;

export type BotLevel = (typeof BOT_LEVELS)[number];
