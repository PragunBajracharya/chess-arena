import { env } from "./env";

/** GET a JSON endpoint on the game server, sending the login cookie. */
export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${env.serverUrl}${path}`, { credentials: "include" });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return (await res.json()) as T;
}
