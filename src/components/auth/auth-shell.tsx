import Link from "next/link";
import { ArrowLeft, CircleDot, ScanLine, ShieldCheck, Sparkles } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";

type AuthShellProps = {
  children: React.ReactNode;
  eyebrow: string;
  title: string;
  description: string;
};

const systemSignals = [
  { label: "Identity", detail: "secure session", icon: ShieldCheck },
  { label: "Interests", detail: "priority signals", icon: ScanLine },
  { label: "Dashboard", detail: "ranked action", icon: Sparkles },
];

export function AuthShell({ children, eyebrow, title, description }: AuthShellProps) {
  return (
    <main className="min-h-screen bg-[var(--bg)] px-4 py-4 text-[var(--text)] sm:px-6 sm:py-6">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-7xl overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-[var(--panel)] shadow-[var(--shadow)] sm:min-h-[calc(100vh-3rem)] lg:grid-cols-[1.05fr_.95fr]">
        <section className="relative hidden min-h-[42rem] overflow-hidden border-r border-[var(--border)] p-10 lg:flex lg:flex-col xl:p-14">
          <div className="auth-grid absolute inset-0 opacity-60" aria-hidden="true" />
          <div className="relative z-10 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 font-semibold tracking-[-0.03em]">
              <span className="grid h-10 w-10 place-items-center rounded-full border border-[var(--accent)] text-[var(--accent)] shadow-[var(--shadow-glow)]"><CircleDot size={18} /></span>
              <span>focus-flow</span>
            </Link>
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">Access node 01</span>
          </div>

          <div className="relative z-10 my-auto max-w-xl">
            <div className="auth-orbit mb-10" aria-hidden="true">
              <span className="auth-orbit-ring auth-orbit-ring-a" />
              <span className="auth-orbit-ring auth-orbit-ring-b" />
              <span className="auth-orbit-ring auth-orbit-ring-c" />
              <span className="auth-orbit-core"><CircleDot size={20} /></span>
            </div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--accent)]">Signal intelligence online</p>
            <h1 className="mt-4 max-w-lg text-5xl font-semibold leading-[1.02] tracking-[-0.055em] xl:text-6xl">Your attention has a control room.</h1>
            <p className="mt-6 max-w-md text-sm leading-7 text-[var(--muted)]">Authenticate once, teach focus-flow what matters, and arrive at a dashboard already ranked around you.</p>
          </div>

          <div className="relative z-10 grid grid-cols-3 gap-3">
            {systemSignals.map(({ label, detail, icon: Icon }, index) => (
              <div key={label} className="rounded-[calc(var(--radius)/1.5)] border border-[var(--border)] bg-[var(--panel-translucent)] p-4">
                <div className="flex items-center justify-between text-[var(--accent)]"><Icon size={15} /><span className="font-mono text-[9px] text-[var(--muted)]">0{index + 1}</span></div>
                <div className="mt-6 text-xs font-semibold">{label}</div>
                <div className="mt-1 font-mono text-[9px] uppercase text-[var(--muted)]">{detail}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="flex min-h-[42rem] flex-col p-5 sm:p-9 lg:p-12 xl:p-16">
          <div className="flex items-center justify-between lg:justify-end">
            <Link href="/" className="flex items-center gap-2 text-sm font-semibold lg:hidden"><CircleDot size={17} className="text-[var(--accent)]" />focus-flow</Link>
            <ThemeToggle />
          </div>
          <div className="my-auto w-full max-w-md self-center py-10">
            <Link href="/" className="mb-8 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--muted)] hover:text-[var(--accent)]"><ArrowLeft size={13} />Back to landing</Link>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--accent)]">{eyebrow}</p>
            <h2 className="mt-3 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">{title}</h2>
            <p className="mt-4 max-w-sm text-sm leading-6 text-[var(--muted)]">{description}</p>
            {children}
          </div>
          <div className="flex items-center justify-between border-t border-[var(--border)] pt-4 font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--muted)]"><span>Encrypted session</span><span className="text-[var(--ok)]">System ready</span></div>
        </section>
      </div>
    </main>
  );
}
