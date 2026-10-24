"use client";

import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usernameProblem } from "@chess/shared";
import { authClient, authErrorMessage, signUp } from "@/lib/auth-client";
import { nextPath } from "@/lib/next-path";
import { Button } from "@/components/ui/Button";
import { Field, FormError } from "@/components/ui/Field";
import { SocialButtons } from "@/components/auth/SocialButtons";

type Availability = "unknown" | "checking" | "free" | "taken";

export default function RegisterPage() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [username, setUsername] = useState("");
    const [touched, setTouched] = useState(false);
    const [availability, setAvailability] = useState<Availability>("unknown");
    const latest = useRef("");
    latest.current = username;

    const problem = username ? usernameProblem(username) : null;
    const usernameError =
        touched && problem ? problem : availability === "taken" ? "That username is taken." : null;

    async function checkAvailability(value: string) {
        setTouched(true);
        if (!value || usernameProblem(value)) return setAvailability("unknown");
        setAvailability("checking");
        const { data } = await authClient.isUsernameAvailable({ username: value });
        // Ignore the answer if the box changed while we waited.
        if (latest.current === value) setAvailability(data?.available === false ? "taken" : "free");
    }

    async function onSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setTouched(true);
        if (problem) return;
        const form = new FormData(e.currentTarget);
        setLoading(true);
        setError(null);
        const { error } = await signUp.email({
            username,
            displayUsername: username,
            name: username,
            email: String(form.get("email")),
            password: String(form.get("password")),
            // Where the "confirm your email" link lands.
            callbackURL: `${window.location.origin}/settings?verified=1`,
        });
        setLoading(false);
        if (error) {
            if (error.code?.startsWith("USERNAME_IS_ALREADY_TAKEN")) setAvailability("taken");
            return setError(authErrorMessage(error, "The account couldn't be created. Try again."));
        }
        router.push(nextPath());
    }

    return (
        <>
            <h1 className="text-[32px] leading-tight font-semibold tracking-tight">
                Create your account
            </h1>
            <p className="mt-2 mb-8 text-muted">Everyone starts at a rating of 1500.</p>

            <SocialButtons onError={setError} />

            <form onSubmit={onSubmit} className="space-y-5">
                <Field
                    label="Username"
                    name="username"
                    autoComplete="username"
                    autoCapitalize="none"
                    spellCheck={false}
                    required
                    maxLength={20}
                    value={username}
                    onChange={(e) => {
                        setUsername(e.target.value.trim());
                        setAvailability("unknown");
                    }}
                    onBlur={(e) => checkAvailability(e.target.value.trim())}
                    error={usernameError}
                    hint={
                        availability === "checking"
                            ? "Checking…"
                            : availability === "free"
                              ? `${username} is available.`
                              : "Shown to your opponents. Letters, numbers and underscores."
                    }
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
                {error && <FormError>{error}</FormError>}
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
