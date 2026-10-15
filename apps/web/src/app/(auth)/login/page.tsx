"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "@/lib/auth-client";
import { nextPath } from "@/lib/next-path";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setLoading(true);
    setError(null);
    const { error } = await signIn.email({
      email: String(form.get("email")),
      password: String(form.get("password")),
    });
    setLoading(false);
    if (error) return setError(error.message ?? "Email or password is incorrect.");
    router.push(nextPath());
  }

  return (
    <>
      <h1 className="text-[32px] leading-tight font-semibold tracking-tight">Log in</h1>
      <p className="mt-2 text-muted">Welcome back. Log in to play rated games.</p>

      <form onSubmit={onSubmit} className="mt-8 space-y-5" noValidate={false}>
        <Field label="Email" name="email" type="email" autoComplete="email" required />
        <Field
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
        {error && (
          <p role="alert" className="rounded-lg bg-loss/10 px-3 py-2 text-[14px] text-loss">
            {error}
          </p>
        )}
        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? "Logging in" : "Log in"}
        </Button>
      </form>

      <p className="mt-6 text-[14px] text-muted">
        New to Chess Arena?{" "}
        <Link href="/register" className="font-medium text-brass hover:underline">
          Create an account
        </Link>
      </p>
    </>
  );
}
