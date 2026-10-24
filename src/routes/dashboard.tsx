import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AlertOctagon, CalendarClock, CheckCircle2, ClipboardCheck, Pause, Play, Radio, Trash2, Wrench, Layers } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OpsShell } from "@/components/civic/Shells";
import { BandBadge, Empty, LoadingGrid, Panel, SimLabel, Stat, StatusBadge, fmt } from "@/components/civic/ui";
import { clearSimEvents, setSimRunning, useDB } from "@/lib/store";
import { useScored } from "@/lib/derived";
import { CATEGORIES, STATUSES, catLabel, type Category, type Status } from "@/lib/types";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Operations dashboard — CIVICLENS" },
      { name: "description", content: "Live road defect statistics, trends and simulated sensor feed." },
      { property: "og:title", content: "Operations dashboard — CIVICLENS" },
      { property: "og:description", content: "Road defect command centre." },
    ],
  }),
  component: Dashboard,
});

const sel = "h-9 rounded-md border border-input bg-background px-2 text-sm";
const tt = { contentStyle: { background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--popover-foreground)" } };

function Dashboard() {
  const db = useDB();
  const all = useScored(db);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<Status | "">("");
  const [cat, setCat] = useState<Category | "">("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const rows = useMemo(() => all.filter((d) => {
    if (status && d.status !== status) return false;
    if (cat && d.category !== cat) return false;
    if (from && d.createdAt.slice(0, 10) < from) return false;
    if (to && d.createdAt.slice(0, 10) > to) return false;
    if (q) { const s = q.toLowerCase(); if (!`${d.id} ${d.road} ${d.location} ${d.description}`.toLowerCase().includes(s)) return false; }
    return true;
  }), [all, q, status, cat, from, to]);

  const sevData = [1, 2, 3, 4, 5].map((s) => ({ severity: `S${s}`, count: rows.filter((d) => d.severity === s).length }));
  const timeData = useMemo(() => {
    const m = new Map<string, number>();
    for (let i = 29; i >= 0; i--) m.set(new Date(Date.now() - i * 86400000).toISOString().slice(0, 10), 0);
    rows.forEach((d) => { const k = d.createdAt.slice(0, 10); if (m.has(k)) m.set(k, m.get(k)! + 1); });
    return [...m].map(([day, count]) => ({ day: day.slice(5), count }));
  }, [rows]);

  if (!db) return <OpsShell title="Operations dashboard" crumb="Dashboard"><LoadingGrid rows={6} /></OpsShell>;
  const hi = rows.filter((d) => d.status !== "Resolved" && (d.p.band === "Critical" || d.p.band === "High")).length;
  const recent = [...rows].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8);
  const feed = db.events.slice(0, 10);

  return (
    <OpsShell title="Operations dashboard" crumb="Dashboard">
      <div className="panel flex flex-wrap items-end gap-3 p-4">
        <div className="min-w-48 flex-1"><label htmlFor="q" className="text-xs text-muted-foreground">Search</label><Input id="q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="ID, road, area…" /></div>
        <div><label htmlFor="st" className="block text-xs text-muted-foreground">Status</label><select id="st" className={sel} value={status} onChange={(e) => setStatus(e.target.value as Status)}><option value="">All</option>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select></div>
        <div><label htmlFor="ct" className="block text-xs text-muted-foreground">Category</label><select id="ct" className={sel} value={cat} onChange={(e) => setCat(e.target.value as Category)}><option value="">All</option>{CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}</select></div>
        <div><label htmlFor="fr" className="block text-xs text-muted-foreground">From</label><Input id="fr" type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
        <div><label htmlFor="to" className="block text-xs text-muted-foreground">To</label><Input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
        {(q || status || cat || from || to) && <Button variant="ghost" onClick={() => { setQ(""); setStatus(""); setCat(""); setFrom(""); setTo(""); }}>Clear</Button>}
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Stat label="Total defects" value={rows.length} icon={<Layers className="size-5" />} />
        <Stat label="Critical / high" value={hi} icon={<AlertOctagon className="size-5" />} tone="critical" />
        <Stat label="Awaiting inspection" value={rows.filter((d) => d.status === "Reported").length} icon={<ClipboardCheck className="size-5" />} tone="high" />
        <Stat label="Repairs scheduled" value={rows.filter((d) => d.status === "Repair Scheduled").length} icon={<CalendarClock className="size-5" />} />
        <Stat label="Resolved" value={rows.filter((d) => d.status === "Resolved").length} icon={<CheckCircle2 className="size-5" />} tone="success" />
        <Stat label="Sensor events" value={db.events.length} icon={<Radio className="size-5" />} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Severity distribution">
          {rows.length === 0 ? <Empty>No defects match the filters.</Empty> : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={sevData}><CartesianGrid stroke="var(--border)" vertical={false} /><XAxis dataKey="severity" stroke="var(--muted-foreground)" fontSize={12} /><YAxis allowDecimals={false} stroke="var(--muted-foreground)" fontSize={12} /><Tooltip {...tt} cursor={{ fill: "var(--muted)" }} /><Bar dataKey="count" fill="var(--cyan)" radius={[6, 6, 0, 0]} /></BarChart>
            </ResponsiveContainer>
          )}
        </Panel>
        <Panel title="Defects reported — last 30 days">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={timeData}><CartesianGrid stroke="var(--border)" vertical={false} /><XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={11} interval={4} /><YAxis allowDecimals={false} stroke="var(--muted-foreground)" fontSize={12} /><Tooltip {...tt} /><Line dataKey="count" stroke="var(--high)" strokeWidth={2} dot={false} /></LineChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-5">
        <Panel title="Recent reports" className="xl:col-span-3">
          {recent.length === 0 ? <Empty>No reports match.</Empty> : (
            <ul className="divide-y">
              {recent.map((d) => (
                <li key={d.id}><Link to="/defects/$id" params={{ id: d.id }} className="flex flex-wrap items-center gap-3 py-2.5 hover:bg-muted/50">
                  <span className="w-24 font-mono text-xs text-cyan">{d.id}</span>
                  <span className="min-w-0 flex-1 truncate text-sm">{catLabel(d.category)} · {d.road}</span>
                  <BandBadge band={d.p.band} score={d.p.score} /><StatusBadge status={d.status} />
                  <span className="hidden w-36 text-right text-xs text-muted-foreground sm:block">{fmt(d.createdAt)}</span>
                </Link></li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel className="xl:col-span-2" title={<span className="flex items-center gap-2">Sensor feed <SimLabel /></span>} action={
          <div className="flex gap-1">
            <Button size="sm" variant="outline" onClick={() => setSimRunning(!db.simRunning)} aria-label={db.simRunning ? "Pause feed" : "Resume feed"}>{db.simRunning ? <><Pause className="size-4" /> Pause</> : <><Play className="size-4" /> Resume</>}</Button>
            <Button size="sm" variant="ghost" onClick={clearSimEvents} aria-label="Reset feed"><Trash2 className="size-4" /></Button>
          </div>
        }>
          <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground"><span className={`size-2 rounded-full ${db.simRunning ? "animate-pulse bg-success" : "bg-muted-foreground"}`} />{db.simRunning ? "Generating every 6 seconds" : "Paused"}</div>
          <ul className="space-y-1.5 font-mono text-xs">
            {feed.map((e) => (
              <li key={e.id} className={`flex items-center gap-2 rounded px-2 py-1 ${e.flagged ? "bg-high/10" : ""}`}>
                <span className="text-muted-foreground">{new Date(e.ts).toLocaleTimeString()}</span>
                <span className="flex-1 truncate">{e.location}</span>
                <span>v{e.vibration}</span><span>s{e.surface}</span>
                {e.flagged ? <Wrench className="size-3.5 text-high" aria-label="flagged" /> : <span className="w-3.5" />}
              </li>
            ))}
          </ul>
          <Link to="/intelligence" className="mt-3 inline-block text-sm text-cyan hover:underline">View analysis →</Link>
        </Panel>
      </div>
    </OpsShell>
  );
}
