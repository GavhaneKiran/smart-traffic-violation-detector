"use client";
import { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, LineElement, PointElement,
  ArcElement, Title, Tooltip, Legend, Filler,
} from "chart.js";
import { Bar, Line, Doughnut } from "react-chartjs-2";
import Navbar from "../../components/Navbar";
import { analyticsAPI } from "../../lib/api";

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler);

// Shared chart defaults
const CHART_DEFAULTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { labels: { color: "#94a3b8", font: { family: "JetBrains Mono", size: 11 }, boxWidth: 12 } },
    tooltip: {
      backgroundColor: "#0f172a",
      borderColor: "#1e293b",
      borderWidth: 1,
      titleColor: "#f1f5f9",
      bodyColor: "#94a3b8",
      titleFont: { family: "JetBrains Mono" },
    },
  },
  scales: {
    x: { ticks: { color: "#475569", font: { family: "JetBrains Mono", size: 10 } }, grid: { color: "rgba(30,41,59,0.5)" } },
    y: { ticks: { color: "#475569", font: { family: "JetBrains Mono", size: 10 } }, grid: { color: "rgba(30,41,59,0.5)" } },
  },
};

const TYPE_COLORS = [
  "#f59e0b","#ef4444","#3b82f6","#22c55e","#a855f7",
  "#06b6d4","#f97316","#ec4899","#84cc16","#6366f1",
];

