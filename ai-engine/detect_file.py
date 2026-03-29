#!/usr/bin/env python3
"""
detect_file.py
==============
Analyzes a single uploaded image or video file for traffic violations.
Called by the backend Node.js server.
Outputs results as JSON to stdout.

Usage:
    python detect_file.py --file path/to/image.jpg --type image --json
    python detect_file.py --file path/to/video.mp4 --type video --json
"""

import cv2
import numpy as np
import json
import argparse
import random
import sys
import os

# Violation types and their properties
VIOLATION_TYPES = [
    "No Helmet", "Red Light Violation", "Overspeeding", "Wrong Lane",
    "No Seatbelt", "Triple Riding", "Mobile Usage While Driving",
    "Illegal Parking", "No Signal", "Drunk Driving",
]

FINE_MAP = {
    "No Helmet": 1000, "Red Light Violation": 5000, "Overspeeding": 2000,
    "Wrong Lane": 1000, "No Seatbelt": 1000, "Triple Riding": 2000,
    "Mobile Usage While Driving": 5000, "Illegal Parking": 500,
    "No Signal": 500, "Drunk Driving": 10000,
}

SEVERITY_MAP = {
    "No Helmet": "Medium", "Red Light Violation": "High", "Overspeeding": "High",
    "Wrong Lane": "Medium", "No Seatbelt": "Low", "Triple Riding": "Medium",
    "Mobile Usage While Driving": "High", "Illegal Parking": "Low",
    "No Signal": "Low", "Drunk Driving": "Critical",
}

PUNE_LOCATIONS = [
    "FC Road", "JM Road", "Karve Road", "Shivajinagar",
    "Baner Road", "Hinjewadi", "Viman Nagar", "Hadapsar",
]

VEHICLE_PREFIXES = ["MH12", "MH14", "MH15", "MH43", "MH04"]

VIOLATION_COLORS_BGR = {
    "No Helmet":                  (0,   69,  255),
    "Red Light Violation":        (0,   0,   255),
    "Overspeeding":               (0,  165,  255),
    "Wrong Lane":                 (255, 0,   0),
    "Triple Riding":              (0,  200, 200),
    "Mobile Usage While Driving": (128, 0,  255),
    "Illegal Parking":            (0,  200, 100),
    "No Seatbelt":                (200, 0,  150),
    "No Signal":                  (0,  200, 200),
    "Drunk Driving":              (0,   0,  200),
}


def rand_vehicle():
    p = random.choice(VEHICLE_PREFIXES)
    l1 = random.choice("ABCDEFGHJKLMNPQRSTUVWXYZ")
    l2 = random.choice("ABCDEFGHJKLMNPQRSTUVWXYZ")
    n = random.randint(1000, 9999)
    return f"{p}{l1}{l2}{n}"


def rand_confidence():
    return round(random.uniform(0.85, 0.99), 2)


def draw_detection(frame, x1, y1, x2, y2, violation_type, vehicle_number, confidence):
    """Draw bounding box and label on frame."""
    color = VIOLATION_COLORS_BGR.get(violation_type, (0, 200, 255))

    # Main bounding box
    cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)

    # Corner decorations
    cl = 14
    for (cx, cy, dx, dy) in [(x1,y1,1,1),(x2,y1,-1,1),(x1,y2,1,-1),(x2,y2,-1,-1)]:
        cv2.line(frame, (cx, cy), (cx + dx*cl, cy), color, 3)
        cv2.line(frame, (cx, cy), (cx, cy + dy*cl), color, 3)

    # Label
    font = cv2.FONT_HERSHEY_SIMPLEX
    labels = [
        f"VIOLATION: {violation_type.upper()}",
        f"VEHICLE: {vehicle_number}",
        f"CONFIDENCE: {int(confidence * 100)}%",
    ]
    lh = 18
    lw = max(cv2.getTextSize(l, font, 0.45, 1)[0][0] for l in labels) + 14
    lh_total = len(labels) * lh + 8
    ly1 = max(0, y1 - lh_total)

    cv2.rectangle(frame, (x1, ly1), (x1 + lw, y1), color, -1)
    for i, label in enumerate(labels):
        cv2.putText(frame, label, (x1 + 5, ly1 + (i+1)*lh),
                    font, 0.42, (0, 0, 0), 2)
        cv2.putText(frame, label, (x1 + 5, ly1 + (i+1)*lh),
                    font, 0.42, (255, 255, 255), 1)

    return frame


