import { lazy, Suspense, useState, type ComponentProps } from "react";
import { ClientOnly } from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";

const DefectMap = lazy(() => import("./DefectMap"));
type Props = ComponentProps<typeof DefectMap>;

export function MapView(props: Props) {
  const [tileErr, setTileErr] = useState(false);
  const h = props.height ?? 480;
  const fallback = <div className="animate-pulse rounded-xl bg-muted" style={{ height: h }} aria-label="Loading map" />;
  return (
    <div className="relative">
      <ClientOnly fallback={fallback}>
        <Suspense fallback={fallback}>
          <DefectMap {...props} onTileError={() => setTileErr(true)} />
        </Suspense>
      </ClientOnly>
      {tileErr && (
        <div className="absolute inset-x-3 top-3 z-[500] flex items-center gap-2 rounded-lg bg-popover p-2 text-xs text-popover-foreground shadow">
          <AlertTriangle className="size-4 text-high" /> Some map tiles failed to load. Check your internet connection; markers still show stored data.
        </div>
      )}
    </div>
  );
}
