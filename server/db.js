import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, "civiclens.sqlite");

export const db = new DatabaseSync(dbPath);

export const PLACES = [
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

const CATS = ["pothole", "uneven_surface", "road_crack", "waterlogging", "other"];
const DESCS = {
  pothole: "Deep pothole in the left lane, vehicles swerving to avoid it.",
  uneven_surface: "Patchwork resurfacing has left a raised uneven strip.",
  road_crack: "Long longitudinal crack spreading near the divider.",
  waterlogging: "Water collects here after rain and hides the surface.",
  other: "Loose debris and broken edge near the footpath.",
};

export const DEFAULT_WEIGHTS = { severity: 40, safety: 30, frequency: 20, waiting: 10 };
const THRESHOLDS = { vibration: 1.5, surface: 0.65, highSpeed: 40 };

function rng(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let counter = 0;
const uid = (p) => `${p}-${Date.now().toString(36)}${(counter++).toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`;

export function distanceM(a, b) {
  const R = 6371000, toR = Math.PI / 180;
  const dLat = (b.lat - a.lat) * toR, dLng = (b.lng - a.lng) * toR;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * toR) * Math.cos(b.lat * toR) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function analyseReading(vibration, speed, surface) {
  const v = Number.isFinite(vibration) ? vibration : 0;
  const s = Number.isFinite(speed) ? speed : 0;
  const a = Number.isFinite(surface) ? surface : 0;
  const reasons = [];
  if (v >= THRESHOLDS.vibration) reasons.push(`Vibration ${v.toFixed(2)}g ≥ ${THRESHOLDS.vibration}g`);
  if (a >= THRESHOLDS.surface) reasons.push(`Surface score ${a.toFixed(2)} ≥ ${THRESHOLDS.surface}`);
  const flagged = reasons.length > 0;
  if (!flagged) return { flagged, reasons: ["All readings below thresholds"], severity: 0, action: "No action" };
  let sev = 1 + Math.min(2, Math.floor((v - 1) / 0.6)) + (a >= 0.8 ? 1 : 0);
  if (v >= THRESHOLDS.vibration && s >= THRESHOLDS.highSpeed) {
    sev += 1;
    reasons.push(`Elevated vibration at ${Math.round(s)} km/h raises urgency`);
  }
  const severity = Math.max(1, Math.min(5, sev));
  const action = severity >= 4 ? "Urgent field inspection" : severity >= 3 ? "Schedule inspection" : "Log and monitor";
  return { flagged, reasons, severity, action };
}

function makeEvent(r, p, ts, id) {
  const spike = r() < 0.3;
  const vibration = +(spike ? 1.4 + r() * 1.6 : 0.2 + r() * 1.1).toFixed(2);
  const speed = Math.round(15 + r() * 50);
  const surface = +(spike ? 0.5 + r() * 0.5 : r() * 0.6).toFixed(2);
  const a = analyseReading(vibration, speed, surface);
  return {
    id,
    ts: new Date(ts).toISOString(),
    lat: +(p.lat + (r() - 0.5) * 0.01).toFixed(5),
    lng: +(p.lng + (r() - 0.5) * 0.01).toFixed(5),
    location: `${p.area}, Jaipur (demo)`,
    vibration,
    speed,
    surface,
    ...a,
    source: "SIMULATED",
  };
}

export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS defects (
      id TEXT PRIMARY KEY,
      road TEXT NOT NULL,
      location TEXT NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      category TEXT NOT NULL,
      severity INTEGER NOT NULL,
      description TEXT NOT NULL,
      photo TEXT,
      source TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      status TEXT NOT NULL,
      reportCount INTEGER NOT NULL DEFAULT 1,
      sensorScore REAL,
      teamId TEXT,
      urgency TEXT
    );

    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      ts TEXT NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      location TEXT NOT NULL,
      vibration REAL NOT NULL,
      speed REAL NOT NULL,
      surface REAL NOT NULL,
      flagged INTEGER NOT NULL,
      reasons TEXT NOT NULL,
      severity INTEGER NOT NULL,
      action TEXT NOT NULL,
      defectId TEXT,
      source TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS teams (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      zone TEXT NOT NULL,
      capacity INTEGER NOT NULL,
      lead TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS assignments (
      id TEXT PRIMARY KEY,
      defectId TEXT NOT NULL,
      teamId TEXT NOT NULL,
      urgency TEXT NOT NULL,
      notes TEXT,
      createdAt TEXT NOT NULL,
      active INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS history (
      id TEXT PRIMARY KEY,
      defectId TEXT NOT NULL,
      ts TEXT NOT NULL,
      action TEXT NOT NULL,
      note TEXT,
      status TEXT NOT NULL,
      internal INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  const countDefects = db.prepare("SELECT COUNT(*) as c FROM defects").get();
  if (countDefects.c === 0) {
    seedData();
  }
}

export function seedData() {
  db.exec("DELETE FROM defects; DELETE FROM events; DELETE FROM teams; DELETE FROM assignments; DELETE FROM history; DELETE FROM settings;");

  const now = Date.now();
  const r = rng(20261023);
  const teams = [
    { id: "T1", name: "Alpha Patch Crew", zone: "Walled City & C-Scheme", capacity: 5, lead: "Demo Lead A" },
    { id: "T2", name: "Bravo Resurfacing", zone: "Malviya Nagar & Tonk Road", capacity: 4, lead: "Demo Lead B" },
    { id: "T3", name: "Charlie Drainage", zone: "Mansarovar & Sanganer", capacity: 3, lead: "Demo Lead C" },
    { id: "T4", name: "Delta Rapid Response", zone: "Vidhyadhar Nagar & Jhotwara", capacity: 6, lead: "Demo Lead D" },
  ];

  const insertTeam = db.prepare("INSERT INTO teams (id, name, zone, capacity, lead) VALUES (?, ?, ?, ?, ?)");
  for (const t of teams) {
    insertTeam.run(t.id, t.name, t.zone, t.capacity, t.lead);
  }

  const statuses = ["Reported", "Reported", "Reported", "Under Inspection", "Repair Scheduled", "Resolved"];
  const insertDefect = db.prepare(`
    INSERT INTO defects (id, road, location, lat, lng, category, severity, description, source, createdAt, status, reportCount, teamId, urgency)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertHistory = db.prepare(`
    INSERT INTO history (id, defectId, ts, action, note, status, internal)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const insertAssignment = db.prepare(`
    INSERT INTO assignments (id, defectId, teamId, urgency, notes, createdAt, active)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const createdDefects = [];
  for (let i = 0; i < 22; i++) {
    const p = PLACES[i % PLACES.length];
    const cat = CATS[Math.floor(r() * CATS.length)];
    const created = now - Math.floor(r() * 28 * 86400000) - 3600000;
    const id = "CL-D" + String(1001 + i);
    const status = statuses[Math.floor(r() * statuses.length)];
    const lat = +(p.lat + (r() - 0.5) * 0.012).toFixed(5);
    const lng = +(p.lng + (r() - 0.5) * 0.012).toFixed(5);
    const severity = 1 + Math.floor(r() * 5);
    const desc = DESCS[cat];
    const createdAt = new Date(created).toISOString();
    const reportCount = 1 + Math.floor(r() * 4);

    let teamId = null;
    let urgency = null;
    if (status !== "Reported") {
      const team = teams[i % teams.length];
      teamId = team.id;
      urgency = "Normal";
      insertAssignment.run(
        `A-s${i}`, id, team.id, "Normal", "Seed assignment",
        new Date(created + 7200000).toISOString(), status !== "Resolved" ? 1 : 0
      );
    }

    insertDefect.run(id, p.road, `${p.area}, Jaipur (demo location)`, lat, lng, cat, severity, desc, "demo_seed", createdAt, status, reportCount, teamId, urgency);
    createdDefects.push({ id, lat, lng });

    insertHistory.run(`H-s${i}a`, id, createdAt, "Report created", "Demonstration record", "Reported", 0);
    if (status !== "Reported") {
      insertHistory.run(`H-s${i}b`, id, new Date(created + 7200000).toISOString(), "Status changed", "Inspection started", "Under Inspection", 0);
      if (status === "Repair Scheduled" || status === "Resolved") {
        insertHistory.run(`H-s${i}c`, id, new Date(created + 86400000).toISOString(), "Status changed", "Repair scheduled", "Repair Scheduled", 0);
      }
      if (status === "Resolved") {
        insertHistory.run(`H-s${i}d`, id, new Date(created + 2 * 86400000).toISOString(), "Status changed", "Surface restored", "Resolved", 0);
      }
    }
  }

  const insertEvent = db.prepare(`
    INSERT INTO events (id, ts, lat, lng, location, vibration, speed, surface, flagged, reasons, severity, action, defectId, source)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (let i = 0; i < 55; i++) {
    const p = PLACES[Math.floor(r() * PLACES.length)];
    const ev = makeEvent(r, p, now - Math.floor(r() * 7 * 86400000), `E-s${i}`);
    if (ev.flagged) {
      const near = createdDefects.find((d) => distanceM(d, ev) < 900);
      if (near) ev.defectId = near.id;
    }
    insertEvent.run(
      ev.id, ev.ts, ev.lat, ev.lng, ev.location, ev.vibration, ev.speed, ev.surface,
      ev.flagged ? 1 : 0, JSON.stringify(ev.reasons), ev.severity, ev.action, ev.defectId || null, ev.source
    );
  }

  const insertSetting = db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)");
  insertSetting.run("weights", JSON.stringify(DEFAULT_WEIGHTS));
  insertSetting.run("simRunning", JSON.stringify(true));
}

export function getFullDB() {
  const defects = db.prepare("SELECT * FROM defects ORDER BY createdAt DESC").all();
  const rawEvents = db.prepare("SELECT * FROM events ORDER BY ts DESC LIMIT 500").all();
  const events = rawEvents.map(e => ({
    ...e,
    flagged: Boolean(e.flagged),
    reasons: JSON.parse(e.reasons || "[]")
  }));
  const teams = db.prepare("SELECT * FROM teams").all();
  const rawAssignments = db.prepare("SELECT * FROM assignments ORDER BY createdAt DESC").all();
  const assignments = rawAssignments.map(a => ({ ...a, active: Boolean(a.active) }));
  const rawHistory = db.prepare("SELECT * FROM history ORDER BY ts DESC").all();
  const history = rawHistory.map(h => ({ ...h, internal: Boolean(h.internal) }));

  let weights = DEFAULT_WEIGHTS;
  const weightsRow = db.prepare("SELECT value FROM settings WHERE key = 'weights'").get();
  if (weightsRow) {
    try { weights = JSON.parse(weightsRow.value); } catch {}
  }

  let simRunning = true;
  const simRow = db.prepare("SELECT value FROM settings WHERE key = 'simRunning'").get();
  if (simRow) {
    try { simRunning = JSON.parse(simRow.value); } catch {}
  }

  return {
    version: 1,
    defects,
    events,
    teams,
    assignments,
    history,
    weights,
    simRunning,
  };
}

export function newReportId() {
  const existingRows = db.prepare("SELECT id FROM defects").all();
  const existing = new Set(existingRows.map(r => r.id));
  for (;;) {
    const id = "CL-" + Math.random().toString(36).slice(2, 8).toUpperCase();
    if (!existing.has(id)) return id;
  }
}

export function createReport(data) {
  const id = data.id || newReportId();
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO defects (id, road, location, lat, lng, category, severity, description, photo, source, createdAt, status, reportCount)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, data.road.trim(), data.location.trim(), data.lat, data.lng, data.category,
    Math.round(data.severity), data.description.trim(), data.photo || null,
    "citizen_report", now, "Reported", 1
  );

  db.prepare(`
    INSERT INTO history (id, defectId, ts, action, note, status, internal)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    uid("H"), id, now, "Report created", "Submitted by citizen", "Reported", 0
  );

  return db.prepare("SELECT * FROM defects WHERE id = ?").get(id);
}

export function updateStatus(defectId, newStatus, note = "") {
  const defect = db.prepare("SELECT * FROM defects WHERE id = ?").get(defectId);
  if (!defect) throw new Error("Defect not found");

  const now = new Date().toISOString();
  db.prepare("UPDATE defects SET status = ? WHERE id = ?").run(newStatus, defectId);

  if (newStatus === "Resolved") {
    db.prepare("UPDATE assignments SET active = 0 WHERE defectId = ?").run(defectId);
  }

  db.prepare(`
    INSERT INTO history (id, defectId, ts, action, note, status, internal)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    uid("H"), defectId, now, "Status changed", note.trim() || `Moved to ${newStatus}`, newStatus, 0
  );

  return db.prepare("SELECT * FROM defects WHERE id = ?").get(defectId);
}

export function assignTeam(defectId, teamId, urgency, notes = "") {
  const defect = db.prepare("SELECT * FROM defects WHERE id = ?").get(defectId);
  if (!defect) throw new Error("Defect not found");
  const team = db.prepare("SELECT * FROM teams WHERE id = ?").get(teamId);
  if (!team) throw new Error("Team not found");

  const now = new Date().toISOString();
  db.prepare("UPDATE assignments SET active = 0 WHERE defectId = ?").run(defectId);

  db.prepare(`
    INSERT INTO assignments (id, defectId, teamId, urgency, notes, createdAt, active)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    uid("A"), defectId, teamId, urgency, notes.trim(), now, 1
  );

  db.prepare("UPDATE defects SET teamId = ?, urgency = ? WHERE id = ?").run(teamId, urgency, defectId);

  db.prepare(`
    INSERT INTO history (id, defectId, ts, action, note, status, internal)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    uid("H"), defectId, now, `Assigned to ${team.name}`, `Urgency ${urgency}${notes.trim() ? ` — ${notes.trim()}` : ""}`, defect.status, 1
  );

  return db.prepare("SELECT * FROM defects WHERE id = ?").get(defectId);
}

export function upsertTeam(teamData) {
  if (teamData.id) {
    db.prepare("UPDATE teams SET name = ?, zone = ?, capacity = ?, lead = ? WHERE id = ?")
      .run(teamData.name, teamData.zone, teamData.capacity, teamData.lead, teamData.id);
  } else {
    const id = uid("T");
    db.prepare("INSERT INTO teams (id, name, zone, capacity, lead) VALUES (?, ?, ?, ?, ?)")
      .run(id, teamData.name, teamData.zone, teamData.capacity, teamData.lead);
  }
}

export function setWeights(weights) {
  db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('weights', ?)").run(JSON.stringify(weights));
}

export function setSimRunning(simRunning) {
  db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('simRunning', ?)").run(JSON.stringify(simRunning));
}

export function clearSimEvents() {
  db.prepare("DELETE FROM events").run();
}

export function deleteDefect(defectId) {
  db.prepare("DELETE FROM defects WHERE id = ?").run(defectId);
  db.prepare("DELETE FROM assignments WHERE defectId = ?").run(defectId);
  db.prepare("DELETE FROM history WHERE defectId = ?").run(defectId);
  db.prepare("UPDATE events SET defectId = NULL WHERE defectId = ?").run(defectId);
  return { success: true };
}

export function simulateOne() {
  const r = Math.random;
  const p = PLACES[Math.floor(r() * PLACES.length)];
  const ev = makeEvent(r, p, Date.now(), uid("E"));

  if (ev.flagged && ev.severity >= 3) {
    const activeDefects = db.prepare("SELECT * FROM defects WHERE status != 'Resolved'").all();
    const recent = activeDefects.find((d) => distanceM(d, ev) < 60 && Date.now() - Date.parse(d.createdAt) < 30 * 60000);

    if (recent) {
      ev.defectId = recent.id;
      const newScore = Math.max(recent.sensorScore || 0, ev.surface);
      db.prepare("UPDATE defects SET reportCount = reportCount + 1, sensorScore = ? WHERE id = ?").run(newScore, recent.id);
    } else {
      const id = newReportId();
      ev.defectId = id;
      const now = ev.ts;
      db.prepare(`
        INSERT INTO defects (id, road, location, lat, lng, category, severity, description, source, createdAt, status, reportCount, sensorScore)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id, p.road, ev.location, ev.lat, ev.lng, "pothole", ev.severity,
        `Auto-created from simulated sensor event: ${ev.reasons.join("; ")}.`,
        "sensor_simulated", now, "Reported", 1, ev.surface
      );

      db.prepare(`
        INSERT INTO history (id, defectId, ts, action, note, status, internal)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        uid("H"), id, now, "Report created", "Created by rule-based anomaly detection (simulated feed)", "Reported", 0
      );
    }
  }

  db.prepare(`
    INSERT INTO events (id, ts, lat, lng, location, vibration, speed, surface, flagged, reasons, severity, action, defectId, source)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    ev.id, ev.ts, ev.lat, ev.lng, ev.location, ev.vibration, ev.speed, ev.surface,
    ev.flagged ? 1 : 0, JSON.stringify(ev.reasons), ev.severity, ev.action, ev.defectId || null, ev.source
  );

  return ev;
}
