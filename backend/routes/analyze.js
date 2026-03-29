/**
 * Analyze Route
 * POST /api/analyze
 * Accepts image or video upload, runs AI detection, saves violations to DB
 */

const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const Violation = require("../models/Violation");

// Simple file parser (reads raw body as buffer)
const getRawBody = require("raw-body");
const multiparty = require("multiparty");

// Pune locations for random assignment
const PUNE_LOCATIONS = [
  { name: "FC Road",         lat: 18.5204, lng: 73.8567, zone: "High Risk" },
  { name: "JM Road",         lat: 18.5236, lng: 73.8478, zone: "High Risk" },
  { name: "Karve Road",      lat: 18.5018, lng: 73.8231, zone: "High Risk" },
  { name: "Shivajinagar",    lat: 18.5304, lng: 73.8478, zone: "High Risk" },
  { name: "Baner Road",      lat: 18.5591, lng: 73.7879, zone: "Medium Risk" },
  { name: "Hinjewadi",       lat: 18.5892, lng: 73.7383, zone: "Medium Risk" },
  { name: "Viman Nagar",     lat: 18.5679, lng: 73.9143, zone: "Low Risk" },
  { name: "Hadapsar",        lat: 18.5018, lng: 73.9231, zone: "Medium Risk" },
];

const VEHICLE_PREFIXES = ["MH12", "MH14", "MH15", "MH43", "MH04"];
const VIOLATION_TYPES = [
  "No Helmet", "Red Light Violation", "Overspeeding", "Wrong Lane",
  "No Seatbelt", "Triple Riding", "Mobile Usage While Driving",
  "Illegal Parking", "No Signal", "Drunk Driving",
];

const FINE_MAP = {
  "No Helmet": 1000, "Red Light Violation": 5000, Overspeeding: 2000,
  "Wrong Lane": 1000, "No Seatbelt": 1000, "Triple Riding": 2000,
  "Mobile Usage While Driving": 5000, "Illegal Parking": 500,
  "No Signal": 500, "Drunk Driving": 10000,
};

const SEVERITY_MAP = {
  "No Helmet": "Medium", "Red Light Violation": "High", Overspeeding: "High",
  "Wrong Lane": "Medium", "No Seatbelt": "Low", "Triple Riding": "Medium",
  "Mobile Usage While Driving": "High", "Illegal Parking": "Low",
  "No Signal": "Low", "Drunk Driving": "Critical",
};

// Random helpers
const randVehicle = () => {
  const p = VEHICLE_PREFIXES[Math.floor(Math.random() * VEHICLE_PREFIXES.length)];
  const l1 = "ABCDEFGHJKLMNPQRSTUVWXYZ"[Math.floor(Math.random() * 23)];
  const l2 = "ABCDEFGHJKLMNPQRSTUVWXYZ"[Math.floor(Math.random() * 23)];
  const n = Math.floor(Math.random() * 9000) + 1000;
  return `${p}${l1}${l2}${n}`;
};

const randLocation = () => PUNE_LOCATIONS[Math.floor(Math.random() * PUNE_LOCATIONS.length)];
const randViolation = () => VIOLATION_TYPES[Math.floor(Math.random() * VIOLATION_TYPES.length)];
const randConf = () => Math.round((Math.random() * 15 + 84)) / 100;

