"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// Animated counter hook
function useCounter(end: number, duration: number = 2000) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (end === 0) return;
    let start = 0;
    const step = end / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [end, duration]);
  return count;
}

const FEATURES = [
  { icon: "🎯", label: "AI Detection", desc: "YOLOv8-powered violation detection" },
  { icon: "⚡", label: "Real-time", desc: "Live socket updates on violations" },
  { icon: "🗺️", label: "Heatmaps", desc: "Geographic violation clustering" },
  { icon: "📊", label: "Analytics", desc: "Pattern & trend analysis" },
  { icon: "🔁", label: "Repeat Offenders", desc: "Automatic flagging system" },
  { icon: "🤖", label: "AI Insights", desc: "Intelligent recommendations" },
];

const VIOLATION_TYPES = [
  "No Helmet", "Red Light", "Overspeeding", "Wrong Lane",
  "Triple Riding", "Mobile Usage", "Illegal Parking", "Drunk Driving"
];

export default function LandingPage() {
  const router = useRouter();
  const [stats, setStats] = useState({ total: 0, todayCount: 0, totalFines: 0 });
  const [isLoaded, setIsLoaded] = useState(false);
  const [liveActivity, setLiveActivity] = useState<string[]>([]);
  const [apiStatus, setApiStatus] = useState<"checking" | "online" | "offline">("checking");

  const totalCount = useCounter(stats.total, 2500);
  const todayCount = useCounter(stats.todayCount, 2000);
  const finesCount = useCounter(Math.floor(stats.totalFines / 1000), 2200);

  useEffect(() => {
    setIsLoaded(true);
    
    // Check API status
    axios.get(`${API_URL}/api/health`)
      .then(() => setApiStatus("online"))
      .catch(() => setApiStatus("offline"));

    // Fetch live stats
    axios.get(`${API_URL}/api/violations/stats/summary`)
      .then(res => {
        if (res.data.success) setStats(res.data.data);
      })
      .catch(() => {});

    // Simulate live activity feed
    const violations = [
      "MH12AB1234 – No Helmet @ FC Road",
      "MH14XY5678 – Red Light @ JM Road",
      "MH43PQ9012 – Overspeeding @ Baner",
      "MH15CD3456 – Triple Riding @ Karve Road",
      "MH01EF7890 – Mobile Usage @ Hinjewadi",
      "MH02GH2345 – Illegal Parking @ Shivajinagar",
    ];
    
    let idx = 0;
    const interval = setInterval(() => {
      setLiveActivity(prev => [violations[idx % violations.length], ...prev].slice(0, 4));
      idx++;
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen grid-bg relative overflow-hidden">
      {/* Ambient glow effects */}
      <div className="fixed top-0 left-1/4 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(245,158,11,0.06) 0%, transparent 70%)" }} />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(239,68,68,0.04) 0%, transparent 70%)" }} />

      {/* ─── Navbar ──────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4"
        style={{ background: "rgba(3,7,18,0.9)", backdropFilter: "blur(16px)", borderBottom: "1px solid rgba(30,41,59,0.6)" }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
            style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}>🚦</div>
          <span className="font-mono text-sm font-semibold" style={{ color: "var(--accent-amber)" }}>SVPD</span>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>Smart Violation Pattern Detector</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs"
            style={{ background: apiStatus === "online" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
              border: `1px solid ${apiStatus === "online" ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
              color: apiStatus === "online" ? "#22c55e" : "#ef4444" }}>
            <span className={`pulse-dot ${apiStatus === "online" ? "" : "red"}`} style={{ width: 6, height: 6 }} />
            {apiStatus === "checking" ? "Connecting..." : apiStatus === "online" ? "System Online" : "API Offline"}
          </div>
          <button onClick={() => router.push("/dashboard")} className="btn-primary text-xs px-4 py-2">
            Open Dashboard →
          </button>
        </div>
      </nav>

      {/* ─── Hero ────────────────────────────────────────────── */}
      <section className="min-h-screen flex flex-col items-center justify-center px-8 text-center pt-20">
        <div className={`transition-all duration-1000 ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 text-xs font-mono"
            style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", color: "#f59e0b" }}>
            <span className="pulse-dot amber" style={{ width: 6, height: 6 }} />
            AI-POWERED SMART CITY SOLUTION
          </div>

          {/* Main headline */}
          <h1 className="mb-6" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(3rem, 8vw, 7rem)", letterSpacing: "0.02em", lineHeight: 0.9 }}>
            <span style={{ color: "var(--text-primary)" }}>SMART TRAFFIC</span>
            <br />
            <span style={{ background: "linear-gradient(135deg, #f59e0b, #ef4444)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              VIOLATION
            </span>
            <br />
            <span style={{ color: "var(--text-primary)" }}>DETECTOR</span>
          </h1>

          <p className="max-w-xl mx-auto mb-10 text-base leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            Real-time AI detection of traffic violations. Heatmaps, analytics, repeat offender tracking,
            and intelligent insights — all in one command center.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap gap-4 justify-center mb-16">
            <button onClick={() => router.push("/dashboard")} className="btn-primary text-sm px-8 py-3">
              🚀 Launch Dashboard
            </button>
            <button onClick={() => router.push("/analytics")} className="btn-secondary text-sm px-8 py-3">
              📊 View Analytics
            </button>
            <button onClick={() => router.push("/heatmap")} className="btn-secondary text-sm px-8 py-3">
              🗺️ Open Heatmap
            </button>
          </div>

          {/* Live Stats */}
          <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto mb-16">
            {[
              { value: totalCount.toLocaleString(), label: "Total Violations", color: "#ef4444" },
              { value: todayCount.toLocaleString(), label: "Detected Today", color: "#f59e0b" },
              { value: `₹${finesCount}K`, label: "Fines Levied", color: "#22c55e" },
            ].map((stat, i) => (
              <div key={i} className="card p-5">
                <div className="stat-number text-4xl mb-1" style={{ color: stat.color }}>{stat.value}</div>
                <div className="text-xs uppercase tracking-widest" style={{ color: "var(--text-muted)", fontFamily: "JetBrains Mono, monospace" }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Live Activity Feed ───────────────────────────────── */}
      <section className="px-8 pb-16 max-w-5xl mx-auto">
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="pulse-dot" style={{ width: 8, height: 8 }} />
            <span className="text-xs font-mono uppercase tracking-widest" style={{ color: "#22c55e" }}>Live Detection Feed</span>
          </div>
          <div className="space-y-2">
            {liveActivity.length === 0 ? (
              <div className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>Initializing detection feed...</div>
            ) : (
              liveActivity.map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-xs font-mono py-2 px-3 rounded transition-all"
                  style={{ background: i === 0 ? "rgba(245,158,11,0.06)" : "transparent",
                    color: i === 0 ? "#f59e0b" : "var(--text-muted)",
                    borderLeft: i === 0 ? "2px solid #f59e0b" : "2px solid transparent" }}>
                  <span style={{ color: "var(--text-muted)" }}>{new Date().toLocaleTimeString()}</span>
                  <span>⚠</span>
                  <span>{item}</span>
                  {i === 0 && <span className="ml-auto text-xs px-2 py-0.5 rounded" style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b" }}>LIVE</span>}
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* ─── Features Grid ────────────────────────────────────── */}
      <section className="px-8 pb-16 max-w-5xl mx-auto">
        <h2 className="text-center text-sm font-mono uppercase tracking-widest mb-8" style={{ color: "var(--text-muted)" }}>
          Platform Capabilities
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => (
            <div key={i} className="card p-5">
              <div className="text-2xl mb-3">{f.icon}</div>
              <div className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>{f.label}</div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Violation Types Ticker ───────────────────────────── */}
      <section className="border-t border-b py-4 mb-16" style={{ borderColor: "var(--bg-card-border)" }}>
        <div className="flex gap-8 overflow-hidden">
          {[...VIOLATION_TYPES, ...VIOLATION_TYPES].map((type, i) => (
            <span key={i} className="whitespace-nowrap text-xs font-mono px-4 py-1 rounded-full flex-shrink-0"
              style={{ background: "rgba(245,158,11,0.08)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.15)" }}>
              ⚡ {type}
            </span>
          ))}
        </div>
      </section>

      {/* ─── Footer ──────────────────────────────────────────── */}
      <footer className="text-center pb-8 px-8">
        <div className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
          SVPD v1.0 · Smart City AI Platform · Built with Next.js, Node.js, MongoDB & Python
        </div>
      </footer>
    </div>
  );
}
