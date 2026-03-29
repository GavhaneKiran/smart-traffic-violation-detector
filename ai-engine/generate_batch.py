#!/usr/bin/env python3
"""
Batch Violation Generator
==========================
Quickly generates and posts a batch of simulated violations to the backend.
Useful for populating the database without running the full detection UI.

Usage:
    python generate_batch.py             # Generate 50 violations
    python generate_batch.py --count 200 # Generate 200 violations
    python generate_batch.py --api http://localhost:5000
"""

import requests
import random
import argparse
import time
from datetime import datetime, timedelta

API_BASE_URL = "http://localhost:5000"

PUNE_LOCATIONS = [
    {"name": "FC Road",         "lat": 18.5204, "lng": 73.8567, "zone": "High Risk"},
    {"name": "JM Road",         "lat": 18.5236, "lng": 73.8478, "zone": "High Risk"},
    {"name": "Karve Road",      "lat": 18.5018, "lng": 73.8231, "zone": "High Risk"},
    {"name": "Shivajinagar",    "lat": 18.5304, "lng": 73.8478, "zone": "High Risk"},
    {"name": "Baner Road",      "lat": 18.5591, "lng": 73.7879, "zone": "Medium Risk"},
    {"name": "Hinjewadi",       "lat": 18.5892, "lng": 73.7383, "zone": "Medium Risk"},
    {"name": "Viman Nagar",     "lat": 18.5679, "lng": 73.9143, "zone": "Low Risk"},
    {"name": "Hadapsar",        "lat": 18.5018, "lng": 73.9231, "zone": "Medium Risk"},
    {"name": "Wakad",           "lat": 18.5992, "lng": 73.7542, "zone": "Low Risk"},
    {"name": "Deccan Gymkhana", "lat": 18.5154, "lng": 73.8385, "zone": "High Risk"},
]

VIOLATION_TYPES = [
    "No Helmet", "Red Light Violation", "Overspeeding", "Wrong Lane",
    "No Seatbelt", "Triple Riding", "Mobile Usage While Driving",
    "Illegal Parking", "No Signal", "Drunk Driving",
]

VEHICLE_PREFIXES = ["MH12", "MH14", "MH15", "MH43", "MH04", "MH01"]


def random_vehicle():
    prefix = random.choice(VEHICLE_PREFIXES)
    l1 = random.choice("ABCDEFGHJKLMNPQRSTUVWXYZ")
    l2 = random.choice("ABCDEFGHJKLMNPQRSTUVWXYZ")
    num = random.randint(1000, 9999)
    return f"{prefix}{l1}{l2}{num}"


def random_past_date(days=30):
    """Random datetime in the past `days` days, biased toward rush hours."""
    now = datetime.now()
    delta = timedelta(seconds=random.randint(0, days * 86400))
    dt = now - delta
    if random.random() < 0.4:
        hour = random.choice([7, 8, 9, 17, 18, 19, 20])
        dt = dt.replace(hour=hour, minute=random.randint(0, 59))
    return dt.isoformat()


def generate_violations(count=50):
    # Create a repeat-offender pool
    repeat_pool = [random_vehicle() for _ in range(8)]
    violations = []

    for _ in range(count):
        location = random.choice(PUNE_LOCATIONS)
        use_repeat = random.random() < 0.25
        vehicle = random.choice(repeat_pool) if use_repeat else random_vehicle()

        violations.append({
            "vehicleNumber": vehicle,
            "violationType": random.choice(VIOLATION_TYPES),
            "location": {
                "name": location["name"],
                "coordinates": {
                    "lat": location["lat"] + random.uniform(-0.003, 0.003),
                    "lng": location["lng"] + random.uniform(-0.003, 0.003),
                },
                "zone": location["zone"],
            },
            "time": random_past_date(30),
            "confidenceScore": random.randint(85, 99),
            "cameraId": f"CAM-{random.randint(1, 20):03d}",
        })

    return violations


def main():
    parser = argparse.ArgumentParser(description="Batch Violation Generator")
    parser.add_argument("--count", type=int, default=50, help="Number of violations to generate")
    parser.add_argument("--api",   type=str, default="http://localhost:5000", help="API base URL")
    parser.add_argument("--delay", type=float, default=0.05, help="Delay between requests (seconds)")
    args = parser.parse_args()

    global API_BASE_URL
    API_BASE_URL = args.api

    print(f"\n🚀 Batch Generator - generating {args.count} violations...")
    print(f"   API: {API_BASE_URL}/api/violations\n")

    violations = generate_violations(args.count)
    success = 0
    fail = 0

    for i, v in enumerate(violations):
        try:
            r = requests.post(f"{API_BASE_URL}/api/violations", json=v, timeout=5)
            if r.status_code == 201:
                success += 1
                data = r.json()
                repeat_flag = " 🔁 REPEAT" if data.get("isRepeatOffender") else ""
                print(f"  [{i+1:3d}] ✅ {v['vehicleNumber']} – {v['violationType']}{repeat_flag}")
            else:
                fail += 1
                print(f"  [{i+1:3d}] ❌ Failed ({r.status_code}): {v['vehicleNumber']}")
        except requests.ConnectionError:
            print(f"\n❌ Cannot connect to {API_BASE_URL}. Is the backend running?")
            break
        except Exception as e:
            fail += 1
            print(f"  [{i+1:3d}] ❌ Error: {e}")

        if args.delay > 0:
            time.sleep(args.delay)

    print(f"\n{'='*50}")
    print(f"  ✅ Successful: {success}")
    print(f"  ❌ Failed:     {fail}")
    print(f"  Total:         {args.count}")
    print(f"{'='*50}\n")


if __name__ == "__main__":
    main()
