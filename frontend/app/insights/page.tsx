"use client";
import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import { insightsAPI, violationsAPI } from "../../lib/api";

interface Insight {
  id: string;
  type: string;
  icon: string;
  title: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low";
  count: number;
  recommendation: string;
}

interface Offender {
  _id: string;
  count: number;
  violations: any[];
}

const SEVERITY_STYLE: Record<string, { border: string; bg: string; text: string; dot: string }> = {
  critical: { border: "rgba(239,68,68,0.3)", bg: "rgba(239,68,68,0.06)", text: "#f87171", dot: "#ef4444" },
  high:     { border: "rgba(245,158,11,0.3)", bg: "rgba(245,158,11,0.06)", text: "#fbbf24", dot: "#f59e0b" },
  medium:   { border: "rgba(59,130,246,0.3)", bg: "rgba(59,130,246,0.06)", text: "#60a5fa", dot: "#3b82f6" },
  low:      { border: "rgba(34,197,94,0.3)", bg: "rgba(34,197,94,0.06)", text: "#4ade80", dot: "#22c55e" },
};

export default function InsightsPage() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [offenders, setOffenders] = useState<Offender[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"insights" | "offenders">("insights");

  useEffect(() => {
    Promise.all([
      insightsAPI.getAll(),
      violationsAPI.getRepeatOffenders(2),
    ]).then(([ins, off]) => {
      setInsights(ins.data.data);
      setSummary(ins.data.summary);
      setOffenders(off.data.data);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const VIOLATION_TYPES_SET = (violations: any[]) => {
    const types = new Set(violations.map((v: any) => v.violationType));
    return [...types];
  };

  if (loading) return (
    <div className="min-h-screen grid-bg flex items-center justify-center" style={{ paddingTop: 64 }}>
      <Navbar />
      <div className="text-sm font-mono animate-pulse" style={{ color: "var(--text-muted)" }}>Analyzing patterns...</div>
    </div>
  );

  return (
    <div className="min-h-screen grid-bg" style={{ paddingTop: 64 }}>
      <Navbar />
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl"
              style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)" }}>🤖</div>
            <div>
              <h1 className="text-3xl font-bold" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.04em", color: "var(--text-primary)" }}>
                AI INSIGHTS ENGINE
              </h1>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Intelligent pattern detection and actionable recommendations
              </p>
            </div>
          </div>

          {/* Summary chips */}
          {summary && (
            <div className="flex gap-3 mt-4 flex-wrap">
              <div className="px-3 py-1.5 rounded-lg text-xs font-mono" style={{ background: "rgba(245,158,11,0.08)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.2)" }}>
                {summary.totalInsights} insights generated
              </div>
              <div className="px-3 py-1.5 rounded-lg text-xs font-mono" style={{ background: "rgba(239,68,68,0.08)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)" }}>
                {summary.criticalCount} critical alerts
              </div>
              <div className="px-3 py-1.5 rounded-lg text-xs font-mono"
                style={{ background: summary.trend === "increasing" ? "rgba(239,68,68,0.08)" : "rgba(34,197,94,0.08)",
                  color: summary.trend === "increasing" ? "#f87171" : "#4ade80",
                  border: `1px solid ${summary.trend === "increasing" ? "rgba(239,68,68,0.2)" : "rgba(34,197,94,0.2)"}` }}>
                Trend: {summary.trend === "increasing" ? "▲ Increasing" : "→ Stable"}
              </div>
              <div className="px-3 py-1.5 rounded-lg text-xs font-mono ml-auto" style={{ color: "var(--text-muted)" }}>
                Updated: {new Date(summary.lastUpdated).toLocaleTimeString("en-IN")}
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { key: "insights", label: "🤖 AI Insights" },
            { key: "offenders", label: `🔁 Repeat Offenders (${offenders.length})` },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
              className="text-sm px-5 py-2 rounded-lg font-medium transition-all"
              style={{
                background: activeTab === tab.key ? "rgba(245,158,11,0.12)" : "transparent",
                color: activeTab === tab.key ? "#f59e0b" : "var(--text-secondary)",
                border: activeTab === tab.key ? "1px solid rgba(245,158,11,0.25)" : "1px solid #1e293b",
              }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Insights Tab */}
        {activeTab === "insights" && (
          <div className="space-y-4">
            {insights.length === 0 ? (
              <div className="card p-12 text-center">
                <div className="text-3xl mb-3">🤖</div>
                <div className="text-sm" style={{ color: "var(--text-muted)" }}>No insights yet. Add more violation data for the AI to analyze.</div>
              </div>
            ) : insights.map((insight, i) => {
              const style = SEVERITY_STYLE[insight.severity] || SEVERITY_STYLE.medium;
              return (
                <div key={insight.id} className="card p-6 animate-fade-up" style={{ animationDelay: `${i * 0.08}s`, border: `1px solid ${style.border}`, background: style.bg }}>
                  <div className="flex items-start gap-4">
                    <div className="text-3xl flex-shrink-0">{insight.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold" style={{ color: "var(--text-primary)" }}>{insight.title}</h3>
                        <span className="text-xs font-mono px-2 py-0.5 rounded-full uppercase"
                          style={{ background: `${style.dot}22`, color: style.text, border: `1px solid ${style.dot}44` }}>
                          {insight.severity}
                        </span>
                        <span className="text-xs font-mono ml-auto" style={{ color: "var(--text-muted)" }}>
                          {insight.count} incidents
                        </span>
                      </div>
                      <p className="text-sm mb-3" style={{ color: "var(--text-secondary)" }}>{insight.description}</p>
                      <div className="p-3 rounded-lg text-sm flex items-start gap-2"
                        style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(30,41,59,0.8)" }}>
                        <span>💡</span>
                        <span style={{ color: "var(--text-secondary)" }}><strong style={{ color: "var(--text-primary)" }}>Recommendation:</strong> {insight.recommendation}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Repeat Offenders Tab */}
        {activeTab === "offenders" && (
          <div>
            {offenders.length === 0 ? (
              <div className="card p-12 text-center">
                <div className="text-3xl mb-3">✅</div>
                <div className="text-sm" style={{ color: "var(--text-muted)" }}>No repeat offenders detected.</div>
              </div>
            ) : (
              <div className="space-y-4">
                {offenders.map((o, i) => {
                  const types = VIOLATION_TYPES_SET(o.violations);
                  const latestTime = o.violations.sort((a: any, b: any) => new Date(b.time).getTime() - new Date(a.time).getTime())[0]?.time;
                  const totalFine = o.violations.reduce((sum: number, v: any) => sum + (v.fineAmount || 0), 0);
                  const hasCritical = o.violations.some((v: any) => v.severity === "Critical");
                  return (
                    <div key={o._id} className="card p-5 animate-fade-up" style={{ animationDelay: `${i * 0.06}s`, borderColor: o.count >= 5 ? "rgba(239,68,68,0.3)" : "rgba(245,158,11,0.2)" }}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm"
                            style={{ background: o.count >= 5 ? "rgba(239,68,68,0.15)" : "rgba(245,158,11,0.1)",
                              color: o.count >= 5 ? "#f87171" : "#f59e0b",
                              border: `1px solid ${o.count >= 5 ? "rgba(239,68,68,0.3)" : "rgba(245,158,11,0.2)"}`,
                              fontFamily: "Bebas Neue, sans-serif", fontSize: 18 }}>
                            #{i + 1}
                          </div>
                          <div>
                            <div className="font-mono font-bold" style={{ color: "#f59e0b", fontSize: 18 }}>{o._id}</div>
                            <div className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                              Last seen: {latestTime ? new Date(latestTime).toLocaleDateString("en-IN") : "N/A"}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-3 text-center">
                          <div>
                            <div className="stat-number text-3xl" style={{ color: o.count >= 5 ? "#ef4444" : "#f59e0b" }}>{o.count}</div>
                            <div className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>Violations</div>
                          </div>
                          <div>
                            <div className="stat-number text-3xl" style={{ color: "#4ade80" }}>₹{(totalFine / 1000).toFixed(0)}K</div>
                            <div className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>Total Fine</div>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {types.map((t: string) => (
                          <span key={t} className="text-xs font-mono px-2 py-1 rounded"
                            style={{ background: "rgba(15,23,42,0.8)", color: "var(--text-secondary)", border: "1px solid #1e293b" }}>
                            {t}
                          </span>
                        ))}
                        {hasCritical && <span className="badge badge-critical">CRITICAL OFFENDER</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