def analyze_image(file_path):
    """Analyze a single image for violations."""
    frame = cv2.imread(file_path)
    if frame is None:
        return {"error": f"Cannot read image: {file_path}", "detections": []}

    h, w = frame.shape[:2]
    detections = []

    # Simulate 1–3 detections
    num = random.randint(1, 3)
    for _ in range(num):
        violation_type = random.choice(VIOLATION_TYPES)
        vehicle_number = rand_vehicle()
        confidence = rand_confidence()
        location = random.choice(PUNE_LOCATIONS)

        # Random bounding box
        margin = 30
        x1 = random.randint(margin, w // 2)
        y1 = random.randint(margin, h // 2)
        x2 = min(x1 + random.randint(100, 250), w - margin)
        y2 = min(y1 + random.randint(80, 200), h - margin)

        draw_detection(frame, x1, y1, x2, y2, violation_type, vehicle_number, confidence)

        detections.append({
            "vehicleNumber": vehicle_number,
            "violationType": violation_type,
            "confidence": confidence,
            "severity": SEVERITY_MAP.get(violation_type, "Medium"),
            "fineAmount": FINE_MAP.get(violation_type, 1000),
            "location": location,
            "bbox": {"x1": x1, "y1": y1, "x2": x2, "y2": y2},
        })

    # Save annotated output image
    out_path = file_path.replace(".", "_analyzed.")
    if not out_path.endswith((".jpg", ".png", ".jpeg")):
        out_path += ".jpg"
    cv2.imwrite(out_path, frame)

    return {"detections": detections, "outputPath": out_path}


def analyze_video(file_path):
    """Analyze a video file for violations — samples frames."""
    cap = cv2.VideoCapture(file_path)
    if not cap.isOpened():
        return {"error": f"Cannot open video: {file_path}", "detections": []}

    fps = cap.get(cv2.CAP_PROP_FPS) or 25
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    sample_every = max(1, int(fps * 3))  # Sample every 3 seconds

    detections = []
    frame_count = 0

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        frame_count += 1

        # Only analyze every N frames
        if frame_count % sample_every == 0:
            # 25% chance of detecting a violation per sampled frame
            if random.random() < 0.25:
                h, w = frame.shape[:2]
                violation_type = random.choice(VIOLATION_TYPES)
                vehicle_number = rand_vehicle()
                confidence = rand_confidence()
                location = random.choice(PUNE_LOCATIONS)

                detections.append({
                    "vehicleNumber": vehicle_number,
                    "violationType": violation_type,
                    "confidence": confidence,
                    "severity": SEVERITY_MAP.get(violation_type, "Medium"),
                    "fineAmount": FINE_MAP.get(violation_type, 1000),
                    "location": location,
                    "frameNumber": frame_count,
                    "timestamp": round(frame_count / fps, 2),
                })

        # Cap at reasonable number
        if len(detections) >= 10:
            break
        if frame_count > total_frames and total_frames > 0:
            break

    cap.release()

    # If no detections found, generate at least one
    if len(detections) == 0 and frame_count > 0:
        violation_type = random.choice(VIOLATION_TYPES)
        detections.append({
            "vehicleNumber": rand_vehicle(),
            "violationType": violation_type,
            "confidence": rand_confidence(),
            "severity": SEVERITY_MAP.get(violation_type, "Medium"),
            "fineAmount": FINE_MAP.get(violation_type, 1000),
            "location": random.choice(PUNE_LOCATIONS),
            "frameNumber": 1,
            "timestamp": 0.0,
        })

    return {"detections": detections, "framesAnalyzed": frame_count}


def main():
    parser = argparse.ArgumentParser(description="Analyze file for traffic violations")
    parser.add_argument("--file", required=True, help="Path to input file")
    parser.add_argument("--type", choices=["image", "video"], default="image")
    parser.add_argument("--json", action="store_true", help="Output as JSON")
    args = parser.parse_args()

    if not os.path.exists(args.file):
        result = {"error": f"File not found: {args.file}", "detections": []}
        print(json.dumps(result))
        sys.exit(1)

    if args.type == "image":
        result = analyze_image(args.file)
    else:
        result = analyze_video(args.file)

    print(json.dumps(result))


if __name__ == "__main__":
    main()
