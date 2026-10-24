import { useEffect } from "react";
import { simulateOne, useDB } from "@/lib/store";

/** Generates one simulated sensor event every 6s while the feed is running. */
export function SimRunner() {
  const db = useDB();
  const running = db?.simRunning ?? false;
  useEffect(() => {
    if (!running) return;
    const t = window.setInterval(() => simulateOne(), 6000);
    return () => window.clearInterval(t);
  }, [running]);
  return null;
}
