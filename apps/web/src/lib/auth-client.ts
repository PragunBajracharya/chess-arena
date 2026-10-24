import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields, usernameClient } from "better-auth/client/plugins";
import { env } from "./env";

export const authClient = createAuthClient({
  baseURL: env.serverUrl,
  plugins: [
    usernameClient(),
    inferAdditionalFields({ user: { rating: { type: "number", input: false } } }),
  ],
});

export const { signIn, signUp, signOut, useSession } = authClient;

/** Better Auth error messages, rewritten where the default reads like a code. */
export function authErrorMessage(
  error: { code?: string; message?: string } | null | undefined,
  fallback: string,
) {
  switch (error?.code) {
    case "USERNAME_IS_ALREADY_TAKEN":
    case "USERNAME_IS_ALREADY_TAKEN_PLEASE_TRY_ANOTHER":
      return "That username is taken. Try another.";
    case "USER_ALREADY_EXISTS":
    case "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL":
      return "An account with this email already exists. Log in instead.";
    case "INVALID_EMAIL_OR_PASSWORD":
    case "INVALID_USERNAME_OR_PASSWORD":
      return "That sign-in and password don't match.";
    case "INVALID_TOKEN":
      return "This link has expired or was already used. Ask for a new one.";
    default:
      return error?.message || fallback;
  }
}
