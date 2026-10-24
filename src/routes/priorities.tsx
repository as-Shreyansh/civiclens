import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { OpsShell } from "@/components/civic/Shells";
import { BandBadge, Empty, LoadingGrid, Panel, StatusBadge } from "@/components/civic/ui";
import { setWeights, useDB } from "@/lib/store";
import { useScored } from "@/lib/derived";
import { DEFAULT_WEIGHTS, type Band, type Weights } from "@/lib/priority";
import { catLabel } from "@/lib/types";

export const Route = createFileRoute("/priorities")({
  head: () => ({
    meta: [
      { title: "Priority engine — CIVICLENS" },
      { name: "description", content: "Explainable 0–100 repair priority scores with configurable weights." },
      { property: "og:title", content: "Priority engine — CIVICLENS" },
      { property: "og:description", content: "Transparent road repair prioritisation." },
    ],
  }),
  component: Priorities,
});

const BANDS: Band[] = ["Critical", "High", "Medium", "Low"];
const LABELS: Record<keyof Weights, string> = { severity: "Defect severity", safety: "Safety risk", frequency: "Report frequency", waiting: "Waiting time" };

function Priorities() {
  const db = useDB();
  const all = useScored(db);
  const [band, setBand] = useState<Band | "">("");
  const [openOnly, setOpenOnly] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  if (!db) return <OpsShell title="Priority engine" crumb="Priorities"><LoadingGrid /></OpsShell>;
  const w = db.weights;
  const total = w.severity + w.safety + w.frequency + w.waiting;
  const rows = all.filter((d) => (!openOnly || d.status !== "Resolved") && (!band || d.p.band === band)).sort((a, b) => b.p.score - a.p.score);

  return (
    <OpsShell title="Priority engine" crumb="Priorities">
      <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
        <Panel title="Formula & weights" action={<Button size="sm" variant="ghost" onClick={() => { setWeights({ ...DEFAULT_WEIGHTS }); toast.success("Default weights restored"); }}><RotateCcw className="size-4" /> Defaults</Button>}>
          <p className="font-mono text-xs text-muted-foreground">score = Σ(factor × weight) ÷ Σweights</p>
          <div className="mt-4 space-y-5">
            {(Object.keys(LABELS) as (keyof Weights)[]).map((k) => (
              <div key={k}>
                <div className="flex justify-between text-sm"><span>{LABELS[k]}</span><span className="font-mono">{w[k]} <span className="text-muted-foreground">({total ? Math.round((w[k] / total) * 100) : 0}%)</span></span></div>
                <Slider aria-label={`${LABELS[k]} weight`} className="mt-2" min={0} max={100} step={5} value={[w[k]]} onValueChange={([v]) => setWeights({ ...w, [k]: v })} />
              </div>
            ))}
          </div>
          <ul className="mt-5 space-y-1 text-xs text-muted-foreground">
            <li><b>Severity</b>: reported 1–5 scaled to 0–100.</li>
            <li><b>Safety</b>: category risk (pothole 90, waterlogging 80, crack 60, uneven 50, other 40) or sensor surface score, whichever is higher.</li>
            <li><b>Frequency</b>: reports at this spot, capped at 5.</li>
            <li><b>Waiting</b>: days open, capped at 30.</li>
          </ul>
          <p className="mt-3 rounded-md bg-high/10 p-2 text-xs text-high">Weights are prototype assumptions, not official municipal standards.</p>
        </Panel>
        <Panel title={`Ranked defects (${rows.length})`} action={
          <div className="flex flex-wrap items-center gap-2">
            {(["", ...BANDS] as const).map((b) => <Button key={b || "all"} size="sm" variant={band === b ? "default" : "outline"} onClick={() => setBand(b)}>{b || "All"}</Button>)}
            <label className="flex items-center gap-1.5 text-sm"><input type="checkbox" checked={openOnly} onChange={(e) => setOpenOnly(e.target.checked)} /> Open only</label>
          </div>
        }>
          {rows.length === 0 ? <Empty>No defects in this band.</Empty> : (
            <ul className="divide-y">
              {rows.map((d, i) => (
                <li key={d.id} className="py-3">
                  <button className="flex w-full flex-wrap items-center gap-3 text-left" onClick={() => setExpanded(expanded === d.id ? null : d.id)} aria-expanded={expanded === d.id}>
                    <span className="w-6 font-mono text-xs text-muted-foreground">{i + 1}</span>
                    <span className="w-14 font-display text-2xl font-bold">{d.p.score}</span>
                    <BandBadge band={d.p.band} />
                    <span className="min-w-0 flex-1 truncate text-sm"><span className="font-mono text-cyan">{d.id}</span> · {catLabel(d.category)} · {d.road}</span>
                    <StatusBadge status={d.status} />
                  </button>
                  {expanded === d.id && (
                    <div className="mt-3 grid gap-3 pl-9 md:grid-cols-2">
                      <div className="space-y-2">
                        {d.p.factors.map((f) => (
                          <div key={f.key} className="text-xs">
                            <div className="flex justify-between"><span>{f.label} <span className="text-muted-foreground">({f.note})</span></span><span className="font-mono">+{f.contribution.toFixed(1)}</span></div>
                            <div className="mt-1 h-1.5 rounded-full bg-muted"><div className="h-full rounded-full bg-cyan" style={{ width: `${f.value}%` }} /></div>
                          </div>
                        ))}
                      </div>
                      <div className="text-sm"><div className="text-xs uppercase text-muted-foreground">Recommended action</div>{d.p.action}<div className="mt-2"><Link to="/defects/$id" params={{ id: d.id }} className="text-cyan hover:underline">Open defect →</Link></div></div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </OpsShell>
  );
}
