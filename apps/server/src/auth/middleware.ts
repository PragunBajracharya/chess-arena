import type { NextFunction, Request, Response } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth, type Session } from "./auth";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Locals {
      session?: Session;
    }
  }
}

/** Express middleware for REST routes that need a signed-in user. */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
  if (!session) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  res.locals.session = session;
  next();
}
