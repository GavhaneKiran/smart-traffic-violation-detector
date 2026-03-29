/**
 * Violation Model - MongoDB Schema
 * Defines the structure for traffic violation records
 */

const mongoose = require("mongoose");

const violationSchema = new mongoose.Schema(
  {
    // Vehicle identification number (license plate)
    vehicleNumber: {
      type: String,
      required: [true, "Vehicle number is required"],
      trim: true,
      uppercase: true,
      index: true,
    },

    // Type of traffic violation
    violationType: {
      type: String,
      required: [true, "Violation type is required"],
      enum: [
        "No Helmet",
        "Red Light Violation",
        "Overspeeding",
        "Wrong Lane",
        "No Seatbelt",
        "Triple Riding",
        "Mobile Usage While Driving",
        "Illegal Parking",
        "No Signal",
        "Drunk Driving",
      ],
      index: true,
    },

    // Location where violation occurred
    location: {
      name: {
        type: String,
        required: [true, "Location name is required"],
      },
      // GeoJSON coordinates [longitude, latitude]
      coordinates: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
      },
      zone: {
        type: String,
        enum: ["High Risk", "Medium Risk", "Low Risk"],
        default: "Medium Risk",
      },
    },

    // Date and time of violation
    time: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },

    // Confidence score from AI detection (0-100%)
    confidenceScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 95,
    },

    // Fine amount in INR
    fineAmount: {
      type: Number,
      default: function () {
        const fines = {
          "No Helmet": 1000,
          "Red Light Violation": 5000,
          Overspeeding: 2000,
          "Wrong Lane": 1000,
          "No Seatbelt": 1000,
          "Triple Riding": 2000,
          "Mobile Usage While Driving": 5000,
          "Illegal Parking": 500,
          "No Signal": 500,
          "Drunk Driving": 10000,
        };
        return fines[this.violationType] || 1000;
      },
    },

    // Payment status
    status: {
      type: String,
      enum: ["Pending", "Paid", "Disputed", "Cancelled"],
      default: "Pending",
      index: true,
    },

    // Camera / sensor that detected the violation
    cameraId: {
      type: String,
      default: "CAM-001",
    },

    // Optional: path to evidence image/video
    evidenceUrl: {
      type: String,
      default: null,
    },

    // Whether this is a repeat offender flag
    isRepeatOffender: {
      type: Boolean,
      default: false,
    },

    // Severity level
    severity: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Medium",
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt automatically
  }
);

// ─── Virtual: hour of day ────────────────────────────────────────────────────
violationSchema.virtual("hourOfDay").get(function () {
  return new Date(this.time).getHours();
});

// ─── Pre-save hook: set severity based on violation type ─────────────────────
violationSchema.pre("save", function (next) {
  const severityMap = {
    "No Helmet": "Medium",
    "Red Light Violation": "High",
    Overspeeding: "High",
    "Wrong Lane": "Medium",
    "No Seatbelt": "Low",
    "Triple Riding": "Medium",
    "Mobile Usage While Driving": "High",
    "Illegal Parking": "Low",
    "No Signal": "Low",
    "Drunk Driving": "Critical",
  };
  this.severity = severityMap[this.violationType] || "Medium";
  next();
});

// ─── Static: count by vehicle (repeat offender check) ────────────────────────
violationSchema.statics.getRepeatOffenders = async function (minCount = 2) {
  return this.aggregate([
    { $group: { _id: "$vehicleNumber", count: { $sum: 1 }, violations: { $push: "$$ROOT" } } },
    { $match: { count: { $gte: minCount } } },
    { $sort: { count: -1 } },
    { $limit: 20 },
  ]);
};

const Violation = mongoose.model("Violation", violationSchema);

module.exports = Violation;
