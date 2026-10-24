import { Router } from "express";
import { desc, eq, inArray, or } from "drizzle-orm";
import type { GameRecord, GameState, GameSummary } from "@chess/shared";
import { db } from "../db/client";
import { game, user } from "../db/schema";
import { requireAuth } from "../auth/middleware";
import { keys, redis } from "../redis/client";

export const gamesRouter = Router();

/** Current user's finished games, newest first, from their point of view. */
gamesRouter.get("/me", requireAuth, async (_req, res) => {
    const userId = res.locals.session!.user.id;
    const rows = await db
        .select()
        .from(game)
        .where(or(eq(game.whiteId, userId), eq(game.blackId, userId)))
        .orderBy(desc(game.endedAt))
        .limit(50);

    const opponentIds = [
        ...new Set(rows.map((g) => (g.whiteId === userId ? g.blackId : g.whiteId))),
    ];
    const opponents = opponentIds.length
        ? await db
              .select({ id: user.id, name: user.name, image: user.image })
              .from(user)
              .where(inArray(user.id, opponentIds))
        : [];
    const byId = new Map(opponents.map((o) => [o.id, o]));

    const summaries: GameSummary[] = rows.map((g) => {
        const isWhite = g.whiteId === userId;
        const opponentId = isWhite ? g.blackId : g.whiteId;
        const won = (isWhite && g.result === "1-0") || (!isWhite && g.result === "0-1");
        return {
            id: g.id,
            timeControl: g.timeControl,
            color: isWhite ? "white" : "black",
            outcome: g.result === "1/2-1/2" ? "draw" : won ? "win" : "loss",
            endReason: g.endReason,
            opponent: {
                id: opponentId,
                name: byId.get(opponentId)?.name ?? "Unknown player",
                image: byId.get(opponentId)?.image ?? null,
            },
            ratingBefore: isWhite ? g.whiteRatingBefore : g.blackRatingBefore,
            ratingAfter: isWhite ? g.whiteRatingAfter : g.blackRatingAfter,
            moveCount: Math.ceil(g.moves.length / 2),
            endedAt: g.endedAt.toISOString(),
        };
    });
    res.json(summaries);
});

/** The game the current user is playing right now, or null. */
gamesRouter.get("/active", requireAuth, async (_req, res) => {
    const userId = res.locals.session!.user.id;
    const gameId = await redis.get(keys.userActiveGame(userId));
    const raw = gameId ? await redis.get(keys.game(gameId)) : null;
    const state = raw ? (JSON.parse(raw) as GameState) : null;
    res.json(state && state.status === "active" ? state : null);
});

/** One finished game with both players' names, for the review page. */
gamesRouter.get("/:id", async (req, res) => {
    const [row] = await db.select().from(game).where(eq(game.id, req.params.id)).limit(1);
    if (!row) {
        res.status(404).json({ error: "Not found" });
        return;
    }
    const players = await db
        .select({ id: user.id, name: user.name, image: user.image })
        .from(user)
        .where(inArray(user.id, [row.whiteId, row.blackId]));
    const nameOf = (id: string) => players.find((p) => p.id === id)?.name ?? "Unknown player";
    const imageOf = (id: string) => players.find((p) => p.id === id)?.image ?? null;
    const record: GameRecord = {
        id: row.id,
        timeControl: row.timeControl,
        result: row.result,
        endReason: row.endReason,
        pgn: row.pgn,
        moves: row.moves,
        white: {
            id: row.whiteId,
            name: nameOf(row.whiteId),
            image: imageOf(row.whiteId),
            ratingBefore: row.whiteRatingBefore,
            ratingAfter: row.whiteRatingAfter,
        },
        black: {
            id: row.blackId,
            name: nameOf(row.blackId),
            image: imageOf(row.blackId),
            ratingBefore: row.blackRatingBefore,
            ratingAfter: row.blackRatingAfter,
        },
        startedAt: row.startedAt.toISOString(),
        endedAt: row.endedAt.toISOString(),
    };
    res.json(record);
});
