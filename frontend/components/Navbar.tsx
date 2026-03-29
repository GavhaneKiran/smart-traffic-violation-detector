"use client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { io as socketIO } from "socket.io-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: "⬛" },
  { href: "/analytics", label: "Analytics", icon: "📊" },
  { href: "/heatmap", label: "Heatmap", icon: "🗺️" },
  { href: "/upload", label: "Upload", icon: "📁" },
  { href: "/admin", label: "Admin", icon: "🛡️" },
  { href: "/insights", label: "AI Insights", icon: "🤖" },
];

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [liveCount, setLiveCount] = useState(0);
  const [notification, setNotification] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Connect to Socket.io for live updates
    const socket = socketIO(SOCKET_URL, { transports: ["websocket", "polling"] });

    socket.on("connect", () => {
      setIsConnected(true);
      socket.emit("subscribe_violations");
    });

    socket.on("disconnect", () => setIsConnected(false));

    socket.on("new_violation", (data) => {
      setLiveCount((c) => c + 1);
      setNotification(`🚨 ${data.message}`);
      setTimeout(() => setNotification(null), 4000);
    });

    return () => { socket.disconnect(); };
  }, []);

  return (
    <>
      {/* Live notification toast */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 text-xs font-mono px-4 py-3 rounded-lg animate-fade-up"
          style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)", color: "#f87171", maxWidth: 320 }}>
          {notification}
        </div>
      )}

      <nav className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-6 py-3"
        style={{ background: "rgba(3,7,18,0.95)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(30,41,59,0.8)" }}>
        {/* Logo */}
        <button onClick={() => router.push("/")} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
            style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}>🚦</div>
          <div>
            <div className="text-sm font-mono font-bold" style={{ color: "#f59e0b", lineHeight: 1 }}>SVPD</div>
            <div className="text-xs" style={{ color: "var(--text-muted)", lineHeight: 1 }}>Traffic Detector</div>
          </div>
        </button>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <button key={link.href} onClick={() => router.push(link.href)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: active ? "rgba(245,158,11,0.12)" : "transparent",
                  color: active ? "#f59e0b" : "var(--text-secondary)",
                  border: active ? "1px solid rgba(245,158,11,0.25)" : "1px solid transparent",
                }}>
                <span>{link.icon}</span>
                {link.label}
              </button>
            );
          })}
        </div>

        {/* Status + live count */}
        <div className="flex items-center gap-3">
          {liveCount > 0 && (
            <div className="text-xs font-mono px-3 py-1.5 rounded-full"
              style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171" }}>
              +{liveCount} live
            </div>
          )}
          <div className="flex items-center gap-2 text-xs font-mono"
            style={{ color: isConnected ? "#22c55e" : "#94a3b8" }}>
            <span className={`pulse-dot ${isConnected ? "" : "red"}`} style={{ width: 6, height: 6, background: isConnected ? "#22c55e" : "#94a3b8" }} />
            {isConnected ? "LIVE" : "OFFLINE"}
          </div>
        </div>
      </nav>
    </>
  );
}
