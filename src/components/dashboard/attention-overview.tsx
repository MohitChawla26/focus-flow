"use client";

import { ArrowUpRight, CalendarClock, CircleGauge, Crosshair, Radio } from "lucide-react";
import { useMemo, useState } from "react";

import type { ScoredContentItem } from "@/types";

type Project = {
  id: string;
  title: string;
  details: string;
  priority: "high" | "medium" | "low";
  deadline: string | null;
  status: string;
};

const CX = 360;
const CY = 360;
const MAX_RADIUS = 260;
const MIN_RADIUS = 82;

function hashAngle(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  return (hash % 360) * (Math.PI / 180);
}

function pointFor(item: ScoredContentItem) {
  const angle = hashAngle(item.id);
  // Ease the radial scale so high-priority signals do not collapse into one tight cluster.
  const normalizedScore = (100 - item.score) / 100;
  const radius = Number((MIN_RADIUS + Math.pow(normalizedScore, 0.72) * (MAX_RADIUS - MIN_RADIUS)).toFixed(2));
  return {
    angle,
    radius,
    x: Number((CX + Math.cos(angle) * radius).toFixed(2)),
    y: Number((CY + Math.sin(angle) * radius).toFixed(2)),
  };
}

function tone(priority: ScoredContentItem["priority"]) {
  if (priority === "critical") return "var(--critical)";
  if (priority === "high") return "var(--high)";
  if (priority === "medium") return "var(--medium)";
  return "var(--low)";
}

