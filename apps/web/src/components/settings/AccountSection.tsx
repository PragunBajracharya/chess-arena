"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, MailWarning } from "lucide-react";
import { authClient, authErrorMessage, useSession } from "@/lib/auth-client";
import { useServerConfig } from "@/components/auth/SocialButtons";
import { Button } from "@/components/ui/Button";
import { Field, FormError, FormNotice } from "@/components/ui/Field";
import { Panel } from "@/components/ui/Panel";

const providerNames: Record<string, string> = { google: "Google", github: "GitHub" };

export function AccountSection({ justVerified }: { justVerified: boolean }) {
  const { data: session } = useSession();
  const user = session!.user;
  const { data: config } = useServerConfig();
  const accounts = useQuery({
    queryKey: ["accounts", user.id],
    queryFn: async () => {
      const { data, error } = await authClient.listAccounts();
      if (error) throw new Error(error.message);
      return data;
    },
  });
  const hasPassword = accounts.data?.some((a) => a.providerId === "credential");
  const social = (accounts.data ?? [])
    .map((a) => providerNames[a.providerId])
    .filter(Boolean)
    .join(" and ");

  const [verifyState, setVerifyState] = useState<"idle" | "sending" | "sent" | string>("idle");

  async function sendVerification() {
    setVerifyState("sending");
    const { error } = await authClient.sendVerificationEmail({
      email: user.email,
      callbackURL: `${window.location.origin}/settings?verified=1`,
    });
    setVerifyState(error ? authErrorMessage(error, "The email couldn't be sent.") : "sent");
  }

  const [pwError, setPwError] = useState<string | null>(null);
  const [pwDone, setPwDone] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);

  async function changePassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    setPwSaving(true);
    setPwError(null);
    setPwDone(false);
    const { error } = await authClient.changePassword({
      currentPassword: String(form.get("current")),
      newPassword: String(form.get("new")),
      revokeOtherSessions: true,
    });
    setPwSaving(false);
    if (error) {
      return setPwError(
        error.code === "INVALID_PASSWORD"
          ? "Your current password isn't right."
          : authErrorMessage(error, "The password couldn't be changed."),
      );
    }
    formEl.reset();
    setPwDone(true);
  }

  return (
    <Panel title="Account" description="How you sign in. Only you can see this.">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-[13px] text-muted">Email</p>
          <p className="flex flex-wrap items-center gap-2 font-medium break-all">
            {user.email}
            {user.emailVerified ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-win/15 px-2 py-0.5 text-[12px] font-medium text-win">
                <BadgeCheck size={13} aria-hidden="true" /> Confirmed
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-loss/15 px-2 py-0.5 text-[12px] font-medium text-loss">
                <MailWarning size={13} aria-hidden="true" /> Not confirmed
              </span>
            )}
          </p>
        </div>
        {!user.emailVerified && (
          <Button
            variant="secondary"
            size="sm"
            className="shrink-0"
            disabled={verifyState === "sending" || verifyState === "sent"}
            onClick={sendVerification}
          >
            {verifyState === "sent"
              ? "Email sent"
              : verifyState === "sending"
                ? "Sending"
                : "Send confirmation email"}
          </Button>
        )}
      </div>
      {justVerified && user.emailVerified && (
        <div className="mt-3">
          <FormNotice>Thanks, your email is confirmed.</FormNotice>
        </div>
      )}
      {!user.emailVerified && (
        <p className="mt-2 text-[13px] text-muted">
          {verifyState === "sent" ? (
            config?.emailDelivery === "log" ? (
              "Development mode: the link is printed in the game server's log."
            ) : (
              `Check ${user.email} for a link. It works for one hour.`
            )
          ) : verifyState !== "idle" && verifyState !== "sending" ? (
            <span className="text-loss">{verifyState}</span>
          ) : (
            "Confirm your email so you can reset your password if you forget it."
          )}
        </p>
      )}

      <div className="mt-6 border-t border-line pt-5">
        <h3 className="font-medium">Password</h3>
        {accounts.isPending ? null : hasPassword ? (
          <form onSubmit={changePassword} className="mt-3 grid gap-4 sm:grid-cols-2">
            <Field
              label="Current password"
              name="current"
              id="pw-current"
              type="password"
              autoComplete="current-password"
              required
            />
            <Field
              label="New password"
              name="new"
              id="pw-new"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              hint="At least 8 characters."
            />
            <div className="flex flex-col gap-3 sm:col-span-2">
              {pwError && <FormError>{pwError}</FormError>}
              {pwDone && <FormNotice>Password changed. Other devices were signed out.</FormNotice>}
              <div>
                <Button type="submit" variant="secondary" disabled={pwSaving}>
                  {pwSaving ? "Saving" : "Change password"}
                </Button>
              </div>
            </div>
          </form>
        ) : (
          <p className="mt-1 text-[14px] text-muted">
            You sign in with {social || "a linked account"}. To also sign in with your email and a
            password,{" "}
            <Link href="/forgot-password" className="font-medium text-brass hover:underline">
              set a password
            </Link>
            .
          </p>
        )}
      </div>
    </Panel>
  );
}
