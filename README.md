# 🚦 Smart Traffic Violation Pattern Detector (SVPD)

A **startup-grade AI-powered smart city system** for real-time traffic violation detection, analytics, and pattern insights.

---

## 📸 Features

| Feature | Description |
|---------|-------------|
| 🎯 AI Detection | Python + OpenCV simulated detection (YOLO-ready) |
| ⚡ Real-time | Socket.io live violation feed |
| 📊 Analytics | Charts by type, hour, day, location, severity |
| 🗺️ Heatmap | Leaflet map with violation density overlay |
| 🛡️ Admin Panel | Filter, update status, delete violations |
| 🔁 Repeat Offenders | Auto-flagging + dedicated report |
| 🤖 AI Insights | Pattern-based recommendations |
| 💾 Database | MongoDB with Mongoose ODM |

---

## 🏗️ Project Structure

```
smart-traffic-violation-detector/
├── frontend/                   # Next.js 14 App Router
│   ├── app/
│   │   ├── page.tsx            # Landing page
│   │   ├── dashboard/          # Main violations table
│   │   ├── analytics/          # Chart.js analytics
│   │   ├── heatmap/            # Leaflet map
│   │   ├── admin/              # Admin panel with filters
│   │   └── insights/           # AI insights + repeat offenders
│   ├── components/
│   │   ├── Navbar.tsx          # Shared navbar + socket status
│   │   └── StatCard.tsx        # Reusable stat card
│   └── lib/
│       └── api.ts              # Axios API helpers + types
│
├── backend/                    # Node.js + Express
│   ├── server.js               # Main server + Socket.io
│   ├── models/
│   │   └── Violation.js        # Mongoose schema
│   ├── routes/
│   │   ├── violations.js       # CRUD + filtering + stats
│   │   ├── analytics.js        # Aggregation endpoints
│   │   ├── insights.js         # AI pattern analysis
│   │   └── upload.js           # Evidence file uploads
│   └── seed/
│       └── seed.js             # 250 realistic sample violations
│
├── ai-engine/                  # Python AI module
│   ├── detect.py               # OpenCV detection engine
│   ├── generate_batch.py       # Batch data generator
│   └── requirements.txt
│
└── README.md
```

---

## ⚙️ Prerequisites

Before starting, ensure you have installed:

- **Node.js** >= 18.x → https://nodejs.org
- **MongoDB** >= 6.x → https://www.mongodb.com/try/download/community
- **Python** >= 3.9 → https://www.python.org/downloads/
- **npm** >= 9.x (comes with Node)

---

## 🚀 Setup Instructions

### Step 1 — Clone or Create the Project

```bash
cd smart-traffic-violation-detector
```

### Step 2 — Start MongoDB

```bash
# On macOS/Linux:
mongod --dbpath /data/db

# On Windows:
"C:\Program Files\MongoDB\Server\6.0\bin\mongod.exe" --dbpath "C:\data\db"

# OR if installed as a service:
sudo systemctl start mongod   # Linux
brew services start mongodb-community   # macOS
```

### Step 3 — Set Up the Backend

```bash
cd backend

# Install dependencies
npm install

# Seed the database with 250 sample violations
node seed/seed.js

# Start the backend server
npm run dev        # Development (auto-reload with nodemon)
# OR
npm start          # Production
```

The backend runs at: **http://localhost:5000**

#### Test the API:
```bash
curl http://localhost:5000/api/health
curl http://localhost:5000/api/violations
curl http://localhost:5000/api/violations/stats/summary
```

### Step 4 — Set Up the Frontend

Open a **new terminal**:

```bash
cd frontend

# Install dependencies
npm install

# Start Next.js dev server
npm run dev
```

The frontend runs at: **http://localhost:3000**

### Step 5 — Set Up the Python AI Engine

Open a **third terminal**:

```bash
cd ai-engine

# Create virtual environment (recommended)
python -m venv venv

# Activate virtual environment
source venv/bin/activate       # macOS/Linux
venv\Scripts\activate          # Windows

# Install dependencies
pip install -r requirements.txt

# Run the AI detection demo (generates violations + posts to API)
python detect.py --demo --count 15

# OR: Just batch-generate violations without the visual UI
python generate_batch.py --count 50
```

---

## 🌐 All Available Pages

| URL | Description |
|-----|-------------|
| http://localhost:3000 | Landing page |
| http://localhost:3000/dashboard | Live violations dashboard |
| http://localhost:3000/analytics | Charts and trends |
| http://localhost:3000/heatmap | Geographic violation map |
| http://localhost:3000/admin | Admin panel with filters |
| http://localhost:3000/insights | AI insights + repeat offenders |

---

## 📡 API Endpoints

