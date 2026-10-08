import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
import { env } from "./env";

export const authClient = createAuthClient({
  baseURL: env.serverUrl,
  plugins: [inferAdditionalFields({ user: { rating: { type: "number", input: false } } })],
});

export const { signIn, signUp, signOut, useSession } = authClient;
