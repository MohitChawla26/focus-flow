"use client";

import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { apiRequest } from "@/lib/focus-api";

type Notice = { id: string; title: string; body: string; category?: string; deadline?: string | null };

export function NoticeAdmin() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ title: "", body: "", category: "Important notices", deadline: "" });

  useEffect(() => {
    let active = true;
    apiRequest<Notice[]>("/notices")
      .then((result) => { if (active) setNotices(result); })
      .catch(() => { if (active) setMessage("Notices could not be loaded; start the backend and refresh this page."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function publish(event: React.FormEvent) {
    event.preventDefault();
    try {
      const created = await apiRequest<Notice>("/notices", { method: "POST", body: JSON.stringify({ ...form, deadline: form.deadline || null }) });
      setNotices((current) => [created, ...current]);
      setForm({ title: "", body: "", category: "Important notices", deadline: "" });
      setMessage("Notice published.");
    } catch {
      setMessage("The notice could not be published; check the backend and try again.");
    }
  }

  async function remove(id: string) {
    try {
      await apiRequest(`/notices/${encodeURIComponent(id)}`, { method: "DELETE" });
      setNotices((current) => current.filter((notice) => notice.id !== id));
      setMessage("Notice deleted.");
    } catch {
      setMessage("The notice could not be deleted; check the backend and try again.");
    }
  }

  return (
    <main className="min-h-screen p-4 sm:p-8">
      <div className="panel-shadow mx-auto max-w-5xl rounded-[var(--radius)] border border-[var(--border)] bg-[var(--panel)] p-5 sm:p-8">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-xs text-[var(--muted)]"><ArrowLeft size={13} />Back to dashboard</Link>
        <div className="mt-6"><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">Manual publishing</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em]">Notice desk</h1><p className="mt-2 text-sm text-[var(--muted)]">Publish a notice into the same triage system students use for mail and news.</p></div>
        {message ? <div role="status" className="mt-5 rounded-[calc(var(--radius)/2)] border border-[var(--border)] bg-[var(--panel-strong)] px-4 py-3 text-xs">{message}</div> : null}
        <div className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <form onSubmit={publish} className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--panel-strong)] p-5 soft-shadow">
            <h2 className="text-sm font-semibold">Publish notice</h2>
            <label className="mt-4 block text-xs text-[var(--muted)]">Title<input required value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} className="mt-1.5 w-full rounded-[calc(var(--radius)/2)] border border-[var(--border)] bg-[var(--panel)] px-3 py-2.5 text-sm text-[var(--text)]" /></label>
            <label className="mt-4 block text-xs text-[var(--muted)]">Body<textarea required rows={6} value={form.body} onChange={(event) => setForm((current) => ({ ...current, body: event.target.value }))} className="mt-1.5 w-full resize-none rounded-[calc(var(--radius)/2)] border border-[var(--border)] bg-[var(--panel)] px-3 py-2.5 text-sm text-[var(--text)]" /></label>
            <div className="mt-4 grid grid-cols-2 gap-3"><label className="text-xs text-[var(--muted)]">Category<input value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} className="mt-1.5 w-full rounded-[calc(var(--radius)/2)] border border-[var(--border)] bg-[var(--panel)] px-3 py-2.5 text-sm text-[var(--text)]" /></label><label className="text-xs text-[var(--muted)]">Deadline<input type="datetime-local" value={form.deadline} onChange={(event) => setForm((current) => ({ ...current, deadline: event.target.value }))} className="mt-1.5 w-full rounded-[calc(var(--radius)/2)] border border-[var(--border)] bg-[var(--panel)] px-3 py-2.5 font-mono text-xs text-[var(--text)]" /></label></div>
            <button className="mt-5 flex w-full items-center justify-center gap-2 rounded-[calc(var(--radius)/2)] bg-[var(--accent)] px-4 py-3 text-xs font-semibold text-[var(--accent-contrast)]"><Plus size={14} />Publish notice</button>
          </form>

          <section className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--panel-strong)] p-5 soft-shadow">
            <div className="flex items-center justify-between"><h2 className="text-sm font-semibold">Published notices</h2><span className="font-mono text-[10px] text-[var(--muted)]">{notices.length}</span></div>
            {loading ? <p className="mt-5 text-xs text-[var(--muted)]">Loading notices…</p> : notices.length ? <div className="mt-3 divide-y divide-[var(--border)]">{notices.map((notice) => <article key={notice.id} className="flex gap-3 py-4"><div className="min-w-0 flex-1"><h3 className="text-sm font-medium">{notice.title}</h3><p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--muted)]">{notice.body}</p>{notice.deadline ? <div className="mt-2 font-mono text-[10px] text-[var(--warn)]">{new Date(notice.deadline).toLocaleString("en-IN")}</div> : null}</div><button onClick={() => void remove(notice.id)} aria-label={`Delete ${notice.title}`} className="grid h-8 w-8 shrink-0 place-items-center rounded-[calc(var(--radius)/3)] text-[var(--warn)] hover:bg-[var(--warn-soft)]"><Trash2 size={14} /></button></article>)}</div> : <p className="mt-5 text-xs text-[var(--muted)]">No manual notices yet. Publish the first one.</p>}
          </section>
        </div>
      </div>
    </main>
  );
}