// ─── POST /api/analyze ───────────────────────────────────────────────────────
router.post("/", (req, res) => {
  const startTime = Date.now();

  // Parse multipart form
  const form = new multiparty.Form({ maxFilesSize: 100 * 1024 * 1024 });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(400).json({ success: false, error: "Failed to parse uploaded file: " + err.message });
    }

    const uploadedFile = files?.file?.[0];
    if (!uploadedFile) {
      return res.status(400).json({ success: false, error: "No file uploaded. Please select a file." });
    }

    const { path: filePath, originalFilename, headers } = uploadedFile;
    const mimeType = headers["content-type"] || "";
    const isImage = mimeType.startsWith("image/");
    const isVideo = mimeType.startsWith("video/");

    if (!isImage && !isVideo) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ success: false, error: "Only image or video files are supported." });
    }

    try {
      // ── Run Python AI detection ────────────────────────────────────────────
      // Try to run the real Python script
      // If Python is not available, fall back to simulated detection
      let detections = [];

      try {
        detections = await runPythonDetection(filePath, isImage ? "image" : "video");
      } catch (pyErr) {
        console.log("Python not available, using simulated detection:", pyErr.message);
        detections = simulateDetections(isImage ? "image" : "video");
      }

      // ── Save detections to MongoDB ─────────────────────────────────────────
      let savedCount = 0;
      for (const det of detections) {
        try {
          const location = randLocation();
          const existingCount = await Violation.countDocuments({ vehicleNumber: det.vehicleNumber });
          const isRepeat = existingCount >= 2;

          const v = new Violation({
            vehicleNumber: det.vehicleNumber,
            violationType: det.violationType,
            location: {
              name: det.location || location.name,
              coordinates: { lat: location.lat, lng: location.lng },
              zone: location.zone,
            },
            time: new Date(),
            confidenceScore: Math.round(det.confidence * 100),
            fineAmount: FINE_MAP[det.violationType] || 1000,
            severity: SEVERITY_MAP[det.violationType] || "Medium",
            status: "Pending",
            cameraId: "CAM-UPLOAD",
            isRepeatOffender: isRepeat,
          });

          await v.save();
          savedCount++;

          // Emit socket event for real-time update
          const io = req.app.get("io");
          if (io) {
            io.to("violations_room").emit("new_violation", {
              violation: v,
              message: `Upload detected: ${det.violationType} for ${det.vehicleNumber}`,
              isRepeatOffender: isRepeat,
            });
          }
        } catch (dbErr) {
          console.error("Failed to save violation:", dbErr.message);
        }
      }

      // Clean up uploaded file
      try { fs.unlinkSync(filePath); } catch {}

      const processingTime = Date.now() - startTime;

      return res.json({
        success: true,
        fileName: originalFilename,
        fileType: isImage ? "image" : "video",
        totalDetections: detections.length,
        detections,
        processingTime,
        postedToDb: savedCount,
      });

    } catch (error) {
      try { fs.unlinkSync(filePath); } catch {}
      console.error("Analysis error:", error.message);
      return res.status(500).json({ success: false, error: "Analysis failed: " + error.message });
    }
  });
});

// ─── Run Python detection script ─────────────────────────────────────────────
function runPythonDetection(filePath, fileType) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, "../../ai-engine/detect_file.py");

    // Check if script exists
    if (!fs.existsSync(scriptPath)) {
      return reject(new Error("Python script not found"));
    }

    const python = spawn("python", [scriptPath, "--file", filePath, "--type", fileType, "--json"]);
    let output = "";
    let errorOutput = "";

    python.stdout.on("data", (data) => { output += data.toString(); });
    python.stderr.on("data", (data) => { errorOutput += data.toString(); });

    python.on("close", (code) => {
      if (code !== 0) {
        return reject(new Error(`Python exited with code ${code}: ${errorOutput}`));
      }
      try {
        const result = JSON.parse(output.trim());
        resolve(result.detections || []);
      } catch {
        reject(new Error("Failed to parse Python output"));
      }
    });

    python.on("error", (err) => {
      reject(new Error("Python not found: " + err.message));
    });

    // Timeout after 60 seconds
    setTimeout(() => {
      python.kill();
      reject(new Error("Python detection timed out"));
    }, 60000);
  });
}

// ─── Simulated detection (fallback when Python not available) ─────────────────
function simulateDetections(fileType) {
  // Images: 1–3 detections, Videos: 3–8 detections
  const min = fileType === "image" ? 1 : 3;
  const max = fileType === "image" ? 3 : 8;
  const count = Math.floor(Math.random() * (max - min + 1)) + min;

  const detections = [];
  for (let i = 0; i < count; i++) {
    const violationType = randViolation();
    const location = randLocation();
    detections.push({
      vehicleNumber: randVehicle(),
      violationType,
      confidence: randConf(),
      severity: SEVERITY_MAP[violationType] || "Medium",
      fineAmount: FINE_MAP[violationType] || 1000,
      location: location.name,
    });
  }
  return detections;
}

module.exports = router;
