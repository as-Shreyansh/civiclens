import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OpsShell } from "@/components/civic/Shells";
import { MapView } from "@/components/civic/MapView";
import { LoadingGrid, Panel } from "@/components/civic/ui";
import { useDB } from "@/lib/store";
import { toPoint, useScored } from "@/lib/derived";
import { CATEGORIES, STATUSES, type Category, type Status } from "@/lib/types";
import type { Band } from "@/lib/priority";

export const Route = createFileRoute("/map")({
  head: () => ({
    meta: [
      { title: "Road hazard map — CIVICLENS" },
      { name: "description", content: "Interactive map of reported and detected road defects." },
      { property: "og:title", content: "Road hazard map — CIVICLENS" },
      { property: "og:description", content: "Colour-coded road defect map for Jaipur (demo data)." },
    ],
  }),
  component: MapPage,
});

const sel = "h-9 rounded-md border border-input bg-background px-2 text-sm";
const BANDS: Band[] = ["Critical", "High", "Medium", "Low"];

function MapPage() {
  const db = useDB();
  const all = useScored(db);
  const [band, setBand] = useState<Band | "">("");
  const [cat, setCat] = useState<Category | "">("");
  const [status, setStatus] = useState<Status | "">("");
  const [q, setQ] = useState("");
  const [center, setCenter] = useState<[number, number]>();
  const [searching, setSearching] = useState(false);
  const [msg, setMsg] = useState("");

  const rows = all.filter((d) => (!band || d.p.band === band) && (!cat || d.category === cat) && (!status || d.status === status));

  const search = async (e: FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    setSearching(true); setMsg("");
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q + ", Jaipur")}`);
      const j = (await r.json()) as { lat: string; lon: string }[];
      if (j[0]) setCenter([+j[0].lat, +j[0].lon]); else setMsg("Place not found.");
    } catch { setMsg("Location search unavailable — check your connection."); }
    setSearching(false);
  };

  return (
    <OpsShell title="Road hazard map" crumb="Map">
      <div className="panel flex flex-wrap items-end gap-3 p-4">
        <form onSubmit={search} className="flex min-w-60 flex-1 gap-2">
          <label htmlFor="ms" className="sr-only">Search location</label>
          <Input id="ms" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a place, e.g. Malviya Nagar" />
          <Button type="submit" variant="outline" disabled={searching}>{searching ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}</Button>
        </form>
        <select aria-label="Priority band" className={sel} value={band} onChange={(e) => setBand(e.target.value as Band)}><option value="">All priorities</option>{BANDS.map((b) => <option key={b}>{b}</option>)}</select>
        <select aria-label="Category" className={sel} value={cat} onChange={(e) => setCat(e.target.value as Category)}><option value="">All categories</option>{CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}</select>
        <select aria-label="Status" className={sel} value={status} onChange={(e) => setStatus(e.target.value as Status)}><option value="">All statuses</option>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
      </div>
      {msg && <p role="status" className="text-sm text-high">{msg}</p>}
      {!db ? <LoadingGrid rows={1} /> : (
        <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
          <div className="panel overflow-hidden p-1"><MapView points={rows.map(toPoint)} center={center} zoom={center ? 15 : 12} height={620} /></div>
          <Panel title="Legend">
            <ul className="space-y-2 text-sm">
              {BANDS.map((b) => <li key={b} className="flex items-center gap-2"><span className={`size-3 rounded-full bg-${b.toLowerCase()}`} />{b} <span className="ml-auto font-mono text-xs text-muted-foreground">{rows.filter((d) => d.p.band === b).length}</span></li>)}
            </ul>
            <p className="mt-4 text-xs text-muted-foreground">Showing {rows.length} of {all.length} stored records. Seeded points are demonstration locations, not verified defects. Click a marker for details.</p>
          </Panel>
        </div>
      )}
    </OpsShell>
  );
}
