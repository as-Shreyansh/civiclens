import { useMemo, useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Activity, Bell, ClipboardList, Cpu, Gauge, Info, LayoutDashboard, Map as MapIcon, Menu, RotateCcw, Users, X, FileWarning, Search,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { resetDemo, useDB } from "@/lib/store";
import { scoreDefect } from "@/lib/priority";
import { Logo, fmt } from "./ui";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/map", label: "Road map", icon: MapIcon },
  { to: "/intelligence", label: "Defect intelligence", icon: Cpu },
  { to: "/priorities", label: "Priority engine", icon: Gauge },
  { to: "/dispatch", label: "Dispatcher", icon: ClipboardList },
  { to: "/teams", label: "Teams", icon: Users },
] as const;

export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/" aria-label="CIVICLENS home"><Logo /></Link>
          <div className="flex items-center gap-1 text-sm">
            <Link to="/report" className="rounded-md px-3 py-2 hover:bg-muted" activeProps={{ className: "bg-muted font-semibold" }}>Report</Link>
          <Link to="/terms" className="rounded-md px-3 py-2 hover:bg-muted" activeProps={{ className: "bg-muted font-semibold" }}>Terms</Link>
          <Link to="/privacy" className="rounded-md px-3 py-2 hover:bg-muted" activeProps={{ className: "bg-muted font-semibold" }}>Privacy</Link>
            <Link to="/track" className="rounded-md px-3 py-2 hover:bg-muted" activeProps={{ className: "bg-muted font-semibold" }}>Track</Link>
            <Link to="/about" className="hidden rounded-md px-3 py-2 hover:bg-muted sm:block" activeProps={{ className: "bg-muted font-semibold" }}>Methodology</Link>
            <Button asChild size="sm" className="ml-2"><Link to="/dashboard">Operations</Link></Button>
          </div>
        </nav>
      </header>
      <main>{children}</main>
      <footer className="border-t bg-secondary">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 text-sm text-muted-foreground sm:grid-cols-3">
          <div><Logo className="text-foreground" /><p className="mt-2">See the damage. Prioritise the repair. A college hackathon prototype.</p></div>
          <div><div className="font-semibold text-foreground">Methodology</div><p className="mt-2">Rule-based anomaly detection and a transparent 0–100 priority score. Weights are prototype assumptions, not municipal standards.</p></div>
          <div>
            <div className="font-semibold text-foreground">Data & Legal Notice</div>
            <p className="mt-2">Sensor data is simulated. Seeded Jaipur locations are demonstration records, not verified defects.</p>
            <div className="mt-2 flex flex-wrap gap-3">
              <Link to="/about" className="underline hover:text-foreground">Methodology</Link>
              <Link to="/terms" className="underline hover:text-foreground">Terms</Link>
              <Link to="/privacy" className="underline hover:text-foreground">Privacy</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function SideNav({ onNav }: { onNav?: () => void }) {
  return (
    <nav className="flex flex-col gap-1" aria-label="Operations">
      {NAV.map((n) => (
        <Link key={n.to} to={n.to} onClick={onNav}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/80 transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          activeProps={{ className: "bg-sidebar-accent !text-sidebar-primary font-semibold" }}>
          <n.icon className="size-4" /> {n.label}
        </Link>
      ))}
      <div className="my-3 border-t border-sidebar-border" />
      <Link to="/report" onClick={onNav} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent"><FileWarning className="size-4" /> Citizen report</Link>
      <Link to="/track" onClick={onNav} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent"><Search className="size-4" /> Track report</Link>
      <Link to="/about" onClick={onNav} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent"><Info className="size-4" /> Methodology</Link>
    </nav>
  );
}

export function OpsShell({ title, crumb, children, actions }: { title: string; crumb?: ReactNode; children: ReactNode; actions?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const db = useDB();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const alerts = useMemo(() => {
    if (!db) return [];
    return db.defects
      .filter((d) => d.status !== "Resolved")
      .map((d) => ({ d, p: scoreDefect(d, db.weights) }))
      .filter((x) => x.p.band === "Critical")
      .sort((a, b) => b.d.createdAt.localeCompare(a.d.createdAt))
      .slice(0, 6);
  }, [db]);

  return (
    <div className="ops min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-sidebar-border bg-sidebar p-4 lg:flex">
        <Link to="/" className="mb-6 text-sidebar-foreground"><Logo /></Link>
        <SideNav />
        <div className="mt-auto rounded-lg border border-sidebar-border p-3 text-xs text-sidebar-foreground/70">
          <div className="flex items-center gap-2 font-semibold text-sidebar-foreground"><Activity className="size-3.5 text-sidebar-primary" /> Full-stack Demo</div>
          Open access, backed by persistent SQLite backend.
        </div>
      </aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <button aria-label="Close menu" className="absolute inset-0 bg-background/70" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-sidebar p-4">
            <div className="mb-6 flex items-center justify-between text-sidebar-foreground"><Logo /><button aria-label="Close menu" onClick={() => setOpen(false)}><X className="size-5" /></button></div>
            <SideNav onNav={() => setOpen(false)} />
          </aside>
        </div>
      )}
      <div className="lg:pl-60">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b bg-background/90 px-4 py-3 backdrop-blur sm:px-6">
          <button className="lg:hidden" aria-label="Open menu" onClick={() => setOpen(true)}><Menu className="size-5" /></button>
          <div className="min-w-0 flex-1">
            <div className="text-xs text-muted-foreground"><Link to="/dashboard" className="hover:underline">Operations</Link> / {crumb ?? path.slice(1)}</div>
            <h1 className="truncate text-xl font-bold">{title}</h1>
          </div>
          {actions}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={`Notifications, ${alerts.length} critical`} className="relative">
                <Bell className="size-5" />
                {alerts.length > 0 && <span className="absolute right-1 top-1 size-2 rounded-full bg-critical" />}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="ops w-80">
              <div className="mb-2 text-sm font-semibold">Critical hazards</div>
              {alerts.length === 0 ? <p className="text-sm text-muted-foreground">No open critical hazards.</p> : (
                <ul className="space-y-2">
                  {alerts.map(({ d, p }) => (
                    <li key={d.id}><Link to="/defects/$id" params={{ id: d.id }} className="block rounded-md p-2 text-sm hover:bg-muted">
                      <span className="font-mono text-xs text-critical">{d.id} · {p.score}</span><br />{d.road} — {fmt(d.createdAt)}
                    </Link></li>
                  ))}
                </ul>
              )}
            </PopoverContent>
          </Popover>
          <ResetButton />
        </header>
        <main className="space-y-6 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}

export function ResetButton() {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5"><RotateCcw className="size-4" /><span className="hidden sm:inline">Reset demo</span></Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="ops">
        <AlertDialogHeader>
          <AlertDialogTitle>Reset demonstration data?</AlertDialogTitle>
          <AlertDialogDescription>All citizen reports, assignments, status changes and simulated events created during the demo will be removed and the original sample records restored. Priority weights are kept.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={() => { try { resetDemo(); toast.success("Demo data restored"); } catch { toast.error("Reset failed"); } }}>Reset</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export const _cn = cn;
