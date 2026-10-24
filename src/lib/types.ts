export type Category = "pothole" | "uneven_surface" | "road_crack" | "waterlogging" | "other";
export type Status = "Reported" | "Under Inspection" | "Repair Scheduled" | "Resolved";
export type Source = "citizen_report" | "sensor_simulated" | "demo_seed";
export type Urgency = "Low" | "Normal" | "High" | "Emergency";

export const CATEGORIES: { value: Category; label: string }[] = [
  { value: "pothole", label: "Pothole" },
  { value: "uneven_surface", label: "Uneven surface" },
  { value: "road_crack", label: "Road crack" },
  { value: "waterlogging", label: "Waterlogging" },
  { value: "other", label: "Other" },
];
export const STATUSES: Status[] = ["Reported", "Under Inspection", "Repair Scheduled", "Resolved"];
export const URGENCIES: Urgency[] = ["Low", "Normal", "High", "Emergency"];
export const catLabel = (c: Category) => CATEGORIES.find((x) => x.value === c)?.label ?? c;

export interface Defect {
  id: string;
  road: string;
  location: string;
  lat: number;
  lng: number;
  category: Category;
  severity: number;
  description: string;
  photo?: string;
  source: Source;
  createdAt: string;
  status: Status;
  reportCount: number;
  sensorScore?: number;
  teamId?: string;
  urgency?: Urgency;
}

export interface SensorEvent {
  id: string;
  ts: string;
  lat: number;
  lng: number;
  location: string;
  vibration: number;
  speed: number;
  surface: number;
  flagged: boolean;
  reasons: string[];
  severity: number;
  action: string;
  defectId?: string;
  source: "SIMULATED";
}

export interface Team { id: string; name: string; zone: string; capacity: number; lead: string }
export interface Assignment { id: string; defectId: string; teamId: string; urgency: Urgency; notes: string; createdAt: string; active: boolean }
export interface HistoryEntry { id: string; defectId: string; ts: string; action: string; note: string; status: Status; internal: boolean }

/** Allowed forward transitions; one step at a time. */
export const TRANSITIONS: Record<Status, Status[]> = {
  Reported: ["Under Inspection"],
  "Under Inspection": ["Repair Scheduled", "Resolved"],
  "Repair Scheduled": ["Resolved"],
  Resolved: [],
};
export const canTransition = (from: Status, to: Status) => TRANSITIONS[from].includes(to);
