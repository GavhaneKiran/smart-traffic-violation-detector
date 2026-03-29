/**
 * AI Insights Routes
 * Generates intelligent pattern analysis from violation data
 */

const express = require("express");
const router = express.Router();
const Violation = require("../models/Violation");

// ─── GET /api/insights ───────────────────────────────────────────────────────
// Generate AI insights from violation patterns
router.get("/", async (req, res) => {
  try {
    const insights = [];

    // 1. Peak hour analysis
    const hourData = await Violation.aggregate([
      { $group: { _id: { $hour: "$time" }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 },
    ]);
    if (hourData.length > 0) {
      const peakHour = hourData[0]._id;
      const amPm = peakHour >= 12 ? "PM" : "AM";
      const displayHour = peakHour > 12 ? peakHour - 12 : peakHour || 12;
      insights.push({
        id: "peak-hour",
        type: "time",
        icon: "🕐",
        title: "Peak Violation Hour",
        description: `Most violations occur around ${displayHour} ${amPm}. Recommend increased patrol during this window.`,
        severity: "high",
        count: hourData[0].count,
        recommendation: `Deploy 2x traffic personnel between ${displayHour - 1}–${displayHour + 1} ${amPm}.`,
      });
    }

    // 2. Most common violation
    const typeData = await Violation.aggregate([
      { $group: { _id: "$violationType", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 },
    ]);
    if (typeData.length > 0) {
      insights.push({
        id: "top-violation",
        type: "violation",
        icon: "⚠️",
        title: "Most Common Violation",
        description: `"${typeData[0]._id}" is the most frequent violation with ${typeData[0].count} incidents. Awareness campaigns needed.`,
        severity: "medium",
        count: typeData[0].count,
        recommendation: `Launch targeted awareness campaign and install warning signboards at key intersections.`,
      });
    }

    // 3. Hotspot location
    const locationData = await Violation.aggregate([
      { $group: { _id: "$location.name", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 },
    ]);
    if (locationData.length > 0) {
      insights.push({
        id: "hotspot",
        type: "location",
        icon: "📍",
        title: "Violation Hotspot Detected",
        description: `"${locationData[0]._id}" has the highest concentration of violations (${locationData[0].count} incidents). This area needs immediate attention.`,
        severity: "critical",
        count: locationData[0].count,
        recommendation: `Install automated surveillance cameras and traffic signal enforcement systems at this location.`,
      });
    }

    // 4. Repeat offender alert
    const repeatOffenders = await Violation.aggregate([
      { $group: { _id: "$vehicleNumber", count: { $sum: 1 } } },
      { $match: { count: { $gte: 3 } } },
    ]);
    if (repeatOffenders.length > 0) {
      insights.push({
        id: "repeat-offenders",
        type: "behavior",
        icon: "🔁",
        title: "Repeat Offenders Alert",
        description: `${repeatOffenders.length} vehicles have committed 3+ violations. These drivers pose a significant public safety risk.`,
        severity: "critical",
        count: repeatOffenders.length,
        recommendation: `Flag these vehicles for license suspension review and mandatory road safety retraining.`,
      });
    }

    // 5. Weekend vs weekday analysis
    const weekdayData = await Violation.aggregate([
      {
        $group: {
          _id: { $dayOfWeek: "$time" },
          count: { $sum: 1 },
        },
      },
    ]);
    const weekendCount = weekdayData
      .filter((d) => d._id === 1 || d._id === 7)
      .reduce((a, b) => a + b.count, 0);
    const weekdayCount = weekdayData
      .filter((d) => d._id >= 2 && d._id <= 6)
      .reduce((a, b) => a + b.count, 0);

    if (weekendCount > weekdayCount / 2) {
      insights.push({
        id: "weekend-spike",
        type: "pattern",
        icon: "📅",
        title: "Weekend Violation Spike",
        description: `Weekend violations are disproportionately high (${weekendCount} on weekends vs ${weekdayCount} on weekdays). Night patrolling recommended.`,
        severity: "medium",
        count: weekendCount,
        recommendation: `Increase weekend night patrol and set up sobriety checkpoints on Friday-Saturday evenings.`,
      });
    }

    // 6. Fine collection analysis
    const fineData = await Violation.aggregate([
      {
        $group: {
          _id: "$status",
          totalFine: { $sum: "$fineAmount" },
          count: { $sum: 1 },
        },
      },
    ]);
    const pendingFines = fineData.find((d) => d._id === "Pending");
    if (pendingFines && pendingFines.totalFine > 50000) {
      insights.push({
        id: "pending-fines",
        type: "financial",
        icon: "💰",
        title: "High Pending Fine Collection",
        description: `₹${pendingFines.totalFine.toLocaleString("en-IN")} in fines are pending collection from ${pendingFines.count} violations.`,
        severity: "high",
        count: pendingFines.count,
        recommendation: `Initiate automated fine reminder system and escalation protocol for overdue payments.`,
      });
    }

    // Summary stats
    const totalViolations = await Violation.countDocuments();
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);
    const recentViolations = await Violation.countDocuments({ time: { $gte: last7Days } });
    const trend =
      recentViolations > totalViolations / 4 ? "increasing" : "stable";

    res.json({
      success: true,
      data: insights,
      summary: {
        totalInsights: insights.length,
        criticalCount: insights.filter((i) => i.severity === "critical").length,
        trend,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
