import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PublicShell } from "@/components/civic/Shells";
import { StatusBadge, fmt, LoadingGrid } from "@/components/civic/ui";
import { useDB } from "@/lib/store";
import { catLabel, STATUSES } from "@/lib/types";

export const Route = createFileRoute("/track")({
  validateSearch: z.object({ id: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Track your report — CIVICLENS" },
      { name: "description", content: "Check the status of a road issue you reported." },
      { property: "og:title", content: "Track your report — CIVICLENS" },
      { property: "og:description", content: "Enter your report ID to see its repair status." },
    ],
  }),
  component: Track,
});

function Track() {
  const { id } = Route.useSearch();
  const nav = useNavigate({ from: "/track" });
  const [q, setQ] = useState(id ?? "");
  const db = useDB();
  const submit = (e: FormEvent) => { e.preventDefault(); nav({ search: { id: q.trim().toUpperCase() || undefined } }); };
  const d = id && db ? db.defects.find((x) => x.id === id.toUpperCase()) : undefined;
  const hist = d && db ? db.history.filter((h) => h.defectId === d.id && !h.internal).sort((a, b) => a.ts.localeCompare(b.ts)) : [];
  const step = d ? STATUSES.indexOf(d.status) : -1;

  return (
    <PublicShell>
      <div className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="text-3xl font-bold">Track a report</h1>
        <form onSubmit={submit} className="mt-6 flex gap-2">
          <Label htmlFor="rid" className="sr-only">Report ID</Label>
          <Input id="rid" value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. CL-D1001" className="font-mono" />
          <Button type="submit"><Search className="size-4" /> Track</Button>
        </form>
        <div className="mt-8">
          {!id ? <p className="text-sm text-muted-foreground">Enter the ID you received after submitting. Try a demo ID like <span className="font-mono">CL-D1001</span>.</p>
          : !db ? <LoadingGrid rows={2} />
          : !d ? <p role="alert" className="panel p-5 text-sm">No report found with ID <span className="font-mono font-semibold">{id}</span>. Check the ID and try again.</p>
          : (
            <div className="panel space-y-5 p-6">
              <div className="flex flex-wrap items-center justify-between gap-2"><span className="font-mono text-xl font-bold">{d.id}</span><StatusBadge status={d.status} /></div>
              <ol className="grid grid-cols-4 gap-1" aria-label="Progress">
                {STATUSES.map((s, i) => <li key={s} className="text-center text-[11px]"><div className={`mb-1 h-1.5 rounded-full ${i <= step ? "bg-cyan" : "bg-muted"}`} />{s}</li>)}
              </ol>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div><dt className="text-muted-foreground">Category</dt><dd className="font-medium">{catLabel(d.category)}</dd></div>
                <div><dt className="text-muted-foreground">Submitted</dt><dd className="font-medium">{fmt(d.createdAt)}</dd></div>
                <div className="col-span-2"><dt className="text-muted-foreground">Location</dt><dd className="font-medium">{d.road}, {d.location}</dd></div>
              </dl>
              <div>
                <h2 className="text-sm font-semibold">Status history</h2>
                <ul className="mt-2 space-y-2 border-l pl-4">
                  {hist.map((h) => <li key={h.id} className="text-sm"><span className="font-medium">{h.status}</span> — {h.note}<div className="text-xs text-muted-foreground">{fmt(h.ts)}</div></li>)}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </PublicShell>
  );
}
