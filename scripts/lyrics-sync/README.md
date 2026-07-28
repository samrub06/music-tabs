# Lyric Practice sync (YouTube click-line → seek)

Local / worker precompute. Extracting YouTube audio violates YouTube ToS — do not run in public serverless production without a licensed audio source.

## Setup

1. **Apply** [`db/add-song-lyric-syncs.sql`](../../db/add-song-lyric-syncs.sql) in the Supabase SQL editor (required for shared DB sync). Until then, precompute writes a **file cache** under `experiments/lyric-sync/cache/` that the app reads in development.
2. Whisper venv:

```bash
python3 -m venv experiments/beau-papa/.venv
experiments/beau-papa/.venv/bin/pip install openai-whisper yt-dlp imageio-ffmpeg
```

3. `.env.local` with `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `YOUTUBE_API_KEY`.

## Full public catalog (recommended)

~**3973** public / catalog songs. Resumable batches skip songs that already have a `ready` sync.

```bash
# Dry-run (count + lang detection, no download)
npm run lyrics-sync:precompute -- --all-public --dry-run --limit=20

# One batch of 50 (cleanup wav after success)
npm run lyrics-sync:precompute -- --all-public --offset=0 --limit=50 --cleanup-audio

# Continuous runner until catalog exhausted (~1–3 min per song on CPU)
bash scripts/lyrics-sync/run-all-public.sh 50 0
# Resume from offset:
bash scripts/lyrics-sync/run-all-public.sh 50 200
# npm alias:
npm run lyrics-sync:precompute-all -- 50 0
```

Logs:
- `experiments/lyric-sync/precompute-all.log` — runner stdout
- `experiments/lyric-sync/precompute-report.jsonl` — per-song outcomes (`ready` / `skipped` / `failed` / `no-video` / `no-lyrics`)

Lang auto: Hebrew in title/author/lyrics → `he`, else `en` (override with `--lang=`).

## Playlist / single song

```bash
npx tsx scripts/lyrics-sync/precompute-playlist.ts --slug=ishay-ribo --limit=20
npx tsx scripts/lyrics-sync/precompute-playlist.ts --song-id=UUID --lang=fr --video-id=VIDEO_ID
# redo:
npx tsx scripts/lyrics-sync/precompute-playlist.ts --all-public --offset=0 --limit=5 --force
```

## Manual extract / align

```bash
bash scripts/lyrics-sync/extract_audio.sh VIDEO_ID stem
experiments/beau-papa/.venv/bin/python scripts/lyrics-sync/align_lyrics.py \
  --audio experiments/lyric-sync/audio/stem.wav \
  --lyrics experiments/lyric-sync/audio/stem.lyrics.json \
  --language he \
  --out experiments/lyric-sync/audio/stem.aligned.json
```

## Initial results (2026-07-27)

| Song | videoId | Timed | Notes |
|------|---------|-------|------|
| הלב שלי (Ishay Ribo) | `6U_5KhaH6IM` | ~45 | he |
| פורחים לשובם | `X8CcSn4EcOo` | 44/49 | he |
| Beau-Papa | `8yOuNrT0dOw` | 40/53 | fr |
| Wonderwall | `bx1Bh8ZvH84` | 29/57 | en |
| Can't Help Falling In Love | `O-aavAlSYgc` | 25/37 | en |
| Viva La Vida | `dvgZkm1xWPE` | 28/48 | en |
| Pumped Up Kicks | `k_aQYP8rsgE` | 54/63 | en |

Full catalog ETA on CPU Whisper base: **~1–2 days**. Runner is resumable; already-ready songs are skipped.

Progress: `experiments/lyric-sync/precompute-report.jsonl` + `select count(*) from song_lyric_syncs where status='ready'`.

**2026-07-27 night run:** ~89 `ready` in DB, then YouTube Data API hit **Search Queries per day = 100**. Script now aborts on 429. Resume after quota reset:

```bash
npm run lyrics-sync:precompute-all -- 50 0
# skips already-ready; continues the rest
```

## Verify in app

Open a public song → **Original** or **Audio** → wait for “Practice ready” → click a lyric line to seek.

Spot-check HE + FR/EN: Ishay Ribo playlist songs, Beau-Papa, Wonderwall.

## Notes

- Skip is keyed on any `ready` row for the song (or file cache), so re-runs are cheap.
- YouTube Data API: ~1 search unit per song; pause/retry on quota errors (runner sleeps 60s on batch failure).
- Disk: prefer `--cleanup-audio` on long runs.
