"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "@/lib/auth-client";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setLoading(true);
    const { error } = await signIn.email({
      email: String(form.get("email")),
      password: String(form.get("password")),
    });
    setLoading(false);
    if (error) return setError(error.message ?? "Login failed");
    router.push("/play");
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto mt-16 flex max-w-sm flex-col gap-4 px-6">
      <h1 className="text-2xl font-bold">Log in</h1>
      <input name="email" type="email" placeholder="Email" required className="input" />
      <input name="password" type="password" placeholder="Password" required className="input" />
      {error && <p className="text-sm text-red-500">{error}</p>}
      <button className="btn" disabled={loading}>
        {loading ? "Logging in…" : "Log in"}
      </button>
      <p className="text-sm">
        No account?{" "}
        <Link href="/register" className="underline">
          Sign up
        </Link>
      </p>
    </form>
  );
}
