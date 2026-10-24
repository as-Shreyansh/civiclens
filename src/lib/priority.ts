import type { Category, Defect } from "./types";

export interface Weights { severity: number; safety: number; frequency: number; waiting: number }
export const DEFAULT_WEIGHTS: Weights = { severity: 40, safety: 30, frequency: 20, waiting: 10 };

export type Band = "Critical" | "High" | "Medium" | "Low";

export const CATEGORY_RISK: Record<Category, number> = {
  pothole: 0.9,
  waterlogging: 0.8,
  road_crack: 0.6,
  uneven_surface: 0.5,
  other: 0.4,
};

export function bandFor(score: number): Band {
  if (score >= 80) return "Critical";
  if (score >= 60) return "High";
  if (score >= 35) return "Medium";
  return "Low";
}

const num = (v: unknown, fallback: number) => (typeof v === "number" && Number.isFinite(v) ? v : fallback);
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

export interface PriorityResult {
  score: number;
  band: Band;
  factors: { key: keyof Weights; label: string; value: number; weight: number; contribution: number; note: string }[];
  action: string;
}

/** Explainable 0–100 score. Prototype weights, not municipal standards. */
export function scoreDefect(
  d: Partial<Defect>,
  weights: Weights = DEFAULT_WEIGHTS,
  now: number = Date.now(),
): PriorityResult {
  const sev = clamp(Math.round(num(d.severity, 3)), 1, 5);
  const cat = (d.category && d.category in CATEGORY_RISK ? d.category : "other") as Category;
  const sensorBoost = clamp(num(d.sensorScore, 0), 0, 1);
  const safety = Math.max(CATEGORY_RISK[cat], sensorBoost);
  const reports = clamp(Math.round(num(d.reportCount, 1)), 1, 1000);
  const created = Date.parse(String(d.createdAt ?? ""));
  const days = Number.isFinite(created) ? Math.max(0, (now - created) / 86400000) : 0;

  const totalW = Math.max(1, weights.severity + weights.safety + weights.frequency + weights.waiting);
  const parts = [
    { key: "severity" as const, label: "Defect severity", value: (sev / 5) * 100, note: `Severity ${sev}/5` },
    { key: "safety" as const, label: "Safety risk", value: safety * 100, note: `${cat.replace("_", " ")} risk ${Math.round(safety * 100)}%` },
    { key: "frequency" as const, label: "Report frequency", value: (Math.min(reports, 5) / 5) * 100, note: `${reports} report${reports > 1 ? "s" : ""}` },
    { key: "waiting" as const, label: "Waiting time", value: (Math.min(days, 30) / 30) * 100, note: `${Math.floor(days)} day${Math.floor(days) === 1 ? "" : "s"} open` },
  ];
  const factors = parts.map((p) => {
    const weight = weights[p.key];
    return { ...p, weight, contribution: (p.value * weight) / totalW };
  });
  const score = clamp(Math.round(factors.reduce((s, f) => s + f.contribution, 0)), 0, 100);
  const band = bandFor(score);
  const action =
    band === "Critical" ? "Dispatch repair crew within 24h; place hazard barricade."
    : band === "High" ? "Schedule inspection within 72h."
    : band === "Medium" ? "Add to weekly inspection round."
    : "Monitor; batch with routine maintenance.";
  return { score, band, factors, action };
}
