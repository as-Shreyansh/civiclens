import { useSyncExternalStore } from "react";
import { analyseReading, distanceM } from "./anomaly";
import { DEFAULT_WEIGHTS, type Weights } from "./priority";
import {
  canTransition, type Assignment, type Category, type Defect, type HistoryEntry,
  type SensorEvent, type Status, type Team, type Urgency,
} from "./types";
import {
  fetchFullDB,
  apiSubmitReport,
  apiUpdateStatus,
  apiDeleteDefect,
  apiAssignTeam,
  apiSaveTeam,
  apiSetWeights,
  apiSetSimRunning,
  apiClearSimEvents,
  apiResetDemo,
} from "./api";

export interface DB {
  version: number;
  defects: Defect[];
  events: SensorEvent[];
  teams: Team[];
  assignments: Assignment[];
  history: HistoryEntry[];
  weights: Weights;
  simRunning: boolean;
}

const KEY = "civiclens-db-v1";
const VERSION = 1;

/* ---------- deterministic demo seed (Jaipur demo coordinates) ---------- */
function rng(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const PLACES: { road: string; area: string; lat: number; lng: number }[] = [
  { road: "MI Road", area: "Panch Batti", lat: 26.9167, lng: 75.8069 },
  { road: "Tonk Road", area: "Durgapura", lat: 26.8505, lng: 75.7936 },
  { road: "JLN Marg", area: "Malviya Nagar", lat: 26.8601, lng: 75.8136 },
  { road: "Ajmer Road", area: "Sodala", lat: 26.9012, lng: 75.7718 },
  { road: "Sikar Road", area: "Vidhyadhar Nagar", lat: 26.9606, lng: 75.7782 },
  { road: "Gopalpura Bypass", area: "Gopalpura", lat: 26.8738, lng: 75.7795 },
  { road: "Tilak Marg", area: "C-Scheme", lat: 26.9049, lng: 75.8026 },
  { road: "Amer Road", area: "Jal Mahal", lat: 26.9535, lng: 75.8463 },
  { road: "Agra Road", area: "Transport Nagar", lat: 26.9163, lng: 75.8607 },
  { road: "New Sanganer Road", area: "Mansarovar", lat: 26.8682, lng: 75.7625 },
  { road: "Sahakar Marg", area: "Lalkothi", lat: 26.8925, lng: 75.8037 },
  { road: "Station Road", area: "Sindhi Camp", lat: 26.9225, lng: 75.7917 },
  { road: "Jhotwara Road", area: "Jhotwara", lat: 26.9391, lng: 75.7486 },
  { road: "Vaishali Main Road", area: "Vaishali Nagar", lat: 26.9118, lng: 75.7434 },
];

const CATS: Category[] = ["pothole", "uneven_surface", "road_crack", "waterlogging", "other"];
const DESCS: Record<Category, string> = {
  pothole: "Deep pothole in the left lane, vehicles swerving to avoid it.",
  uneven_surface: "Patchwork resurfacing has left a raised uneven strip.",
  road_crack: "Long longitudinal crack spreading near the divider.",
  waterlogging: "Water collects here after rain and hides the surface.",
  other: "Loose debris and broken edge near the footpath.",
};

const iso = (ms: number) => new Date(ms).toISOString();
let counter = 0;
const uid = (p: string) => `${p}-${Date.now().toString(36)}${(counter++).toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`;

export function newReportId(existing: Set<string>) {
  for (;;) {
    const id = "CL-" + Math.random().toString(36).slice(2, 8).toUpperCase();
    if (!existing.has(id)) return id;
  }
}

export function buildSeed(now = Date.now()): DB {
  const r = rng(20261023);
  const teams: Team[] = [
    { id: "T1", name: "Alpha Patch Crew", zone: "Walled City & C-Scheme", capacity: 5, lead: "Demo Lead A" },
    { id: "T2", name: "Bravo Resurfacing", zone: "Malviya Nagar & Tonk Road", capacity: 4, lead: "Demo Lead B" },
    { id: "T3", name: "Charlie Drainage", zone: "Mansarovar & Sanganer", capacity: 3, lead: "Demo Lead C" },
    { id: "T4", name: "Delta Rapid Response", zone: "Vidhyadhar Nagar & Jhotwara", capacity: 6, lead: "Demo Lead D" },
  ];
  const defects: Defect[] = [];
  const history: HistoryEntry[] = [];
  const assignments: Assignment[] = [];
  const ids = new Set<string>();
  const statuses: Status[] = ["Reported", "Reported", "Reported", "Under Inspection", "Repair Scheduled", "Resolved"];
  for (let i = 0; i < 22; i++) {
    const p = PLACES[i % PLACES.length];
    const cat = CATS[Math.floor(r() * CATS.length)];
    const created = now - Math.floor(r() * 28 * 86400000) - 3600000;
    let id = "CL-D" + String(1001 + i);
    ids.add(id);
    const status = statuses[Math.floor(r() * statuses.length)];
    const d: Defect = {
      id, road: p.road, location: `${p.area}, Jaipur (demo location)`,
      lat: +(p.lat + (r() - 0.5) * 0.012).toFixed(5), lng: +(p.lng + (r() - 0.5) * 0.012).toFixed(5),
      category: cat, severity: 1 + Math.floor(r() * 5), description: DESCS[cat],
      source: "demo_seed", createdAt: iso(created), status, reportCount: 1 + Math.floor(r() * 4),
    };
    history.push({ id: `H-s${i}a`, defectId: id, ts: d.createdAt, action: "Report created", note: "Demonstration record", status: "Reported", internal: false });
    if (status !== "Reported") {
      const team = teams[i % teams.length];
      d.teamId = team.id; d.urgency = "Normal";
      assignments.push({ id: `A-s${i}`, defectId: id, teamId: team.id, urgency: "Normal", notes: "Seed assignment", createdAt: iso(created + 7200000), active: status !== "Resolved" });
      history.push({ id: `H-s${i}b`, defectId: id, ts: iso(created + 7200000), action: "Status changed", note: "Inspection started", status: "Under Inspection", internal: false });
      if (status === "Repair Scheduled" || status === "Resolved")
        history.push({ id: `H-s${i}c`, defectId: id, ts: iso(created + 86400000), action: "Status changed", note: "Repair scheduled", status: "Repair Scheduled", internal: false });
      if (status === "Resolved")
        history.push({ id: `H-s${i}d`, defectId: id, ts: iso(created + 2 * 86400000), action: "Status changed", note: "Surface restored", status: "Resolved", internal: false });
    }
    defects.push(d);
    id = "";
  }
  const events: SensorEvent[] = [];
  for (let i = 0; i < 55; i++) {
    const p = PLACES[Math.floor(r() * PLACES.length)];
    const ev = makeEvent(r, p, now - Math.floor(r() * 7 * 86400000), `E-s${i}`);
    if (ev.flagged) {
      const near = defects.find((d) => distanceM(d, ev) < 900);
      if (near) ev.defectId = near.id;
    }
    events.push(ev);
  }
  events.sort((a, b) => b.ts.localeCompare(a.ts));
  return { version: VERSION, defects, events, teams, assignments, history, weights: { ...DEFAULT_WEIGHTS }, simRunning: true };
}

function makeEvent(r: () => number, p: { area: string; lat: number; lng: number }, ts: number, id: string): SensorEvent {
  const spike = r() < 0.3;
  const vibration = +(spike ? 1.4 + r() * 1.6 : 0.2 + r() * 1.1).toFixed(2);
  const speed = Math.round(15 + r() * 50);
  const surface = +(spike ? 0.5 + r() * 0.5 : r() * 0.6).toFixed(2);
  const a = analyseReading(vibration, speed, surface);
  return {
    id, ts: iso(ts), lat: +(p.lat + (r() - 0.5) * 0.01).toFixed(5), lng: +(p.lng + (r() - 0.5) * 0.01).toFixed(5),
    location: `${p.area}, Jaipur (demo)`, vibration, speed, surface, ...a, source: "SIMULATED",
  };
}

/* ---------- store plumbing ---------- */
let db: DB | null = null;
const listeners = new Set<() => void>();
let syncInitialized = false;

async function syncWithServer() {
  const serverDb = await fetchFullDB();
  if (serverDb && serverDb.defects) {
    db = serverDb;
    persist();
    listeners.forEach((l) => l());
  }
}

function initSyncOnce() {
  if (typeof window === "undefined" || syncInitialized) return;
  syncInitialized = true;
  syncWithServer();
  window.setInterval(syncWithServer, 4000);
}

function load(): DB {
  if (typeof window !== "undefined") initSyncOnce();
  if (db) return db;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DB;
      if (parsed?.version === VERSION && Array.isArray(parsed.defects)) { db = parsed; return db; }
    }
  } catch { /* corrupted: fall through to seed */ }
  db = buildSeed();
  persist();
  return db;
}
function persist() {
  try { window.localStorage.setItem(KEY, JSON.stringify(db)); }
  catch { /* quota exceeded: keep in memory */ }
}
function commit(next: DB) { db = next; persist(); listeners.forEach((l) => l()); }

