#!/usr/bin/env python3
"""
Smart Traffic Violation Pattern Detector - AI Engine
======================================================
Simulates AI-based traffic violation detection using OpenCV.
Detects violations and automatically reports them to the backend API.

Usage:
    python detect.py                    # Run demo simulation
    python detect.py --image path.jpg  # Analyze a single image
    python detect.py --video path.mp4  # Analyze a video file
    python detect.py --live            # Live webcam detection
"""

import cv2
import numpy as np
import requests
import json
import time
import random
import argparse
import sys
import os
from datetime import datetime

# ─── Configuration ────────────────────────────────────────────────────────────
API_BASE_URL = os.getenv("API_URL", "http://localhost:5000")
VIOLATIONS_ENDPOINT = f"{API_BASE_URL}/api/violations"
CONFIDENCE_THRESHOLD = 0.75  # Minimum confidence to report

# Pune city locations with GPS coordinates
PUNE_LOCATIONS = [
    {"name": "FC Road",              "lat": 18.5204, "lng": 73.8567, "zone": "High Risk"},
    {"name": "JM Road",              "lat": 18.5236, "lng": 73.8478, "zone": "High Risk"},
    {"name": "Karve Road",           "lat": 18.5018, "lng": 73.8231, "zone": "High Risk"},
    {"name": "Shivajinagar",         "lat": 18.5304, "lng": 73.8478, "zone": "High Risk"},
    {"name": "Deccan Gymkhana",      "lat": 18.5154, "lng": 73.8385, "zone": "High Risk"},
    {"name": "Baner Road",           "lat": 18.5591, "lng": 73.7879, "zone": "Medium Risk"},
    {"name": "Hinjewadi",            "lat": 18.5892, "lng": 73.7383, "zone": "Medium Risk"},
    {"name": "Viman Nagar",          "lat": 18.5679, "lng": 73.9143, "zone": "Low Risk"},
    {"name": "Hadapsar",             "lat": 18.5018, "lng": 73.9231, "zone": "Medium Risk"},
    {"name": "Pune Railway Station", "lat": 18.5289, "lng": 73.8741, "zone": "High Risk"},
]

VIOLATION_TYPES = [
    "No Helmet",
    "Red Light Violation",
    "Overspeeding",
    "Wrong Lane",
    "Triple Riding",
    "Mobile Usage While Driving",
    "Illegal Parking",
    "No Seatbelt",
]

VEHICLE_PREFIXES = ["MH12", "MH14", "MH15", "MH43", "MH04", "MH01", "MH06"]

# Color palette for bounding boxes (BGR format for OpenCV)
VIOLATION_COLORS = {
    "No Helmet":                  (0,   69,  255),  # Red
    "Red Light Violation":        (0,   0,   255),  # Bright red
    "Overspeeding":               (0,  165,  255),  # Orange
    "Wrong Lane":                 (255, 0,   0),    # Blue
    "Triple Riding":              (0,   255, 255),  # Yellow
    "Mobile Usage While Driving": (128, 0,   255),  # Purple
    "Illegal Parking":            (0,   255, 128),  # Green
    "No Seatbelt":                (255, 0,   128),  # Pink
}

# ─── Utility Functions ────────────────────────────────────────────────────────

def random_vehicle_number():
    """Generate a realistic Indian vehicle number."""
    prefix = random.choice(VEHICLE_PREFIXES)
    letters = "ABCDEFGHJKLMNPQRSTUVWXYZ"
    l1 = random.choice(letters)
    l2 = random.choice(letters)
    num = random.randint(1000, 9999)
    return f"{prefix}{l1}{l2}{num}"


def random_location():
    """Pick a random Pune location."""
    return random.choice(PUNE_LOCATIONS)


def random_violation():
    """Pick a random violation type."""
    return random.choice(VIOLATION_TYPES)


def get_confidence():
    """Simulate AI detection confidence (85–99%)."""
    return round(random.uniform(0.85, 0.99), 2)


# ─── API Communication ────────────────────────────────────────────────────────

