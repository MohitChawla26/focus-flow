"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Loader2, LockKeyhole } from "lucide-react";

import { AuthShell } from "@/components/auth/auth-shell";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");
    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }
    const client = createClient();
    if (!client) {
      setMessage("Password recovery is unavailable because authentication is not configured.");
      return;
    }
    setBusy(true);
    const { error } = await client.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <AuthShell eyebrow="Secure recovery" title="Choose a new password." description="Use at least eight characters. Once saved, you’ll continue directly to your dashboard.">
      <form onSubmit={submit} className="mt-9 space-y-5">
        <label className="field-label">
          New password
          <span className="relative block">
            <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={15} />
            <input required minLength={8} type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" className="field-control field-control-leading h-12" />
          </span>
        </label>
        <label className="field-label">
          Confirm password
          <span className="relative block">
            <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={15} />
            <input required minLength={8} type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Repeat your new password" className="field-control field-control-leading h-12" />
          </span>
        </label>
        <button disabled={busy} className="flex h-12 w-full items-center justify-center gap-2 rounded-[calc(var(--radius)/2)] border border-[var(--accent)] bg-[var(--accent)] text-sm font-semibold text-[var(--accent-contrast)] shadow-[var(--shadow-glow)] transition hover:-translate-y-0.5 disabled:translate-y-0 disabled:cursor-wait disabled:opacity-60">
          {busy ? <><Loader2 className="animate-spin" size={17} />Updating access</> : <>Update password<ArrowRight size={16} /></>}
        </button>
        {message ? <p role="status" className="rounded-[calc(var(--radius)/2)] border border-[var(--critical)] bg-[var(--critical-soft)] px-3 py-3 text-xs leading-5 text-[var(--critical)]">{message}</p> : null}
      </form>
    </AuthShell>
  );
}
