import { createFileRoute } from "@tanstack/react-router";
import { PublicShell } from "@/components/civic/Shells";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms and Conditions — CIVICLENS" },
      { name: "description", content: "Terms and conditions for using CIVICLENS platform." },
      { property: "og:title", content: "Terms and Conditions — CIVICLENS" },
      { property: "og:description", content: "Legal terms governing use of the service." },
    ],
  }),
  component: Terms,
});

function Terms() {
  return (
    <PublicShell>
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-12">
        <h1 className="text-3xl font-bold">Terms and Conditions</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {/* TODO: Replace with actual terms content */}
          By using CIVICLENS you agree to the following terms and conditions. [...] 
        </p>
      </div>
    </PublicShell>
  );
}
