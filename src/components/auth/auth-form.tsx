"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Eye, EyeOff, Loader2, LockKeyhole, Mail, UserRound } from "lucide-react";

import { AuthShell } from "@/components/auth/auth-shell";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

type AuthMode = "login" | "signup" | "forgot";

const copy = {
  login: {
    eyebrow: "Resume your focus",
    title: "Welcome back.",
    description: "Sign in to continue from the exact priority state you left behind.",
    action: "Enter dashboard",
  },
  signup: {
    eyebrow: "Create your signal profile",
    title: "Start with what matters.",
    description: "Create an account, then calibrate the interests and people that deserve your attention.",
    action: "Create focus space",
  },
  forgot: {
    eyebrow: "Recover secure access",
    title: "Reset your password.",
    description: "We’ll email a secure recovery link so you can return to your ranked dashboard.",
    action: "Send recovery link",
  },
} satisfies Record<AuthMode, { eyebrow: string; title: string; description: string; action: string }>;

export function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const content = copy[mode];

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setIsError(false);

    if (!isSupabaseConfigured()) {
      setIsError(true);
      setMessage("Authentication is unavailable because the connection is not configured.");
      setBusy(false);
      return;
    }

    const client = createClient();
    if (!client) {
      setIsError(true);
      setMessage("Authentication could not start. Refresh the page and try again.");
      setBusy(false);
      return;
    }

    try {
      if (mode === "login") {
        const { error } = await client.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.replace("/dashboard");
        router.refresh();
      } else if (mode === "signup") {
        const { data, error } = await client.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${location.origin}/auth/callback?next=/onboarding`,
            data: { display_name: fullName.trim() },
          },
        });
        if (error) throw error;
        if (data.session) {
          router.push("/onboarding");
          router.refresh();
        } else {
          setMessage("Account created. Confirm your email, then return here to continue calibration.");
        }
      } else {
        const { error } = await client.auth.resetPasswordForEmail(email, {
          redirectTo: `${location.origin}/auth/callback?next=/reset-password`,
        });
        if (error) throw error;
        setMessage("Recovery link sent. Check your inbox to choose a new password.");
      }
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : "Authentication failed. Check your details and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell eyebrow={content.eyebrow} title={content.title} description={content.description}>
      <form onSubmit={submit} className="mt-9 space-y-5">
        {mode === "signup" ? (
          <label className="field-label">
            Full name
            <span className="relative block">
              <UserRound className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={15} />
              <input required minLength={2} autoComplete="name" value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Your full name" className="field-control field-control-leading h-12" />
            </span>
          </label>
        ) : null}
        <label className="field-label">
          Email address
          <span className="relative block">
            <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={15} />
            <input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="field-control field-control-leading h-12" />
          </span>
        </label>
        {mode !== "forgot" ? (
          <label className="field-label">
            Password
            <span className="relative block">
              <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={15} />
              <input required minLength={8} autoComplete={mode === "login" ? "current-password" : "new-password"} type={show ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" className="field-control field-control-leading field-control-trailing h-12" />
              <button type="button" onClick={() => setShow((visible) => !visible)} aria-label={show ? "Hide password" : "Show password"} className="icon-button absolute right-2 top-1/2 -translate-y-1/2">{show ? <EyeOff size={16} /> : <Eye size={16} />}</button>
            </span>
          </label>
        ) : null}
        {mode === "login" ? <div className="text-right"><Link href="/forgot-password" className="text-xs font-medium text-[var(--muted)] hover:text-[var(--accent)]">Forgot password?</Link></div> : null}
        <button disabled={busy} className="flex h-12 w-full items-center justify-center gap-2 rounded-[calc(var(--radius)/2)] border border-[var(--accent)] bg-[var(--accent)] text-sm font-semibold text-[var(--accent-contrast)] shadow-[var(--shadow-glow)] transition hover:-translate-y-0.5 disabled:translate-y-0 disabled:cursor-wait disabled:opacity-60">
          {busy ? <><Loader2 className="animate-spin" size={17} />Authenticating</> : <>{content.action}<ArrowRight size={16} /></>}
        </button>
        {message ? <p role="status" className={`rounded-[calc(var(--radius)/2)] border px-3 py-3 text-xs leading-5 ${isError ? "border-[var(--critical)] bg-[var(--critical-soft)] text-[var(--critical)]" : "border-[var(--ok)] bg-[var(--ok-soft)] text-[var(--ok)]"}`}>{message}</p> : null}
      </form>
      <p className="mt-7 text-center text-xs text-[var(--muted)]">
        {mode === "login" ? <>New to focus-flow? <Link className="font-semibold text-[var(--accent)]" href="/signup">Create an account</Link></> : mode === "signup" ? <>Already calibrated? <Link className="font-semibold text-[var(--accent)]" href="/login">Sign in</Link></> : <Link className="font-semibold text-[var(--accent)]" href="/login">Return to sign in</Link>}
      </p>
    </AuthShell>
  );
}
