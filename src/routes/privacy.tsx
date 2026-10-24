import { createFileRoute } from "@tanstack/react-router";
import { PublicShell } from "@/components/civic/Shells";

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

function Privacy() {
  return (
    <PublicShell>
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-12">
        <h1 className="text-3xl font-bold">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {/* TODO: Replace with actual privacy policy content */}
          This privacy policy explains how CIVICLENS collects, uses, and protects your data. [...] 
        </p>
      </div>
    </PublicShell>
  );
}
