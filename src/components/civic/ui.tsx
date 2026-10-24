import type { ReactNode } from "react";
import { ScanLine, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Band } from "@/lib/priority";
import type { Status } from "@/lib/types";

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-display text-lg font-bold tracking-tight", className)}>
      <span className="grid size-8 place-items-center rounded-lg bg-cyan/15 text-cyan ring-1 ring-cyan/40">
        <ScanLine className="size-4" />
      </span>
      CIVIC<span className="text-cyan">LENS</span>
    </span>
  );
}

const bandCls: Record<Band, string> = {
  Critical: "bg-critical/15 text-critical ring-critical/40",
  High: "bg-high/15 text-high ring-high/40",
  Medium: "bg-medium/15 text-medium ring-medium/40",
  Low: "bg-low/15 text-low ring-low/40",
};
export function BandBadge({ band, score }: { band: Band; score?: number }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ring-1", bandCls[band])}>
      {score !== undefined && <span className="font-mono">{score}</span>}
      {band}
    </span>
  );
}

const statusCls: Record<Status, string> = {
  Reported: "bg-muted text-foreground ring-border",
  "Under Inspection": "bg-cyan/15 text-cyan ring-cyan/40",
  "Repair Scheduled": "bg-high/15 text-high ring-high/40",
  Resolved: "bg-success/15 text-success ring-success/40",
};
export function StatusBadge({ status }: { status: Status }) {
  return <span className={cn("inline-flex rounded-md px-2 py-0.5 text-xs font-medium ring-1", statusCls[status])}>{status}</span>;
}

export function Panel({ title, action, children, className }: { title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("panel p-4 sm:p-5", className)}>
      {(title || action) && (
        <header className="mb-4 flex flex-wrap items-center justify-between gap-2">
          {title && <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{title}</h2>}
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

export function Stat({ label, value, icon, tone }: { label: string; value: ReactNode; icon: ReactNode; tone?: "critical" | "high" | "cyan" | "success" }) {
  const t = tone === "critical" ? "text-critical" : tone === "high" ? "text-high" : tone === "success" ? "text-success" : "text-cyan";
  return (
    <div className="panel flex items-start justify-between p-4">
      <div>
        <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="mt-1 font-display text-3xl font-bold">{value}</div>
      </div>
      <span className={cn("rounded-lg bg-muted p-2", t)}>{icon}</span>
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center text-sm text-muted-foreground">
      <Inbox className="size-6" /> {children}
    </div>
  );
}

export function LoadingGrid({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />)}
    </div>
  );
}

export function SimLabel() {
  return <span className="rounded border border-high/40 bg-high/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-high">Simulated</span>;
}

export const fmt = (iso: string) => new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
