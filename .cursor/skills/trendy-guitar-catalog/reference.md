# Trendy guitar catalog — reference

## Pipeline

```
spotifyPopularSources → popularTracksResearchService (chart | AI)
  → localeScrapeRouter (IL: Tab4U/Negina | INTL: UG)
  → catalogSongUpsert
  → curated playlist song_ids (chart = replace, editorial = merge)
```

Entrypoint: `npm run seed:spotify-popular` → `scripts/seed-from-spotify-popular.ts` → `popularCatalogSeedService`.

## Source registry

| key | mode | targetSlug | marketHint | scrape |
|-----|------|------------|------------|--------|
| `top-israel` | chart `il_daily` | `spotify-top-israel` | IL | Tab4U/Negina |
| `top-global` | chart `global_daily` | `spotify-top-global` | INTL | UG |
| `top-france` | chart `fr_daily` | `spotify-top-france` | INTL | UG |
| `editorial-hassidic` | AI | `hassidic` | IL | Tab4U/Negina |
| `editorial-religious-il` | AI | `hassidic` | IL | Tab4U/Negina |
| `editorial-acoustic` | AI | `acoustic` | INTL | UG |
| `editorial-french-variete` | AI | `variete-francaise` | INTL | UG |
| `editorial-rap-fr` | AI | `rap-fr` | INTL | UG |
| `editorial-ribo` | AI | `ishay-ribo` | IL | Tab4U/Negina |
| `editorial-ben-zur` | AI | `ben-zur` | IL | Tab4U/Negina |
| `editorial-eyal-golan` | AI | `eyal-golan` | IL | Tab4U/Negina |
| `editorial-omer-adam` | AI | `omer-adam` | IL | Tab4U/Negina |
| `editorial-eden-hason` | AI | `eden-hason` | IL | Tab4U/Negina |
| `editorial-sarit-hadad` | AI | `sarit-hadad` | IL | Tab4U/Negina |
| `editorial-moshe-peretz` | AI | `moshe-peretz` | IL | Tab4U/Negina |
| `editorial-nathan-goshen` | AI | `nathan-goshen` | IL | Tab4U/Negina |
| `editorial-idan-raichel` | AI | `idan-raichel` | IL | Tab4U/Negina |
| `editorial-shlomo-artzi` | AI | `shlomo-artzi` | IL | Tab4U/Negina |
| `editorial-static-ben-el` | AI | `static-ben-el` | IL | Tab4U/Negina |
| `editorial-noa-kirel` | AI | `noa-kirel` | IL | Tab4U/Negina |
| `editorial-itay-levi` | AI | `itay-levi` | IL | Tab4U/Negina |
| `editorial-osher-cohen` | AI | `osher-cohen` | IL | Tab4U/Negina |
| `editorial-avi-ohayon` | AI | `avi-ohayon` | IL | Tab4U/Negina |

Full definitions: `src/data/spotifyPopularSources.ts`.

### Chart URLs

- Israel: `https://kworb.net/spotify/country/il_daily.html`
- Global: `https://kworb.net/spotify/country/global_daily.html`
- France: `https://kworb.net/spotify/country/fr_daily.html`

## CLI cheat sheet

```bash
# Dry-run
npm run seed:spotify-popular -- --source=top-israel --dry-run --limit=5

# Charts
npm run seed:spotify-popular -- --source=top-israel --limit=30
npm run seed:spotify-popular -- --source=top-global --limit=30
npm run seed:spotify-popular -- --source=top-france --limit=30

# Religious (Jewish)
npm run seed:spotify-popular -- --source=editorial-hassidic --limit=25
npm run seed:spotify-popular -- --source=editorial-religious-il --limit=25

# Acoustic + French
npm run seed:spotify-popular -- --source=editorial-acoustic --limit=30
npm run seed:spotify-popular -- --source=editorial-french-variete --limit=25
npm run seed:spotify-popular -- --source=editorial-rap-fr --limit=20

# Artist editorial example
npm run seed:spotify-popular -- --source=editorial-eyal-golan --limit=20

# Song covers (optional)
npm run backfill:song-covers
# or
npx tsx scripts/backfill-playlist-song-covers.ts --playlist=acoustic
```

