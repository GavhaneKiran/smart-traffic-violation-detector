#!/bin/bash
# ─────────────────────────────────────────────────────────
# SVPD Quick Start Script
# Installs all dependencies and starts all services
# Usage: chmod +x start.sh && ./start.sh
# ─────────────────────────────────────────────────────────

set -e  # Exit on error

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║  🚦  SMART TRAFFIC VIOLATION DETECTOR — STARTUP      ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# Check prerequisites
check_command() {
  if ! command -v "$1" &> /dev/null; then
    echo "❌ $1 is not installed. Please install it first."
    exit 1
  else
    echo "✅ $1 found: $($1 --version 2>&1 | head -1)"
  fi
}

echo "🔍 Checking prerequisites..."
check_command node
check_command npm
check_command python3

echo ""
echo "📦 Installing backend dependencies..."
cd backend && npm install
echo "✅ Backend dependencies installed"

echo ""
echo "📦 Installing frontend dependencies..."
cd ../frontend && npm install
echo "✅ Frontend dependencies installed"

echo ""
echo "🐍 Installing Python dependencies..."
cd ../ai-engine && pip3 install -r requirements.txt --quiet
echo "✅ Python dependencies installed"

cd ..

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║  🚀 All dependencies installed!                       ║"
echo "╠══════════════════════════════════════════════════════╣"
echo "║  Now run each in a separate terminal:                 ║"
echo "║                                                       ║"
echo "║  Terminal 1 (MongoDB):                                ║"
echo "║    mongod --dbpath /data/db                           ║"
echo "║                                                       ║"
echo "║  Terminal 2 (Backend):                                ║"
echo "║    cd backend && node seed/seed.js && npm run dev     ║"
echo "║                                                       ║"
echo "║  Terminal 3 (Frontend):                               ║"
echo "║    cd frontend && npm run dev                         ║"
echo "║                                                       ║"
echo "║  Terminal 4 (AI Engine):                              ║"
echo "║    cd ai-engine && python3 detect.py --demo           ║"
echo "║                                                       ║"
echo "║  Open: http://localhost:3000                          ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""
