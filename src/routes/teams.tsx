import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OpsShell } from "@/components/civic/Shells";
import { LoadingGrid, Panel } from "@/components/civic/ui";
import { saveTeam, teamLoad, useDB } from "@/lib/store";

export const Route = createFileRoute("/teams")({
  head: () => ({ meta: [{ title: "Maintenance teams — CIVICLENS" }, { name: "description", content: "Manage crews, zones and capacity." }] }),
  component: Teams,
});

const blank = { id: "", name: "", zone: "", lead: "", capacity: "4" };

function Teams() {
  const db = useDB();
  const [f, setF] = useState(blank);
  if (!db) return <OpsShell title="Teams" crumb="Teams"><LoadingGrid /></OpsShell>;
  const save = () => {
    try { saveTeam({ id: f.id || undefined, name: f.name, zone: f.zone, lead: f.lead, capacity: Number(f.capacity) }); toast.success("Team saved"); setF(blank); }
    catch (e) { toast.error((e as Error).message); }
  };
  return (
    <OpsShell title="Maintenance teams" crumb="Teams">
      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="grid gap-4 md:grid-cols-2">
          {db.teams.map((t) => { const l = teamLoad(db, t.id); return (
            <div key={t.id} className="panel p-5">
              <div className="flex justify-between"><h2 className="font-bold">{t.name}</h2><Button size="sm" variant="ghost" onClick={() => setF({ ...t, capacity: String(t.capacity) })}>Edit</Button></div>
              <p className="text-sm text-muted-foreground">{t.zone} · {t.lead}</p>
              <p className={`mt-3 text-sm ${l >= t.capacity ? "text-critical" : ""}`}>{l} active / {t.capacity} capacity · {Math.max(0, t.capacity - l)} free{l >= t.capacity && " — at capacity"}</p>
            </div>); })}
        </div>
        <Panel title={f.id ? "Edit team" : "New team"}>
          <div className="space-y-2">
            <Input aria-label="Name" placeholder="Team name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
            <Input aria-label="Zone" placeholder="Operating zone" value={f.zone} onChange={(e) => setF({ ...f, zone: e.target.value })} />
            <Input aria-label="Lead" placeholder="Team lead" value={f.lead} onChange={(e) => setF({ ...f, lead: e.target.value })} />
            <Input aria-label="Capacity" type="number" min={1} max={50} value={f.capacity} onChange={(e) => setF({ ...f, capacity: e.target.value })} />
            <div className="flex gap-2"><Button onClick={save}>Save</Button>{f.id && <Button variant="ghost" onClick={() => setF(blank)}>Cancel</Button>}</div>
          </div>
        </Panel>
      </div>
    </OpsShell>
  );
}
