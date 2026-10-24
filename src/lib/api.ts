import type { Category, Defect, Status, Urgency, Weights } from "./types";
import type { DB, NewReport } from "./store";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

export async function fetchFullDB(): Promise<DB | null> {
  try {
    const res = await fetch(`${API_BASE}/db`);
    if (!res.ok) return null;
    return (await res.json()) as DB;
  } catch {
    return null;
  }
}

export async function apiSubmitReport(report: NewReport & { id?: string }): Promise<Defect | null> {
  try {
    const res = await fetch(`${API_BASE}/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(report),
    });
    if (!res.ok) return null;
    return (await res.json()) as Defect;
  } catch {
    return null;
  }
}

export async function apiUpdateStatus(defectId: string, status: Status, note: string): Promise<Defect | null> {
  try {
    const res = await fetch(`${API_BASE}/defects/${defectId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, note }),
    });
    if (!res.ok) return null;
    return (await res.json()) as Defect;
  } catch {
    return null;
  }
}

export async function apiDeleteDefect(defectId: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/defects/${defectId}`, {
      method: "DELETE",
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function apiAssignTeam(defectId: string, teamId: string, urgency: Urgency, notes: string): Promise<Defect | null> {
  try {
    const res = await fetch(`${API_BASE}/defects/${defectId}/assign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamId, urgency, notes }),
    });
    if (!res.ok) return null;
    return (await res.json()) as Defect;
  } catch {
    return null;
  }
}

export async function apiSaveTeam(team: { id?: string; name: string; zone: string; capacity: number; lead: string }): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/teams`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(team),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function apiSetWeights(weights: Weights): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/weights`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(weights),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function apiSetSimRunning(simRunning: boolean): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/sim/toggle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ simRunning }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function apiClearSimEvents(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/sim/clear`, {
      method: "POST",
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function apiResetDemo(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/demo/reset`, {
      method: "POST",
    });
    return res.ok;
  } catch {
    return false;
  }
}