Requires `.env.local`: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY` (for AI sources).

## Artist → slug map

### Israel (artist banners)

| Artist | Hebrew | slug |
|--------|--------|------|
| Hanan Ben Ari | חנן בן ארי | `hanan-ben-ari` |
| Aharon Razel | אהרן רזאל | `aharon-razel` |
| Eviatar Banai | אביתר בנאי | `eviatar-banai` |
| Shuli Rand | שולי רנד | `shuli-rand` |
| Ishay Ribo | ישי ריבו | `ishay-ribo` |
| Yosef Karduner | יוסף קרדונר | `yosef-karduner` |
| Akiva | עקיבא | `akiva` |
| Ben Zur | בן צור | `ben-zur` |
| Eyal Golan | אייל גולן | `eyal-golan` |
| Omer Adam | עומר אדם | `omer-adam` |
| Eden Hason | עדן חסון | `eden-hason` |
| Sarit Hadad | שרית חדד | `sarit-hadad` |
| Moshe Peretz | משה פרץ | `moshe-peretz` |
| Nathan Goshen | נתן גושן | `nathan-goshen` |
| Idan Raichel | עידן רייכל | `idan-raichel` |
| Shlomo Artzi | שלמה ארצי | `shlomo-artzi` |
| Static & Ben El | סטטיק ובן אל | `static-ben-el` |
| Noa Kirel | נועה קירל | `noa-kirel` |
| Itay Levi | איתי לוי | `itay-levi` |
| Osher Cohen | אושר כהן | `osher-cohen` |
| Avi Ohayon | אבי אוחיון | `avi-ohayon` |
| Carlebach | קרליבך | `carlebach` |
| Classic Israeli | — | `classic-israeli` |
| Modern Israeli | — | `modern-israeli` |

Source of truth: `src/data/artistPlaylistSlugs.ts`.

### Acoustic staples (genre shelf `acoustic`)

Ed Sheeran, Vance Joy, Passenger, The Lumineers, George Ezra, Jason Mraz, John Mayer, Jack Johnson, Lewis Capaldi, Hozier, Tracy Chapman, Bon Iver, … — see `src/data/acousticPlaylists.ts`.

### French (genre shelves)

| Style | slug | example artists |
|-------|------|-----------------|
| Variété | `variete-francaise` | Vianney, Kendji Girac, Angèle, Stromae, Cabrel, Goldman, Gims (crossover) |
| Rap FR | `rap-fr` | Gims, PNL, Damso, Booba, Nekfeu, … |

Author lists: `src/data/frenchPlaylists.ts`.

## Decision tree: new trendy song → playlist(s)

```
Is it on IL / FR / Global daily chart?
  → yes → add to matching spotify-top-* (via chart seed)
  → also cluster by artist

Does the main artist have an artistPlaylistSlug?
  → yes → editorial-<slug> or hebrew seed into that shelf
  → no, but artist repeats on IL charts → create new artist shelf (full wiring) then seed

Is it Jewish religious / hassidic / faith-pop?
  → hassidic (+ editorial-religious-il / editorial-hassidic)
  → NOT christian UG genre 1016 / slug `religious` unless user asks

Is it campfire / acoustic guitar staple (intl)?
  → acoustic via editorial-acoustic

Is it French variété / chanson?
  → variete-francaise (+ top-france if charting in FR)

Is it French rap with playable chords?
  → rap-fr via editorial-rap-fr

No tab on Tab4U/Negina/UG?
  → skip; note miss in report
```

## Related files

- `src/data/spotifyPopularSources.ts` — source definitions
- `src/lib/services/popularTracksResearchService.ts` — kworb parse + AI research
- `src/lib/services/popularCatalogSeedService.ts` — scrape + playlist upsert
- `src/lib/services/localeScrapeRouter.ts` — IL vs INTL routing
- `src/data/curatedPlaylists.ts` — UI shelves / displayOrder
- `src/data/hebrewPlaylists.ts` / `hebrewCatalogGenres.ts` — Hebrew catalog genres
- `scripts/seed-from-spotify-popular.ts` — CLI
