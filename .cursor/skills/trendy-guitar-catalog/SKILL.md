---
name: trendy-guitar-catalog
description: >-
  Detects trendy guitar-ready songs (Israel, Jewish religious/hassidic, international
  acoustic, French variété/rap), maps them to main artists and curated playlists, and
  refreshes the catalog via kworb charts + AI research → Tab4U/Negina/UG scrape (no
  Spotify API). Use when updating trendy Israel playlists, hassidic/religious hits,
  acoustic Ed Sheeran-style shelves, French variété / Kendji / Gims, or seeding the
  best guitar library.
---

# Trendy guitar catalog

Goal: keep curated playlists stocked with **songs people actually stream** that also have **playable guitar tabs**.

Never call the Spotify Web API. Popularity comes from public chart mirrors + AI research. Scrape: IL → Tab4U/Negina; intl/FR → Ultimate Guitar.

For source keys, CLI, and artist→slug maps see [reference.md](reference.md).

## 1. Detection (sources)

Decide **how you know** a song is trendy before scraping.

### Charts (preferred for “now”)

Public Spotify daily chart HTML on kworb (parsed by `popularTracksResearchService`):

| Market | Source key | Chart URL |
|--------|------------|-----------|
| Israel | `top-israel` | `https://kworb.net/spotify/country/il_daily.html` |
| Global | `top-global` | `https://kworb.net/spotify/country/global_daily.html` |
| France | `top-france` | `https://kworb.net/spotify/country/fr_daily.html` |

Use charts first for Top Israel / Top Global / Top France shelves (`spotify-top-*`). Chart shelves **replace** `song_ids` in popularity order.

### AI editorial (shelves without a good chart)

When the shelf is an artist, style, or genre (hassidic, acoustic campfire, French variété):

- Define / use an entry in `src/data/spotifyPopularSources.ts` with `researchMode: 'ai'` and a tight `aiPrompt`.
- Editorial shelves **merge** into existing playlist `song_ids` (do not wipe prior seed lists).

### Public playlist knowledge (hints only)

You may use well-known Spotify editorial playlist themes as **research hints** in AI prompts (e.g. “Acoustic Hits”, “Variété Française”, “Rap FR”). Do not call Spotify APIs or scrape private data.

### Guitar fitness filter

- Prefer titles that exist on Tab4U/Negina (IL, Hebrew titles) or Ultimate Guitar (intl/FR).
- Drop or skip scrape misses; do not invent fake tabs.
- For Israel: research and search in **Hebrew** when that is how Tab4U knows the song.
- Bias French rap / global pop toward tracks that commonly have chord sheets (skip ultra-obscure trap with no UG page).

## 2. Artist + playlist update

1. From chart or AI results, cluster by **main artist**.
2. Match against `src/data/artistPlaylistSlugs.ts` and curated slugs in `src/data/curatedPlaylists.ts`.
3. Update:
   - Chart shelf (`spotify-top-israel` / `global` / `france`) via chart source.
   - Artist shelf via `editorial-<slug>` (or add a new source + classifier if the artist is missing but keeps charting).
   - Genre shelves: `hassidic`, `acoustic`, `variete-francaise`, `rap-fr`, `modern-israeli`, `classic-israeli`.
4. **New artist discovery**: if the same artist repeats on IL charts and has no shelf, add slug + `hebrewCatalogGenres` + classifier + `artistPlaylistSlugs` + editorial source, then seed (same path as Ben Zur / Eyal Golan).
5. Never create empty shells without a scrape path.

## 3. Markets — run in multitask (4 parallel agents)

When the user asks to refresh trendy guitar catalogs, launch **four parallel workstreams** (do not serialize unless deps conflict on the same playlist row):

### A — Israel secular

```bash
npm run seed:spotify-popular -- --source=top-israel --limit=30
# Plus key artist editorials as needed, e.g.:
npm run seed:spotify-popular -- --source=editorial-eyal-golan --limit=20
npm run seed:spotify-popular -- --source=editorial-omer-adam --limit=20
npm run seed:spotify-popular -- --source=editorial-noa-kirel --limit=20
```

Also refresh `modern-israeli` / `classic-israeli` only when building era shelves (manual/hebrew seed path), not via Christian `religious`.

### B — Religious (IL Jewish)

**Jewish / hassidic / faith-pop only.** Do **not** touch UG genre `religious` / `1016` (Christian) unless the user explicitly asks.

```bash
npm run seed:spotify-popular -- --source=editorial-hassidic --limit=25
npm run seed:spotify-popular -- --source=editorial-religious-il --limit=25
npm run seed:spotify-popular -- --source=editorial-ribo --limit=20
npm run seed:spotify-popular -- --source=editorial-ben-zur --limit=20
```

Faith-pop artist shelves (Akiva, Karduner, Ribo, Ben Zur) count as religious coverage.

### C — International acoustic

```bash
npm run seed:spotify-popular -- --source=editorial-acoustic --limit=30
```

Targets `acoustic` (Ed Sheeran, Vance Joy, campfire staples). Optional: skim `top-global` for acoustic-friendly guitar hits and merge via acoustic editorial — do not dump the whole global chart into Acoustic.

### D — French

```bash
npm run seed:spotify-popular -- --source=top-france --limit=30
npm run seed:spotify-popular -- --source=editorial-french-variete --limit=25
npm run seed:spotify-popular -- --source=editorial-rap-fr --limit=20
```

`top-france` → `spotify-top-france`. Variété / rap merge into `variete-francaise` / `rap-fr`. Artists: Vianney, Kendji Girac, Gims, Angèle, Stromae, Cabrel, etc. Market hint `INTL` → UG.

## 4. Ops checklist

1. Confirm `.env.local` has `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `OPENAI_API_KEY` (AI sources).
2. Optional dry-run: `npm run seed:spotify-popular -- --source=<key> --dry-run --limit=5`.
3. Run seeds (prefer multitask per market).
4. Report per source: researched count, added/updated/skipped/errors, Tab4U/UG misses.
5. Hard-refresh explorer (`/` / library) if shelves look stale.
6. Optional covers: `npm run backfill:song-covers` or `npx tsx scripts/backfill-playlist-song-covers.ts`.

## 5. Hard rules

- Service role **only** in ops scripts — never in Next.js web runtime.
- No Spotify Web API for this workflow.
- Do not import browser Supabase client in server code.
- Do not pass `userId` from the client for catalog ops.
- Prefer explicit columns in any ad-hoc queries; RLS still applies for user data — catalog scripts use service role carefully.
- Commit/push only when the user asks.
