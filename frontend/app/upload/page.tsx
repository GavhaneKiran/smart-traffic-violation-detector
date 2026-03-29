"use client";
import { useRef, useState } from "react";
import Navbar from "../../components/Navbar";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// Types
interface Detection {
  vehicleNumber: string;
  violationType: string;
  confidence: number;
  severity: string;
  fineAmount: number;
  location: string;
}

interface AnalysisResult {
  success: boolean;
  fileName: string;
  fileType: "image" | "video";
  totalDetections: number;
  detections: Detection[];
  processingTime: number;
  postedToDb: number;
}

const SEVERITY_STYLE: Record<string, string> = {
  Critical: "badge-critical",
  High: "badge-high",
  Medium: "badge-medium",
  Low: "badge-low",
};

const VIOLATION_COLORS: Record<string, string> = {
  "No Helmet": "#ef4444",
  "Red Light Violation": "#dc2626",
  Overspeeding: "#f97316",
  "Wrong Lane": "#3b82f6",
  "Triple Riding": "#eab308",
  "Mobile Usage While Driving": "#a855f7",
  "Illegal Parking": "#22c55e",
  "No Seatbelt": "#ec4899",
  "No Signal": "#06b6d4",
  "Drunk Driving": "#ef4444",
};

export default function UploadPage() {
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Handle file selection ───────────────────────────────
  const handleFile = (selected: File) => {
    const isImage = selected.type.startsWith("image/");
    const isVideo = selected.type.startsWith("video/");

    if (!isImage && !isVideo) {
      setError("Please upload an image (JPG, PNG) or video (MP4, AVI, MOV)");
      return;
    }
    if (selected.size > 100 * 1024 * 1024) {
      setError("File too large. Maximum 100MB allowed.");
      return;
    }

    setFile(selected);
    setResult(null);
    setError(null);
    setPreview(URL.createObjectURL(selected));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFile(dropped);
  };

  // ─── Analyze file ─────────────────────────────────────────
  const analyzeFile = async () => {
    if (!file) return;

    setAnalyzing(true);
    setProgress(0);
    setError(null);
    setResult(null);

    // Simulate progress steps
    const steps = [
      { pct: 15, text: "Uploading file to server..." },
      { pct: 35, text: "Preprocessing frames..." },
      { pct: 55, text: "Running AI detection..." },
      { pct: 75, text: "Analyzing violations..." },
      { pct: 90, text: "Saving to database..." },
      { pct: 100, text: "Complete!" },
    ];

    let stepIndex = 0;
    const progressInterval = setInterval(() => {
      if (stepIndex < steps.length) {
        setProgress(steps[stepIndex].pct);
        setProgressText(steps[stepIndex].text);
        stepIndex++;
      }
    }, 600);

    try {
      // Build form data
      const formData = new FormData();
      formData.append("file", file);

      const response = await axios.post(`${API_URL}/api/analyze`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 120000, // 2 minutes for video
      });

      clearInterval(progressInterval);
      setProgress(100);
      setProgressText("Complete!");
      setResult(response.data);
    } catch (err: any) {
      clearInterval(progressInterval);
      setError(
        err.response?.data?.error ||
          "Analysis failed. Make sure backend is running on port 5000."
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const resetUpload = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    setProgress(0);
    setProgressText("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="min-h-screen grid-bg" style={{ paddingTop: 64 }}>
      <Navbar />

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* ─── Header ─────────────────────────────────────── */}
        <div className="mb-8">
          <h1
            className="text-3xl font-bold mb-1"
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              letterSpacing: "0.04em",
              color: "var(--text-primary)",
            }}
          >
            UPLOAD & ANALYZE
          </h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Upload an image or video — AI will detect violations and save them
            to the dashboard
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ─── Left: Upload area ──────────────────────── */}
          <div>
            {/* Drop zone */}
            {!file ? (
              <div
                className="card flex flex-col items-center justify-center cursor-pointer transition-all"
                style={{
                  height: 320,
                  border: dragOver
                    ? "2px dashed #f59e0b"
                    : "2px dashed #1e293b",
                  background: dragOver
                    ? "rgba(245,158,11,0.05)"
                    : "var(--bg-card)",
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div
                  className="text-5xl mb-4"
                  style={{ opacity: dragOver ? 1 : 0.5 }}
                >
                  {dragOver ? "📂" : "📁"}
                </div>
                <div
                  className="text-base font-semibold mb-2"
                  style={{ color: "var(--text-primary)" }}
                >
                  Drop your file here
                </div>
                <div
                  className="text-sm mb-4"
                  style={{ color: "var(--text-muted)" }}
                >
                  or click to browse
                </div>
                <div
                  className="text-xs font-mono px-4 py-2 rounded-full"
                  style={{
                    background: "rgba(245,158,11,0.08)",
                    color: "#f59e0b",
                    border: "1px solid rgba(245,158,11,0.2)",
                  }}
                >
                  JPG · PNG · MP4 · AVI · MOV · up to 100MB
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={handleInputChange}
                />
              </div>
            ) : (
              /* Preview area */
              <div className="card overflow-hidden" style={{ height: 320 }}>
                {file.type.startsWith("image/") ? (
                  <img
                    src={preview!}
                    alt="Preview"
                    className="w-full h-full object-contain"
                    style={{ background: "#0a0f1e" }}
                  />
                ) : (
                  <video
                    src={preview!}
                    controls
                    className="w-full h-full"
                    style={{ background: "#0a0f1e" }}
                  />
                )}
              </div>
            )}

            {/* File info */}
            {file && (
              <div
                className="card p-4 mt-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                    style={{
                      background: "rgba(245,158,11,0.1)",
                      border: "1px solid rgba(245,158,11,0.2)",
                    }}
                  >
                    {file.type.startsWith("image/") ? "🖼️" : "🎬"}
                  </div>
                  <div>
                    <div
                      className="text-sm font-medium"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {file.name}
                    </div>
                    <div
                      className="text-xs font-mono"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {(file.size / 1024 / 1024).toFixed(2)} MB ·{" "}
                      {file.type.startsWith("image/") ? "Image" : "Video"}
                    </div>
                  </div>
                </div>
                <button onClick={resetUpload} className="btn-secondary text-xs px-3 py-1.5">
                  ✕ Remove
                </button>
              </div>
            )}

            {/* Error */}
            {error && (
              <div
                className="mt-4 p-4 rounded-xl text-sm"
                style={{
                  background: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  color: "#f87171",
                }}
              >
                ⚠️ {error}
              </div>
            )}

            {/* Analyze button */}
            {file && !analyzing && !result && (
              <button
                onClick={analyzeFile}
                className="btn-primary w-full mt-4 py-3 text-sm"
              >
                🔍 Analyze for Violations
              </button>
            )}

            {/* Progress bar */}
            {analyzing && (
              <div className="mt-4 card p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className="pulse-dot"
                    style={{ width: 8, height: 8 }}
                  />
                  <span
                    className="text-xs font-mono"
                    style={{ color: "#22c55e" }}
                  >
                    {progressText}
                  </span>
                </div>
                <div
                  className="w-full rounded-full overflow-hidden"
                  style={{ height: 6, background: "#1e293b" }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${progress}%`,
                      background:
                        "linear-gradient(90deg, #f59e0b, #ef4444)",
                    }}
                  />
                </div>
                <div
                  className="text-right text-xs font-mono mt-1"
                  style={{ color: "var(--text-muted)" }}
                >
                  {progress}%
                </div>
              </div>
            )}

            {/* Analyze again button */}
            {result && (
              <button
                onClick={resetUpload}
                className="btn-secondary w-full mt-4 py-3 text-sm"
              >
                ↑ Upload Another File
              </button>
            )}
          </div>

          {/* ─── Right: Results ──────────────────────────── */}
          <div>
            {/* Waiting state */}
            {!result && !analyzing && (
              <div
                className="card flex flex-col items-center justify-center"
                style={{ height: 320 }}
              >
                <div className="text-4xl mb-3 opacity-30">🤖</div>
                <div
                  className="text-sm"
                  style={{ color: "var(--text-muted)" }}
                >
                  Upload a file and click Analyze
                </div>
                <div
                  className="text-xs mt-1"
                  style={{ color: "var(--text-muted)" }}
                >
                  Results will appear here
                </div>
              </div>
            )}

            {/* Analyzing state */}
            {analyzing && (
              <div
                className="card flex flex-col items-center justify-center"
                style={{ height: 320 }}
              >
                <div
                  className="text-4xl mb-4"
                  style={{ animation: "spin 2s linear infinite" }}
                >
                  ⚙️
                </div>
                <div
                  className="text-sm font-mono animate-pulse"
                  style={{ color: "#f59e0b" }}
                >
                  AI is analyzing your file...
                </div>
                <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
              </div>
            )}

            {/* Results */}
            {result && (
              <div className="space-y-4">
                {/* Summary card */}
                <div
                  className="card p-5"
                  style={{
                    border:
                      result.totalDetections > 0
                        ? "1px solid rgba(239,68,68,0.3)"
                        : "1px solid rgba(34,197,94,0.3)",
                    background:
                      result.totalDetections > 0
                        ? "rgba(239,68,68,0.04)"
                        : "rgba(34,197,94,0.04)",
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className="text-xs font-mono uppercase"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Analysis Complete
                    </div>
                    <div
                      className="text-xs font-mono"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {result.processingTime}ms
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <div
                        className="stat-number text-3xl"
                        style={{
                          color:
                            result.totalDetections > 0
                              ? "#ef4444"
                              : "#22c55e",
                        }}
                      >
                        {result.totalDetections}
                      </div>
                      <div
                        className="text-xs font-mono"
                        style={{ color: "var(--text-muted)" }}
                      >
                        Violations
                      </div>
                    </div>
                    <div>
                      <div
                        className="stat-number text-3xl"
                        style={{ color: "#4ade80" }}
                      >
                        {result.postedToDb}
                      </div>
                      <div
                        className="text-xs font-mono"
                        style={{ color: "var(--text-muted)" }}
                      >
                        Saved to DB
                      </div>
                    </div>
                    <div>
                      <div
                        className="stat-number text-3xl"
                        style={{ color: "#60a5fa" }}
                      >
                        {result.fileType === "image" ? "📸" : "🎬"}
                      </div>
                      <div
                        className="text-xs font-mono"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {result.fileType}
                      </div>
                    </div>
                  </div>
                </div>

                {/* No violations found */}
                {result.totalDetections === 0 && (
                  <div className="card p-8 text-center">
                    <div className="text-4xl mb-3">✅</div>
                    <div
                      className="text-base font-semibold mb-1"
                      style={{ color: "#22c55e" }}
                    >
                      No Violations Detected
                    </div>
                    <div
                      className="text-sm"
                      style={{ color: "var(--text-muted)" }}
                    >
                      The file appears to be violation-free
                    </div>
                  </div>
                )}

                {/* Violation cards */}
                {result.detections.length > 0 && (
                  <div>
                    <div
                      className="text-xs font-mono uppercase mb-3"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Detected Violations
                    </div>
                    <div
                      className="space-y-3"
                      style={{ maxHeight: 420, overflowY: "auto" }}
                    >
                      {result.detections.map((det, i) => {
                        const color =
                          VIOLATION_COLORS[det.violationType] || "#f59e0b";
                        return (
                          <div
                            key={i}
                            className="card p-4 animate-fade-up"
                            style={{
                              animationDelay: `${i * 0.07}s`,
                              border: `1px solid ${color}33`,
                              background: `${color}08`,
                            }}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                                  style={{
                                    background: `${color}22`,
                                    border: `1px solid ${color}44`,
                                  }}
                                >
                                  ⚠️
                                </div>
                                <div>
                                  <div
                                    className="text-sm font-semibold"
                                    style={{ color: "var(--text-primary)" }}
                                  >
                                    {det.violationType}
                                  </div>
                                  <div
                                    className="text-xs font-mono"
                                    style={{ color: "#f59e0b" }}
                                  >
                                    {det.vehicleNumber}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <div
                                  className="text-sm font-mono font-bold"
                                  style={{ color: "#4ade80" }}
                                >
                                  ₹{det.fineAmount?.toLocaleString()}
                                </div>
                                <span
                                  className={`badge ${SEVERITY_STYLE[det.severity]}`}
                                >
                                  {det.severity}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 mt-2">
                              <div
                                className="text-xs"
                                style={{ color: "var(--text-muted)" }}
                              >
                                📍 {det.location}
                              </div>
                              <div className="flex items-center gap-1 ml-auto">
                                <div
                                  className="h-1.5 rounded-full overflow-hidden"
                                  style={{ width: 40, background: "#1e293b" }}
                                >
                                  <div
                                    className="h-full rounded-full"
                                    style={{
                                      width: `${Math.round(det.confidence * 100)}%`,
                                      background: color,
                                    }}
                                  />
                                </div>
                                <span
                                  className="text-xs font-mono"
                                  style={{ color: "var(--text-muted)" }}
                                >
                                  {Math.round(det.confidence * 100)}%
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Go to dashboard */}
                {result.postedToDb > 0 && (
                  <a
                    href="/dashboard"
                    className="btn-primary w-full py-3 text-sm text-center block"
                  >
                    📊 View in Dashboard →
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ─── How it works section ───────────────────── */}
        <div className="mt-10">
          <div
            className="text-xs font-mono uppercase mb-4"
            style={{ color: "var(--text-muted)" }}
          >
            How It Works
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: "📁", step: "01", title: "Upload", desc: "Drop any image or video file" },
              { icon: "🤖", step: "02", title: "AI Scan", desc: "OpenCV scans every frame" },
              { icon: "⚠️", step: "03", title: "Detect", desc: "Violations are identified" },
              { icon: "💾", step: "04", title: "Save", desc: "Auto-saved to dashboard" },
            ].map((s) => (
              <div key={s.step} className="card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="text-xs font-mono"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {s.step}
                  </span>
                  <span className="text-xl">{s.icon}</span>
                </div>
                <div
                  className="text-sm font-semibold mb-1"
                  style={{ color: "var(--text-primary)" }}
                >
                  {s.title}
                </div>
                <div
                  className="text-xs"
                  style={{ color: "var(--text-muted)" }}
                >
                  {s.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (selected) handleFile(selected);
  }
}
