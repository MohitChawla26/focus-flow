"use client";

import { ArrowUpRight, CircleDot } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";

import { ThemeToggle } from "@/components/theme-toggle";

const chips = [
  "Exam hall ticket released",
  "Internship deadline: Friday",
  "Scholarship form open",
  "Hackathon team call",
  "Cafeteria menu update",
  "Cricket: fixtures",
];

export function LandingHero() {
  const reduceMotion = useReducedMotion();
  const [ordered, setOrdered] = useState(Boolean(reduceMotion));

  useEffect(() => {
    if (reduceMotion) return;
    const timer = window.setTimeout(() => setOrdered(true), 1400);
    return () => window.clearTimeout(timer);
  }, [reduceMotion]);

  return (
    <main className="min-h-screen px-5 py-12 sm:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-6xl flex-col justify-center">
        <div className="mb-12 flex items-center justify-between font-semibold tracking-[-0.03em] lg:mb-16">
          <div className="flex items-center gap-2"><CircleDot size={19} className="text-[var(--accent)]" /><span>focus-flow</span></div>
          <ThemeToggle />
        </div>

        <div className="grid items-center gap-14 lg:grid-cols-[1fr_0.9fr] lg:gap-20">
          <section>
            <p className="mb-5 font-mono text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
              Your attention, ranked
            </p>
            <h1 className="max-w-3xl text-5xl font-semibold leading-[1.05] tracking-[-0.055em] sm:text-6xl">
              Too much information?<br />We&apos;ll show you what matters.
            </h1>
            <p className="mt-7 max-w-md text-base leading-7 text-[var(--muted)]">
              focus-flow reads your mail, Teams, notice boards and feeds, then ranks everything by what you must act on first.
            </p>
            <Link
              href="/login"
              className="mt-8 inline-flex items-center gap-2 rounded-[var(--radius)] border border-[var(--accent)] px-5 py-3 text-sm font-semibold text-[var(--accent)] transition hover:bg-[var(--accent)] hover:text-[var(--accent-contrast)]"
            >
              Open dashboard <ArrowUpRight size={16} />
            </Link>
          </section>

          <section
            aria-hidden="true"
            onMouseEnter={() => !reduceMotion && setOrdered(false)}
            onMouseLeave={() => setOrdered(true)}
            className="landing-depth relative h-[360px] overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-[var(--panel)] soft-shadow"
          >
            <div className="absolute inset-x-0 top-0 flex items-center justify-between border-b border-[var(--border)] px-4 py-3 font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--muted)]">
              <span>Incoming</span><span>{ordered ? "Ranked" : "Unsorted"}</span>
            </div>
            <div className="landing-core" aria-hidden="true"><span className="landing-orbit landing-orbit-a" /><span className="landing-orbit landing-orbit-b" /><span className="landing-orbit landing-orbit-c" /><span className="landing-core-dot" /></div>
            <div className="absolute bottom-4 right-4 font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--muted)]">priority depth · live</div>
            {chips.map((chip, index) => {
              const chaosLeft = `${(index * 37) % 55}%`;
              const chaosTop = `${12 + ((index * 53) % 72)}%`;
              const rotation = (index % 2 === 0 ? 1 : -1) * (6 + 3 * index);
              const tone = index < 2 ? "var(--warn)" : index < 4 ? "var(--info)" : "var(--muted)";
              return (
                <motion.div
                  key={chip}
                  initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    left: ordered ? 16 : chaosLeft,
                    top: ordered ? 58 + index * 48 : chaosTop,
                    rotate: ordered ? 0 : rotation,
                    z: ordered ? 36 - index * 4 : 8 + index * 5,
                  }}
                  transition={{ duration: reduceMotion ? 0 : 1.2, ease: "easeOut" }}
                  className="absolute whitespace-nowrap rounded-[calc(var(--radius)/2)] border border-[var(--border)] bg-[var(--panel-strong)] px-3 py-2 font-mono text-sm shadow-[var(--shadow-soft)]"
                  style={{ borderLeftWidth: 3, borderLeftColor: tone }}
                >
                  <span className="mr-2 text-[10px] text-[var(--muted)]">0{index + 1}</span>{chip}
                </motion.div>
              );
            })}
          </section>
        </div>
      </div>
    </main>
  );
}
