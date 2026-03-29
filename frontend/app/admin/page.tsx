"use client";
import { useEffect, useState, useCallback } from "react";
import Navbar from "../../components/Navbar";
import { violationsAPI, type Violation, VIOLATION_TYPES } from "../../lib/api";

const PUNE_LOCATIONS = [
  "FC Road","JM Road","Karve Road","Tilak Road","Kothrud","Baner Road",
  "Hadapsar","Viman Nagar","Hinjewadi","Shivajinagar","Deccan Gymkhana",
  "Camp Area","Pune Railway Station","Wakad","Magarpatta",
];

const STATUS_OPTS = ["Pending","Paid","Disputed","Cancelled"];
const SEVERITY_OPTS = ["Low","Medium","High","Critical"];

export default function AdminPage() {
  const [violations, setViolations] = useState<Violation[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const LIMIT = 20;

  // Filters
  const [filters, setFilters] = useState({
    vehicleNumber: "",
    violationType: "",
    location: "",
    status: "",
    severity: "",
  });

  // Edit modal
  const [editing, setEditing] = useState<Violation | null>(null);
  const [editStatus, setEditStatus] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchViolations = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = {
        page,
        limit: LIMIT,
        sortBy: "time",
        sortOrder: "desc",
      };
      if (filters.vehicleNumber) params.vehicleNumber = filters.vehicleNumber;
      if (filters.violationType) params.violationType = filters.violationType;
      if (filters.location) params.location = filters.location;
      if (filters.status) params.status = filters.status;
      if (filters.severity) params.severity = filters.severity;

      const res = await violationsAPI.getAll(params);
      setViolations(res.data.data);
      setTotal(res.data.pagination.total);
    } catch (err) {
      console.error("Failed to fetch violations:", err);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => { fetchViolations(); }, [fetchViolations]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(f => ({ ...f, [key]: value }));
    setPage(1);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this violation? This cannot be undone.")) return;
    setDeleting(id);
    try {
      await violationsAPI.delete(id);
      fetchViolations();
    } catch { alert("Failed to delete."); }
    finally { setDeleting(null); }
  };

  const handleStatusUpdate = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await violationsAPI.update(editing._id, { status: editStatus });
      setEditing(null);
      fetchViolations();
    } catch { alert("Failed to update status."); }
    finally { setSaving(false); }
  };

  const clearFilters = () => {
    setFilters({ vehicleNumber: "", violationType: "", location: "", status: "", severity: "" });
    setPage(1);
  };

  const totalPages = Math.ceil(total / LIMIT);

  const formatTime = (t: string) =>
    new Date(t).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  const SEVERITY_STYLE: Record<string, string> = { Critical: "badge-critical", High: "badge-high", Medium: "badge-medium", Low: "badge-low" };
  const STATUS_STYLE: Record<string, string> = { Pending: "badge-pending", Paid: "badge-paid", Disputed: "badge-disputed", Cancelled: "badge-cancelled" };

  return (
    <div className="min-h-screen grid-bg" style={{ paddingTop: 64 }}>
      <Navbar />
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-1" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.04em", color: "var(--text-primary)" }}>
              ADMIN PANEL
            </h1>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Manage violations · {total} total records
            </p>
          </div>
          <button onClick={() => fetchViolations()} className="btn-secondary text-xs px-4 py-2">⟳ Refresh</button>
        </div>

        {/* Filter Bar */}
        <div className="card p-4 mb-6">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-36">
              <label className="text-xs font-mono mb-1 block" style={{ color: "var(--text-muted)" }}>Vehicle #</label>
              <input className="cyber-input" placeholder="MH12..." value={filters.vehicleNumber}
                onChange={e => handleFilterChange("vehicleNumber", e.target.value)} />
            </div>
            <div className="flex-1 min-w-36">
              <label className="text-xs font-mono mb-1 block" style={{ color: "var(--text-muted)" }}>Violation Type</label>
              <select className="cyber-input" value={filters.violationType}
                onChange={e => handleFilterChange("violationType", e.target.value)}>
                <option value="">All Types</option>
                {VIOLATION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="flex-1 min-w-36">
              <label className="text-xs font-mono mb-1 block" style={{ color: "var(--text-muted)" }}>Location</label>
              <select className="cyber-input" value={filters.location}
                onChange={e => handleFilterChange("location", e.target.value)}>
                <option value="">All Locations</option>
                {PUNE_LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div className="flex-1 min-w-28">
              <label className="text-xs font-mono mb-1 block" style={{ color: "var(--text-muted)" }}>Status</label>
              <select className="cyber-input" value={filters.status}
                onChange={e => handleFilterChange("status", e.target.value)}>
                <option value="">All Statuses</option>
                {STATUS_OPTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex-1 min-w-28">
              <label className="text-xs font-mono mb-1 block" style={{ color: "var(--text-muted)" }}>Severity</label>
              <select className="cyber-input" value={filters.severity}
                onChange={e => handleFilterChange("severity", e.target.value)}>
                <option value="">All Severities</option>
                {SEVERITY_OPTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <button onClick={clearFilters} className="btn-secondary text-xs px-4 py-2 whitespace-nowrap">✕ Clear</button>
          </div>
        </div>

        {/* Table */}
        <div className="card mb-4">
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--bg-card-border)" }}>
            <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Violations</span>
            <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
              Page {page} of {totalPages} · {total} total
            </span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-sm font-mono animate-pulse" style={{ color: "var(--text-muted)" }}>Fetching violations...</div>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Vehicle</th>
                    <th>Violation</th>
                    <th>Location</th>
                    <th>Time</th>
                    <th>Severity</th>
                    <th>Status</th>
                    <th>Fine (₹)</th>
                    <th>Camera</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {violations.length === 0 ? (
                    <tr><td colSpan={9} className="text-center py-10" style={{ color: "var(--text-muted)" }}>No records match the current filters.</td></tr>
                  ) : violations.map(v => (
                    <tr key={v._id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs px-2 py-0.5 rounded" style={{ background: "rgba(245,158,11,0.08)", color: "#f59e0b" }}>{v.vehicleNumber}</span>
                          {v.isRepeatOffender && <span className="badge badge-critical text-xs">REPEAT</span>}
                        </div>
                      </td>
                      <td className="text-xs" style={{ color: "var(--text-primary)" }}>{v.violationType}</td>
                      <td className="text-xs">{v.location?.name}</td>
                      <td className="text-xs font-mono">{formatTime(v.time)}</td>
                      <td><span className={`badge ${SEVERITY_STYLE[v.severity]}`}>{v.severity}</span></td>
                      <td><span className={`badge ${STATUS_STYLE[v.status]}`}>{v.status}</span></td>
                      <td className="text-xs font-mono" style={{ color: "#4ade80" }}>{v.fineAmount?.toLocaleString()}</td>
                      <td className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>{v.cameraId}</td>
                      <td>
                        <div className="flex gap-2">
                          <button onClick={() => { setEditing(v); setEditStatus(v.status); }}
                            className="text-xs px-2 py-1 rounded transition-all"
                            style={{ background: "rgba(59,130,246,0.1)", color: "#60a5fa", border: "1px solid rgba(59,130,246,0.25)" }}>
                            Edit
                          </button>
                          <button onClick={() => handleDelete(v._id)} disabled={deleting === v._id}
                            className="text-xs px-2 py-1 rounded transition-all"
                            style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.25)" }}>
                            {deleting === v._id ? "..." : "Del"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="btn-secondary text-xs px-4 py-2" style={{ opacity: page === 1 ? 0.4 : 1 }}>
            ← Prev
          </button>
          <div className="flex gap-2">
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)}
                className="w-8 h-8 rounded text-xs font-mono transition-all"
                style={{ background: page === p ? "rgba(245,158,11,0.15)" : "transparent",
                  color: page === p ? "#f59e0b" : "var(--text-muted)",
                  border: page === p ? "1px solid rgba(245,158,11,0.3)" : "1px solid transparent" }}>
                {p}
              </button>
            ))}
          </div>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="btn-secondary text-xs px-4 py-2" style={{ opacity: page === totalPages ? 0.4 : 1 }}>
            Next →
          </button>
        </div>
      </div>

      {/* Edit Status Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>
          <div className="card p-6 w-full max-w-sm animate-fade-up">
            <h2 className="text-lg font-bold mb-4" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.04em", color: "var(--text-primary)" }}>
              UPDATE VIOLATION
            </h2>
            <div className="mb-2 text-xs font-mono" style={{ color: "var(--text-muted)" }}>Vehicle: <span style={{ color: "#f59e0b" }}>{editing.vehicleNumber}</span></div>
            <div className="mb-4 text-xs font-mono" style={{ color: "var(--text-muted)" }}>Type: {editing.violationType}</div>
            <div className="mb-4">
              <label className="text-xs font-mono mb-1 block" style={{ color: "var(--text-muted)" }}>New Status</label>
              <select className="cyber-input" value={editStatus} onChange={e => setEditStatus(e.target.value)}>
                {STATUS_OPTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setEditing(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleStatusUpdate} disabled={saving} className="btn-primary flex-1">
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