export function AttentionOverview({ items, projects }: { items: ScoredContentItem[]; projects: Project[] }) {
  const ranked = useMemo(() => [...items].sort((a, b) => b.score - a.score).slice(0, 32), [items]);
  const points = useMemo(() => ranked.map((item) => ({ item, ...pointFor(item) })), [ranked]);
  const path = useMemo(() => points.length > 1 ? points.map((point, index) => `${index ? "L" : "M"}${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" ") : "", [points]);
  const [selected, setSelected] = useState<ScoredContentItem | null>(ranked[0] ?? null);
  const urgentCount = ranked.filter((item) => item.priority === "critical" || item.priority === "high").length;
  const activeProjects = projects.filter((project) => project.status !== "completed").slice(0, 5);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--accent)]">Live command center</div><h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em]">Overview</h1><p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">Distance is priority: the items closest to you need action first.</p></div><div className="flex gap-2"><span className="metric-chip"><Radio size={12} />{ranked.length} signals</span><span className="metric-chip text-[var(--critical)]"><Crosshair size={12} />{urgentCount} high priority</span></div></div>

      {ranked.length ? <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_21rem]"><section className="radar-shell overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-[var(--panel)]"><div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3 font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--muted)]"><span>Attention radar · live</span><span>inner = urgent</span></div><div className="thin-scrollbar overflow-x-auto"><svg viewBox="0 0 720 720" role="img" aria-label="Priority radar showing high-priority information close to the center" className="mx-auto block min-w-[650px] max-w-[820px]">
        <g aria-hidden="true">
          {[62, 112, 162, 212, 262].map((radius, index) => <circle key={radius} cx={CX} cy={CY} r={radius} fill="none" stroke="var(--border)" strokeWidth={index === 0 ? 1.5 : 1} strokeDasharray={index % 2 ? "3 7" : undefined} />)}
          {Array.from({ length: 16 }, (_, index) => { const angle = index * (Math.PI / 8); return <line key={index} x1={CX + Math.cos(angle) * 48} y1={CY + Math.sin(angle) * 48} x2={CX + Math.cos(angle) * 280} y2={CY + Math.sin(angle) * 280} stroke="var(--border)" strokeWidth="0.8" />; })}
          <circle cx={CX} cy={CY} r="42" fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth="1" />
          <circle cx={CX} cy={CY} r="24" fill="var(--panel-strong)" stroke="var(--accent)" strokeWidth="2" />
          <circle cx={CX} cy={CY} r="8" fill="var(--accent)" className="radar-core" />
          <line x1={CX} y1={CY} x2={CX} y2="72" stroke="var(--accent)" strokeWidth="1.5" className="radar-sweep" />
          {path ? <path d={path} fill="none" stroke="var(--accent)" strokeOpacity="0.35" strokeWidth="1.3" /> : null}
        </g>
        {points.map(({ item, x, y }) => <g key={item.id} role="button" tabIndex={0} aria-label={`${item.title}, priority score ${item.score}`} onClick={() => setSelected(item)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelected(item); } }} className="cursor-pointer outline-none"><circle cx={x} cy={y} r={selected?.id === item.id ? 15 : item.priority === "critical" ? 12 : item.priority === "high" ? 10 : 9} fill="var(--panel)" stroke={tone(item.priority)} strokeWidth={selected?.id === item.id ? 5 : 3.5} className="radar-point" /><circle cx={x} cy={y} r="3.5" fill={tone(item.priority)} /><text x={x < CX ? x - 17 : x + 17} y={y + 4} textAnchor={x < CX ? "end" : "start"} fill="var(--muted)" fontSize="11" className="pointer-events-none font-mono">{String(item.score)}</text></g>)}
        <text x={CX} y={CY + 4} textAnchor="middle" fill="var(--accent)" fontSize="8" className="font-mono">YOU</text>
        <text x={CX} y="36" textAnchor="middle" fill="var(--muted)" fontSize="9" className="font-mono">LOW PRIORITY PERIMETER</text>
      </svg></div></section><aside className="space-y-4"><section className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--panel)] p-5 shadow-[var(--shadow-soft)]">{selected ? <><div className="flex items-center justify-between"><span className="font-mono text-[9px] uppercase text-[var(--muted)]">Selected signal</span><span className="font-mono text-xs text-[var(--accent)]">{selected.score}/100</span></div><h2 className="mt-3 text-lg font-semibold leading-6">{selected.analysis.catchyTitle || selected.title}</h2><p className="mt-3 text-xs leading-5 text-[var(--muted)]">{selected.analysis.summary}</p><div className="mt-4 border-l-2 border-[var(--accent)] pl-3 text-[11px] leading-5 text-[var(--muted)]">{selected.reasons[0] || selected.analysis.suggestedPriorityReason}</div>{selected.originalUrl ? <a href={selected.originalUrl} target="_blank" rel="noreferrer" className="mt-5 flex items-center justify-center gap-2 rounded-[calc(var(--radius)/2)] border border-[var(--accent)] px-3 py-2 text-xs font-semibold text-[var(--accent)] hover:bg-[var(--accent-soft)]">Open source <ArrowUpRight size={13} /></a> : null}</> : null}</section><section className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--panel)] p-5"><div className="flex items-center gap-2"><CircleGauge size={15} className="text-[var(--accent)]" /><h2 className="text-sm font-semibold">Active projects</h2></div>{activeProjects.length ? <div className="mt-3 space-y-3">{activeProjects.map((project) => <div key={project.id} className="border-t border-[var(--border)] pt-3 first:border-0 first:pt-0"><div className="text-xs font-medium">{project.title}</div><div className="mt-1 flex items-center gap-2 font-mono text-[9px] uppercase text-[var(--muted)]"><span>{project.priority}</span>{project.deadline ? <><span>·</span><CalendarClock size={10} /><span>{new Date(project.deadline).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</span></> : null}</div></div>)}</div> : <p className="mt-3 text-xs text-[var(--muted)]">No active projects yet.</p>}</section></aside></div> : <div className="rounded-[var(--radius)] border border-dashed border-[var(--border)] bg-[var(--panel)] px-6 py-20 text-center"><Crosshair className="mx-auto text-[var(--accent)]" size={24} /><h2 className="mt-4 font-semibold">Radar awaiting signals</h2><p className="mt-2 text-sm text-[var(--muted)]">Sync your sources and ranked items will appear automatically.</p></div>}
    </div>
  );
}
