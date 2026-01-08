#!/bin/bash

# Browser test runner for Daily Moments app
# Requires dev-browser server to be running

# Find the dev-browser skill directory
DEV_BROWSER_DIR=$(find ~/.claude/plugins/cache -name "dev-browser" -type d 2>/dev/null | head -1)
SKILL_DIR="$DEV_BROWSER_DIR/skills/dev-browser"

if [ ! -d "$SKILL_DIR" ]; then
  echo "Error: dev-browser skill not found"
  echo "Make sure the dev-browser plugin is installed"
  exit 1
fi

# Check if server is running
if ! curl -s http://localhost:9222 > /dev/null 2>&1; then
  echo "Warning: dev-browser server doesn't appear to be running"
  echo "Start it with: $SKILL_DIR/server.sh"
fi

# Get the directory of this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Set default app URL if not provided
APP_URL="${APP_URL:-http://localhost:5174/storyworthy/}"

# Run the tests from the dev-browser skill directory
cd "$SKILL_DIR"
APP_URL="$APP_URL" SCREENSHOT_DIR="$SCRIPT_DIR/screenshots" npx tsx "$SCRIPT_DIR/run-tests.ts"