def post_violation(vehicle_number: str, violation_type: str, location: dict, confidence: float) -> dict:
    """
    Post a detected violation to the backend API.
    Returns the API response or an error dict.
    """
    payload = {
        "vehicleNumber": vehicle_number,
        "violationType": violation_type,
        "location": {
            "name": location["name"],
            "coordinates": {
                "lat": location["lat"] + random.uniform(-0.002, 0.002),
                "lng": location["lng"] + random.uniform(-0.002, 0.002),
            },
            "zone": location["zone"],
        },
        "time": datetime.now().isoformat(),
        "confidenceScore": int(confidence * 100),
        "cameraId": f"CAM-{random.randint(1, 20):03d}",
    }

    try:
        response = requests.post(
            VIOLATIONS_ENDPOINT,
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=5,
        )
        if response.status_code == 201:
            data = response.json()
            print(f"  ✅ Reported to backend: {vehicle_number} – {violation_type}")
            if data.get("isRepeatOffender"):
                print(f"  🔁 REPEAT OFFENDER DETECTED: {vehicle_number}")
            return data
        else:
            print(f"  ⚠️  Backend returned {response.status_code}: {response.text[:100]}")
            return {"error": response.text}
    except requests.exceptions.ConnectionError:
        print(f"  ❌ Cannot reach backend at {API_BASE_URL}. Is it running?")
        return {"error": "Connection refused"}
    except requests.exceptions.Timeout:
        print(f"  ❌ Request timed out.")
        return {"error": "Timeout"}


# ─── OpenCV Drawing Helpers ───────────────────────────────────────────────────

def draw_violation_box(frame: np.ndarray, x1: int, y1: int, x2: int, y2: int,
                        violation_type: str, vehicle_number: str, confidence: float) -> np.ndarray:
    """
    Draw a detection bounding box with violation info overlay on a frame.
    """
    color = VIOLATION_COLORS.get(violation_type, (0, 255, 255))

    # Draw bounding box with thick border
    cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)

    # Corner decorations (tech-style corners)
    corner_len = 15
    thickness = 3
    # Top-left
    cv2.line(frame, (x1, y1), (x1 + corner_len, y1), color, thickness)
    cv2.line(frame, (x1, y1), (x1, y1 + corner_len), color, thickness)
    # Top-right
    cv2.line(frame, (x2, y1), (x2 - corner_len, y1), color, thickness)
    cv2.line(frame, (x2, y1), (x2, y1 + corner_len), color, thickness)
    # Bottom-left
    cv2.line(frame, (x1, y2), (x1 + corner_len, y2), color, thickness)
    cv2.line(frame, (x1, y2), (x1, y2 - corner_len), color, thickness)
    # Bottom-right
    cv2.line(frame, (x2, y2), (x2 - corner_len, y2), color, thickness)
    cv2.line(frame, (x2, y2), (x2, y2 - corner_len), color, thickness)

    # Label background
    label_lines = [
        f"⚠ {violation_type.upper()}",
        f"VEH: {vehicle_number}",
        f"CONF: {int(confidence * 100)}%",
    ]
    font = cv2.FONT_HERSHEY_SIMPLEX
    font_scale = 0.45
    font_thickness = 1
    line_height = 18
    label_h = len(label_lines) * line_height + 8
    label_w = max(cv2.getTextSize(l, font, font_scale, font_thickness)[0][0] for l in label_lines) + 12

    bg_y1 = max(0, y1 - label_h)
    cv2.rectangle(frame, (x1, bg_y1), (x1 + label_w, y1), color, -1)

    for i, line in enumerate(label_lines):
        text_y = bg_y1 + (i + 1) * line_height
        cv2.putText(frame, line, (x1 + 4, text_y), font, font_scale, (0, 0, 0), font_thickness + 1)
        cv2.putText(frame, line, (x1 + 4, text_y), font, font_scale, (255, 255, 255), font_thickness)

    return frame


