import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { DEFAULT_RATING } from "@chess/shared";
import { env } from "../config/env";
import { db } from "../db/client";
import * as schema from "../db/schema";

const socialProviders = {
  ...(env.GOOGLE_CLIENT_ID &&
    env.GOOGLE_CLIENT_SECRET && {
      google: { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET },
    }),
  ...(env.GITHUB_CLIENT_ID &&
    env.GITHUB_CLIENT_SECRET && {
      github: { clientId: env.GITHUB_CLIENT_ID, clientSecret: env.GITHUB_CLIENT_SECRET },
    }),
};

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: [env.WEB_ORIGIN],
  database: drizzleAdapter(db, { provider: "pg", schema }),
  emailAndPassword: { enabled: true },
  socialProviders,
  user: {
    additionalFields: {
      // input: false => users can't set their own rating at sign-up
      rating: { type: "number", defaultValue: DEFAULT_RATING, input: false },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
