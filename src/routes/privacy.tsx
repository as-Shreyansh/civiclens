import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicShell } from "@/components/civic/Shells";
import { 
  ShieldCheck, 
  Lock, 
  MapPin, 
  Camera, 
  Share2, 
  Database, 
  UserX, 
  RefreshCw 
} from "lucide-react";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — CIVICLENS" },
      { name: "description", content: "Privacy policy for the CIVICLENS platform." },
      { property: "og:title", content: "Privacy Policy — CIVICLENS" },
      { property: "og:description", content: "How we handle user data and privacy." },
    ],
  }),
  component: Privacy,
});

const PRIVACY_SECTIONS = [
  {
    icon: Database,
    title: "1. Information We Collect",
    content:
      "We collect data submitted during civic defect reporting, including issue categories, descriptions, defect photographs, and optional contact details (such as email or phone) if provided for ticket tracking updates. For telemetry-enabled runs, vibration metrics and speed readings are recorded.",
  },
  {
    icon: MapPin,
    title: "2. Geolocation & Location Tracking",
    content:
      "To accurately map road defects and dispatch maintenance teams, CIVICLENS collects precise GPS coordinates when a report is lodged or when route scanning is activated. Location data is tied directly to defect locations on our public map.",
  },
  {
    icon: RefreshCw,
    title: "3. How Information Is Used",
    content:
      "Collected information is utilized to calculate hazard priority scores, identify repeat cluster zones, generate municipal dispatch work orders, update public progress tracking, and refine automated defect detection models.",
  },
  {
    icon: Share2,
    title: "4. Information Sharing & Public Transparency",
    content:
      "CIVICLENS operates under a civic transparency model. Road defect locations, repair statuses, and anonymized damage reports are visible on public dashboards. Personal contact details are kept confidential and shared only with authorized public works departments when necessary to verify report specifics.",
  },
  {
    icon: Camera,
    title: "5. Media & Photographic Privacy",
    content:
      "Users should ensure photos focus strictly on the physical road surface defect. We discourage including recognizable faces, private property interiors, or vehicle license plates. Any inadvertent personal identifiers may be blurred or removed during processing.",
  },
  {
    icon: Lock,
    title: "6. Data Security & Retention",
    content:
      "Data is retained in our persistent database to track municipal repair lifecycles and infrastructure degradation trends. We implement encryption in transit, strict access controls, and regular database maintenance to protect user records against unauthorized access.",
  },
  {
    icon: UserX,
    title: "7. No Commercial Sale of Data",
    content:
      "CIVICLENS does not sell, lease, or monetize personal user data, location histories, or contact information with third-party advertisers or commercial brokers.",
  },
  {
    icon: ShieldCheck,
    title: "8. User Rights & Data Redaction",
    content:
      "You have the right to request access to, correction of, or removal of reports and personal details you have submitted. To request data redaction or report resolution changes, citizens can reference their unique report tracking ID.",
  },
];

function Privacy() {
  return (
    <PublicShell>
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-12">
        <div className="space-y-2 border-b pb-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            CIVICLENS Privacy
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Learn how CIVICLENS collects, safeguards, and utilizes civic road reports and telemetry data.
          </p>
          <p className="text-xs text-muted-foreground">Last updated: October 2026 • Committed to public transparency & data integrity</p>
        </div>

        <div className="grid gap-4">
          {PRIVACY_SECTIONS.map((section) => {
            const Icon = section.icon;
            return (
              <section key={section.title} className="panel p-5 transition-shadow hover:shadow-md">
                <div className="flex items-start gap-4">
                  <div className="rounded-lg bg-primary/10 p-2 text-primary shrink-0">
                    <Icon className="size-5" />
                  </div>
                  <div className="space-y-1.5">
                    <h2 className="text-base font-bold sm:text-lg">{section.title}</h2>
                    <p className="text-sm leading-relaxed text-muted-foreground">{section.content}</p>
                  </div>
                </div>
              </section>
            );
          })}
        </div>

        <div className="panel p-6 bg-muted/40 text-center space-y-3">
          <h3 className="font-semibold text-foreground">Need Assistance or Data Removal?</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            For privacy inquiries or to request modification of a report, please use our{" "}
            <Link to="/track" className="underline hover:text-foreground">
              Report Tracker
            </Link>{" "}
            or review our{" "}
            <Link to="/terms" className="underline hover:text-foreground">
              Terms & Conditions
            </Link>
            .
          </p>
        </div>
      </div>
    </PublicShell>
  );
}
