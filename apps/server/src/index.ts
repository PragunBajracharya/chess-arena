import { createServer } from "node:http";
import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { env } from "./config/env";
import { logger } from "./config/logger";
import { auth } from "./auth/auth";
import { gamesRouter } from "./routes/games";
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

const httpServer = createServer(app);
createSocketServer(httpServer);

httpServer.listen(env.PORT, () => {
  logger.info(`Server listening on http://localhost:${env.PORT}`);
});
