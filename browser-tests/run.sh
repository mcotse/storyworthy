#!/bin/bash

# Browser test runner for Storyworthy app using agent-browser CLI
# Requires: npm install -g agent-browser && agent-browser install

set -e

# Check if agent-browser is installed
if ! command -v agent-browser &> /dev/null; then
  echo "Error: agent-browser is not installed"
  echo "Install it with: npm install -g agent-browser && agent-browser install"
  exit 1
fi

# Get the directory of this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Set default app URL if not provided
export APP_URL="${APP_URL:-http://localhost:5174/storyworthy/}"
export SCREENSHOT_DIR="${SCREENSHOT_DIR:-$SCRIPT_DIR/screenshots}"

# Ensure screenshot directory exists
mkdir -p "$SCREENSHOT_DIR"

# Run the tests
cd "$PROJECT_DIR"
npx tsx "$SCRIPT_DIR/run-tests.ts"
