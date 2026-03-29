"use client";
import { useEffect, useState, useRef } from "react";
import Navbar from "../../components/Navbar";
import { analyticsAPI } from "../../lib/api";

// Dynamically import Leaflet (client-side only)
const SEVERITY_COLORS: Record<string, string> = {
  Critical: "#ef4444",
  High: "#f59e0b",
  Medium: "#3b82f6",
  Low: "#22c55e",
};

interface MapPoint {
  _id: string;
  location: { name: string; coordinates: { lat: number; lng: number } };
  violationType: string;
  severity: string;
  vehicleNumber: string;
  time: string;
}

export default function HeatmapPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapReady, setMapReady] = useState(false);
  const [points, setPoints] = useState<MapPoint[]>([]);
  const [filter, setFilter] = useState("All");
  const [stats, setStats] = useState({ total: 0, critical: 0, high: 0 });
  const [selectedPoint, setSelectedPoint] = useState<MapPoint | null>(null);
  const leafletMapRef = useRef<any>(null);

  const VIOLATION_TYPES = ["All", "No Helmet", "Red Light Violation", "Overspeeding", "Wrong Lane", "Illegal Parking", "Drunk Driving"];

  useEffect(() => {
    analyticsAPI.heatmap().then(res => {
      const data = res.data.data;
      setPoints(data);
      setStats({
        total: data.length,
        critical: data.filter((p: MapPoint) => p.severity === "Critical").length,
        high: data.filter((p: MapPoint) => p.severity === "High").length,
      });
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (!mapRef.current || mapReady) return;

    // Dynamically import Leaflet
    import("leaflet").then(L => {
      // Fix default marker icons
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      });

      if (leafletMapRef.current) return;

      // Initialize map centered on Pune
      const map = L.map(mapRef.current!, {
        center: [18.5204, 73.8567],
        zoom: 12,
        zoomControl: false,
      });

      L.control.zoom({ position: "bottomright" }).addTo(map);

      // Dark tile layer
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      leafletMapRef.current = map;
      setMapReady(true);
    });
  }, []);

  // Render markers when points or filter changes
  useEffect(() => {
    if (!mapReady || !leafletMapRef.current) return;
    import("leaflet").then(L => {
      const map = leafletMapRef.current;

      // Clear existing markers
      map.eachLayer((layer: any) => {
        if (layer instanceof L.CircleMarker) map.removeLayer(layer);
      });

      // Add filtered markers
      const filtered = filter === "All" ? points : points.filter(p => p.violationType === filter);

      filtered.forEach(point => {
        if (!point.location?.coordinates) return;
        const { lat, lng } = point.location.coordinates;
        const color = SEVERITY_COLORS[point.severity] || "#f59e0b";

        const marker = L.circleMarker([lat, lng], {
          radius: point.severity === "Critical" ? 10 : point.severity === "High" ? 8 : 6,
          fillColor: color,
          color: color,
          weight: 2,
          opacity: 0.9,
          fillOpacity: 0.4,
        });

        marker.bindPopup(`
          <div style="font-family: JetBrains Mono, monospace; font-size: 12px; background: #0f172a; color: #f1f5f9; padding: 8px; border-radius: 8px; min-width: 180px;">
            <div style="color: ${color}; font-weight: 700; margin-bottom: 4px;">${point.violationType}</div>
            <div style="color: #94a3b8;">🚗 ${point.vehicleNumber}</div>
            <div style="color: #94a3b8;">📍 ${point.location.name}</div>
            <div style="color: #94a3b8;">🕐 ${new Date(point.time).toLocaleString("en-IN")}</div>
            <div style="margin-top: 6px;">
              <span style="background: ${color}22; color: ${color}; border: 1px solid ${color}44; padding: 2px 8px; border-radius: 99px; font-size: 10px;">${point.severity}</span>
            </div>
          </div>
        `, { className: "dark-popup" });

        marker.addTo(map);
      });
    });
  }, [mapReady, points, filter]);

  return (
    <div className="min-h-screen grid-bg" style={{ paddingTop: 64 }}>
      <Navbar />
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-1" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.04em", color: "var(--text-primary)" }}>
              VIOLATION HEATMAP
            </h1>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Geographic distribution of traffic violations across Pune
            </p>
          </div>
          {/* Stats chips */}
          <div className="flex gap-3 flex-wrap">
            {[
              { label: "Total", value: stats.total, color: "#f59e0b" },
              { label: "Critical", value: stats.critical, color: "#ef4444" },
              { label: "High Risk", value: stats.high, color: "#f97316" },
            ].map(s => (
              <div key={s.label} className="px-4 py-2 rounded-lg text-center card">
                <div className="text-xl font-bold" style={{ color: s.color, fontFamily: "'Bebas Neue', sans-serif" }}>{s.value}</div>
                <div className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap gap-2 mb-4">
          {VIOLATION_TYPES.map(type => (
            <button key={type} onClick={() => setFilter(type)}
              className="text-xs px-3 py-1.5 rounded-full font-mono transition-all"
              style={{
                background: filter === type ? "rgba(245,158,11,0.15)" : "rgba(15,23,42,0.8)",
                color: filter === type ? "#f59e0b" : "var(--text-muted)",
                border: `1px solid ${filter === type ? "rgba(245,158,11,0.4)" : "#1e293b"}`,
              }}>
              {type}
            </button>
          ))}
        </div>

        {/* Map */}
        <div className="card overflow-hidden" style={{ height: 520 }}>
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css" />
          <div ref={mapRef} style={{ height: "100%", width: "100%", background: "#0a0f1e" }} />
          {!mapReady && (
            <div className="absolute inset-0 flex items-center justify-center" style={{ background: "#0a0f1e" }}>
              <div className="text-sm font-mono animate-pulse" style={{ color: "var(--text-muted)" }}>Initializing map...</div>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-4">
          {Object.entries(SEVERITY_COLORS).map(([severity, color]) => (
            <div key={severity} className="flex items-center gap-2 text-xs font-mono" style={{ color: "var(--text-secondary)" }}>
              <div className="w-3 h-3 rounded-full" style={{ background: color }} />
              {severity}
            </div>
          ))}
          <div className="text-xs font-mono ml-auto" style={{ color: "var(--text-muted)" }}>
            Click markers for details · Data: Pune City Traffic
          </div>
        </div>
      </div>
    </div>
  );
}
