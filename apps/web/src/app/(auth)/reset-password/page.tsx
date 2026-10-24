"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient, authErrorMessage } from "@/lib/auth-client";
import { Button, buttonClass } from "@/components/ui/Button";
import { Field, FormError } from "@/components/ui/Field";

/** Where the emailed reset link lands: /reset-password?token=… (or ?error=INVALID_TOKEN). */
export default function ResetPasswordPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [linkError, setLinkError] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mismatch, setMismatch] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setToken(params.get("token"));
    setLinkError(!params.get("token") || !!params.get("error"));
  }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const password = String(form.get("password"));
    if (password !== String(form.get("confirm"))) return setMismatch(true);
    setMismatch(false);
    setLoading(true);
    setError(null);
    const { error } = await authClient.resetPassword({ newPassword: password, token: token! });
    setLoading(false);
    if (error) return setError(authErrorMessage(error, "The password couldn't be changed."));
    router.push("/login?reset=1");
  }

  if (linkError) {
    return (
      <>
        <h1 className="text-[32px] leading-tight font-semibold tracking-tight">
          This link doesn&apos;t work
        </h1>
        <p className="mt-2 text-muted">
          Reset links work once and expire after an hour. Ask for a new one.
        </p>
        <Link href="/forgot-password" className={buttonClass("primary", "lg", "mt-8 w-full")}>
          Send a new link
        </Link>
      </>
    );
  }

  return (
    <>
      <h1 className="text-[32px] leading-tight font-semibold tracking-tight">
        Choose a new password
      </h1>
      <p className="mt-2 text-muted">You&apos;ll be signed out everywhere else.</p>
      <form onSubmit={onSubmit} className="mt-8 space-y-5">
        <Field
          label="New password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          hint="At least 8 characters."
        />
        <Field
          label="Repeat new password"
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          error={mismatch ? "The passwords don't match." : null}
        />
        {error && <FormError>{error}</FormError>}
        <Button type="submit" size="lg" className="w-full" disabled={loading || !token}>
          {loading ? "Saving" : "Save new password"}
        </Button>
      </form>
    </>
  );
}
