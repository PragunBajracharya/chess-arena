"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authErrorMessage, signIn } from "@/lib/auth-client";
import { nextPath } from "@/lib/next-path";
import { Button } from "@/components/ui/Button";
import { Field, FormError, FormNotice } from "@/components/ui/Field";
import { SocialButtons } from "@/components/auth/SocialButtons";

export default function LoginPage() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // Messages passed back by redirects: a failed social sign-in, or a finished password reset.
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get("error"))
            setError("That sign-in didn't work. Try again, or use your email.");
        if (params.get("reset") === "1")
            setNotice("Password changed. Log in with your new password.");
    }, []);

    async function onSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        const login = String(form.get("login")).trim();
        const password = String(form.get("password"));
        setLoading(true);
        setError(null);
        setNotice(null);
        // One box for both: anything with an @ is an email, the rest is a username.
        const { error } = login.includes("@")
            ? await signIn.email({ email: login, password })
            : await signIn.username({ username: login, password });
        setLoading(false);
        if (error)
            return setError(authErrorMessage(error, "That sign-in and password don't match."));
        router.push(nextPath());
    }

    return (
        <>
            <h1 className="text-[32px] leading-tight font-semibold tracking-tight">Log in</h1>
            <p className="mt-2 mb-8 text-muted">Welcome back. Log in to play rated games.</p>

            <SocialButtons onError={setError} />

            <form onSubmit={onSubmit} className="space-y-5">
                <Field
                    label="Email or username"
                    name="login"
                    autoComplete="username"
                    autoCapitalize="none"
                    spellCheck={false}
                    required
                />
                <Field
                    label="Password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    labelAside={
                        <Link
                            href="/forgot-password"
                            className="text-[13px] text-brass hover:underline"
                        >
                            Forgot password?
                        </Link>
                    }
                />
                {notice && <FormNotice>{notice}</FormNotice>}
                {error && <FormError>{error}</FormError>}
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
