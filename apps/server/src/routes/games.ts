import { Router } from "express";
import { desc, eq, or } from "drizzle-orm";
import { db } from "../db/client";
import { game } from "../db/schema";
import { requireAuth } from "../auth/middleware";

export const gamesRouter = Router();

/** Current user's finished games, newest first. */
gamesRouter.get("/me", requireAuth, async (_req, res) => {
  const userId = res.locals.session!.user.id;
  const rows = await db
    .select()
    .from(game)
    .where(or(eq(game.whiteId, userId), eq(game.blackId, userId)))
    .orderBy(desc(game.endedAt))
    .limit(50);
  res.json(rows);
});

gamesRouter.get("/:id", async (req, res) => {
  const [row] = await db.select().from(game).where(eq(game.id, req.params.id)).limit(1);
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(row);
});
