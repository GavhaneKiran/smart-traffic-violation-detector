/**
 * Database Seeder
 * Populates MongoDB with realistic sample violation data for Pune, India
 * Run: node seed/seed.js
 */

require("dotenv").config({ path: "../.env" });
const mongoose = require("mongoose");
const Violation = require("../models/Violation");

// ─── Pune locations with real coordinates ────────────────────────────────────
const PUNE_LOCATIONS = [
  { name: "FC Road", lat: 18.5204, lng: 73.8567, zone: "High Risk" },
  { name: "JM Road", lat: 18.5236, lng: 73.8478, zone: "High Risk" },
  { name: "Karve Road", lat: 18.5018, lng: 73.8231, zone: "High Risk" },
  { name: "Tilak Road", lat: 18.5163, lng: 73.8567, zone: "Medium Risk" },
  { name: "Kothrud", lat: 18.5089, lng: 73.8086, zone: "Medium Risk" },
  { name: "Baner Road", lat: 18.5591, lng: 73.7879, zone: "Medium Risk" },
  { name: "Hadapsar", lat: 18.5018, lng: 73.9231, zone: "Medium Risk" },
  { name: "Viman Nagar", lat: 18.5679, lng: 73.9143, zone: "Low Risk" },
  { name: "Hinjewadi", lat: 18.5892, lng: 73.7383, zone: "Low Risk" },
  { name: "Shivajinagar", lat: 18.5304, lng: 73.8478, zone: "High Risk" },
  { name: "Deccan Gymkhana", lat: 18.5154, lng: 73.8385, zone: "High Risk" },
  { name: "Camp Area", lat: 18.5175, lng: 73.8769, zone: "Medium Risk" },
  { name: "Pune Railway Station", lat: 18.5289, lng: 73.8741, zone: "High Risk" },
  { name: "Wakad", lat: 18.5992, lng: 73.7542, zone: "Low Risk" },
  { name: "Magarpatta", lat: 18.5127, lng: 73.9265, zone: "Low Risk" },
];

const VIOLATION_TYPES = [
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
];

const VEHICLE_PREFIXES = [
  "MH12", "MH14", "MH15", "MH43", "MH04", "MH01", "MH02", "MH06",
];

// Generate random vehicle number
const randomVehicle = () => {
  const prefix = VEHICLE_PREFIXES[Math.floor(Math.random() * VEHICLE_PREFIXES.length)];
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const l1 = letters[Math.floor(Math.random() * letters.length)];
  const l2 = letters[Math.floor(Math.random() * letters.length)];
  const num = Math.floor(Math.random() * 9000) + 1000;
  return `${prefix}${l1}${l2}${num}`;
};

// Generate random date within last 60 days
const randomDate = (daysBack = 60) => {
  const now = new Date();
  const ms = Math.floor(Math.random() * daysBack * 24 * 60 * 60 * 1000);
  const date = new Date(now - ms);
  
  // Bias toward rush hours (7-9 AM and 5-8 PM)
  const isRushHour = Math.random() < 0.4;
  if (isRushHour) {
    const rushHour = Math.random() < 0.5 ? 
      7 + Math.random() * 2 :  // Morning
      17 + Math.random() * 3;  // Evening
    date.setHours(Math.floor(rushHour), Math.floor(Math.random() * 60), 0, 0);
  }
  return date;
};

// ─── Generate violations with repeat offenders ────────────────────────────────
const generateViolations = (count = 200) => {
  const violations = [];
  
  // Create a pool of repeat offenders (10% of vehicles appear multiple times)
  const repeatPool = Array.from({ length: 15 }, () => randomVehicle());
  
  for (let i = 0; i < count; i++) {
    const location = PUNE_LOCATIONS[Math.floor(Math.random() * PUNE_LOCATIONS.length)];
    const violationType = VIOLATION_TYPES[Math.floor(Math.random() * VIOLATION_TYPES.length)];
    
    // 30% chance of using a repeat offender vehicle
    const useRepeat = Math.random() < 0.3 && repeatPool.length > 0;
    const vehicleNumber = useRepeat
      ? repeatPool[Math.floor(Math.random() * repeatPool.length)]
      : randomVehicle();

    // Fine amounts based on type
    const fineMap = {
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

    const statuses = ["Pending", "Paid", "Disputed", "Cancelled"];
    const statusWeights = [0.5, 0.35, 0.1, 0.05]; // Mostly Pending
    const rand = Math.random();
    let status = "Pending";
    let cumulative = 0;
    for (let j = 0; j < statuses.length; j++) {
      cumulative += statusWeights[j];
      if (rand < cumulative) { status = statuses[j]; break; }
    }

    violations.push({
      vehicleNumber,
      violationType,
      location: {
        name: location.name,
        coordinates: {
          lat: location.lat + (Math.random() - 0.5) * 0.005, // slight variation
          lng: location.lng + (Math.random() - 0.5) * 0.005,
        },
        zone: location.zone,
      },
      time: randomDate(60),
      confidenceScore: Math.floor(Math.random() * 15) + 85, // 85-100%
      fineAmount: fineMap[violationType],
      status,
      severity: severityMap[violationType],
      cameraId: `CAM-${String(Math.floor(Math.random() * 20) + 1).padStart(3, "0")}`,
      isRepeatOffender: useRepeat,
    });
  }
  return violations;
};

// ─── Main seed function ───────────────────────────────────────────────────────
async function seed() {
  try {
    const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/smart_traffic_db";
    
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Clear existing data
    await Violation.deleteMany({});
    console.log("🗑️  Cleared existing violations");

    // Generate and insert seed data
    const violations = generateViolations(250);
    const result = await Violation.insertMany(violations);
    console.log(`✅ Inserted ${result.length} violations successfully`);

    // Print sample stats
    const total = await Violation.countDocuments();
    const byType = await Violation.aggregate([
      { $group: { _id: "$violationType", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 3 },
    ]);

    console.log("\n📊 Seeding Summary:");
    console.log(`   Total violations: ${total}`);
    console.log("   Top 3 violation types:");
    byType.forEach((t) => console.log(`   - ${t._id}: ${t.count}`));
    console.log("\n🎉 Database seeding complete!");

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding failed:", err.message);
    process.exit(1);
  }
}

seed();
