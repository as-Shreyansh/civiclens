export const THRESHOLDS = { vibration: 1.5, surface: 0.65, highSpeed: 40 };

export interface Analysis {
  flagged: boolean;
  reasons: string[];
  severity: number; // 0 when not flagged, else 1–5
  action: string;
}

/** Rule-based anomaly detection (not a trained model). */
export function analyseReading(vibration: number, speed: number, surface: number): Analysis {
  const v = Number.isFinite(vibration) ? vibration : 0;
  const s = Number.isFinite(speed) ? speed : 0;
  const a = Number.isFinite(surface) ? surface : 0;
  const reasons: string[] = [];
  if (v >= THRESHOLDS.vibration) reasons.push(`Vibration ${v.toFixed(2)}g ≥ ${THRESHOLDS.vibration}g`);
  if (a >= THRESHOLDS.surface) reasons.push(`Surface score ${a.toFixed(2)} ≥ ${THRESHOLDS.surface}`);
  const flagged = reasons.length > 0;
  if (!flagged) return { flagged, reasons: ["All readings below thresholds"], severity: 0, action: "No action" };
  let sev = 1 + Math.min(2, Math.floor((v - 1) / 0.6)) + (a >= 0.8 ? 1 : 0);
  if (v >= THRESHOLDS.vibration && s >= THRESHOLDS.highSpeed) {
    sev += 1;
    reasons.push(`Elevated vibration at ${Math.round(s)} km/h raises urgency`);
  }
  if (reasons.length >= 2 && v >= THRESHOLDS.vibration && a >= THRESHOLDS.surface) sev += 0;
  const severity = Math.max(1, Math.min(5, sev));
  const action = severity >= 4 ? "Urgent field inspection" : severity >= 3 ? "Schedule inspection" : "Log and monitor";
  return { flagged, reasons, severity, action };
}

/** Haversine distance in metres. */
export function distanceM(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371000, toR = Math.PI / 180;
  const dLat = (b.lat - a.lat) * toR, dLng = (b.lng - a.lng) * toR;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * toR) * Math.cos(b.lat * toR) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Greedy nearest-neighbour ordering (straight-line, approximate). */
export function nearestNeighbourOrder<T extends { lat: number; lng: number }>(items: T[], start?: { lat: number; lng: number }) {
  const left = [...items];
  const out: { item: T; legM: number }[] = [];
  let cur = start ?? left[0];
  while (left.length) {
    let bi = 0, bd = Infinity;
    left.forEach((it, i) => { const d = cur ? distanceM(cur, it) : 0; if (d < bd) { bd = d; bi = i; } });
    const [it] = left.splice(bi, 1);
    out.push({ item: it, legM: out.length === 0 && !start ? 0 : bd });
    cur = it;
  }
  return out;
}
