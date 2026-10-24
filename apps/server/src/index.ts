import { createServer } from "node:http";
import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { env } from "./config/env";
import { logger } from "./config/logger";
import { auth, enabledProviders } from "./auth/auth";
import { gamesRouter } from "./routes/games";
import { meRouter } from "./routes/me";
import { LOCAL_UPLOAD_DIR, LOCAL_UPLOAD_ROUTE } from "./services/avatar.service";
import { createSocketServer } from "./sockets";

const app = express();

app.use(cors({ origin: env.WEB_ORIGIN, credentials: true }));

// Better Auth must be mounted BEFORE express.json(), it parses its own bodies.
app.all("/api/auth/{*any}", toNodeHandler(auth));

app.use(express.json());
app.get("/health", (_req, res) => {
    res.json({ ok: true });
});
app.use("/api/games", gamesRouter);
app.use("/api/me", meRouter);

/** Public settings the sign-in pages need: which social buttons to show. */
app.get("/api/config", (_req, res) => {
    res.json({ providers: enabledProviders, emailDelivery: env.RESEND_API_KEY ? "email" : "log" });
});

// Profile pictures saved on disk when no S3 bucket is configured.
app.use(
    LOCAL_UPLOAD_ROUTE,
    express.static(LOCAL_UPLOAD_DIR, {
        immutable: true,
        maxAge: "365d",
        setHeaders: (res) => res.setHeader("Cross-Origin-Resource-Policy", "cross-origin"),
    }),
);

const httpServer = createServer(app);
createSocketServer(httpServer);

httpServer.listen(env.PORT, () => {
    logger.info(`Server listening on http://localhost:${env.PORT}`);
});
