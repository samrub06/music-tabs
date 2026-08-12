#!/usr/bin/env bash
# Resilient local cover migration: restarts until catalog exhausted.
# Usage: bash scripts/run-migrate-song-covers.sh [batch_size] [concurrency]
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

BATCH="${1:-80}"
CONCURRENCY="${2:-6}"
LOG_DIR="$ROOT/experiments/cover-migrate"
mkdir -p "$LOG_DIR"
LOG="$LOG_DIR/migrate.log"

echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] start batch=$BATCH concurrency=$CONCURRENCY" | tee -a "$LOG"

while true; do
  echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] batch limit=$BATCH" | tee -a "$LOG"
  set +e
  npx tsx scripts/migrate-song-covers-to-storage.ts --write --limit="$BATCH" --concurrency="$CONCURRENCY" 2>&1 | tee -a "$LOG"
  code=${PIPESTATUS[0]}
  set -e

  if [[ $code -ne 0 ]]; then
    echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] batch failed code=$code — retry in 30s" | tee -a "$LOG"
    sleep 30
    continue
  fi

  # Stop when last Done line reports nothing left / 0 processed candidates
  if grep -E "Candidates=0 |Done ok=0 fail=0 skip=0 \(nothing left\)" "$LOG" | tail -1 | grep -q .; then
    # Check most recent Candidates= line
    last_cand=$(grep -E "^Candidates=" "$LOG" | tail -1 || true)
    if [[ "$last_cand" == Candidates=0* ]]; then
      echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] catalog exhausted" | tee -a "$LOG"
      break
    fi
  fi

  last_cand=$(grep -E "^Candidates=" "$LOG" | tail -1 || true)
  if [[ "$last_cand" == Candidates=0* ]]; then
    echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] catalog exhausted" | tee -a "$LOG"
    break
  fi

  sleep 2
done

echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] finished" | tee -a "$LOG"