const subscribe = (l: () => void) => {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => { if (e.key === KEY) { db = null; l(); } };
  window.addEventListener("storage", onStorage);
  return () => { listeners.delete(l); window.removeEventListener("storage", onStorage); };
};

/** Returns null during SSR / first hydration render, then the live DB. */
export function useDB(): DB | null {
  return useSyncExternalStore(subscribe, load, () => null);
}

/* ---------- actions (validated, like an API layer) ---------- */
export class ValidationError extends Error {}

export interface NewReport { road: string; location: string; lat: number; lng: number; category: Category; severity: number; description: string; photo?: string }

export function validateReport(r: Partial<NewReport>): Record<string, string> {
  const e: Record<string, string> = {};
  if (!r.road || r.road.trim().length < 2) e.road = "Enter the road name.";
  if (!r.location || r.location.trim().length < 2) e.location = "Describe the location or landmark.";
  if (typeof r.lat !== "number" || !Number.isFinite(r.lat) || r.lat < -90 || r.lat > 90) e.lat = "Latitude must be between -90 and 90.";
  if (typeof r.lng !== "number" || !Number.isFinite(r.lng) || r.lng < -180 || r.lng > 180) e.lng = "Longitude must be between -180 and 180.";
  if (!r.category || !CATS.includes(r.category)) e.category = "Choose a defect category.";
  if (typeof r.severity !== "number" || r.severity < 1 || r.severity > 5) e.severity = "Severity must be 1–5.";
  if (!r.description || r.description.trim().length < 10) e.description = "Add at least 10 characters.";
  if (r.description && r.description.length > 1000) e.description = "Keep it under 1000 characters.";
  return e;
}

