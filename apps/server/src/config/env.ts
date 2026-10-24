import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
    PORT: z.coerce.number().default(4000),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    WEB_ORIGIN: z.url(),
    DATABASE_URL: z.url(),
    REDIS_URL: z.url(),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.url(),
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    GITHUB_CLIENT_ID: z.string().optional(),
    GITHUB_CLIENT_SECRET: z.string().optional(),
    // Email (password reset, verification). Without RESEND_API_KEY, emails are
    // written to the server log instead of sent, which is enough for local work.
    RESEND_API_KEY: z.string().optional(),
    EMAIL_FROM: z.string().default("Chess Arena <onboarding@resend.dev>"),

    // Profile pictures. With S3_BUCKET set, uploads go to S3 or any S3-compatible
    // store (Cloudflare R2, MinIO); otherwise they are saved under ./uploads.
    S3_BUCKET: z.string().optional(),
    S3_REGION: z.string().default("auto"),
    S3_ENDPOINT: z.url().optional(),
    S3_ACCESS_KEY_ID: z.string().optional(),
    S3_SECRET_ACCESS_KEY: z.string().optional(),
    /** Public base URL the bucket is served from, e.g. https://pub-xxxx.r2.dev */
    S3_PUBLIC_URL: z.url().optional(),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
    console.error("Invalid environment variables:", z.treeifyError(parsed.error));
    process.exit(1);
}

if (parsed.data.S3_BUCKET && !parsed.data.S3_PUBLIC_URL) {
    console.error(
        "S3_PUBLIC_URL is required when S3_BUCKET is set (it is where avatars are served from).",
    );
    process.exit(1);
}

export const env = parsed.data;