def draw_hud(frame: np.ndarray, violation_count: int, fps: float, location_name: str) -> np.ndarray:
    """Draw heads-up display overlay on the frame."""
    h, w = frame.shape[:2]
    overlay = frame.copy()

    # Top header bar
    cv2.rectangle(overlay, (0, 0), (w, 48), (10, 12, 20), -1)
    cv2.line(overlay, (0, 48), (w, 48), (0, 165, 255), 1)

    # Bottom status bar
    cv2.rectangle(overlay, (0, h - 36), (w, h), (10, 12, 20), -1)
    cv2.line(overlay, (0, h - 36), (w, h - 36), (0, 165, 255), 1)

    font = cv2.FONT_HERSHEY_SIMPLEX

    # Title
    cv2.putText(frame, "SMART TRAFFIC VIOLATION DETECTOR", (10, 28),
                font, 0.55, (0, 165, 255), 1)

    # Right: location
    loc_text = f"LOC: {location_name}"
    loc_size = cv2.getTextSize(loc_text, font, 0.45, 1)[0]
    cv2.putText(frame, loc_text, (w - loc_size[0] - 10, 28), font, 0.45, (200, 200, 200), 1)

    # Bottom: stats
    stats_text = f"VIOLATIONS: {violation_count:04d}  |  FPS: {fps:.1f}  |  STATUS: MONITORING"
    cv2.putText(frame, stats_text, (10, h - 12), font, 0.42, (0, 200, 100), 1)

    # Timestamp
    ts = datetime.now().strftime("%Y-%m-%d  %H:%M:%S")
    ts_size = cv2.getTextSize(ts, font, 0.42, 1)[0]
    cv2.putText(frame, ts, (w - ts_size[0] - 10, h - 12), font, 0.42, (200, 200, 200), 1)

    # Blend overlay
    cv2.addWeighted(overlay, 0.85, frame, 0.15, 0, frame)
    return frame


# ─── Detection Modes ──────────────────────────────────────────────────────────

