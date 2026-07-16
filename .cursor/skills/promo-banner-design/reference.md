# Spotify promo banner anatomy (from code)

Extracted from the Profile Spotify connection block and related library hero.

## Primary reference — Profile card

**File:** `src/app/(protected)/profile/ProfileClient.tsx`

### Shell

```ts
const sectionCardClass =
  'rounded-2xl border border-black/[0.06] bg-card p-4 dark:border-white/[0.08] sm:p-5'
```

- Radius: `rounded-2xl`
- Border: light black 6% / dark white 8%
- Surface: `bg-card`
- Padding: `p-4` → `sm:p-5`

### Layout

| Zone | Classes | Role |
|------|---------|------|
| Row | `flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between` | Stack on mobile; title left, CTAs right on `sm+` |
| Copy column | `min-w-0 flex-1` | Truncation-safe text |
| Title row | `flex flex-wrap items-center gap-2` | Title + optional badge |
| Title | `text-base font-semibold text-foreground` | Feature name |
| Badge | `inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium` | Connected / not connected |
| Description | `mt-1 text-sm text-muted-foreground` | One short sentence |
| CTA group | `flex flex-wrap gap-2 sm:shrink-0` | Primary + optional secondary |
| Buttons | `h-10 min-h-[44px] rounded-xl` | Touch-friendly |

### Spotify accent tokens

| Token | Value |
|-------|--------|
| Primary fill | `#1DB954` |
| Primary hover | `#1ed760` |
| Primary label | `text-black` |
| Badge connected bg | `bg-[#1DB954]/15` |
| Badge connected text | `text-[#0d7a34] dark:text-[#1ed760]` |
| Badge idle | `bg-muted text-muted-foreground` |

### CTA patterns

- **Connect (primary):** filled Spotify green
- **Import (secondary when connected):** `variant="outline"` + `rounded-xl`
- **Disconnect:** outline + `text-destructive hover:bg-destructive/10`

### Error line

`mt-3 text-sm text-destructive` below the row when an action fails.

---

## Secondary reference — Library hero (asset-forward)

**File:** `src/components/library/SpotifyComingSoonSection.tsx`

Use when the user supplies a **PNG/SVG** and wants a louder promo:

- Panel: `rounded-xl bg-[#011E0B]`, min-height ~`8.5rem` / `sm:9.5rem`
- Decorative logo: absolute, rotated, large (`spotify_logo_V2.png`)
- **Half-width clip (required):** decorative art must not take more than half of the banner width — cut/clip the picture so the description stays clear on the left. Cap the asset layer at `w-1/2` + `overflow-hidden` (banner already `overflow-hidden`); keep copy in a left safe zone (`max-w-[50%]` or up to ~`max-w-[68%]` when the art is well cropped).
- Wordmark: `spotify_text.png` in the copy column
- Copy: `text-white/80`, constrained width so it never sits under the art
- CTA: `rounded-full bg-[#1DB954] … text-black` (or muted pill when connected)
- Optional corner chip: `rounded-full border border-white/20 bg-white/15`

Still pair with the Profile **card recipe** for in-page feature banners (record, settings, etc.); reserve the hero for brand-forward library/search surfaces.

### Practice hero example

**File:** `src/components/practice/PracticeComingSoonBanner.tsx`

Same half-width rule: parchment asset on the right is clipped to ≤ 50% width; title + description + CTA stay fully legible on the left.

---

## Record-song accent (app-consistent)

When adapting the Profile recipe to recording:

| Token | Suggested classes |
|-------|-------------------|
| Primary CTA | `bg-red-600 text-white hover:bg-red-500` |
| Badge | `bg-red-500/15 text-red-700 dark:text-red-400` |
| Icon | `@heroicons/react/24/outline` `MicrophoneIcon` |

Wire CTA to `SongRecordingPanel` `startRecording()` (or equivalent existing flow).
