/**
 * Violations API Routes
 * GET  /api/violations       - Get all violations (with filters)
 * POST /api/violations       - Create a new violation
 * GET  /api/violations/:id   - Get single violation
 * PUT  /api/violations/:id   - Update violation status
 * DELETE /api/violations/:id - Delete a violation
 * GET  /api/violations/repeat-offenders - Get repeat offenders
 */

const express = require("express");
const router = express.Router();
const Violation = require("../models/Violation");

// ─── GET /api/violations ─────────────────────────────────────────────────────
// Fetch all violations with optional filters
router.get("/", async (req, res) => {
  try {
    const {
      vehicleNumber,
      violationType,
      location,
      status,
      severity,
      startDate,
      endDate,
      page = 1,
      limit = 50,
      sortBy = "time",
      sortOrder = "desc",
    } = req.query;

    // Build filter object
    const filter = {};
    if (vehicleNumber) filter.vehicleNumber = { $regex: vehicleNumber, $options: "i" };
    if (violationType) filter.violationType = violationType;
    if (location) filter["location.name"] = { $regex: location, $options: "i" };
    if (status) filter.status = status;
    if (severity) filter.severity = severity;

    // Date range filter
    if (startDate || endDate) {
      filter.time = {};
      if (startDate) filter.time.$gte = new Date(startDate);
      if (endDate) filter.time.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortObj = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

    const [violations, total] = await Promise.all([
      Violation.find(filter).sort(sortObj).skip(skip).limit(parseInt(limit)).lean(),
      Violation.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: violations,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── GET /api/violations/repeat-offenders ───────────────────────────────────
router.get("/repeat-offenders", async (req, res) => {
  try {
    const minCount = parseInt(req.query.minCount) || 2;
    const offenders = await Violation.getRepeatOffenders(minCount);
    res.json({ success: true, data: offenders });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── GET /api/violations/stats/summary ──────────────────────────────────────
router.get("/stats/summary", async (req, res) => {
  try {
    const [total, pending, paid, critical] = await Promise.all([
      Violation.countDocuments(),
      Violation.countDocuments({ status: "Pending" }),
      Violation.countDocuments({ status: "Paid" }),
      Violation.countDocuments({ severity: "Critical" }),
    ]);

    // Total fine amount
    const fineAgg = await Violation.aggregate([
      { $group: { _id: null, totalFines: { $sum: "$fineAmount" } } },
    ]);
    const totalFines = fineAgg[0]?.totalFines || 0;

    // Today's violations
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCount = await Violation.countDocuments({ time: { $gte: today } });

    res.json({
      success: true,
      data: { total, pending, paid, critical, totalFines, todayCount },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── GET /api/violations/:id ─────────────────────────────────────────────────
router.get("/:id", async (req, res) => {
  try {
    const violation = await Violation.findById(req.params.id);
    if (!violation) return res.status(404).json({ success: false, error: "Violation not found" });
    res.json({ success: true, data: violation });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── POST /api/violations ────────────────────────────────────────────────────
// Create a new violation (from AI engine or manual entry)
router.post("/", async (req, res) => {
  try {
    const { vehicleNumber, violationType, location, time, confidenceScore, cameraId, evidenceUrl } =
      req.body;

    // Check if repeat offender
    const existingCount = await Violation.countDocuments({ vehicleNumber: vehicleNumber?.toUpperCase() });
    const isRepeatOffender = existingCount >= 2;

    const violation = new Violation({
      vehicleNumber,
      violationType,
      location,
      time: time || new Date(),
      confidenceScore,
      cameraId,
      evidenceUrl,
      isRepeatOffender,
    });

    await violation.save();

    // If repeat offender, update all previous violations for this vehicle
    if (isRepeatOffender) {
      await Violation.updateMany(
        { vehicleNumber: vehicleNumber?.toUpperCase(), _id: { $ne: violation._id } },
        { isRepeatOffender: true }
      );
    }

    // Emit real-time event to connected clients
    const io = req.app.get("io");
    if (io) {
      io.to("violations_room").emit("new_violation", {
        violation,
        message: `New ${violationType} violation detected for ${vehicleNumber}`,
        isRepeatOffender,
      });
    }

    res.status(201).json({
      success: true,
      data: violation,
      message: "Violation recorded successfully",
      isRepeatOffender,
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ─── PUT /api/violations/:id ─────────────────────────────────────────────────
router.put("/:id", async (req, res) => {
  try {
    const violation = await Violation.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!violation) return res.status(404).json({ success: false, error: "Violation not found" });
    res.json({ success: true, data: violation });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ─── DELETE /api/violations/:id ──────────────────────────────────────────────
router.delete("/:id", async (req, res) => {
  try {
    const violation = await Violation.findByIdAndDelete(req.params.id);
    if (!violation) return res.status(404).json({ success: false, error: "Violation not found" });
    res.json({ success: true, message: "Violation deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
