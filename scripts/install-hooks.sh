#!/bin/sh
# Install git hooks for the project
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cp "$SCRIPT_DIR/pre-commit" "$PROJECT_DIR/.git/hooks/pre-commit"
chmod +x "$PROJECT_DIR/.git/hooks/pre-commit"

echo "Git hooks installed successfully!"
