#!/usr/bin/env bash
# Local experiment / precompute only — extracting YouTube audio violates YouTube ToS.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
OUT_DIR="${LYRIC_SYNC_OUT_DIR:-$ROOT/experiments/lyric-sync/audio}"
VIDEO_ID="${1:?Usage: extract_audio.sh <youtubeVideoId> [outStem]}"
STEM="${2:-$VIDEO_ID}"

mkdir -p "$OUT_DIR"

VENV_PY="$ROOT/experiments/beau-papa/.venv/bin/python"
YT_DLP="$ROOT/experiments/beau-papa/.venv/bin/yt-dlp"
if [[ ! -x "$YT_DLP" ]]; then
  YT_DLP="$(command -v yt-dlp || true)"
fi
if [[ -z "$YT_DLP" ]]; then
  echo "yt-dlp not found" >&2
  exit 1
fi

if ! command -v ffmpeg >/dev/null 2>&1; then
  BIN_DIR="$ROOT/experiments/beau-papa/bin"
  mkdir -p "$BIN_DIR"
  if [[ -x "$VENV_PY" ]]; then
    FFMPEG_BIN="$("$VENV_PY" -c "import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())")"
    ln -sfn "$FFMPEG_BIN" "$BIN_DIR/ffmpeg"
    export PATH="$BIN_DIR:$PATH"
  fi
fi

URL="https://www.youtube.com/watch?v=${VIDEO_ID}"
OUT_WAV="$OUT_DIR/${STEM}.wav"

echo "Extracting $URL → $OUT_WAV"
"$YT_DLP" \
  -x \
  --audio-format wav \
  --audio-quality 0 \
  -o "$OUT_DIR/${STEM}.%(ext)s" \
  --force-overwrites \
  "$URL"

echo "$OUT_WAV"