export function submitReport(r: NewReport): Defect {
  const errs = validateReport(r);
  if (Object.keys(errs).length) throw new ValidationError(Object.values(errs)[0]);
  const s = load();
  const id = newReportId(new Set(s.defects.map((d) => d.id)));
  const now = iso(Date.now());
  const d: Defect = {
    id, road: r.road.trim(), location: r.location.trim(), lat: r.lat, lng: r.lng, category: r.category,
    severity: Math.round(r.severity), description: r.description.trim(), photo: r.photo,
    source: "citizen_report", createdAt: now, status: "Reported", reportCount: 1,
  };
  commit({ ...s, defects: [d, ...s.defects], history: [{ id: uid("H"), defectId: id, ts: now, action: "Report created", note: "Submitted by citizen", status: "Reported", internal: false }, ...s.history] });
  apiSubmitReport({ ...r, id }).then(() => syncWithServer()).catch(() => {});
  return d;
}

export function updateStatus(defectId: string, to: Status, note: string) {
  const s = load();
  const d = s.defects.find((x) => x.id === defectId);
  if (!d) throw new ValidationError("Defect not found.");
  if (!canTransition(d.status, to)) throw new ValidationError(`Cannot move from ${d.status} to ${to}.`);
  const now = iso(Date.now());
  const assignments = to === "Resolved" ? s.assignments.map((a) => (a.defectId === defectId ? { ...a, active: false } : a)) : s.assignments;
  commit({
    ...s, assignments,
    defects: s.defects.map((x) => (x.id === defectId ? { ...x, status: to } : x)),
    history: [{ id: uid("H"), defectId, ts: now, action: "Status changed", note: note.trim() || `Moved to ${to}`, status: to, internal: false }, ...s.history],
  });
  apiUpdateStatus(defectId, to, note).then(() => syncWithServer()).catch(() => {});
}

export function deleteDefect(defectId: string) {
  const s = load();
  commit({
    ...s,
    defects: s.defects.filter((d) => d.id !== defectId),
    assignments: s.assignments.filter((a) => a.defectId !== defectId),
    history: s.history.filter((h) => h.defectId !== defectId),
    events: s.events.map((e) => (e.defectId === defectId ? { ...e, defectId: undefined } : e)),
  });
  apiDeleteDefect(defectId).then(() => syncWithServer()).catch(() => {});
}

export function teamLoad(s: DB, teamId: string) {
  return s.assignments.filter((a) => a.teamId === teamId && a.active).length;
}

