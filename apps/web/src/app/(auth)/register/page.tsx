"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signUp } from "@/lib/auth-client";
import { nextPath } from "@/lib/next-path";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setLoading(true);
    setError(null);
    const { error } = await signUp.email({
      name: String(form.get("name")),
      email: String(form.get("email")),
      password: String(form.get("password")),
    });
    setLoading(false);
    if (error) return setError(error.message ?? "The account couldn't be created. Try again.");
    router.push(nextPath());
  }

  return (
    <>
      <h1 className="text-[32px] leading-tight font-semibold tracking-tight">
        Create your account
      </h1>
      <p className="mt-2 text-muted">Everyone starts at a rating of 1500.</p>

      <form onSubmit={onSubmit} className="mt-8 space-y-5">
        <Field
          label="Username"
          name="name"
          autoComplete="username"
          required
          minLength={3}
          maxLength={24}
          hint="Shown to your opponents."
        />
        <Field label="Email" name="email" type="email" autoComplete="email" required />
        <Field
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          hint="At least 8 characters."
        />
        {error && (
          <p role="alert" className="rounded-lg bg-loss/10 px-3 py-2 text-[14px] text-loss">
            {error}
          </p>
        )}
        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? "Creating account" : "Create account"}
        </Button>
      </form>

      <p className="mt-6 text-[14px] text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-brass hover:underline">
          Log in
        </Link>
      </p>
    </>
  );
}
