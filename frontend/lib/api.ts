/**
 * API utility functions for communicating with the backend
 */
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

// ─── Violations ──────────────────────────────────────────────────────────────
export const violationsAPI = {
  getAll: (params?: Record<string, string | number>) =>
    api.get("/api/violations", { params }),

  getById: (id: string) => api.get(`/api/violations/${id}`),

  create: (data: Record<string, unknown>) => api.post("/api/violations", data),

  update: (id: string, data: Record<string, unknown>) =>
    api.put(`/api/violations/${id}`, data),

  delete: (id: string) => api.delete(`/api/violations/${id}`),

  getSummary: () => api.get("/api/violations/stats/summary"),

  getRepeatOffenders: (minCount = 2) =>
    api.get("/api/violations/repeat-offenders", { params: { minCount } }),
};

// ─── Analytics ───────────────────────────────────────────────────────────────
export const analyticsAPI = {
  byType:     () => api.get("/api/analytics/by-type"),
  byHour:     () => api.get("/api/analytics/by-hour"),
  byDay:      () => api.get("/api/analytics/by-day"),
  byLocation: () => api.get("/api/analytics/by-location"),
  bySeverity: () => api.get("/api/analytics/by-severity"),
  byWeekday:  () => api.get("/api/analytics/by-weekday"),
  heatmap:    () => api.get("/api/analytics/heatmap"),
};

// ─── Insights ────────────────────────────────────────────────────────────────
export const insightsAPI = {
  getAll: () => api.get("/api/insights"),
};

// ─── Types ───────────────────────────────────────────────────────────────────
export interface Violation {
  _id: string;
  vehicleNumber: string;
  violationType: string;
  location: {
    name: string;
    coordinates: { lat: number; lng: number };
    zone: string;
  };
  time: string;
  confidenceScore: number;
  fineAmount: number;
  status: "Pending" | "Paid" | "Disputed" | "Cancelled";
  severity: "Low" | "Medium" | "High" | "Critical";
  cameraId: string;
  isRepeatOffender: boolean;
  createdAt: string;
}

export interface Summary {
  total: number;
  pending: number;
  paid: number;
  critical: number;
  totalFines: number;
  todayCount: number;
}

export const VIOLATION_TYPES = [
  "No Helmet",
  "Red Light Violation",
  "Overspeeding",
  "Wrong Lane",
  "No Seatbelt",
  "Triple Riding",
  "Mobile Usage While Driving",
  "Illegal Parking",
  "No Signal",
  "Drunk Driving",
];

export const SEVERITY_COLORS: Record<string, string> = {
  Critical: "#ef4444",
  High:     "#f59e0b",
  Medium:   "#60a5fa",
  Low:      "#4ade80",
};

export const STATUS_COLORS: Record<string, string> = {
  Pending:   "#f59e0b",
  Paid:      "#22c55e",
  Disputed:  "#60a5fa",
  Cancelled: "#94a3b8",
};
