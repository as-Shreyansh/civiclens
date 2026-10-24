import { useMemo } from "react";
import type { DB } from "./store";
import { scoreDefect, type PriorityResult } from "./priority";
import type { Defect } from "./types";
import { catLabel } from "./types";
import type { MapPoint } from "@/components/civic/map-types";

export type Scored = Defect & { p: PriorityResult };

export function useScored(db: DB | null): Scored[] {
  return useMemo(() => {
    if (!db) return [];
    const now = Date.now();
    return db.defects.map((d) => ({ ...d, p: scoreDefect(d, db.weights, now) }));
  }, [db]);
}

export const toPoint = (d: Scored): MapPoint => ({
  id: d.id, lat: d.lat, lng: d.lng, band: d.p.band, score: d.p.score,
  title: `${catLabel(d.category)} — ${d.road}`, subtitle: d.location, status: d.status, createdAt: d.createdAt,
});

export function worklistCSV(rows: Scored[], teamName: (id?: string) => string) {
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const head = ["Rank", "Report ID", "Score", "Band", "Status", "Category", "Road", "Location", "Lat", "Lng", "Team", "Urgency", "Recommended action"];
  const lines = rows.map((d, i) => [i + 1, d.id, d.p.score, d.p.band, d.status, catLabel(d.category), d.road, d.location, d.lat, d.lng, teamName(d.teamId), d.urgency ?? "", d.p.action].map(esc).join(","));
  return [head.join(","), ...lines].join("\n");
}

export function download(name: string, text: string, type = "text/csv") {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}
