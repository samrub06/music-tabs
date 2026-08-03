#!/usr/bin/env bash
# Resumable full-catalog lyric-sync precompute (curated public playlists first).
# Usage: bash scripts/lyrics-sync/run-all-public.sh [batch_size] [start_offset]
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

BATCH="${1:-50}"
OFFSET="${2:-0}"
LOG_DIR="$ROOT/experiments/lyric-sync"
mkdir -p "$LOG_DIR"
LOG="$LOG_DIR/precompute-all.log"

echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] start offset=$OFFSET batch=$BATCH (playlist-first)" | tee -a "$LOG"

while true; do
  echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] batch offset=$OFFSET limit=$BATCH" | tee -a "$LOG"
  set +e
  npm run lyrics-sync:precompute -- --all-public --offset="$OFFSET" --limit="$BATCH" --cleanup-audio 2>&1 | tee -a "$LOG"
  code=${PIPESTATUS[0]}
  set -e
  if [[ $code -ne 0 ]]; then
    echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] batch failed code=$code — retry same offset in 60s" | tee -a "$LOG"
    sleep 60
    continue
  fi

  # Stop when this batch loaded 0 songs (offset past end)
  loaded=$(grep -E "Loaded [0-9]+ songs" "$LOG" | tail -1 | sed -E 's/.*Loaded ([0-9]+) songs.*/\1/')
  if [[ "${loaded:-0}" -eq 0 ]]; then
    echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] catalog exhausted at offset=$OFFSET" | tee -a "$LOG"
    break
  fi

  OFFSET=$((OFFSET + BATCH))
  # Brief pause between batches (YouTube quota / politeness)
  sleep 5
done

echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] finished" | tee -a "$LOG"
