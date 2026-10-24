import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OpsShell } from "@/components/civic/Shells";
import { MapView } from "@/components/civic/MapView";
import { BandBadge, LoadingGrid, Panel, StatusBadge, fmt } from "@/components/civic/ui";
import { updateStatus, deleteDefect, useDB } from "@/lib/store";
import { toPoint, useScored } from "@/lib/derived";
import { TRANSITIONS, catLabel } from "@/lib/types";

export const Route = createFileRoute("/defects/$id")({
  head: () => ({ meta: [{ title: "Defect detail — CIVICLENS" }, { name: "description", content: "Road defect detail, priority and history." }] }),
  component: Detail,
});

function Detail() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const db = useDB();
  const d = useScored(db).find((x) => x.id === id);
  const [note, setNote] = useState("");
  if (!db) return <OpsShell title="Defect" crumb={id}><LoadingGrid /></OpsShell>;
  if (!d) return <OpsShell title="Defect not found" crumb={id}><Panel><p>No defect with ID <span className="font-mono">{id}</span>.</p><Link to="/dashboard" className="text-cyan underline">Back to dashboard</Link></Panel></OpsShell>;
  const team = db.teams.find((t) => t.id === d.teamId);
  const hist = db.history.filter((h) => h.defectId === d.id).sort((a, b) => b.ts.localeCompare(a.ts));
  const ev = db.events.filter((e) => e.defectId === d.id).slice(0, 5);

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete report ${d.id}?`)) {
      deleteDefect(d.id);
      toast.success(`Deleted report ${d.id}`);
      nav({ to: "/dashboard" });
    }
  };

  return (
    <OpsShell
      title={`${d.id} · ${catLabel(d.category)}`}
      crumb={d.id}
      action={
        <Button variant="destructive" size="sm" onClick={handleDelete} className="gap-1.5">
          <Trash2 className="size-4" /> Delete Report
        </Button>
      }
    >
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Overview">
          <div className="flex flex-wrap gap-2"><BandBadge band={d.p.band} score={d.p.score} /><StatusBadge status={d.status} /></div>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div><dt className="text-muted-foreground">Location</dt><dd>{d.road}, {d.location}</dd></div>
            <div><dt className="text-muted-foreground">Coordinates</dt><dd className="font-mono">{d.lat}, {d.lng}</dd></div>
            <div><dt className="text-muted-foreground">Severity</dt><dd>{d.severity}/5</dd></div>
            <div><dt className="text-muted-foreground">Source</dt><dd>{d.source}</dd></div>
            <div><dt className="text-muted-foreground">Created</dt><dd>{fmt(d.createdAt)}</dd></div>
            <div><dt className="text-muted-foreground">Team</dt><dd>{team?.name ?? "Unassigned"} {d.urgency && `(${d.urgency})`}</dd></div>
          </dl>
          <p className="mt-4 text-sm">{d.description}</p>
          {d.photo && <img src={d.photo} alt="Reported defect" className="mt-3 max-h-64 rounded-lg" />}
        </Panel>
        <div className="panel overflow-hidden p-1"><MapView points={[toPoint(d)]} center={[d.lat, d.lng]} zoom={15} height={360} /></div>
        <Panel title="Priority breakdown">
          {d.p.factors.map((f) => <div key={f.key} className="flex justify-between text-sm"><span>{f.label} ({f.note})</span><span className="font-mono">+{f.contribution.toFixed(1)}</span></div>)}
          <p className="mt-3 text-sm"><b>Action:</b> {d.p.action}</p>
          {ev.length > 0 && <div className="mt-3 text-xs text-muted-foreground">Linked simulated sensor events: {ev.map((e) => `v${e.vibration}/s${e.surface}`).join(", ")}</div>}
        </Panel>
        <Panel title="Status & history">
          {TRANSITIONS[d.status].length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              <input aria-label="Note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (optional)" className="h-9 flex-1 rounded-md border border-input bg-background px-2 text-sm" />
              {TRANSITIONS[d.status].map((s) => <Button key={s} size="sm" onClick={() => { try { updateStatus(d.id, s, note); setNote(""); toast.success(`Moved to ${s}`); } catch (e) { toast.error((e as Error).message); } }}>{s}</Button>)}
            </div>
          )}
          <Link to="/dispatch" className="text-sm text-cyan underline">Assign in dispatcher</Link>
          <ul className="mt-3 space-y-2 border-l pl-4 text-sm">{hist.map((h) => <li key={h.id}><b>{h.action}</b> — {h.note}<div className="text-xs text-muted-foreground">{fmt(h.ts)} · {h.status}</div></li>)}</ul>
        </Panel>
      </div>
    </OpsShell>
  );
}
