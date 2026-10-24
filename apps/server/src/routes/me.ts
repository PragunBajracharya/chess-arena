import { Router, raw } from "express";
import { eq } from "drizzle-orm";
import { normalizePreferences, preferencesPatchSchema } from "@chess/shared";
import { db } from "../db/client";
import { user } from "../db/schema";
import { requireAuth } from "../auth/middleware";
import { deleteAvatar, MAX_AVATAR_BYTES, saveAvatar, sniffImage } from "../services/avatar.service";

/** The signed-in player's own settings and profile picture. */
export const meRouter = Router();
meRouter.use(requireAuth);

meRouter.get("/preferences", async (_req, res) => {
    const userId = res.locals.session!.user.id;
    const [row] = await db
        .select({ preferences: user.preferences })
        .from(user)
        .where(eq(user.id, userId))
        .limit(1);
    res.json(normalizePreferences(row?.preferences));
});

/** Merges the sent fields into the stored preferences and returns the full set. */
meRouter.patch("/preferences", async (req, res) => {
    const parsed = preferencesPatchSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: "Invalid settings" });
        return;
    }
    const userId = res.locals.session!.user.id;
    const [row] = await db
        .select({ preferences: user.preferences })
        .from(user)
        .where(eq(user.id, userId))
        .limit(1);
    const next = normalizePreferences({
        ...normalizePreferences(row?.preferences),
        ...parsed.data,
    });
    await db
        .update(user)
        .set({ preferences: next, updatedAt: new Date() })
        .where(eq(user.id, userId));
    res.json(next);
});

/**
 * Upload a profile picture as the raw request body. The web app crops and
 * resizes it to 256x256 WebP first, so this only checks type and size.
 */
meRouter.put(
    "/avatar",
    raw({ type: ["image/webp", "image/png", "image/jpeg"], limit: MAX_AVATAR_BYTES }),
    async (req, res) => {
        const body = req.body as unknown;
        const type = Buffer.isBuffer(body) ? sniffImage(body) : null;
        if (!Buffer.isBuffer(body) || !type) {
            res.status(400).json({ error: "Upload a PNG, JPEG or WebP image." });
            return;
        }
        const current = res.locals.session!.user;
        const url = await saveAvatar(current.id, body, type);
        await db
            .update(user)
            .set({ image: url, updatedAt: new Date() })
            .where(eq(user.id, current.id));
        await deleteAvatar(current.image);
        res.json({ image: url });
    },
);

meRouter.delete("/avatar", async (_req, res) => {
    const current = res.locals.session!.user;
    await db
        .update(user)
        .set({ image: null, updatedAt: new Date() })
        .where(eq(user.id, current.id));
    await deleteAvatar(current.image);
    res.json({ image: null });
});
