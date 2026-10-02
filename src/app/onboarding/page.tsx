"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, CircleDot, Clock3, Gauge, KeyRound, Loader2, MoonStar, UserRound, UsersRound } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

const topics = [
  "AI", "Technology", "Programming", "Cricket", "Football", "Business",
  "Finance", "College", "Research", "Entertainment", "Science", "Startups",
  "Social Media Trends",
];

const steps = [
  { label: "Identity & interests", hint: "Who and what matters", icon: UserRound },
  { label: "Priority weights", hint: "Rank every signal", icon: Gauge },
  { label: "Keywords", hint: "Words that break through", icon: KeyRound },
  { label: "Important people", hint: "Never miss a sender", icon: UsersRound },
  { label: "Digest rhythm", hint: "Choose the cadence", icon: Clock3 },
  { label: "Quiet hours", hint: "Protect deep work", icon: MoonStar },
];

type Priority = Database["public"]["Enums"]["priority_level"];
type DigestFrequency = Database["public"]["Enums"]["digest_frequency"];

function splitValues(value: string) {
  return [...new Set(value.split(",").map((item) => item.trim()).filter(Boolean))];
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [priorities, setPriorities] = useState<Record<string, Priority>>({});
  const [keywords, setKeywords] = useState("");
  const [people, setPeople] = useState("");
  const [digestFrequency, setDigestFrequency] = useState<DigestFrequency>("manual");
  const [quietEnabled, setQuietEnabled] = useState(false);
  const [quietStart, setQuietStart] = useState("22:00");
  const [quietEnd, setQuietEnd] = useState("07:00");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    void supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", data.user.id)
        .maybeSingle();
      setFullName(profile?.display_name || String(data.user.user_metadata.display_name ?? ""));
    });
  }, []);

  function toggleTopic(topic: string) {
    const next = new Set(selected);
    if (next.has(topic)) {
      next.delete(topic);
      const nextPriorities = { ...priorities };
      delete nextPriorities[topic];
      setPriorities(nextPriorities);
    } else {
      next.add(topic);
      setPriorities((current) => ({ ...current, [topic]: "medium" }));
    }
    setSelected(next);
  }

  async function finish() {
    const supabase = createClient();
    if (!supabase) {
      setMessage("Personalization is unavailable because the data connection is not configured.");
      return;
    }

    setSaving(true);
    setMessage("");
    const { data: userData, error: userError } = await supabase.auth.getUser();
    const user = userData.user;
    if (userError || !user) {
      setMessage("Your session expired. Sign in again to continue.");
      setSaving(false);
      return;
    }

    const keywordValues = splitValues(keywords);
    const peopleValues = splitValues(people);
    const interestRows = [...selected].map((topic) => ({
      user_id: user.id,
      topic,
      priority: priorities[topic] ?? "medium",
      weight: priorities[topic] === "high" ? 100 : priorities[topic] === "low" ? 25 : 65,
    }));

    const cleanup = await Promise.all([
      supabase.from("user_interests").delete().eq("user_id", user.id),
      supabase.from("user_keywords").delete().eq("user_id", user.id),
      supabase.from("important_people").delete().eq("user_id", user.id),
    ]);
    const cleanupError = cleanup.find((result) => result.error)?.error;

    const writes = await Promise.all([
      interestRows.length
        ? supabase.from("user_interests").insert(interestRows)
        : Promise.resolve({ error: null }),
      keywordValues.length
        ? supabase.from("user_keywords").insert(keywordValues.map((keyword) => ({ user_id: user.id, keyword })))
        : Promise.resolve({ error: null }),
      peopleValues.length
        ? supabase.from("important_people").insert(peopleValues.map((name) => ({ user_id: user.id, name })))
        : Promise.resolve({ error: null }),
      supabase.from("user_preferences").upsert({
        user_id: user.id,
        quiet_hours_enabled: quietEnabled,
        quiet_start: quietStart,
        quiet_end: quietEnd,
        digest_frequency: digestFrequency,
      }),
      supabase.from("profiles").update({ display_name: fullName.trim(), onboarding_completed: true }).eq("id", user.id),
    ]);
    const writeError = writes.find((result) => result.error)?.error;

    setSaving(false);
    if (cleanupError || writeError) {
      setMessage((cleanupError ?? writeError)?.message ?? "Your preferences could not be saved. Try again.");
      return;
    }
    router.replace("/dashboard");
    router.refresh();
  }

  function next() {
    if (step === 1 && fullName.trim().length < 2) {
      setMessage("Enter your full name to continue.");
      return;
    }
    if (step === 1 && selected.size === 0) {
      setMessage("Choose at least one interest to continue.");
      return;
    }
    setMessage("");
    if (step < steps.length) setStep((current) => current + 1);
    else void finish();
  }

  const activeStep = steps[step - 1];
  const ActiveStepIcon = activeStep.icon;

  return (
    <main className="min-h-screen bg-[var(--bg)] px-4 py-4 text-[var(--text)] sm:px-6 sm:py-6">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-7xl overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-[var(--panel)] shadow-[var(--shadow)] sm:min-h-[calc(100vh-3rem)] lg:grid-cols-[19rem_1fr]">
        <aside className="relative hidden overflow-hidden border-r border-[var(--border)] p-8 lg:flex lg:flex-col">
          <div className="auth-grid absolute inset-0 opacity-40" aria-hidden="true" />
          <div className="relative flex items-center gap-3 font-semibold tracking-[-0.03em]">
            <span className="grid h-10 w-10 place-items-center rounded-full border border-[var(--accent)] text-[var(--accent)] shadow-[var(--shadow-glow)]"><CircleDot size={18} /></span>
            <span>focus-flow</span>
          </div>
          <div className="relative mt-14">
            <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--accent)]">Attention calibration</p>
            <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-[-0.045em]">Build your signal profile.</h1>
            <p className="mt-3 text-xs leading-5 text-[var(--muted)]">Six small decisions shape every ranking in your dashboard.</p>
          </div>
          <ol className="relative mt-10 space-y-2">
            {steps.map(({ label, hint, icon: Icon }, index) => {
              const number = index + 1;
              const isActive = number === step;
              const isComplete = number < step;
              return (
                <li key={label} className={"flex items-center gap-3 rounded-[calc(var(--radius)/2)] border px-3 py-3 transition " + (isActive ? "border-[var(--accent)] bg-[var(--accent-soft)]" : "border-transparent")}>
                  <span className={"grid h-8 w-8 shrink-0 place-items-center rounded-full border " + (isComplete || isActive ? "border-[var(--accent)] text-[var(--accent)]" : "border-[var(--border)] text-[var(--muted)]")}>{isComplete ? <Check size={14} /> : <Icon size={14} />}</span>
                  <span><span className="block text-xs font-semibold">{label}</span><span className="mt-0.5 block font-mono text-[8px] uppercase text-[var(--muted)]">{hint}</span></span>
                </li>
              );
            })}
          </ol>
          <div className="relative mt-auto border-t border-[var(--border)] pt-4 font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--muted)]">Profile signals stay editable</div>
        </aside>

        <section className="flex min-w-0 flex-col p-5 sm:p-8 lg:p-12">
          <header className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold lg:hidden"><CircleDot size={17} className="text-[var(--accent)]" />focus-flow</div>
            <div className="ml-auto flex items-center gap-4"><span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--muted)]">Step {step} / {steps.length}</span><ThemeToggle /></div>
          </header>
          <div className="mt-6 grid grid-cols-6 gap-2" aria-label={"Step " + step + " of " + steps.length}>
            {steps.map(({ label }, index) => <span key={label} className={"h-1 rounded-full transition-colors " + (index < step ? "bg-[var(--accent)]" : "bg-[var(--border)]")} />)}
          </div>

          <div className="mx-auto my-auto w-full max-w-3xl py-10">
            <div className="mb-8 flex items-start gap-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"><ActiveStepIcon size={18} /></span>
              <div><p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--accent)]">{activeStep.label}</p><h2 className="mt-2 text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">{step === 1 ? "What deserves your attention?" : step === 2 ? "How urgent is each interest?" : step === 3 ? "Which words should break through?" : step === 4 ? "Whose messages matter most?" : step === 5 ? "When should your digest arrive?" : "When should focus-flow stay quiet?"}</h2></div>
            </div>

            <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--panel-strong)] p-5 shadow-[var(--shadow-soft)] sm:p-7">
              {step === 1 ? <>
                <p className="text-sm leading-6 text-[var(--muted)]">Start with your name, then choose only the subjects you genuinely want ranked.</p>
                <label className="field-label mt-6">Full name<input required minLength={2} autoComplete="name" value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Your full name" className="field-control h-12" /></label>
                <fieldset className="mt-7"><legend className="font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--muted)]">Your interests</legend><div className="mt-3 flex flex-wrap gap-2">{topics.map((topic) => { const on = selected.has(topic); return <button type="button" key={topic} aria-pressed={on} onClick={() => toggleTopic(topic)} className={"flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-medium transition " + (on ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]" : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)]")}>{on ? <Check size={12} /> : null}{topic}</button>; })}</div></fieldset>
              </> : null}

              {step === 2 ? <>
                <p className="text-sm leading-6 text-[var(--muted)]">High-priority interests move related updates closer to the center of your radar.</p>
                <div className="mt-6 divide-y divide-[var(--border)]">{[...selected].map((topic) => <label key={topic} className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"><span className="text-sm font-medium">{topic}</span><select aria-label={"Priority for " + topic} value={priorities[topic] ?? "medium"} onChange={(event) => setPriorities((current) => ({ ...current, [topic]: event.target.value as Priority }))} className="filter-control"><option value="high">High priority</option><option value="medium">Medium priority</option><option value="low">Low priority</option></select></label>)}</div>
              </> : null}

              {step === 3 ? <>
                <p className="text-sm leading-6 text-[var(--muted)]">Optional keywords add context to your interests. Separate each phrase with a comma.</p>
                <label className="field-label mt-6">Priority keywords<textarea value={keywords} onChange={(event) => setKeywords(event.target.value)} rows={6} placeholder="exam, deadline, hackathon, placement" className="field-control resize-none" /></label>
              </> : null}

              {step === 4 ? <>
                <p className="text-sm leading-6 text-[var(--muted)]">Optional names help messages from faculty, teammates, or mentors rank higher.</p>
                <label className="field-label mt-6">Important people or senders<input value={people} onChange={(event) => setPeople(event.target.value)} placeholder="Faculty advisor, project lead, mentor" className="field-control h-12" /></label>
              </> : null}

              {step === 5 ? <>
                <p className="text-sm leading-6 text-[var(--muted)]">Choose when lower-priority information should be grouped into a quieter summary.</p>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">{(["morning", "evening", "every_x_hours", "manual"] as DigestFrequency[]).map((value) => { const active = digestFrequency === value; const label = value === "every_x_hours" ? "Every few hours" : value === "manual" ? "Only when I ask" : value[0].toUpperCase() + value.slice(1); return <button type="button" key={value} aria-pressed={active} onClick={() => setDigestFrequency(value)} className={"rounded-[calc(var(--radius)/2)] border p-4 text-left transition " + (active ? "border-[var(--accent)] bg-[var(--accent-soft)]" : "border-[var(--border)] hover:border-[var(--accent)]")}><Clock3 size={15} className={active ? "text-[var(--accent)]" : "text-[var(--muted)]"} /><span className="mt-5 block text-sm font-semibold">{label}</span><span className="mt-1 block text-[10px] text-[var(--muted)]">{value === "manual" ? "No automatic digest" : "A compact ranked summary"}</span></button>; })}</div>
              </> : null}

              {step === 6 ? <>
                <p className="text-sm leading-6 text-[var(--muted)]">Non-critical updates can wait during deep work. Urgent inner-ring signals still break through.</p>
                <button type="button" role="switch" aria-checked={quietEnabled} onClick={() => setQuietEnabled((enabled) => !enabled)} className="mt-6 flex w-full items-center justify-between rounded-[calc(var(--radius)/2)] border border-[var(--border)] p-4 text-left hover:border-[var(--accent)]"><span><span className="block text-sm font-semibold">Enable quiet hours</span><span className="mt-1 block text-[10px] text-[var(--muted)]">Hold non-urgent items for the next digest</span></span><span className={"relative h-5 w-9 rounded-full border transition " + (quietEnabled ? "border-[var(--accent)] bg-[var(--accent-soft)]" : "border-[var(--border)]")}><span className={"absolute top-0.5 h-3.5 w-3.5 rounded-full bg-[var(--muted)] transition " + (quietEnabled ? "left-[1.15rem] bg-[var(--accent)]" : "left-0.5")} /></span></button>
                {quietEnabled ? <div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="field-label">Quiet from<input type="time" value={quietStart} onChange={(event) => setQuietStart(event.target.value)} className="field-control h-12" /></label><label className="field-label">Resume at<input type="time" value={quietEnd} onChange={(event) => setQuietEnd(event.target.value)} className="field-control h-12" /></label></div> : null}
              </> : null}

              {message ? <p role="status" className="mt-5 rounded-[calc(var(--radius)/2)] border border-[var(--warn)] bg-[var(--warn-soft)] px-4 py-3 text-xs leading-5 text-[var(--warn)]">{message}</p> : null}
            </div>

            <div className="mt-6 flex items-center justify-between">
              <button type="button" disabled={step === 1 || saving} onClick={() => { setMessage(""); setStep((current) => current - 1); }} className="flex h-10 items-center gap-2 rounded-[calc(var(--radius)/2)] px-4 text-xs font-semibold text-[var(--muted)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)] disabled:invisible"><ArrowLeft size={14} />Back</button>
              <button type="button" disabled={saving} onClick={next} className="flex h-11 items-center gap-2 rounded-[calc(var(--radius)/2)] border border-[var(--accent)] bg-[var(--accent)] px-5 text-xs font-semibold text-[var(--accent-contrast)] shadow-[var(--shadow-glow)] transition hover:-translate-y-0.5 disabled:translate-y-0 disabled:cursor-wait disabled:opacity-60">{saving ? <><Loader2 size={15} className="animate-spin" />Building dashboard</> : <>{step === steps.length ? "Open my dashboard" : "Continue"}<ArrowRight size={14} /></>}</button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
