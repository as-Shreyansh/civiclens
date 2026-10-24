import { createFileRoute } from "@tanstack/react-router";
import { PublicShell } from "@/components/civic/Shells";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "Methodology — CIVICLENS" },
      { name: "description", content: "How CIVICLENS detects, scores and dispatches road repairs." },
      { property: "og:title", content: "Methodology — CIVICLENS" },
      { property: "og:description", content: "Architecture, rules, scoring and limitations." },
    ],
  }),
  component: About,
});

const S = [
  ["The problem", "Potholes and broken surfaces cause crashes and vehicle damage; reports are scattered and repairs are not ranked."],
  ["Proposed IoT architecture", "Vehicle-mounted accelerometers and GPS would stream vibration, speed and surface readings to a city backend."],
  ["This prototype", "Full-stack prototype: Node.js + Express backend with persistent SQLite database, connected to a modern React frontend. Open demo access without login for hackathon evaluation."],
  ["Rule-based anomaly detection", "Vibration ≥ 1.5g or surface score ≥ 0.65 flags an event; high vibration at ≥ 40 km/h raises urgency. Not a trained AI model."],
  ["Priority scoring", "0–100 = severity 40% + safety risk 30% + report frequency 20% + waiting time 10%. Bands: Critical 80+, High 60–79, Medium 35–59, Low 0–34. Prototype assumptions."],
  ["Data flow", "Citizen report / simulated event → validation → stored → scored → shown on dashboard, map, priorities and dispatch."],
  ["Limitations", "Simulated sensors, demonstration Jaipur coordinates (not verified defects), no real authentication, data not shared between devices."],
  ["Future work", "Physical sensors, verified municipal datasets, computer-vision pothole detection, real staff accounts."],
];

function About() {
  return (
    <PublicShell>
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-12">
        <h1 className="text-3xl font-bold">About & methodology</h1>
        {S.map(([t, d]) => <section key={t} className="panel p-5"><h2 className="text-lg font-bold">{t}</h2><p className="mt-1 text-sm text-muted-foreground">{d}</p></section>)}
      </div>
    </PublicShell>
  );
}