### Violations
```
GET    /api/violations                   Get all (supports filters + pagination)
POST   /api/violations                   Create new violation
GET    /api/violations/:id               Get single violation
PUT    /api/violations/:id               Update violation
DELETE /api/violations/:id               Delete violation
GET    /api/violations/stats/summary     Dashboard summary stats
GET    /api/violations/repeat-offenders  Vehicles with multiple violations
```

#### Query Parameters (GET /api/violations):
```
vehicleNumber  - Filter by plate (partial match)
violationType  - Exact match
location       - Partial match on location name
status         - Pending | Paid | Disputed | Cancelled
severity       - Low | Medium | High | Critical
startDate      - ISO date string
endDate        - ISO date string
page           - Page number (default: 1)
limit          - Results per page (default: 50)
sortBy         - Field to sort by (default: time)
sortOrder      - asc | desc
```

### Analytics
```
GET /api/analytics/by-type       Violations grouped by type
GET /api/analytics/by-hour       Violations by hour of day (0–23)
GET /api/analytics/by-day        Last 30 days trend
GET /api/analytics/by-location   Top 15 hotspot locations
GET /api/analytics/by-severity   Distribution by severity
GET /api/analytics/by-weekday    Violations by day of week
GET /api/analytics/heatmap       All coordinates for map
```

### Insights
```
GET /api/insights                AI-generated pattern insights
```

---

## 🐍 Python AI Engine Usage

```bash
# Demo mode — creates synthetic frames, shows bounding boxes, posts to API
python detect.py

# Demo with custom count and delay
python detect.py --demo --count 20 --delay 2.0

# Analyze a static image file
python detect.py --image traffic_photo.jpg

# Analyze a video file
python detect.py --video highway_footage.mp4

# Live webcam detection
python detect.py --live

# Custom API endpoint
python detect.py --api http://192.168.1.100:5000

# Batch generate without UI (fastest way to populate DB)
python generate_batch.py --count 100
```

---

## 🗄️ MongoDB Schema

```javascript
{
  vehicleNumber:    String,        // e.g., "MH12AB1234"
  violationType:    String,        // Enum of 10 types
  location: {
    name:           String,        // e.g., "FC Road"
    coordinates: {
      lat:          Number,        // GPS latitude
      lng:          Number,        // GPS longitude
    },
    zone:           String,        // High Risk | Medium Risk | Low Risk
  },
  time:             Date,          // When violation occurred
  confidenceScore:  Number,        // AI confidence 0–100
  fineAmount:       Number,        // INR amount
  status:           String,        // Pending | Paid | Disputed | Cancelled
  severity:         String,        // Low | Medium | High | Critical
  cameraId:         String,        // e.g., "CAM-007"
  isRepeatOffender: Boolean,       // Auto-flagged
  evidenceUrl:      String,        // Optional file path
  createdAt:        Date,          // Auto
  updatedAt:        Date,          // Auto
}
```

---

## 🔌 Real-time Socket.io Events

```javascript
// Client → Server
socket.emit("subscribe_violations")

// Server → Client
socket.on("new_violation", (data) => {
  // data.violation  → full violation object
  // data.message    → "New No Helmet violation detected for MH12AB1234"
  // data.isRepeatOffender → boolean
})
```

---

## 🔧 Environment Variables

### Backend (`backend/.env`)
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/smart_traffic_db
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### Frontend (`frontend/.env.local`)
```
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| `MongoDB not connected` | Run `mongod` first, check MONGODB_URI |
| `Cannot GET /api/...` | Make sure backend is running on port 5000 |
| Frontend shows "API Offline" | Check backend is running, check .env.local |
| Map not loading | Check internet connection (uses OpenStreetMap tiles) |
| Python `cv2` not found | Run `pip install opencv-python` |
| Socket not connecting | Check CORS settings and SOCKET_URL env var |
| No data in charts | Run `node seed/seed.js` to populate the database |

---

## 🚀 Production Deployment Tips

1. **Backend**: Deploy to Railway, Render, or a VPS with PM2
2. **Frontend**: Deploy to Vercel (`vercel deploy`)
3. **Database**: Use MongoDB Atlas (free tier available)
4. **Update .env** files with production URLs
5. **AI Engine**: Run on a server with GPU for real YOLO inference

---

## 🤖 Upgrading to Real YOLO Detection

To use actual YOLOv8 for helmet/license plate detection:

```bash
pip install ultralytics easyocr torch torchvision

# In detect.py, replace simulate_on_frame() with:
from ultralytics import YOLO
model = YOLO("yolov8n.pt")
results = model(frame)
```

See `ai-engine/detect.py` comments for integration guidance.

---

**Built with ❤️ — Next.js · Node.js · MongoDB · Python · OpenCV · Socket.io · Leaflet**
