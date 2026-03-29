"use client";
import { useEffect, useState, useCallback } from "react";
import { io as socketIO } from "socket.io-client";
import Navbar from "../../components/Navbar";
import StatCard from "../../components/StatCard";
import { violationsAPI, type Violation, type Summary, VIOLATION_TYPES } from "../../lib/api";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000";

const SEVERITY_STYLE: Record<string, string> = {
  Critical: "badge-critical",
  High: "badge-high",
  Medium: "badge-medium",
  Low: "badge-low",
};

const STATUS_STYLE: Record<string, string> = {
  Pending: "badge-pending",
  Paid: "badge-paid",
  Disputed: "badge-disputed",
  Cancelled: "badge-cancelled",
};

export default function DashboardPage() {
  const [violations, setViolations] = useState<Violation[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [liveEvents, setLiveEvents] = useState<string[]>([]);

  // Form state for adding violation
  const [form, setForm] = useState({
    vehicleNumber: "",
    violationType: "No Helmet",
    locationName: "FC Road",
    lat: "18.5204",
    lng: "73.8567",
    confidenceScore: "95",
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [vsRes, summaryRes] = await Promise.all([
        violationsAPI.getAll({ limit: 100, sortBy: "time", sortOrder: "desc" }),
        violationsAPI.getSummary(),
      ]);
      setViolations(vsRes.data.data);
      setSummary(summaryRes.data.data);
      setError(null);
    } catch (err) {
      setError("Cannot connect to backend. Make sure the server is running on port 5000.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    // Real-time socket updates
    const socket = socketIO(SOCKET_URL, { transports: ["websocket", "polling"] });
    socket.on("connect", () => socket.emit("subscribe_violations"));
    socket.on("new_violation", (data) => {
      setViolations((prev) => [data.violation, ...prev]);
      setSummary((prev) => prev ? { ...prev, total: prev.total + 1 } : prev);
      setLiveEvents((prev) => [`🚨 ${data.message}`, ...prev].slice(0, 5));
    });
    return () => { socket.disconnect(); };
  }, [fetchData]);

  const handleSubmit = async () => {
    if (!form.vehicleNumber.trim()) return alert("Vehicle number is required");
    setSubmitting(true);
    try {
      await violationsAPI.create({
        vehicleNumber: form.vehicleNumber.toUpperCase(),
        violationType: form.violationType,
        location: {
          name: form.locationName,
          coordinates: { lat: parseFloat(form.lat), lng: parseFloat(form.lng) },
          zone: "Medium Risk",
        },
        time: new Date().toISOString(),
        confidenceScore: parseInt(form.confidenceScore),
      });
      setShowAddModal(false);
      setForm({ vehicleNumber: "", violationType: "No Helmet", locationName: "FC Road", lat: "18.5204", lng: "73.8567", confidenceScore: "95" });
      fetchData();
    } catch {
      alert("Failed to add violation. Check console.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (t: string) => {
    const d = new Date(t);
    return d.toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="min-h-screen grid-bg" style={{ paddingTop: 64 }}>
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-1" style={{ color: "var(--text-primary)", fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.04em" }}>
              COMMAND DASHBOARD
            </h1>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Real-time traffic violation monitoring · {violations.length} records loaded
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={fetchData} className="btn-secondary text-xs px-4 py-2">⟳ Refresh</button>
            <button onClick={() => setShowAddModal(true)} className="btn-primary text-xs px-4 py-2">+ Log Violation</button>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-6 p-4 rounded-xl text-sm" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171" }}>
            ⚠️ {error}
          </div>
        )}

        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <StatCard icon="⚡" title="Total" value={summary?.total ?? "—"} color="amber" />
          <StatCard icon="🕐" title="Today" value={summary?.todayCount ?? "—"} color="amber" />
          <StatCard icon="⏳" title="Pending" value={summary?.pending ?? "—"} color="red" />
          <StatCard icon="✅" title="Paid" value={summary?.paid ?? "—"} color="green" />
          <StatCard icon="🔴" title="Critical" value={summary?.critical ?? "—"} color="red" />
          <StatCard icon="💰" title="Fines" value={summary ? `₹${(summary.totalFines / 100000).toFixed(1)}L` : "—"} color="green" />
        </div>

        {/* Live events strip */}
        {liveEvents.length > 0 && (
          <div className="mb-6 card p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="pulse-dot" style={{ width: 6, height: 6 }} />
              <span className="text-xs font-mono uppercase" style={{ color: "#22c55e" }}>Live Events</span>
            </div>
            {liveEvents.map((e, i) => (
              <div key={i} className="text-xs font-mono py-1" style={{ color: i === 0 ? "#f59e0b" : "var(--text-muted)" }}>{e}</div>
            ))}
          </div>
        )}

        {/* Violations Table */}
        <div className="card">
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--bg-card-border)" }}>
            <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Recent Violations</span>
            <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>{violations.length} records</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-sm font-mono animate-pulse" style={{ color: "var(--text-muted)" }}>Loading violations...</div>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Vehicle</th>
                    <th>Violation</th>
                    <th>Location</th>
                    <th>Time</th>
                    <th>Severity</th>
                    <th>Status</th>
                    <th>Fine</th>
                    <th>Confidence</th>
                    <th>Flag</th>
                  </tr>
                </thead>
                <tbody>
                  {violations.length === 0 ? (
                    <tr><td colSpan={10} className="text-center py-12" style={{ color: "var(--text-muted)" }}>No violations found. Add some or seed the database.</td></tr>
                  ) : (
                    violations.slice(0, 50).map((v, i) => (
                      <tr key={v._id}>
                        <td className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>{String(i + 1).padStart(3, "0")}</td>
                        <td>
                          <span className="font-mono text-xs px-2 py-1 rounded" style={{ background: "rgba(245,158,11,0.08)", color: "#f59e0b" }}>
                            {v.vehicleNumber}
                          </span>
                        </td>
                        <td className="text-xs" style={{ color: "var(--text-primary)" }}>{v.violationType}</td>
                        <td className="text-xs">{v.location?.name}</td>
                        <td className="text-xs font-mono">{formatTime(v.time)}</td>
                        <td><span className={`badge ${SEVERITY_STYLE[v.severity] || "badge-medium"}`}>{v.severity}</span></td>
                        <td><span className={`badge ${STATUS_STYLE[v.status] || "badge-pending"}`}>{v.status}</span></td>
                        <td className="text-xs font-mono" style={{ color: "#4ade80" }}>₹{v.fineAmount?.toLocaleString()}</td>
                        <td>
                          <div className="flex items-center gap-1">
                            <div className="h-1.5 rounded-full overflow-hidden" style={{ width: 50, background: "#1e293b" }}>
                              <div className="h-full rounded-full" style={{ width: `${v.confidenceScore}%`, background: v.confidenceScore > 90 ? "#22c55e" : "#f59e0b" }} />
                            </div>
                            <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>{v.confidenceScore}%</span>
                          </div>
                        </td>
                        <td>{v.isRepeatOffender && <span className="badge badge-critical">REPEAT</span>}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add Violation Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>
          <div className="card p-6 w-full max-w-md animate-fade-up">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)", fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.04em" }}>
                LOG NEW VIOLATION
              </h2>
              <button onClick={() => setShowAddModal(false)} className="text-lg" style={{ color: "var(--text-muted)" }}>✕</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-mono mb-1 block" style={{ color: "var(--text-muted)" }}>Vehicle Number *</label>
                <input className="cyber-input" placeholder="e.g. MH12AB1234" value={form.vehicleNumber}
                  onChange={e => setForm(f => ({ ...f, vehicleNumber: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-mono mb-1 block" style={{ color: "var(--text-muted)" }}>Violation Type</label>
                <select className="cyber-input" value={form.violationType}
                  onChange={e => setForm(f => ({ ...f, violationType: e.target.value }))}>
                  {VIOLATION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-mono mb-1 block" style={{ color: "var(--text-muted)" }}>Location Name</label>
                <input className="cyber-input" placeholder="e.g. FC Road" value={form.locationName}
                  onChange={e => setForm(f => ({ ...f, locationName: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-mono mb-1 block" style={{ color: "var(--text-muted)" }}>Latitude</label>
                  <input className="cyber-input" type="number" value={form.lat}
                    onChange={e => setForm(f => ({ ...f, lat: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-mono mb-1 block" style={{ color: "var(--text-muted)" }}>Longitude</label>
                  <input className="cyber-input" type="number" value={form.lng}
                    onChange={e => setForm(f => ({ ...f, lng: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="text-xs font-mono mb-1 block" style={{ color: "var(--text-muted)" }}>Confidence Score (%)</label>
                <input className="cyber-input" type="number" min="0" max="100" value={form.confidenceScore}
                  onChange={e => setForm(f => ({ ...f, confidenceScore: e.target.value }))} />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowAddModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={handleSubmit} disabled={submitting} className="btn-primary flex-1">
                  {submitting ? "Saving..." : "Log Violation"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