export default function AnalyticsPage() {
  const [byType, setByType]       = useState<any[]>([]);
  const [byHour, setByHour]       = useState<any[]>([]);
  const [byDay, setByDay]         = useState<any[]>([]);
  const [bySeverity, setBySeverity] = useState<any[]>([]);
  const [byWeekday, setByWeekday] = useState<any[]>([]);
  const [byLocation, setByLocation] = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    Promise.all([
      analyticsAPI.byType(),
      analyticsAPI.byHour(),
      analyticsAPI.byDay(),
      analyticsAPI.bySeverity(),
      analyticsAPI.byWeekday(),
      analyticsAPI.byLocation(),
    ]).then(([t, h, d, s, w, l]) => {
      setByType(t.data.data);
      setByHour(h.data.data);
      setByDay(d.data.data);
      setBySeverity(s.data.data);
      setByWeekday(w.data.data);
      setByLocation(l.data.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  // Chart data configs
  const typeChartData = {
    labels: byType.map(d => d._id),
    datasets: [{
      label: "Violations",
      data: byType.map(d => d.count),
      backgroundColor: TYPE_COLORS.map(c => c + "33"),
      borderColor: TYPE_COLORS,
      borderWidth: 2,
      borderRadius: 6,
    }],
  };

  const hourChartData = {
    labels: byHour.map(d => d.label),
    datasets: [{
      label: "Violations per Hour",
      data: byHour.map(d => d.count),
      borderColor: "#f59e0b",
      backgroundColor: "rgba(245,158,11,0.08)",
      borderWidth: 2,
      fill: true,
      tension: 0.4,
      pointBackgroundColor: "#f59e0b",
      pointRadius: 3,
    }],
  };

  const dayChartData = {
    labels: byDay.map(d => d.date?.slice(5)),
    datasets: [
      {
        label: "Violations",
        data: byDay.map(d => d.count),
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59,130,246,0.08)",
        borderWidth: 2,
        fill: true,
        tension: 0.4,
      },
      {
        label: "Fines (₹00s)",
        data: byDay.map(d => Math.round(d.fines / 100)),
        borderColor: "#22c55e",
        backgroundColor: "rgba(34,197,94,0.05)",
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        yAxisID: "y1",
      },
    ],
  };

  const dayChartOptions = {
    ...CHART_DEFAULTS,
    scales: {
      ...CHART_DEFAULTS.scales,
      y1: { position: "right" as const, ticks: { color: "#475569", font: { family: "JetBrains Mono", size: 10 } }, grid: { drawOnChartArea: false } },
    },
  };

  const severityChartData = {
    labels: bySeverity.map(d => d._id),
    datasets: [{
      data: bySeverity.map(d => d.count),
      backgroundColor: ["rgba(239,68,68,0.7)","rgba(245,158,11,0.7)","rgba(59,130,246,0.7)","rgba(34,197,94,0.7)"],
      borderColor: ["#ef4444","#f59e0b","#3b82f6","#22c55e"],
      borderWidth: 2,
    }],
  };

  const weekdayChartData = {
    labels: byWeekday.map(d => d.day.slice(0, 3)),
    datasets: [{
      label: "Violations",
      data: byWeekday.map(d => d.count),
      backgroundColor: "rgba(168,85,247,0.2)",
      borderColor: "#a855f7",
      borderWidth: 2,
      borderRadius: 6,
    }],
  };

  const locationChartData = {
    labels: byLocation.slice(0, 8).map(d => d._id),
    datasets: [{
      label: "Violations",
      data: byLocation.slice(0, 8).map(d => d.count),
      backgroundColor: "rgba(245,158,11,0.15)",
      borderColor: "#f59e0b",
      borderWidth: 2,
      borderRadius: 6,
    }],
  };

  const locationOptions = {
    ...CHART_DEFAULTS,
    indexAxis: "y" as const,
  };

  if (loading) return (
    <div className="min-h-screen grid-bg flex items-center justify-center" style={{ paddingTop: 64 }}>
      <Navbar />
      <div className="text-sm font-mono animate-pulse" style={{ color: "var(--text-muted)" }}>Loading analytics data...</div>
    </div>
  );

  return (
    <div className="min-h-screen grid-bg" style={{ paddingTop: 64 }}>
      <Navbar />
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.04em", color: "var(--text-primary)" }}>
            VIOLATION ANALYTICS
          </h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Pattern analysis across time, location, and violation type
          </p>
        </div>

        {/* Row 1: Hourly + Type */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 card p-5">
            <div className="text-xs font-mono uppercase mb-4" style={{ color: "var(--text-muted)" }}>⏱ Violations by Hour of Day</div>
            <div style={{ height: 220 }}>
              <Line data={hourChartData} options={CHART_DEFAULTS as any} />
            </div>
          </div>
          <div className="card p-5">
            <div className="text-xs font-mono uppercase mb-4" style={{ color: "var(--text-muted)" }}>🔴 By Severity</div>
            <div style={{ height: 220 }}>
              <Doughnut data={severityChartData} options={{ ...CHART_DEFAULTS, scales: undefined } as any} />
            </div>
          </div>
        </div>

        {/* Row 2: 30-day trend */}
        <div className="card p-5 mb-6">
          <div className="text-xs font-mono uppercase mb-4" style={{ color: "var(--text-muted)" }}>📈 30-Day Trend: Violations & Revenue</div>
          <div style={{ height: 220 }}>
            <Line data={dayChartData} options={dayChartOptions as any} />
          </div>
        </div>

        {/* Row 3: Violation type + Weekday */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="card p-5">
            <div className="text-xs font-mono uppercase mb-4" style={{ color: "var(--text-muted)" }}>⚡ By Violation Type</div>
            <div style={{ height: 260 }}>
              <Bar data={typeChartData} options={CHART_DEFAULTS as any} />
            </div>
          </div>
          <div className="card p-5">
            <div className="text-xs font-mono uppercase mb-4" style={{ color: "var(--text-muted)" }}>📅 By Day of Week</div>
            <div style={{ height: 260 }}>
              <Bar data={weekdayChartData} options={CHART_DEFAULTS as any} />
            </div>
          </div>
        </div>

        {/* Row 4: Top locations */}
        <div className="card p-5">
          <div className="text-xs font-mono uppercase mb-4" style={{ color: "var(--text-muted)" }}>📍 Top Violation Locations</div>
          <div style={{ height: 280 }}>
            <Bar data={locationChartData} options={locationOptions as any} />
          </div>
        </div>
      </div>
    </div>
  );
}
