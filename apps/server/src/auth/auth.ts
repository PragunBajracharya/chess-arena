import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { username } from "better-auth/plugins";
import { eq } from "drizzle-orm";
import { DEFAULT_RATING, USERNAME_RULES } from "@chess/shared";
import { env } from "../config/env";
import { db } from "../db/client";
import * as schema from "../db/schema";
import { sendMail } from "../services/mail.service";

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

/** Which social sign-in buttons the web app should show. */
export const enabledProviders = {
    google: "google" in socialProviders,
    github: "github" in socialProviders,
};

/**
 * A free username for an account created without one (Google or GitHub sign-in):
 * the name with unsupported characters removed, plus a number if it is taken.
 */
async function freeUsername(name: string, email: string) {
    let base = (name || email.split("@")[0] || "")
        .normalize("NFKD")
        .replace(/[^a-zA-Z0-9_]/g, "")
        .slice(0, USERNAME_RULES.max - 5);
    if (base.length < USERNAME_RULES.min) base = "player";
    for (let i = 0; i < 20; i++) {
        const candidate = i === 0 ? base : `${base}_${Math.floor(1000 + Math.random() * 9000)}`;
        const [taken] = await db
            .select({ id: schema.user.id })
            .from(schema.user)
            .where(eq(schema.user.username, candidate.toLowerCase()))
            .limit(1);
        if (!taken) return candidate;
    }
    return `player_${crypto.randomUUID().slice(0, 8)}`;
}

export const auth = betterAuth({
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    trustedOrigins: [env.WEB_ORIGIN],
    database: drizzleAdapter(db, { provider: "pg", schema }),
    emailAndPassword: {
        enabled: true,
        // Players can play before verifying; the app shows a reminder until they do.
        requireEmailVerification: false,
        revokeSessionsOnPasswordReset: true,
        sendResetPassword: async ({ user, url }) => {
            await sendMail({
                to: user.email,
                subject: "Reset your Chess Arena password",
                text: `Hi ${user.name},\n\nSomeone asked to reset the password for your Chess Arena account. If it was you, choose a new password with the button below. The link works for one hour.\n\nIf it wasn't you, ignore this email: your password stays the same.`,
                link: { label: "Choose a new password", url },
            });
        },
    },
    emailVerification: {
        sendOnSignUp: true,
        autoSignInAfterVerification: true,
        sendVerificationEmail: async ({ user, url }) => {
            await sendMail({
                to: user.email,
                subject: "Confirm your email for Chess Arena",
                text: `Hi ${user.name},\n\nConfirm this is your email address so you can reset your password if you ever forget it. The link works for one hour.`,
                link: { label: "Confirm email", url },
            });
        },
    },
    socialProviders,
    account: {
        // Signing in with Google or GitHub using the same verified email joins the accounts.
        accountLinking: { enabled: true, trustedProviders: ["google", "github"] },
    },
    plugins: [
        username({
            minUsernameLength: USERNAME_RULES.min,
            maxUsernameLength: USERNAME_RULES.max,
            usernameValidator: (value) => USERNAME_RULES.pattern.test(value),
        }),
    ],
    user: {
        additionalFields: {
            // input: false => users can't set their own rating at sign-up
            rating: { type: "number", defaultValue: DEFAULT_RATING, input: false },
        },
    },
    databaseHooks: {
        user: {
            create: {
                // Every account gets a username, including ones made by social sign-in
                // (Google's "Jane Doe" becomes JaneDoe, or JaneDoe_4821 if that is taken).
                before: async (user) => {
                    const u = user as typeof user & {
                        username?: string | null;
                        displayUsername?: string | null;
                    };
                    if (u.username) return { data: user };
                    const handle = await freeUsername(user.name, user.email);
                    // The shown name is always the username, so no two players look alike.
                    return {
                        data: {
                            ...user,
                            name: handle,
                            username: handle.toLowerCase(),
                            displayUsername: handle,
                        },
                    };
                },
            },
        },
    },
});

export type Session = typeof auth.$Infer.Session;
