#!/usr/bin/env python3
"""Align lyric lines (JSON) to Whisper word timestamps.

Input JSON:
  { "language": "he", "lines": [{ "sectionIndex", "lineIndex", "text" }] }

Output JSON (stdout or --out):
  { "model", "lines": [{ ..., "startSec", "endSec", "score" }] }
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import unicodedata
from difflib import SequenceMatcher
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def normalize(text: str) -> str:
    text = text.lower()
    text = unicodedata.normalize("NFD", text)
    text = "".join(ch for ch in text if unicodedata.category(ch) != "Mn")
    text = text.replace("'", " ").replace("'", " ").replace("-", " ")
    # Keep Hebrew letters \u0590-\u05FF and latin alnum
    text = re.sub(r"[^\w\s\u0590-\u05ff]", " ", text, flags=re.UNICODE)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def ensure_ffmpeg_on_path() -> None:
    import os
    import shutil

    if shutil.which("ffmpeg"):
        return
    try:
        import imageio_ffmpeg

        ffmpeg_bin = imageio_ffmpeg.get_ffmpeg_exe()
        bin_dir = ROOT / "experiments" / "beau-papa" / "bin"
        bin_dir.mkdir(parents=True, exist_ok=True)
        link = bin_dir / "ffmpeg"
        if not link.exists():
            link.symlink_to(ffmpeg_bin)
        os.environ["PATH"] = str(bin_dir) + os.pathsep + os.environ.get("PATH", "")
    except Exception as exc:  # noqa: BLE001
        raise SystemExit(f"ffmpeg not found: {exc}") from exc


def flatten_words(result: dict) -> list[dict]:
    words: list[dict] = []
    for segment in result.get("segments", []):
        for word in segment.get("words") or []:
            w = str(word.get("word", "")).strip()
            if not w:
                continue
            words.append(
                {
                    "word": w,
                    "start": float(word["start"]),
                    "end": float(word["end"]),
                }
            )
    return words


def token_stream(words: list[dict]) -> tuple[list[str], list[int]]:
    tokens: list[str] = []
    index_map: list[int] = []
    for i, w in enumerate(words):
        tok = normalize(w["word"])
        if not tok:
            continue
        for part in tok.split():
            if part:
                tokens.append(part)
                index_map.append(i)
    return tokens, index_map


def best_window_match(
    target_tokens: list[str],
    transcript_tokens: list[str],
    search_from: int,
    min_score: float = 0.42,
) -> tuple[int, int, float] | None:
    n = len(target_tokens)
    if n == 0 or not transcript_tokens:
        return None

    candidates: list[tuple[int, int, float]] = []
    for win in range(max(1, n - 3), n + 5):
        if win > len(transcript_tokens):
            break
        upper = len(transcript_tokens) - win + 1
        for i in range(search_from, upper):
            window = transcript_tokens[i : i + win]
            ratio = SequenceMatcher(None, target_tokens, window).ratio()
            shared = set(target_tokens) & set(window)
            if len(shared) >= max(2, n // 3):
                ratio = min(1.0, ratio + 0.05)
            if ratio >= min_score:
                candidates.append((i, i + win - 1, ratio))

    if not candidates:
        return None

    # Prefer earliest near-best match so verse beats later refrain repeats.
    best_score = max(c[2] for c in candidates)
    near_best = [c for c in candidates if c[2] >= best_score - 0.12]
    return min(near_best, key=lambda c: c[0])


def best_segment_match(
    text: str,
    result: dict,
    min_start: float = 0.0,
    min_score: float = 0.35,
) -> tuple[float, float, float] | None:
    """Pick earliest qualifying segment at/after min_start (not highest score)."""
    target = normalize(text)
    if not target:
        return None

    qualifying: list[tuple[float, float, float]] = []
    for seg in result.get("segments") or []:
        start = float(seg.get("start", 0.0))
        if start + 0.05 < min_start:
            continue
        score = SequenceMatcher(None, target, normalize(seg.get("text", ""))).ratio()
        if score >= min_score:
            qualifying.append((start, float(seg.get("end", start)), score))

    if not qualifying:
        # Fall back: earliest among all segments scoring reasonably, ignoring min_start.
        for seg in result.get("segments") or []:
            start = float(seg.get("start", 0.0))
            score = SequenceMatcher(None, target, normalize(seg.get("text", ""))).ratio()
            if score >= min_score:
                qualifying.append((start, float(seg.get("end", start)), score))

    if not qualifying:
        return None

    best_score = max(c[2] for c in qualifying)
    near_best = [c for c in qualifying if c[2] >= best_score - 0.12]
    return min(near_best, key=lambda c: c[0])


def align_lines(words: list[dict], result: dict, lines: list[dict]) -> list[dict]:
    tokens, idx_map = token_stream(words)
    cursor = 0
    aligned: list[dict] = []
    prev_end = 0.0

    for line in lines:
        text = str(line.get("text") or "").strip()
        target = normalize(text).split()
        base = {
            "sectionIndex": int(line.get("sectionIndex", 0)),
            "lineIndex": int(line.get("lineIndex", 0)),
            "text": text,
            "startSec": None,
            "endSec": None,
            "score": 0.0,
        }
        if not target:
            aligned.append(base)
            continue

        match = best_window_match(target, tokens, cursor)
        if match is None:
            match = best_window_match(target, tokens, 0, min_score=0.38)
        if match is None:
            seg_match = best_segment_match(text, result, min_start=prev_end, min_score=0.35)
            if seg_match is not None:
                start_sec, end_sec, score = seg_match
                base["startSec"] = round(start_sec, 2)
                base["endSec"] = round(end_sec, 2)
                base["score"] = round(score, 3)
                prev_end = end_sec
            aligned.append(base)
            continue

        start_i, end_i, score = match
        abs_start = idx_map[start_i]
        abs_end = idx_map[end_i]
        start_sec = float(words[abs_start]["start"])
        end_sec = float(words[abs_end]["end"])
        # If the earliest global rematch jumped backward past a later refrain,
        # prefer continuing forward from prev_end when possible.
        if start_sec + 0.25 < prev_end and cursor > 0:
            forward = best_window_match(target, tokens, cursor, min_score=0.38)
            if forward is not None:
                start_i, end_i, score = forward
                abs_start = idx_map[start_i]
                abs_end = idx_map[end_i]
                start_sec = float(words[abs_start]["start"])
                end_sec = float(words[abs_end]["end"])

        base["startSec"] = round(start_sec, 2)
        base["endSec"] = round(end_sec, 2)
        base["score"] = round(score, 3)
        aligned.append(base)
        cursor = end_i + 1
        prev_end = end_sec

    return aligned


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--audio", required=True)
    parser.add_argument("--lyrics", required=True, help="JSON file with lines[]")
    parser.add_argument("--language", default="he")
    parser.add_argument("--out", required=True)
    parser.add_argument("--transcript-out")
    parser.add_argument("--retranscribe", action="store_true")
    args = parser.parse_args()

    audio_path = Path(args.audio)
    lyrics_path = Path(args.lyrics)
    if not audio_path.exists():
        print(f"Missing audio {audio_path}", file=sys.stderr)
        return 1

    ensure_ffmpeg_on_path()
    payload = json.loads(lyrics_path.read_text(encoding="utf-8"))
    lines_in = payload.get("lines") or []
    language = payload.get("language") or args.language

    transcript_path = Path(args.transcript_out) if args.transcript_out else audio_path.with_suffix(".transcript.json")

    if transcript_path.exists() and not args.retranscribe:
        result = json.loads(transcript_path.read_text(encoding="utf-8"))
    else:
        import whisper

        print(f"Loading Whisper base ({language})…", file=sys.stderr)
        model = whisper.load_model("base")
        print(f"Transcribing {audio_path}…", file=sys.stderr)
        result = model.transcribe(
            str(audio_path),
            language=language,
            word_timestamps=True,
            verbose=False,
        )
        transcript_path.parent.mkdir(parents=True, exist_ok=True)
        transcript_path.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")

    words = flatten_words(result)
    aligned = align_lines(words, result, lines_in)
    out = {"model": "whisper-base", "language": language, "lines": aligned}
    Path(args.out).parent.mkdir(parents=True, exist_ok=True)
    Path(args.out).write_text(json.dumps(out, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    timed = sum(1 for l in aligned if l.get("startSec") is not None)
    print(f"Aligned {timed}/{len(aligned)} lines → {args.out}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
