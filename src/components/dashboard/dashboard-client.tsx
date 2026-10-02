"use client";

import {
  Bell, Bookmark, BookmarkCheck, CalendarClock, Check, CheckCircle2, ChevronRight,
  CircleGauge, ExternalLink, EyeOff, Flame, FolderKanban, Inbox, LayoutDashboard, ListFilter,
  Loader2, LogOut, Menu, Plus, RefreshCw, Rss, Search, Sparkles, Trash2, UserRound, X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { AttentionOverview } from "@/components/dashboard/attention-overview";
import { ThemeToggle } from "@/components/theme-toggle";
import type { Database } from "@/types/database";
import type { ScoredContentItem } from "@/types";

type Priority = Database["public"]["Enums"]["priority_level"];
type View = "overview" | "feed" | "projects" | "priorities" | "saved" | "insights" | "sources" | "profile";
type Interest = { topic: string; priority: Priority };
type SourceStatus = { name: string; description: string; configured: boolean };
type Project = {
  id: string;
  title: string;
  details: string;
  priority: Priority;
  deadline: string | null;
  status: string;
  created_at: string;
};

type DashboardProps = {
  initialItems: ScoredContentItem[];
  initialReadItemIds: string[];
  initialHiddenItemIds: string[];
  initialSavedItemIds: string[];
  initialProjects: Project[];
  userName: string;
  userEmail: string;
  interests: Interest[];
  sourceStatuses: SourceStatus[];
  nowIso: string;
  currentDate: string;
  greeting: string;
};

const PAGE_SIZE = 12;
const panel = "rounded-[var(--radius)] border border-[var(--border)] bg-[var(--panel)] shadow-[var(--shadow-soft)]";
const priorityTone = {
  critical: { border: "border-[var(--critical)]", text: "text-[var(--critical)]", soft: "bg-[var(--critical-soft)]", label: "Must see" },
  high: { border: "border-[var(--high)]", text: "text-[var(--high)]", soft: "bg-[var(--high-soft)]", label: "High" },
  medium: { border: "border-[var(--medium)]", text: "text-[var(--medium)]", soft: "bg-[var(--medium-soft)]", label: "Medium" },
  low: { border: "border-[var(--low)]", text: "text-[var(--low)]", soft: "bg-[var(--low-soft)]", label: "Low" },
} as const;

function relativeTime(value: string | undefined, nowIso: string) {
  if (!value) return "Recently";
  const minutes = Math.max(1, Math.round((new Date(nowIso).getTime() - new Date(value).getTime()) / 60_000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  return hours < 24 ? `${hours}h ago` : `${Math.round(hours / 24)}d ago`;
}

function displayTitle(item: ScoredContentItem) {
  return item.analysis.catchyTitle?.trim() || item.title;
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return <div className={`${panel} grid min-h-64 place-items-center border-dashed px-6 text-center`}><div><Sparkles className="mx-auto text-[var(--accent)]" size={22} /><h3 className="mt-4 font-semibold">{title}</h3><p className="mt-2 max-w-md text-sm text-[var(--muted)]">{text}</p></div></div>;
}

function FeedCard({ item, saved, nowIso, onSave, onRead, onHide }: {
  item: ScoredContentItem; saved: boolean; nowIso: string;
  onSave: () => void; onRead: () => void; onHide: () => void;
}) {
  const tone = priorityTone[item.priority];
  const hasAiHeadline = displayTitle(item) !== item.title;
  return (
    <article className={`${panel} group relative flex min-h-72 flex-col overflow-hidden border-t-2 ${tone.border} p-4 transition hover:-translate-y-1 hover:shadow-[var(--shadow-glow)]`}>
      <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--muted)]"><span className={`h-2 w-2 rounded-full ${tone.soft}`} /><span className="truncate">{item.source}</span><span className="ml-auto shrink-0">{relativeTime(item.publishedAt, nowIso)}</span></div>
      <div className="mt-4 flex items-start gap-3"><div className="min-w-0 flex-1">{hasAiHeadline ? <div className="mb-1.5 flex items-center gap-1 font-mono text-[9px] uppercase text-[var(--accent)]"><Sparkles size={10} />AI refined</div> : null}<h3 title={item.title} className="line-clamp-3 text-base font-semibold leading-6 tracking-[-0.02em]">{displayTitle(item)}</h3></div><span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border ${tone.border} ${tone.text} font-mono text-xs font-bold`}>{item.score}</span></div>
      <p className="mt-3 line-clamp-3 text-xs leading-5 text-[var(--muted)]">{item.analysis.summary}</p>
      <div className="mt-3 flex flex-wrap gap-1.5"><span className={`rounded-full border ${tone.border} ${tone.text} px-2 py-1 text-[9px] font-bold uppercase`}>{tone.label}</span><span className="rounded-full border border-[var(--border)] px-2 py-1 text-[9px] text-[var(--muted)]">{item.analysis.category}</span></div>
      {item.reasons[0] ? <div className="mt-3 border-l-2 border-[var(--accent)] pl-3 text-[11px] leading-5 text-[var(--muted)]">{item.reasons[0]}</div> : null}
      <div className="mt-auto flex items-center gap-1 border-t border-[var(--border)] pt-3"><button onClick={onSave} aria-label={saved ? "Remove bookmark" : "Bookmark"} className="icon-button">{saved ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}</button><button onClick={onRead} aria-label="Mark read" className="icon-button"><Check size={16} /></button><button onClick={onHide} aria-label="Hide item" className="icon-button"><EyeOff size={15} /></button>{item.originalUrl ? <a href={item.originalUrl} target="_blank" rel="noreferrer" onClick={onRead} className="ml-auto flex h-8 items-center gap-1 rounded-[calc(var(--radius)/2)] border border-[var(--accent)] px-2.5 text-[10px] font-semibold text-[var(--accent)] hover:bg-[var(--accent-soft)]">Open <ExternalLink size={11} /></a> : null}</div>
    </article>
  );
}

function ProjectForm({ onCreated }: { onCreated: (project: Project) => void }) {
  const [form, setForm] = useState({ title: "", details: "", priority: "medium" as Priority, deadline: "" });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true); setMessage("");
    const supabase = createClient();
    if (!supabase) { setMessage("The database is not configured; add Supabase credentials and try again."); setSaving(false); return; }
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) { setMessage("Your session expired; sign in again and retry."); setSaving(false); return; }
    const { data, error } = await supabase.from("user_projects").insert({
      user_id: auth.user.id,
      title: form.title.trim(),
      details: form.details.trim(),
      priority: form.priority,
      deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
    }).select("id,title,details,priority,deadline,status,created_at").single();
    setSaving(false);
    if (error || !data) { setMessage(error?.message || "The project could not be saved; try again."); return; }
    onCreated(data);
    setForm({ title: "", details: "", priority: "medium", deadline: "" });
    setMessage("Project added to your attention queue.");
  }

  return <form onSubmit={submit} className={`${panel} p-5`}><div className="flex items-center gap-2"><Plus className="text-[var(--accent)]" size={17} /><h2 className="font-semibold">Add a project</h2></div><div className="mt-5 grid gap-4"><label className="field-label">Project title<input required maxLength={160} value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="e.g. Semester portfolio" className="field-control" /></label><label className="field-label">Details<textarea maxLength={5000} rows={5} value={form.details} onChange={(event) => setForm((current) => ({ ...current, details: event.target.value }))} placeholder="Goals, links, people involved, and the next step" className="field-control resize-y" /></label><div className="grid gap-4 sm:grid-cols-2"><label className="field-label">Priority<select value={form.priority} onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value as Priority }))} className="field-control"><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></label><label className="field-label">Deadline<input type="datetime-local" value={form.deadline} onChange={(event) => setForm((current) => ({ ...current, deadline: event.target.value }))} className="field-control font-mono" /></label></div></div>{message ? <p role="status" className="mt-4 text-xs text-[var(--accent)]">{message}</p> : null}<button disabled={saving} className="mt-5 flex h-10 w-full items-center justify-center gap-2 rounded-[calc(var(--radius)/2)] bg-[var(--accent)] px-4 text-xs font-bold text-[var(--accent-contrast)] disabled:opacity-60">{saving ? <Loader2 className="animate-spin" size={15} /> : <Plus size={15} />}{saving ? "Saving…" : "Add project"}</button></form>;
}

function ProjectsView({ initialProjects }: { initialProjects: Project[] }) {
  const [projects, setProjects] = useState(initialProjects);
  const [error, setError] = useState("");

  async function updateStatus(project: Project) {
    const supabase = createClient();
    if (!supabase) return;
    const status = project.status === "completed" ? "active" : "completed";
    const { error: updateError } = await supabase.from("user_projects").update({ status }).eq("id", project.id);
    if (updateError) { setError(updateError.message); return; }
    setProjects((current) => current.map((value) => value.id === project.id ? { ...value, status } : value));
  }

  async function remove(project: Project) {
    const supabase = createClient();
    if (!supabase) return;
    const { error: deleteError } = await supabase.from("user_projects").delete().eq("id", project.id);
    if (deleteError) { setError(deleteError.message); return; }
    setProjects((current) => current.filter((value) => value.id !== project.id));
  }

  return <div><PageHeading eyebrow="Your input" title="Projects & deadlines" subtitle="Add the work that matters to you. It stays private to your account and sits beside your ranked feed." />{error ? <div role="alert" className="mb-4 rounded-[calc(var(--radius)/2)] border border-[var(--critical)] bg-[var(--critical-soft)] p-3 text-xs text-[var(--critical)]">{error}</div> : null}<div className="grid gap-4 xl:grid-cols-[minmax(19rem,26rem)_1fr]"><ProjectForm onCreated={(project) => setProjects((current) => [project, ...current])} /><section className={`${panel} p-5`}><div className="flex items-center justify-between"><h2 className="font-semibold">Your queue</h2><span className="font-mono text-[10px] text-[var(--muted)]">{projects.length} projects</span></div>{projects.length ? <div className="mt-4 grid gap-3 md:grid-cols-2">{projects.map((project) => { const tone = priorityTone[project.priority]; return <article key={project.id} className={`rounded-[calc(var(--radius)/1.4)] border ${tone.border} bg-[var(--panel-strong)] p-4 ${project.status === "completed" ? "opacity-55" : ""}`}><div className="flex items-start gap-3"><button onClick={() => void updateStatus(project)} aria-label={project.status === "completed" ? `Mark ${project.title} active` : `Complete ${project.title}`} className={`icon-button shrink-0 ${project.status === "completed" ? "text-[var(--ok)]" : ""}`}>{project.status === "completed" ? <CheckCircle2 size={16} /> : <CircleGauge size={16} />}</button><div className="min-w-0 flex-1"><h3 className="font-semibold">{project.title}</h3><span className={`mt-1 inline-block font-mono text-[9px] uppercase ${tone.text}`}>{project.priority}</span></div><button onClick={() => void remove(project)} aria-label={`Delete ${project.title}`} className="icon-button text-[var(--critical)]"><Trash2 size={14} /></button></div>{project.details ? <p className="mt-3 whitespace-pre-wrap text-xs leading-5 text-[var(--muted)]">{project.details}</p> : null}{project.deadline ? <div className="mt-4 flex items-center gap-2 border-t border-[var(--border)] pt-3 font-mono text-[10px] text-[var(--warn)]"><CalendarClock size={13} />{new Date(project.deadline).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</div> : null}</article>; })}</div> : <p className="mt-8 text-sm text-[var(--muted)]">No projects yet. Add the first one using the form.</p>}</section></div></div>;
}

function PageHeading({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  return <div className="mb-6"><div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--accent)]">{eyebrow}</div><h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em]">{title}</h1><p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">{subtitle}</p></div>;
}

function ProfileView({ name, email, interests, onNameChange, onLogout }: { name: string; email: string; interests: Interest[]; onNameChange: (name: string) => void; onLogout: () => void }) {
  const [nextName, setNextName] = useState(name);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function save(event: React.FormEvent) {
    event.preventDefault();
    const cleanName = nextName.trim();
    if (cleanName.length < 2) { setMessage("Enter at least two characters for your display name."); return; }
    const supabase = createClient();
    if (!supabase) { setMessage("The database is not configured; add Supabase credentials and try again."); return; }
    setSaving(true); setMessage("");
    const { data } = await supabase.auth.getUser();
    if (!data.user) { setSaving(false); setMessage("Your session expired; sign in again and retry."); return; }
    const { error } = await supabase.from("profiles").update({ display_name: cleanName }).eq("id", data.user.id);
    setSaving(false);
    if (error) { setMessage(error.message); return; }
    onNameChange(cleanName);
    setMessage("Profile updated.");
  }

  return <div><PageHeading eyebrow="Account" title="Profile" subtitle="Manage the identity and attention signals used by your workspace." /><div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]"><form onSubmit={save} className={`${panel} p-5`}><div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-full border border-[var(--accent)] bg-[var(--accent-soft)] text-lg font-semibold text-[var(--accent)]">{name.slice(0, 1).toUpperCase()}</span><div><h2 className="font-semibold">Personal details</h2><p className="mt-1 text-xs text-[var(--muted)]">Used for greetings and your private workspace.</p></div></div><div className="mt-6 grid gap-4"><label className="field-label">Display name<input value={nextName} onChange={(event) => setNextName(event.target.value)} maxLength={80} className="field-control" /></label><label className="field-label">Email<input value={email} readOnly className="field-control opacity-70" /></label></div>{message ? <p role="status" className="mt-4 text-xs text-[var(--accent)]">{message}</p> : null}<button disabled={saving} className="mt-5 flex h-10 items-center justify-center gap-2 rounded-[calc(var(--radius)/2)] bg-[var(--accent)] px-4 text-xs font-bold text-[var(--accent-contrast)] disabled:opacity-60">{saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}{saving ? "Saving…" : "Save profile"}</button></form><aside className={`${panel} p-5`}><h2 className="font-semibold">Attention profile</h2><p className="mt-2 text-xs leading-5 text-[var(--muted)]">Your saved interests shape every relevance score.</p><div className="mt-4 flex flex-wrap gap-2">{interests.length ? interests.map((interest) => <span key={interest.topic} className="rounded-full border border-[var(--border)] bg-[var(--panel-strong)] px-2.5 py-1.5 text-[10px]"><span className="font-medium">{interest.topic}</span><span className="ml-1 text-[var(--muted)]">· {interest.priority}</span></span>) : <span className="text-xs text-[var(--muted)]">No interests saved yet.</span>}</div><button type="button" onClick={onLogout} className="mt-8 flex h-10 w-full items-center justify-center gap-2 rounded-[calc(var(--radius)/2)] border border-[var(--critical)] text-xs font-semibold text-[var(--critical)] hover:bg-[var(--critical-soft)]"><LogOut size={14} />Log out</button></aside></div></div>;
}

export function DashboardClient(props: DashboardProps) {
  const router = useRouter();
  const autoRefreshed = useRef(false);
  const [view, setView] = useState<View>("overview");
  const [displayName, setDisplayName] = useState(props.userName);
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [saved, setSaved] = useState(() => new Set(props.initialSavedItemIds));
  const [read, setRead] = useState(() => new Set(props.initialReadItemIds));
  const [hidden, setHidden] = useState(() => new Set(props.initialHiddenItemIds));
  const [refreshing, setRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState("");

  const refresh = useCallback(async () => {
    setRefreshing(true); setRefreshMessage("");
    try {
      const response = await fetch("/api/content", { method: "POST" });
      const result = await response.json() as { created?: number; warnings?: string[]; error?: string };
      if (!response.ok) throw new Error(result.error || result.warnings?.[0] || "Source refresh failed.");
      setRefreshMessage(result.created ? `${result.created} new updates added.` : "Sources are synced; there are no new updates.");
      router.refresh();
    } catch (error) {
      setRefreshMessage(error instanceof Error ? error.message : "Sources could not refresh; check the server configuration.");
    } finally { setRefreshing(false); }
  }, [router]);

  useEffect(() => {
    if (autoRefreshed.current) return;
    autoRefreshed.current = true;
    void refresh();
  }, [refresh]);

  const unreadItems = useMemo(() => props.initialItems.filter((item) => !read.has(item.id) && !hidden.has(item.id)), [hidden, props.initialItems, read]);
  const sources = useMemo(() => [...new Set(unreadItems.map((item) => item.source))].sort(), [unreadItems]);
  const categories = useMemo(() => [...new Set(unreadItems.map((item) => item.analysis.category))].sort(), [unreadItems]);
  const filtered = useMemo(() => unreadItems.filter((item) => {
    const text = `${displayTitle(item)} ${item.title} ${item.analysis.summary} ${item.source}`.toLowerCase();
    return (!query || text.includes(query.toLowerCase())) && (sourceFilter === "all" || item.source === sourceFilter) && (categoryFilter === "all" || item.analysis.category === categoryFilter) && (priorityFilter === "all" || item.priority === priorityFilter);
  }), [categoryFilter, priorityFilter, query, sourceFilter, unreadItems]);

  const mutateRead = useCallback(async (id: string, kind: "read" | "hidden") => {
    if (kind === "read") setRead((current) => new Set(current).add(id)); else setHidden((current) => new Set(current).add(id));
    const supabase = createClient(); if (!supabase) return;
    const { data } = await supabase.auth.getUser(); if (!data.user) return;
    const timestamp = new Date().toISOString();
    const payload: Database["public"]["Tables"]["read_status"]["Insert"] = kind === "read"
      ? { user_id: data.user.id, content_item_id: id, read_at: timestamp }
      : { user_id: data.user.id, content_item_id: id, hidden_at: timestamp };
    await supabase.from("read_status").upsert(payload, { onConflict: "user_id,content_item_id" });
  }, []);

  const toggleSaved = useCallback(async (id: string) => {
    const shouldSave = !saved.has(id);
    setSaved((current) => { const next = new Set(current); if (shouldSave) next.add(id); else next.delete(id); return next; });
    const supabase = createClient(); if (!supabase) return;
    const { data } = await supabase.auth.getUser(); if (!data.user) return;
    if (shouldSave) await supabase.from("bookmarks").insert({ user_id: data.user.id, content_item_id: id });
    else await supabase.from("bookmarks").delete().eq("user_id", data.user.id).eq("content_item_id", id);
  }, [saved]);

  const logout = useCallback(async () => {
    const supabase = createClient();
    if (supabase) await supabase.auth.signOut({ scope: "local" });
    router.push("/login");
    router.refresh();
  }, [router]);

  const feed = <div><PageHeading eyebrow={props.currentDate} title={`${props.greeting}, ${props.userName}.`} subtitle="Real updates, ranked against the interests and priorities saved in your profile." /><div className={`${panel} mb-5 flex flex-wrap items-center gap-2 p-3`}><ListFilter size={15} className="text-[var(--accent)]" /><select aria-label="Filter by source" value={sourceFilter} onChange={(event) => { setSourceFilter(event.target.value); setVisibleCount(PAGE_SIZE); }} className="filter-control"><option value="all">All sources</option>{sources.map((source) => <option key={source}>{source}</option>)}</select><select aria-label="Filter by category" value={categoryFilter} onChange={(event) => { setCategoryFilter(event.target.value); setVisibleCount(PAGE_SIZE); }} className="filter-control"><option value="all">All categories</option>{categories.map((category) => <option key={category}>{category}</option>)}</select><select aria-label="Filter by priority" value={priorityFilter} onChange={(event) => { setPriorityFilter(event.target.value); setVisibleCount(PAGE_SIZE); }} className="filter-control"><option value="all">All priorities</option><option value="critical">Must see</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select><span className="ml-auto font-mono text-[10px] text-[var(--muted)]">{filtered.length} unread</span></div>{filtered.length ? <><div className="grid gap-5 sm:grid-cols-2">{filtered.slice(0, visibleCount).map((item) => <FeedCard key={item.id} item={item} saved={saved.has(item.id)} nowIso={props.nowIso} onSave={() => void toggleSaved(item.id)} onRead={() => void mutateRead(item.id, "read")} onHide={() => void mutateRead(item.id, "hidden")} />)}</div>{visibleCount < filtered.length ? <button onClick={() => setVisibleCount((count) => count + PAGE_SIZE)} className="mx-auto mt-7 flex h-10 items-center gap-2 rounded-[calc(var(--radius)/2)] border border-[var(--accent)] px-5 text-xs font-semibold text-[var(--accent)] hover:bg-[var(--accent-soft)]">Load more <ChevronRight size={14} /></button> : null}</> : <EmptyState title={query || sourceFilter !== "all" || categoryFilter !== "all" || priorityFilter !== "all" ? "No matching information" : "Nothing needs action"} text={query ? "Try another search or clear a filter." : "Check back after the next source sync."} />}</div>;

  const savedView = <div><PageHeading eyebrow="Reading list" title="Saved updates" subtitle="Only items you bookmarked from your real feed appear here." />{props.initialItems.filter((item) => saved.has(item.id)).length ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">{props.initialItems.filter((item) => saved.has(item.id)).map((item) => <FeedCard key={item.id} item={item} saved nowIso={props.nowIso} onSave={() => void toggleSaved(item.id)} onRead={() => void mutateRead(item.id, "read")} onHide={() => void mutateRead(item.id, "hidden")} />)}</div> : <EmptyState title="Your reading list is empty" text="Bookmark a feed card and it will appear here." />}</div>;
  const priorityView = <div><PageHeading eyebrow="Personal signals" title="Your priorities" subtitle="These values come from your onboarding profile and directly influence every score." />{props.interests.length ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{props.interests.map((interest) => { const tone = priorityTone[interest.priority]; return <div key={interest.topic} className={`${panel} border-l-2 ${tone.border} p-5`}><div className="text-lg font-semibold">{interest.topic}</div><div className={`mt-2 font-mono text-[10px] uppercase ${tone.text}`}>{interest.priority} priority</div></div>; })}</div> : <EmptyState title="No priorities saved" text="Complete onboarding to personalize your ranking." />}</div>;
  const insightsView = <div><PageHeading eyebrow="Live account data" title="Attention insights" subtitle="Calculated from the information currently stored for your account." /><div className="grid gap-4 sm:grid-cols-3">{[{ label: "Updates", value: props.initialItems.length }, { label: "Must see", value: props.initialItems.filter((item) => item.priority === "critical").length }, { label: "Saved", value: saved.size }].map((metric) => <div key={metric.label} className={`${panel} p-5`}><div className="font-mono text-[10px] uppercase text-[var(--muted)]">{metric.label}</div><div className="mt-3 text-4xl font-semibold text-[var(--accent)]">{metric.value}</div></div>)}</div></div>;
  const sourceView = <div><PageHeading eyebrow="Server status" title="Information sources" subtitle="Configuration is read from the running server; unavailable integrations are labelled honestly." /><div className="grid gap-3 md:grid-cols-2">{props.sourceStatuses.map((source) => <div key={source.name} className={`${panel} flex items-center gap-4 p-4`}><div className="grid h-10 w-10 place-items-center rounded-full border border-[var(--border)] text-[var(--accent)]"><Rss size={17} /></div><div className="min-w-0"><div className="font-semibold">{source.name}</div><div className="mt-1 text-xs text-[var(--muted)]">{source.description}</div></div><span className={`ml-auto h-2.5 w-2.5 rounded-full ${source.configured ? "bg-[var(--ok)]" : "bg-[var(--warn)]"}`} aria-label={source.configured ? "Configured" : "Not configured"} /></div>)}</div></div>;

  const nav = [
    { id: "overview" as const, label: "Overview", icon: LayoutDashboard },
    { id: "feed" as const, label: "Smart feed", icon: Inbox },
    { id: "projects" as const, label: "Projects", icon: FolderKanban },
    { id: "priorities" as const, label: "Priorities", icon: Flame },
    { id: "saved" as const, label: "Saved", icon: Bookmark },
    { id: "insights" as const, label: "Insights", icon: CircleGauge },
    { id: "sources" as const, label: "Sources", icon: Rss },
    { id: "profile" as const, label: "Profile", icon: UserRound },
  ];
  const content = view === "overview"
    ? <AttentionOverview items={unreadItems} projects={props.initialProjects} />
    : view === "feed"
      ? feed
      : view === "projects"
        ? <ProjectsView initialProjects={props.initialProjects} />
        : view === "priorities"
          ? priorityView
          : view === "saved"
            ? savedView
            : view === "insights"
              ? insightsView
              : view === "sources"
                ? sourceView
                : <ProfileView name={displayName} email={props.userEmail} interests={props.interests} onNameChange={setDisplayName} onLogout={() => void logout()} />;

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <button aria-label="Close navigation" onClick={() => setMenuOpen(false)} className={`fixed inset-0 z-40 bg-[var(--overlay)] lg:hidden ${menuOpen ? "block" : "hidden"}`} />
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-[var(--border)] bg-[var(--panel)] p-4 transition-transform lg:translate-x-0 ${menuOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-14 items-center gap-3 px-2"><div className="grid h-9 w-9 place-items-center rounded-full border border-[var(--accent)] text-[var(--accent)] shadow-[var(--shadow-glow)]"><Sparkles size={16} /></div><div><div className="font-semibold tracking-[-0.03em]">focus-flow</div><div className="font-mono text-[9px] uppercase text-[var(--muted)]">attention system</div></div><button aria-label="Close navigation" onClick={() => setMenuOpen(false)} className="icon-button ml-auto lg:hidden"><X size={15} /></button></div>
        <nav className="mt-7 space-y-1">{nav.map((item) => { const Icon = item.icon; return <button key={item.id} onClick={() => { setView(item.id); setMenuOpen(false); }} className={`flex w-full items-center gap-3 rounded-[calc(var(--radius)/2)] px-3 py-2.5 text-left text-xs font-medium ${view === item.id ? "bg-[var(--accent-soft)] text-[var(--accent)]" : "text-[var(--muted)] hover:bg-[var(--panel-strong)] hover:text-[var(--text)]"}`}><Icon size={16} />{item.label}{item.id === "feed" ? <span className="ml-auto font-mono text-[9px]">{unreadItems.length}</span> : null}</button>; })}</nav>
        <div className="mt-auto border-t border-[var(--border)] pt-4"><button onClick={() => setView("profile")} className="flex w-full items-center gap-3 rounded-[calc(var(--radius)/2)] p-2 text-left hover:bg-[var(--panel-strong)]"><span className="grid h-9 w-9 place-items-center rounded-full border border-[var(--accent)] bg-[var(--accent-soft)] text-xs font-semibold text-[var(--accent)]">{displayName.slice(0, 1).toUpperCase()}</span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold">{displayName}</span><span className="mt-1 block text-[10px] text-[var(--muted)]">View profile</span></span><ChevronRight size={13} className="text-[var(--muted)]" /></button><button onClick={() => void logout()} className="mt-2 flex w-full items-center gap-2 px-3 py-2 text-[10px] text-[var(--critical)]"><LogOut size={13} />Log out</button></div>
      </aside>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex min-h-16 items-center gap-2 border-b border-[var(--border)] bg-[var(--panel-translucent)] px-3 backdrop-blur-xl sm:px-6"><button aria-label="Open navigation" onClick={() => setMenuOpen(true)} className="icon-button lg:hidden"><Menu size={17} /></button><div className="relative min-w-0 flex-1 sm:max-w-xl"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" /><input value={query} onChange={(event) => { setQuery(event.target.value); setView("feed"); setVisibleCount(PAGE_SIZE); }} placeholder="Search your information" className="h-10 w-full rounded-[calc(var(--radius)/2)] border border-[var(--border)] bg-[var(--panel-strong)] pl-9 pr-3 text-xs outline-none focus:border-[var(--accent)]" /></div><button onClick={() => void refresh()} disabled={refreshing} className="flex h-10 items-center gap-2 rounded-[calc(var(--radius)/2)] border border-[var(--border)] px-3 text-[10px] font-semibold text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-50"><RefreshCw size={14} className={refreshing ? "animate-spin" : ""} /><span className="hidden sm:inline">{refreshing ? "Syncing" : "Sync now"}</span></button><ThemeToggle /><button aria-label="Notifications" className="icon-button"><Bell size={15} /></button></header>
        <div className="mx-auto max-w-[1560px] px-3 py-6 sm:px-6 lg:px-8">{refreshMessage ? <div role="status" className={`${panel} mb-4 px-4 py-3 text-xs text-[var(--accent)]`}>{refreshMessage}</div> : null}{content}</div>
      </div>
    </main>
  );
}
