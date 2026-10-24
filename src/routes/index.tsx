import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Cpu, Gauge, Radar, Truck, ShieldCheck, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicShell } from "@/components/civic/Shells";
import { MapView } from "@/components/civic/MapView";
import { SimLabel } from "@/components/civic/ui";
import { useDB } from "@/lib/store";
import { toPoint, useScored } from "@/lib/derived";
import hero from "@/assets/hero-road.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CIVICLENS — See the damage. Prioritise the repair." },
      { name: "description", content: "Road intelligence prototype: citizen reports, simulated sensor feeds, explainable repair priorities for Jaipur." },
      { property: "og:title", content: "CIVICLENS — Road Intelligence for Smarter Cities" },
      { property: "og:description", content: "Detect, analyse, prioritise and dispatch road repairs." },
    ],
  }),
  component: Home,
});

function Home() {
  const db = useDB();
  const scored = useScored(db);
  const open = scored.filter((d) => d.status !== "Resolved");
  const stats = [
    { l: "Defects tracked", v: scored.length },
    { l: "Critical / high open", v: open.filter((d) => d.p.band === "Critical" || d.p.band === "High").length },
    { l: "Resolved", v: scored.filter((d) => d.status === "Resolved").length },
    { l: "Sensor events", v: db?.events.length ?? 0 },
  ];
  const steps = [
    { i: Radar, t: "Detect", d: "Citizens report hazards; a simulated vehicle sensor feed flags rough surfaces." },
    { i: Cpu, t: "Analyse", d: "Transparent threshold rules explain why every reading was or wasn't flagged." },
    { i: Gauge, t: "Prioritise", d: "A 0–100 score weighs severity, safety risk, frequency and waiting time." },
    { i: Truck, t: "Dispatch", d: "Crews are assigned within capacity and given an ordered worklist." },
  ];
  return (
    <PublicShell>
      <section className="relative overflow-hidden">
        <img src={hero} alt="Jaipur road at dusk with highlighted defects" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-sidebar via-sidebar/85 to-sidebar/30" />
        <div className="relative mx-auto max-w-6xl px-4 py-24 sm:py-32">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-sidebar-primary">Road intelligence for smarter cities</p>
          <h1 className="mt-4 max-w-2xl text-4xl font-extrabold leading-tight text-sidebar-accent-foreground sm:text-6xl">See the damage. Prioritise the repair.</h1>
          <p className="mt-5 max-w-xl text-lg text-sidebar-foreground/85">Potholes and broken surfaces cause crashes and costly vehicle damage. CIVICLENS turns scattered reports into a ranked, explainable repair plan.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"><Link to="/dashboard">Explore Road Intelligence <ArrowRight className="size-4" /></Link></Button>
            <Button asChild size="lg" variant="secondary"><Link to="/report">Report a Road Issue</Link></Button>
          </div>
        </div>
      </section>

      <section className="mx-auto -mt-10 grid max-w-6xl grid-cols-2 gap-3 px-4 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.l} className="panel relative p-4">
            <div className="font-display text-3xl font-bold">{db ? s.v : "—"}</div>
            <div className="text-xs text-muted-foreground">{s.l}</div>
          </div>
        ))}
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20">
        <h2 className="text-3xl font-bold">How it works</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {steps.map((s, i) => (
            <div key={s.t} className="panel p-5">
              <div className="flex items-center gap-2 text-cyan"><s.i className="size-5" /><span className="font-mono text-xs">0{i + 1}</span></div>
              <h3 className="mt-3 text-lg font-bold">{s.t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div><h2 className="text-3xl font-bold">Hazard map preview</h2><p className="text-sm text-muted-foreground">Demonstration locations around Jaipur — not verified real-world defects.</p></div>
          <Button asChild variant="outline"><Link to="/map">Open full map</Link></Button>
        </div>
        <div className="panel overflow-hidden p-1"><MapView points={open.map(toPoint)} height={380} /></div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-4 pb-20 md:grid-cols-3">
        <div className="panel p-6"><ShieldCheck className="size-6 text-cyan" /><h3 className="mt-3 text-xl font-bold">For citizens</h3><p className="mt-2 text-sm text-muted-foreground">Report in under a minute without an account, then track progress with your report ID.</p></div>
        <div className="panel p-6"><Building2 className="size-6 text-cyan" /><h3 className="mt-3 text-xl font-bold">For engineering teams</h3><p className="mt-2 text-sm text-muted-foreground">One ranked list, crew workloads, and a CSV worklist ordered by approximate travel distance.</p></div>
        <div className="panel p-6"><div className="flex items-center gap-2"><Radar className="size-6 text-high" /><SimLabel /></div><h3 className="mt-3 text-xl font-bold">IoT demonstration</h3><p className="mt-2 text-sm text-muted-foreground">No physical hardware: a simulator produces vibration, speed and surface readings so the pipeline can be shown end to end.</p></div>
      </section>
    </PublicShell>
  );
}
