/**
 * Upload Route - Handle image/video evidence uploads
 */

const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");

// Simple file upload using built-in Node.js (no multer needed for demo)
// In production, use multer + cloud storage (AWS S3 / Cloudinary)

router.post("/evidence", express.raw({ type: "*/*", limit: "50mb" }), async (req, res) => {
  try {
    const uploadsDir = path.join(__dirname, "../uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filename = `evidence_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const ext = req.headers["content-type"]?.includes("video") ? ".mp4" : ".jpg";
    const filepath = path.join(uploadsDir, filename + ext);

    fs.writeFileSync(filepath, req.body);

    res.json({
      success: true,
      filename: filename + ext,
      url: `/uploads/${filename}${ext}`,
      message: "Evidence uploaded successfully",
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
