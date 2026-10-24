"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { authClient, authErrorMessage } from "@/lib/auth-client";
import { Button } from "@/components/ui/Button";
import { Field, FormError, FormNotice } from "@/components/ui/Field";
import { useServerConfig } from "@/components/auth/SocialButtons";

export default function ForgotPasswordPage() {
  const { data: config } = useServerConfig();
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email")).trim();
    setLoading(true);
    setError(null);
    const { error } = await authClient.requestPasswordReset({
      email,
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) return setError(authErrorMessage(error, "The email couldn't be sent. Try again."));
    setSentTo(email);
  }

  return (
    <>
      <h1 className="text-[32px] leading-tight font-semibold tracking-tight">
        Reset your password
      </h1>
      <p className="mt-2 text-muted">
        Enter the email you signed up with and we&apos;ll send you a link to choose a new password.
      </p>

      {sentTo ? (
        <div className="mt-8 space-y-4">
          <FormNotice>
            If an account uses {sentTo}, a reset link is on its way. It works for one hour.
          </FormNotice>
          {config?.emailDelivery === "log" && (
            <p className="text-[13px] text-muted">
              Development mode: emails aren&apos;t sent. The link is printed in the game
              server&apos;s log.
            </p>
          )}
          <Button variant="secondary" onClick={() => setSentTo(null)}>
            Use a different email
          </Button>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-8 space-y-5">
          <Field label="Email" name="email" type="email" autoComplete="email" required />
          {error && <FormError>{error}</FormError>}
          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? "Sending" : "Send reset link"}
          </Button>
        </form>
      )}

      <p className="mt-6 text-[14px] text-muted">
        Remembered it?{" "}
        <Link href="/login" className="font-medium text-brass hover:underline">
          Back to log in
        </Link>
      </p>
    </>
  );
}
