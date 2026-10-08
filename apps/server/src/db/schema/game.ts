import { index, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import type { GameEndReason, GameResult, MoveRecord, TimeControlId } from "@chess/shared";
import { user } from "./auth";

/** Finished games. Active games live in Redis and are written here when they end. */
export const game = pgTable(
  "game",
  {
    id: text("id").primaryKey(),
    whiteId: text("white_id")
      .notNull()
      .references(() => user.id),
    blackId: text("black_id")
      .notNull()
      .references(() => user.id),
    timeControl: text("time_control").$type<TimeControlId>().notNull(),
    result: text("result").$type<GameResult>().notNull(),
    endReason: text("end_reason").$type<GameEndReason>().notNull(),
    pgn: text("pgn").notNull(),
    finalFen: text("final_fen").notNull(),
    moves: jsonb("moves").$type<MoveRecord[]>().notNull(),
    whiteRatingBefore: integer("white_rating_before").notNull(),
    blackRatingBefore: integer("black_rating_before").notNull(),
    whiteRatingAfter: integer("white_rating_after").notNull(),
    blackRatingAfter: integer("black_rating_after").notNull(),
    startedAt: timestamp("started_at").notNull(),
    endedAt: timestamp("ended_at").notNull().defaultNow(),
  },
  (t) => [index("game_white_idx").on(t.whiteId), index("game_black_idx").on(t.blackId)],
);
