/**
 * Smart Traffic Violation Pattern Detector - Backend Server
 * Node.js + Express + MongoDB + Socket.io
 */

const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
require("dotenv").config();

const violationRoutes = require("./routes/violations");
const analyticsRoutes = require("./routes/analytics");
const insightsRoutes = require("./routes/insights");
const uploadRoutes = require("./routes/upload");
const analyzeRoutes = require("./routes/analyze");

const app = express();
const server = http.createServer(app);

// ─── Socket.io Setup ─────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

// Make io accessible in routes
app.set("io", io);

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Serve uploaded files statically
app.use("/uploads", express.static("uploads"));

// ─── MongoDB Connection ───────────────────────────────────────────────────────
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/smart_traffic_db")
  .then(() => {
    console.log("✅ MongoDB connected successfully");
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    console.log("💡 Make sure MongoDB is running: mongod --dbpath /data/db");
    process.exit(1);
  });

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use("/api/violations", violationRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/insights", insightsRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/analyze", analyzeRoutes);

// Health check route
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Smart Traffic API is running",
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

// ─── Socket.io Events ────────────────────────────────────────────────────────
io.on("connection", (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  socket.on("disconnect", () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });

  // Client can request live updates
  socket.on("subscribe_violations", () => {
    socket.join("violations_room");
    socket.emit("subscribed", { message: "Subscribed to live violation updates" });
  });
});

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("Server error:", err.message);
  res.status(500).json({ error: "Internal server error", details: err.message });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 Socket.io ready for real-time updates`);
  console.log(`🗄️  Database: ${process.env.MONGODB_URI}`);
});

module.exports = { app, io };