def simulate_on_frame(frame: np.ndarray, violation_count: int, detect_interval: float = 2.0):
    """
    Simulate AI detection on a single frame.
    Returns (modified_frame, detected_violation_or_None)
    """
    h, w = frame.shape[:2]

    # Decide whether to "detect" a violation in this frame
    # In real YOLO, this would be model inference
    if random.random() < 0.15:  # ~15% chance per call
        # Simulate a random bounding box
        margin = 50
        x1 = random.randint(margin, w // 2)
        y1 = random.randint(margin, h // 2)
        x2 = random.randint(x1 + 80, min(x1 + 250, w - margin))
        y2 = random.randint(y1 + 80, min(y1 + 250, h - margin))

        violation_type = random_violation()
        vehicle_number = random_vehicle_number()
        confidence = get_confidence()

        frame = draw_violation_box(frame, x1, y1, x2, y2, violation_type, vehicle_number, confidence)

        return frame, {
            "violation_type": violation_type,
            "vehicle_number": vehicle_number,
            "confidence": confidence,
        }

    return frame, None


def run_demo_simulation(num_violations: int = 10, delay: float = 1.5):
    """
    Run a simulation that generates and reports violations without a camera.
    Creates synthetic frames with OpenCV and displays them.
    """
    print("\n" + "=" * 60)
    print("  SMART TRAFFIC VIOLATION DETECTOR - DEMO MODE")
    print("=" * 60)
    print(f"  Generating {num_violations} simulated detections...")
    print(f"  API Endpoint: {VIOLATIONS_ENDPOINT}")
    print("  Press Ctrl+C to stop\n")

    violation_count = 0
    window_name = "SVPD - AI Detection Engine (Demo)"

    try:
        for i in range(num_violations):
            # Create a synthetic background frame (dark city-like)
            frame = np.zeros((540, 960, 3), dtype=np.uint8)

            # Add noise texture to simulate a real camera feed
            noise = np.random.randint(0, 25, frame.shape, dtype=np.uint8)
            frame = cv2.add(frame, noise)

            # Draw road simulation
            # Road surface
            cv2.rectangle(frame, (0, 250), (960, 540), (30, 30, 35), -1)
            # Lane markings
            for lx in range(50, 960, 80):
                cv2.line(frame, (lx, 290), (lx + 40, 290), (60, 60, 70), 2)
                cv2.line(frame, (lx, 390), (lx + 40, 390), (60, 60, 70), 2)
            # Center double yellow line
            cv2.line(frame, (0, 340), (960, 340), (0, 180, 180), 2)
            cv2.line(frame, (0, 344), (960, 344), (0, 180, 180), 2)

            # Simulate vehicle rectangles
            num_vehicles = random.randint(2, 5)
            for _ in range(num_vehicles):
                vx = random.randint(50, 850)
                vy = random.randint(260, 440)
                vw = random.randint(60, 120)
                vh = random.randint(40, 80)
                # Car body
                car_color = (random.randint(40, 180), random.randint(40, 180), random.randint(40, 180))
                cv2.rectangle(frame, (vx, vy), (vx + vw, vy + vh), car_color, -1)
                # Windows
                cv2.rectangle(frame, (vx + 8, vy + 6), (vx + vw - 8, vy + vh // 2 - 4), (80, 120, 160), -1)

            # Detect a violation
            location = random_location()
            violation_type = random_violation()
            vehicle_number = random_vehicle_number()
            confidence = get_confidence()

            # Draw on the frame
            x1 = random.randint(100, 500)
            y1 = random.randint(260, 380)
            x2 = x1 + random.randint(100, 200)
            y2 = y1 + random.randint(80, 160)
            x2 = min(x2, 920)
            y2 = min(y2, 490)

            frame = draw_violation_box(frame, x1, y1, x2, y2, violation_type, vehicle_number, confidence)
            frame = draw_hud(frame, violation_count, 24.0, location["name"])

            # Show frame
            cv2.imshow(window_name, frame)

            print(f"\n[{i + 1}/{num_violations}] 🔍 Detection:")
            print(f"  Vehicle:    {vehicle_number}")
            print(f"  Violation:  {violation_type}")
            print(f"  Location:   {location['name']} ({location['zone']})")
            print(f"  Confidence: {int(confidence * 100)}%")

            # Post to backend if confidence is high enough
            if confidence >= CONFIDENCE_THRESHOLD:
                post_violation(vehicle_number, violation_type, location, confidence)
                violation_count += 1

            # Wait for key press or delay
            key = cv2.waitKey(int(delay * 1000)) & 0xFF
            if key == ord('q') or key == 27:  # q or ESC to quit
                print("\n⛔ Detection stopped by user.")
                break

    except KeyboardInterrupt:
        print("\n⛔ Detection stopped.")

    cv2.destroyAllWindows()
    print(f"\n{'=' * 60}")
    print(f"  ✅ Detection complete: {violation_count} violations reported")
    print(f"{'=' * 60}\n")


def run_image_detection(image_path: str):
    """
    Simulate violation detection on a static image.
    """
    print(f"\n📸 Analyzing image: {image_path}")

    frame = cv2.imread(image_path)
    if frame is None:
        print(f"❌ Could not load image: {image_path}")
        sys.exit(1)

    location = random_location()
    detections = []

    # Simulate 1–3 detections on the image
    num_detections = random.randint(1, 3)
    h, w = frame.shape[:2]

    for _ in range(num_detections):
        x1 = random.randint(20, w // 3)
        y1 = random.randint(20, h // 3)
        x2 = random.randint(x1 + 80, min(x1 + 250, w - 20))
        y2 = random.randint(y1 + 60, min(y1 + 200, h - 20))

        violation_type = random_violation()
        vehicle_number = random_vehicle_number()
        confidence = get_confidence()

        frame = draw_violation_box(frame, x1, y1, x2, y2, violation_type, vehicle_number, confidence)
        detections.append((violation_type, vehicle_number, confidence))

        print(f"\n  ⚠️  Detected: {violation_type}")
        print(f"     Vehicle: {vehicle_number} | Confidence: {int(confidence * 100)}%")

        if confidence >= CONFIDENCE_THRESHOLD:
            post_violation(vehicle_number, violation_type, location, confidence)

    frame = draw_hud(frame, len(detections), 0.0, location["name"])

    # Save output
    out_path = image_path.replace(".", "_detected.")
    cv2.imwrite(out_path, frame)
    print(f"\n💾 Saved output to: {out_path}")

    cv2.imshow("SVPD - Image Detection", frame)
    print("Press any key to close...")
    cv2.waitKey(0)
    cv2.destroyAllWindows()


def run_video_detection(video_path: str):
    """
    Run violation detection on a video file.
    """
    print(f"\n🎬 Analyzing video: {video_path}")
    cap = cv2.VideoCapture(video_path)

    if not cap.isOpened():
        print(f"❌ Could not open video: {video_path}")
        sys.exit(1)

    location = random_location()
    fps_target = cap.get(cv2.CAP_PROP_FPS) or 25
    violation_count = 0
    frame_count = 0
    detect_every_n_frames = int(fps_target * 2)  # detect every ~2 seconds

    prev_time = time.time()
    print("▶ Processing video... (press Q to stop)")

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        frame_count += 1
        curr_time = time.time()
        fps = 1.0 / max(curr_time - prev_time, 0.001)
        prev_time = curr_time

        # Simulate detection every N frames
        if frame_count % detect_every_n_frames == 0:
            frame, detection = simulate_on_frame(frame, violation_count)
            if detection:
                violation_count += 1
                post_violation(detection["vehicle_number"], detection["violation_type"], location, detection["confidence"])

        frame = draw_hud(frame, violation_count, fps, location["name"])
        cv2.imshow("SVPD - Video Detection", frame)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()
    print(f"\n✅ Video processed: {frame_count} frames, {violation_count} violations detected")


def run_live_detection():
    """
    Run live webcam-based violation detection.
    """
    print("\n📹 Starting live webcam detection...")
    cap = cv2.VideoCapture(0)

    if not cap.isOpened():
        print("❌ Could not open webcam. Try --demo mode instead.")
        sys.exit(1)

    violation_count = 0
    frame_count = 0
    location = random_location()
    detect_every = 60  # Simulate detection every 60 frames (~2s at 30fps)
    prev_time = time.time()

    print("▶ Live detection running... (press Q to stop)")

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        frame_count += 1
        curr_time = time.time()
        fps = 1.0 / max(curr_time - prev_time, 0.001)
        prev_time = curr_time

        if frame_count % detect_every == 0:
            frame, detection = simulate_on_frame(frame, violation_count)
            if detection:
                violation_count += 1
                post_violation(detection["vehicle_number"], detection["violation_type"], location, detection["confidence"])
            # Refresh location every few detections
            if violation_count % 5 == 0:
                location = random_location()

        frame = draw_hud(frame, violation_count, fps, location["name"])
        cv2.imshow("SVPD - Live Detection", frame)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()
    print(f"\n✅ Live session ended. {violation_count} violations detected.")


# ─── Entry Point ──────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Smart Traffic Violation Pattern Detector - AI Engine",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python detect.py                     # Run 10-violation demo simulation
  python detect.py --demo --count 20   # Run demo with 20 violations
  python detect.py --image cam01.jpg   # Analyze a static image
  python detect.py --video traffic.mp4 # Analyze a video file
  python detect.py --live              # Use webcam (requires camera)
        """,
    )
    parser.add_argument("--demo",   action="store_true", help="Run simulation demo (default)")
    parser.add_argument("--image",  type=str,            help="Path to input image")
    parser.add_argument("--video",  type=str,            help="Path to input video")
    parser.add_argument("--live",   action="store_true", help="Use live webcam")
    parser.add_argument("--count",  type=int, default=10, help="Number of violations for demo mode")
    parser.add_argument("--delay",  type=float, default=1.5, help="Delay between detections in demo mode (seconds)")
    parser.add_argument("--api",    type=str, default="http://localhost:5000", help="Backend API URL")
    args = parser.parse_args()

    # Override global API URL
    global API_BASE_URL, VIOLATIONS_ENDPOINT
    API_BASE_URL = args.api
    VIOLATIONS_ENDPOINT = f"{API_BASE_URL}/api/violations"

    print(f"\n🚦 SVPD AI Engine starting...")
    print(f"   OpenCV version: {cv2.__version__}")
    print(f"   Backend: {API_BASE_URL}")

    if args.image:
        run_image_detection(args.image)
    elif args.video:
        run_video_detection(args.video)
    elif args.live:
        run_live_detection()
    else:
        # Default: demo mode
        run_demo_simulation(num_violations=args.count, delay=args.delay)


if __name__ == "__main__":
    main()
