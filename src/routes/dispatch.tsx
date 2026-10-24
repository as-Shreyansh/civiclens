import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { OpsShell } from "@/components/civic/Shells";
import { BandBadge, LoadingGrid, Panel, StatusBadge } from "@/components/civic/ui";
import { assignTeam, teamLoad, updateStatus, useDB } from "@/lib/store";
import { download, useScored, worklistCSV } from "@/lib/derived";
import { nearestNeighbourOrder } from "@/lib/anomaly";
import { TRANSITIONS, URGENCIES, catLabel, type Urgency } from "@/lib/types";

export const Route = createFileRoute("/dispatch")({
  head: () => ({ meta: [{ title: "Dispatcher — CIVICLENS" }, { name: "description", content: "Assign maintenance teams and export worklists." }] }),
  component: Dispatch,
});

const sel = "h-9 rounded-md border border-input bg-background px-2 text-sm";

function Dispatch() {
  const db = useDB();
  const open = useScored(db).filter((d) => d.status !== "Resolved").sort((a, b) => b.p.score - a.p.score);
  const [defId, setDefId] = useState("");
  const [teamId, setTeamId] = useState("");
  const [urg, setUrg] = useState<Urgency>("Normal");
  const [notes, setNotes] = useState("");
  const [routeTeam, setRouteTeam] = useState("");
  if (!db) return <OpsShell title="Dispatcher" crumb="Dispatch"><LoadingGrid /></OpsShell>;
  const tName = (id?: string) => db.teams.find((t) => t.id === id)?.name ?? "";
  const sel_d = open.find((d) => d.id === defId);
  const route = nearestNeighbourOrder(open.filter((d) => d.teamId === routeTeam));
  const run = (f: () => void, ok: string) => { try { f(); toast.success(ok); } catch (e) { toast.error((e as Error).message); } };

  return (
    <OpsShell title="Maintenance dispatcher" crumb="Dispatch" actions={<Button size="sm" variant="outline" onClick={() => download("civiclens-worklist.csv", worklistCSV(open, tName))}><Download className="size-4" /> CSV</Button>}>
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Assign a defect">
          <div className="space-y-3">
            <select aria-label="Defect" className={`${sel} w-full`} value={defId} onChange={(e) => setDefId(e.target.value)}><option value="">Select unresolved defect…</option>{open.map((d) => <option key={d.id} value={d.id}>{d.id} · {d.p.score} · {catLabel(d.category)} · {d.road}</option>)}</select>
            <div className="flex gap-2">
              <select aria-label="Team" className={`${sel} flex-1`} value={teamId} onChange={(e) => setTeamId(e.target.value)}><option value="">Team…</option>{db.teams.map((t) => <option key={t.id} value={t.id}>{t.name} ({teamLoad(db, t.id)}/{t.capacity})</option>)}</select>
              <select aria-label="Urgency" className={sel} value={urg} onChange={(e) => setUrg(e.target.value as Urgency)}>{URGENCIES.map((u) => <option key={u}>{u}</option>)}</select>
            </div>
            <textarea aria-label="Inspection notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Inspection notes" className="w-full rounded-md border border-input bg-background p-2 text-sm" rows={2} />
            <Button disabled={!defId || !teamId} onClick={() => run(() => { assignTeam(defId, teamId, urg, notes); setNotes(""); }, "Assigned")}>Assign team</Button>
            {sel_d && TRANSITIONS[sel_d.status].length > 0 && (
              <div className="flex flex-wrap items-center gap-2 border-t pt-3 text-sm">Status <StatusBadge status={sel_d.status} /> →
                {TRANSITIONS[sel_d.status].map((s) => <Button key={s} size="sm" variant="outline" onClick={() => run(() => updateStatus(sel_d.id, s, notes), `Moved to ${s}`)}>{s}</Button>)}
              </div>
            )}
          </div>
        </Panel>
        <Panel title="Team workload">
          <ul className="space-y-3">{db.teams.map((t) => { const l = teamLoad(db, t.id); return (
            <li key={t.id} className="text-sm"><div className="flex justify-between"><span>{t.name}</span><span className={l >= t.capacity ? "text-critical" : ""}>{l}/{t.capacity}{l >= t.capacity && " · full"}</span></div><div className="mt-1 h-1.5 rounded-full bg-muted"><div className={`h-full rounded-full ${l >= t.capacity ? "bg-critical" : "bg-cyan"}`} style={{ width: `${Math.min(100, (l / t.capacity) * 100)}%` }} /></div></li>); })}</ul>
        </Panel>
      </div>
      <Panel title="Team route (approximate straight-line distance, not road directions)" action={<select aria-label="Route team" className={sel} value={routeTeam} onChange={(e) => setRouteTeam(e.target.value)}><option value="">Choose team…</option>{db.teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select>}>
        {!routeTeam ? <p className="text-sm text-muted-foreground">Pick a team to order its open jobs by nearest neighbour.</p> : route.length === 0 ? <p className="text-sm text-muted-foreground">No open jobs.</p> : (
          <ol className="divide-y">{route.map(({ item: d, legM }, i) => <li key={d.id} className="flex flex-wrap items-center gap-3 py-2 text-sm"><span className="w-6 font-mono">{i + 1}</span><Link to="/defects/$id" params={{ id: d.id }} className="font-mono text-cyan">{d.id}</Link><span className="flex-1">{d.road}</span><BandBadge band={d.p.band} score={d.p.score} /><span className="w-20 text-right font-mono text-xs">{i === 0 ? "start" : `+${(legM / 1000).toFixed(2)} km`}</span></li>)}</ol>
        )}
      </Panel>
    </OpsShell>
  );
}
