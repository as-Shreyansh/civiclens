import { describe, expect, it } from "vitest";
import { bandFor, scoreDefect } from "./priority";
import { analyseReading } from "./anomaly";
import { canTransition } from "./types";

describe("priority bands", () => {
  it("80+ is Critical", () => expect(bandFor(80)).toBe("Critical"));
  it("60–79 is High", () => { expect(bandFor(60)).toBe("High"); expect(bandFor(79)).toBe("High"); });
  it("35–59 is Medium", () => { expect(bandFor(35)).toBe("Medium"); expect(bandFor(59)).toBe("Medium"); });
  it("0–34 is Low", () => expect(bandFor(34)).toBe("Low"));
});

describe("priority score", () => {
  const now = Date.parse("2026-01-31T00:00:00Z");
  it("maxes at 100 for worst case with 40/30/20/10 weights", () => {
    const r = scoreDefect({ severity: 5, category: "pothole", sensorScore: 1, reportCount: 5, createdAt: "2025-12-01T00:00:00Z" }, undefined, now);
    expect(r.score).toBe(100);
  });
  it("weights severity at 40%", () => {
    const r = scoreDefect({ severity: 5, category: "other", reportCount: 1, createdAt: "2026-01-31T00:00:00Z" }, undefined, now);
    expect(r.factors.find((f) => f.key === "severity")?.contribution).toBe(40);
  });
  it("handles malformed data without NaN", () => {
    const r = scoreDefect({ severity: NaN, category: "bogus" as never, createdAt: "nope" }, undefined, now);
    expect(Number.isFinite(r.score)).toBe(true);
  });
});

describe("anomaly rules", () => {
  it("flags vibration ≥ 1.5", () => expect(analyseReading(1.5, 20, 0.1).flagged).toBe(true));
  it("flags surface ≥ 0.65", () => expect(analyseReading(0.5, 20, 0.65).flagged).toBe(true));
  it("does not flag below thresholds", () => expect(analyseReading(1.49, 60, 0.64).flagged).toBe(false));
  it("higher speed raises severity", () =>
    expect(analyseReading(1.8, 60, 0.3).severity).toBeGreaterThan(analyseReading(1.8, 20, 0.3).severity));
});

describe("status workflow", () => {
  it("Reported → Under Inspection allowed", () => expect(canTransition("Reported", "Under Inspection")).toBe(true));
  it("Reported → Resolved blocked", () => expect(canTransition("Reported", "Resolved")).toBe(false));
  it("Resolved is final", () => expect(canTransition("Resolved", "Reported")).toBe(false));
});
