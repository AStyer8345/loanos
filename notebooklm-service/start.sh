#!/usr/bin/env bash
# Start the LoanOS NotebookLM bridge service
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Create venv on first run
if [ ! -d ".venv" ]; then
  echo "Creating Python virtual environment..."
  python3.12 -m venv .venv
  echo "Installing dependencies..."
  .venv/bin/pip install -q -r requirements.txt
  .venv/bin/python -m playwright install chromium
  echo "Setup complete."
fi

echo "Starting LoanOS NotebookLM bridge on http://localhost:8001"
exec .venv/bin/uvicorn main:app --port 8001 --reload
