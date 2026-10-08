"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signUp } from "@/lib/auth-client";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setLoading(true);
    const { error } = await signUp.email({
      name: String(form.get("name")),
      email: String(form.get("email")),
      password: String(form.get("password")),
    });
    setLoading(false);
    if (error) return setError(error.message ?? "Sign up failed");
    router.push("/play");
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto mt-16 flex max-w-sm flex-col gap-4 px-6">
      <h1 className="text-2xl font-bold">Create account</h1>
      <input name="name" placeholder="Username" required className="input" />
      <input name="email" type="email" placeholder="Email" required className="input" />
      <input
        name="password"
        type="password"
        placeholder="Password (8+ chars)"
        minLength={8}
        required
        className="input"
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
      <button className="btn" disabled={loading}>
        {loading ? "Creating…" : "Sign up"}
      </button>
      <p className="text-sm">
        Have an account?{" "}
        <Link href="/login" className="underline">
          Log in
        </Link>
      </p>
    </form>
  );
}
