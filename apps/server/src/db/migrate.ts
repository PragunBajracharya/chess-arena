import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

/**
 * Applies the SQL migrations in ./drizzle.
 * Used instead of `drizzle-kit migrate`, which exits with code 1 and prints
 * nothing when the database is unreachable or the credentials are wrong.
 */

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set.");
  console.error("Fix: copy apps/server/.env.example to apps/server/.env");
  process.exit(1);
}

function hint(err: unknown): string | null {
  const e = err as { code?: string; message?: string; cause?: { code?: string } };
  const code = e.code ?? e.cause?.code;
  const message = e.message ?? "";
  if (code === "ECONNREFUSED" || code === "ENOTFOUND") {
    return "Postgres is not reachable. Start Docker Desktop, then run: pnpm db:up";
  }
  if (code === "28P01" || code === "28000") {
    return "Postgres rejected the user or password. Another Postgres may already be using port 5432, or DATABASE_URL does not match docker-compose.yml.";
  }
  if (code === "3D000") {
    return "That database does not exist. DATABASE_URL should end in /chess, or another Postgres is using port 5432.";
  }
  if (message.includes("_journal.json")) {
    return "No migrations found in apps/server/drizzle. Run: pnpm db:generate";
  }
  return null;
}

const client = postgres(url, { max: 1, onnotice: () => {} });

try {
  await migrate(drizzle(client), { migrationsFolder: "./drizzle" });
  console.log("Migrations applied successfully.");
} catch (err) {
  console.error("Migration failed:");
  const cause = (err as { cause?: { message?: string; code?: string } }).cause;
  if (cause) {
    console.error(`${cause.message || "Could not connect"}${cause.code ? ` (${cause.code})` : ""}`);
  } else {
    console.error(err instanceof Error ? err.message || err : err);
  }
  const fix = hint(err);
  if (fix) console.error(`\nFix: ${fix}`);
  process.exitCode = 1;
} finally {
  await client.end({ timeout: 2 });
}