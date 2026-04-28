#!/bin/bash

# ============================================================
# update-ip.sh — Auto-update Mac IP for iOS testing
# Usage: ./update-ip.sh
# Run this every time you switch WiFi networks
# ============================================================

set -e

FRONTEND_DIR="$(dirname "$0")/frontend"
ENV_FILE="$FRONTEND_DIR/.env"

echo ""
echo "🔍 Detecting Mac IP address..."

# Get the active non-loopback IPv4 address
IP=$(ifconfig | grep "inet " | grep -v "127.0.0.1" | awk '{print $2}' | head -1)

if [ -z "$IP" ]; then
  echo "❌ Could not detect IP address. Are you connected to a network?"
  exit 1
fi

echo "✅ Detected IP: $IP"

# Read current IP from .env
CURRENT=$(grep "^VITE_API_URL=" "$ENV_FILE" | sed 's|.*http://||' | cut -d: -f1)

if [ "$CURRENT" == "$IP" ]; then
  echo "✅ .env already has the correct IP ($IP). No change needed."
else
  echo "📝 Updating .env: $CURRENT → $IP"
  # Update the VITE_API_URL line
  sed -i '' "s|VITE_API_URL=http://[^:]*:|VITE_API_URL=http://$IP:|" "$ENV_FILE"
  echo "✅ .env updated."
fi

echo ""
echo "🏗️  Building frontend..."
cd "$FRONTEND_DIR"
npm run build

echo ""
echo "📱 Syncing to iOS..."
npx cap sync ios

echo ""
echo "============================================================"
echo "✅ All done! Current API URL: http://$IP:5002/api"
echo ""
echo "⚠️  IMPORTANT: Make sure your iPhone is on the SAME WiFi"
echo "   as your Mac (both on the same router/hotspot)."
echo ""
echo "   Then open Xcode and Run on your iPhone."  
echo "============================================================"
echo ""
