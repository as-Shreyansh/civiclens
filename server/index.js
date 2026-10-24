import express from "express";
import cors from "cors";
import {
  initDb,
  getFullDB,
  createReport,
  updateStatus,
  assignTeam,
  upsertTeam,
  setWeights,
  setSimRunning,
  clearSimEvents,
  simulateOne,
  seedData,
  deleteDefect,
} from "./db.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: "5mb" }));

// Initialize SQLite database
initDb();

// Friendly root landing page for developers visiting localhost:5000 in browser
app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>CIVICLENS Backend API</title>
        <style>
          body { font-family: system-ui, sans-serif; background: #0b1120; color: #e2e8f0; padding: 40px; }
          .card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 24px; max-width: 600px; margin: 0 auto; box-shadow: 0 4px 20px rgba(0,0,0,0.4); }
          h1 { color: #38bdf8; margin-top: 0; }
          .badge { display: inline-block; background: #059669; color: white; padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: bold; }
          ul { line-height: 1.8; }
          a { color: #38bdf8; text-decoration: none; }
          a:hover { text-decoration: underline; }
          code { background: #0f172a; padding: 2px 6px; border-radius: 4px; color: #f43f5e; font-size: 13px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <h1>CIVICLENS API</h1>
            <span class="badge">ONLINE</span>
          </div>
          <p>The CIVICLENS backend server and SQLite database are active.</p>
          <h3>Useful Links:</h3>
          <ul>
            <li><strong>Frontend Web App:</strong> <a href="http://localhost:5173" target="_blank">http://localhost:5173</a></li>
            <li><strong>Full Database JSON:</strong> <a href="/api/db" target="_blank"><code>/api/db</code></a></li>
          </ul>
          <h3>REST Endpoints:</h3>
          <ul>
            <li><code>POST /api/report</code> (Citizen reports)</li>
            <li><code>PATCH /api/defects/:id/status</code> (Workflow update)</li>
            <li><code>POST /api/defects/:id/assign</code> (Dispatch crew)</li>
            <li><code>POST /api/sim/toggle</code> (Simulated IoT toggle)</li>
            <li><code>POST /api/demo/reset</code> (Reset seed data)</li>
          </ul>
        </div>
      </body>
    </html>
  `);
});

// 1. Get full database state
app.get("/api/db", (req, res) => {
  try {
    const data = getFullDB();
    res.json(data);
  } catch (err) {
    console.error("Error fetching db:", err);
    res.status(500).json({ error: "Failed to fetch database state" });
  }
});

// 2. Submit citizen report
app.post("/api/report", (req, res) => {
  try {
    const { road, location, lat, lng, category, severity, description, photo, id } = req.body;
    if (!road || !location || lat === undefined || lng === undefined || !category || !description) {
      return res.status(400).json({ error: "Missing required report fields" });
    }
    const defect = createReport({ road, location, lat, lng, category, severity, description, photo, id });
    res.status(201).json(defect);
  } catch (err) {
    console.error("Error creating report:", err);
    res.status(400).json({ error: err.message || "Failed to create report" });
  }
});

// 3. Update defect status
app.patch("/api/defects/:id/status", (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;
    if (!status) return res.status(400).json({ error: "Status is required" });
    const updated = updateStatus(id, status, note || "");
    res.json(updated);
  } catch (err) {
    console.error("Error updating status:", err);
    res.status(400).json({ error: err.message || "Failed to update status" });
  }
});

// Delete defect
app.delete("/api/defects/:id", (req, res) => {
  try {
    const { id } = req.params;
    deleteDefect(id);
    res.json({ success: true });
  } catch (err) {
    console.error("Error deleting defect:", err);
    res.status(400).json({ error: err.message || "Failed to delete defect" });
  }
});

// 4. Assign defect to maintenance team
app.post("/api/defects/:id/assign", (req, res) => {
  try {
    const { id } = req.params;
    const { teamId, urgency, notes } = req.body;
    if (!teamId || !urgency) return res.status(400).json({ error: "Team ID and urgency are required" });
    const updated = assignTeam(id, teamId, urgency, notes || "");
    res.json(updated);
  } catch (err) {
    console.error("Error assigning team:", err);
    res.status(400).json({ error: err.message || "Failed to assign team" });
  }
});

// 5. Save or update maintenance team
app.post("/api/teams", (req, res) => {
  try {
    const { id, name, zone, capacity, lead } = req.body;
    if (!name || !zone || !capacity || !lead) {
      return res.status(400).json({ error: "Missing required team fields" });
    }
    upsertTeam({ id, name, zone, capacity: Number(capacity), lead });
    res.json({ success: true });
  } catch (err) {
    console.error("Error saving team:", err);
    res.status(400).json({ error: err.message || "Failed to save team" });
  }
});

// 6. Update priority weights
app.post("/api/weights", (req, res) => {
  try {
    const weights = req.body;
    setWeights(weights);
    res.json({ success: true, weights });
  } catch (err) {
    res.status(400).json({ error: "Failed to update weights" });
  }
});

// 7. Simulated IoT controls
app.post("/api/sim/toggle", (req, res) => {
  try {
    const { simRunning } = req.body;
    setSimRunning(Boolean(simRunning));
    res.json({ simRunning: Boolean(simRunning) });
  } catch (err) {
    res.status(400).json({ error: "Failed to update simulation state" });
  }
});

app.post("/api/sim/tick", (req, res) => {
  try {
    const ev = simulateOne();
    res.json(ev);
  } catch (err) {
    res.status(500).json({ error: "Failed to run simulation tick" });
  }
});

app.post("/api/sim/clear", (req, res) => {
  try {
    clearSimEvents();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to clear simulated events" });
  }
});

// 8. Demo reset
app.post("/api/demo/reset", (req, res) => {
  try {
    seedData();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to reset demo" });
  }
});

// Background simulation ticker (every 6 seconds if simRunning is true)
setInterval(() => {
  try {
    const dbState = getFullDB();
    if (dbState.simRunning) {
      simulateOne();
    }
  } catch (err) {
    // silent catch in background
  }
}, 6000);

app.listen(PORT, () => {
  console.log(`[CIVICLENS Backend] Running on http://localhost:${PORT}`);
});