export function assignTeam(defectId: string, teamId: string, urgency: Urgency, notes: string) {
  const s = load();
  const d = s.defects.find((x) => x.id === defectId);
  const t = s.teams.find((x) => x.id === teamId);
  if (!d) throw new ValidationError("Defect not found.");
  if (!t) throw new ValidationError("Team not found.");
  if (d.status === "Resolved") throw new ValidationError("Resolved defects cannot be assigned.");
  if (d.teamId !== teamId && teamLoad(s, teamId) >= t.capacity) throw new ValidationError(`${t.name} is at full capacity.`);
  const now = iso(Date.now());
  const assignments = s.assignments.map((a) => (a.defectId === defectId ? { ...a, active: false } : a));
  assignments.unshift({ id: uid("A"), defectId, teamId, urgency, notes: notes.trim(), createdAt: now, active: true });
  commit({
    ...s, assignments,
    defects: s.defects.map((x) => (x.id === defectId ? { ...x, teamId, urgency } : x)),
    history: [{ id: uid("H"), defectId, ts: now, action: `Assigned to ${t.name}`, note: `Urgency ${urgency}${notes.trim() ? ` — ${notes.trim()}` : ""}`, status: d.status, internal: true }, ...s.history],
  });
  apiAssignTeam(defectId, teamId, urgency, notes).then(() => syncWithServer()).catch(() => {});
}

export function saveTeam(t: Omit<Team, "id"> & { id?: string }) {
  if (!t.name.trim()) throw new ValidationError("Team name is required.");
  if (!t.zone.trim()) throw new ValidationError("Operating zone is required.");
  if (!Number.isInteger(t.capacity) || t.capacity < 1 || t.capacity > 50) throw new ValidationError("Capacity must be 1–50.");
  const s = load();
  if (t.id) {
    if (teamLoad(s, t.id) > t.capacity) throw new ValidationError("Capacity cannot be lower than current active assignments.");
    commit({ ...s, teams: s.teams.map((x) => (x.id === t.id ? { ...x, ...t, id: x.id } : x)) });
  } else {
    commit({ ...s, teams: [...s.teams, { ...t, id: uid("T") }] });
  }
  apiSaveTeam(t).then(() => syncWithServer()).catch(() => {});
}

export function setWeights(w: Weights) {
  const s = load();
  commit({ ...s, weights: w });
  apiSetWeights(w).then(() => syncWithServer()).catch(() => {});
}

export function setSimRunning(v: boolean) {
  const s = load();
  commit({ ...s, simRunning: v });
  apiSetSimRunning(v).then(() => syncWithServer()).catch(() => {});
}

export function clearSimEvents() {
  const s = load();
  commit({ ...s, events: [] });
  apiClearSimEvents().then(() => syncWithServer()).catch(() => {});
}

export function resetDemo() {
  const keepWeights = load().weights;
  commit({ ...buildSeed(), weights: keepWeights });
  apiResetDemo().then(() => syncWithServer()).catch(() => {});
}

/** One simulated tick: generate, analyse, and create/link a defect if severe. */
export function simulateOne() {
  const s = load();
  const r = Math.random;
  const p = PLACES[Math.floor(r() * PLACES.length)];
  const ev = makeEvent(r, p, Date.now(), uid("E"));
  let defects = s.defects, history = s.history;
  if (ev.flagged && ev.severity >= 3) {
    const recent = s.defects.find((d) => d.status !== "Resolved" && distanceM(d, ev) < 60 && Date.now() - Date.parse(d.createdAt) < 30 * 60000);
    if (recent) {
      ev.defectId = recent.id;
      defects = s.defects.map((d) => (d.id === recent.id ? { ...d, reportCount: d.reportCount + 1, sensorScore: Math.max(d.sensorScore ?? 0, ev.surface) } : d));
    } else {
      const id = newReportId(new Set(s.defects.map((d) => d.id)));
      ev.defectId = id;
      const d: Defect = {
        id, road: p.road, location: ev.location, lat: ev.lat, lng: ev.lng, category: "pothole", severity: ev.severity,
        description: `Auto-created from simulated sensor event: ${ev.reasons.join("; ")}.`, source: "sensor_simulated",
        createdAt: ev.ts, status: "Reported", reportCount: 1, sensorScore: ev.surface,
      };
      defects = [d, ...s.defects];
      history = [{ id: uid("H"), defectId: id, ts: ev.ts, action: "Report created", note: "Created by rule-based anomaly detection (simulated feed)", status: "Reported", internal: false }, ...s.history];
    }
  }
  commit({ ...s, defects, history, events: [ev, ...s.events].slice(0, 500) });
  return ev;
}
