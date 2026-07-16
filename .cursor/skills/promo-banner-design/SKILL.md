---
name: promo-banner-design
description: Designs and implements TABasco promo banners in the Spotify connection banner style (logo/SVG or PNG + title + description + CTA). Use when creating feature banners, promo cards, Spotify-style banners, record-song banners, or when the user provides a PNG/SVG and wants title/description/CTA in that layout.
---

# Promo Banner Design (Spotify-style)

Build feature promo banners that match the **Profile Spotify connection card** — not generic marketing cards, not purple AI themes.

Canonical reference: Spotify section in `src/app/(protected)/profile/ProfileClient.tsx` (`sectionCardClass`).

For extracted tokens and anatomy, see [reference.md](reference.md).

## 1. Analyze reference banner

Before inventing layout:

1. Open `ProfileClient.tsx` and locate the Spotify block (`t('profile.spotify')`).
2. Extract and reuse:
   - Outer shell: `sectionCardClass`
   - Row: `flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between`
   - Title: `text-base font-semibold text-foreground`
   - Optional status badge: `rounded-full px-2.5 py-0.5 text-xs font-medium` + accent tint
   - Description: `mt-1 text-sm text-muted-foreground`
   - CTA column: `flex flex-wrap gap-2 sm:shrink-0` (on mobile, CTAs should feel full-width when alone)
   - Primary CTA: `h-10 min-h-[44px] rounded-xl` + thematic fill
3. Also note the **library hero variant** in `SpotifyComingSoonSection.tsx` (full-bleed dark panel + PNG logo) when the user wants a louder promo with a brand asset — still use app tokens, not a new theme.

## 2. User workflow (asset → banner)

1. User provides a **PNG or SVG** (e.g. Spotify logo) — or an icon name if no asset.
2. Agent places the asset (optional decorative / brand mark) and fills:
   - **Title** (short)
   - **Description** (one supporting sentence)
   - **CTA** label + wired action (link, `window.location`, or existing handler)
3. Match spacing, type, border, and dark mode from the reference card.
4. Add **en / fr / he** locale keys; never hardcode user-facing strings.

## 3. Recipe (reusable structure)

```tsx
const sectionCardClass =
  'rounded-2xl border border-black/[0.06] bg-card p-4 dark:border-white/[0.08] sm:p-5'

<div className={sectionCardClass}>
  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
    <div className="min-w-0 flex-1">
      {/* Optional: logo/SVG/PNG or themed icon */}
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-base font-semibold text-foreground">{/* title */}</h2>
        {/* Optional status/badge */}
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{/* description */}</p>
    </div>
    <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:shrink-0">
      <Button
        type="button"
        className="h-10 min-h-[44px] w-full rounded-xl sm:w-auto /* accent */"
      >
        {/* CTA */}
      </Button>
    </div>
  </div>
</div>
```

### Accents

| Feature | Accent |
|---------|--------|
| Spotify | `#1DB954` fill, hover `#1ed760`, text `text-black`; badge `bg-[#1DB954]/15 text-[#0d7a34] dark:text-[#1ed760]` |
| Record song | Red / mic theme already in song UI: e.g. `bg-red-600 text-white hover:bg-red-500`, badge `bg-red-500/15 text-red-700 dark:text-red-400`, `MicrophoneIcon` |
| Other | One thematic accent from the existing app (amber transpose, blue piano, etc.) — never invent a purple gradient theme |

## 4. Checklist for new banners

- [ ] Accessibility: meaningful title hierarchy, CTA has clear label, decorative images `alt=""`, status `role="status"` when needed, touch targets ≥ 44px
- [ ] Dark mode: borders/backgrounds use `dark:` variants from the recipe; accent text readable on dark
- [ ] Mobile: primary CTA `w-full` on small screens; stack title block above actions
- [ ] i18n: keys in `src/locales/en.json`, `fr.json`, `he.json`
- [ ] CTA wired to a real flow (handler, route, or Server Action) — no dead buttons
- [ ] Visual system matches Profile Spotify card / app tokens — **do not** invent purple AI-slop themes

## 5. Do not

- Invent purple-on-white / indigo glow / generic SaaS promo looks
- Replace `bg-card` shells with heavy multi-shadow card stacks
- Hardcode copy in components
- Skip dark mode or mobile full-width CTAs
