"use client";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: string;
  color?: "amber" | "red" | "green" | "blue";
  trend?: number; // % change
}

const COLOR_MAP = {
  amber: { bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)", text: "#f59e0b" },
  red:   { bg: "rgba(239,68,68,0.08)",  border: "rgba(239,68,68,0.2)",  text: "#f87171" },
  green: { bg: "rgba(34,197,94,0.08)",  border: "rgba(34,197,94,0.2)",  text: "#4ade80" },
  blue:  { bg: "rgba(59,130,246,0.08)", border: "rgba(59,130,246,0.2)", text: "#60a5fa" },
};

export default function StatCard({ title, value, subtitle, icon, color = "amber", trend }: StatCardProps) {
  const c = COLOR_MAP[color];
  return (
    <div className="card p-5 animate-fade-up">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
          style={{ background: c.bg, border: `1px solid ${c.border}` }}>
          {icon}
        </div>
        {trend !== undefined && (
          <span className="text-xs font-mono px-2 py-1 rounded-full"
            style={{ background: trend >= 0 ? "rgba(239,68,68,0.1)" : "rgba(34,197,94,0.1)",
              color: trend >= 0 ? "#f87171" : "#4ade80" }}>
            {trend >= 0 ? "▲" : "▼"} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className="stat-number text-4xl mb-1" style={{ color: c.text }}>{value}</div>
      <div className="text-sm font-medium mb-0.5" style={{ color: "var(--text-primary)" }}>{title}</div>
      {subtitle && <div className="text-xs" style={{ color: "var(--text-muted)" }}>{subtitle}</div>}
    </div>
  );
}
