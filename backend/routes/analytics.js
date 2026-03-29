/**
 * Analytics Routes
 * Provides aggregated data for charts and visualizations
 */

const express = require("express");
const router = express.Router();
const Violation = require("../models/Violation");

// ─── GET /api/analytics/by-type ─────────────────────────────────────────────
// Violations grouped by type (for pie/bar chart)
router.get("/by-type", async (req, res) => {
  try {
    const data = await Violation.aggregate([
      { $group: { _id: "$violationType", count: { $sum: 1 }, totalFine: { $sum: "$fineAmount" } } },
      { $sort: { count: -1 } },
    ]);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── GET /api/analytics/by-hour ─────────────────────────────────────────────
// Violations grouped by hour of day (for time pattern analysis)
router.get("/by-hour", async (req, res) => {
  try {
    const data = await Violation.aggregate([
      {
        $group: {
          _id: { $hour: "$time" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Fill in missing hours with 0
    const hourMap = {};
    data.forEach((d) => (hourMap[d._id] = d.count));
    const fullData = Array.from({ length: 24 }, (_, h) => ({
      hour: h,
      label: `${h.toString().padStart(2, "0")}:00`,
      count: hourMap[h] || 0,
    }));

    res.json({ success: true, data: fullData });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── GET /api/analytics/by-location ─────────────────────────────────────────
// Top violation hotspot locations
router.get("/by-location", async (req, res) => {
  try {
    const data = await Violation.aggregate([
      {
        $group: {
          _id: "$location.name",
          count: { $sum: 1 },
          lat: { $first: "$location.coordinates.lat" },
          lng: { $first: "$location.coordinates.lng" },
          zone: { $first: "$location.zone" },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 15 },
    ]);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── GET /api/analytics/by-day ──────────────────────────────────────────────
// Violations over the last 30 days (for trend line chart)
router.get("/by-day", async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const data = await Violation.aggregate([
      { $match: { time: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: {
            year: { $year: "$time" },
            month: { $month: "$time" },
            day: { $dayOfMonth: "$time" },
          },
          count: { $sum: 1 },
          fines: { $sum: "$fineAmount" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
    ]);

    const formatted = data.map((d) => ({
      date: `${d._id.year}-${String(d._id.month).padStart(2, "0")}-${String(d._id.day).padStart(2, "0")}`,
      count: d.count,
      fines: d.fines,
    }));

    res.json({ success: true, data: formatted });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── GET /api/analytics/by-severity ─────────────────────────────────────────
router.get("/by-severity", async (req, res) => {
  try {
    const data = await Violation.aggregate([
      { $group: { _id: "$severity", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── GET /api/analytics/heatmap ─────────────────────────────────────────────
// All violation coordinates for map heatmap
router.get("/heatmap", async (req, res) => {
  try {
    const data = await Violation.find(
      {},
      {
        "location.coordinates": 1,
        "location.name": 1,
        violationType: 1,
        severity: 1,
        time: 1,
        vehicleNumber: 1,
      }
    ).lean();

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── GET /api/analytics/by-weekday ──────────────────────────────────────────
router.get("/by-weekday", async (req, res) => {
  try {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const data = await Violation.aggregate([
      { $group: { _id: { $dayOfWeek: "$time" }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const dayMap = {};
    data.forEach((d) => (dayMap[d._id] = d.count));
    const fullData = Array.from({ length: 7 }, (_, i) => ({
      day: days[i],
      count: dayMap[i + 1] || 0,
    }));

    res.json({ success: true, data: fullData });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
