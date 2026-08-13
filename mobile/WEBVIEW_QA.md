# WebView QA checklist (Capacitor → live site)

Run on a real device or emulator with the shell pointed at production (or a staging URL temporarily in `capacitor.config.ts`).

## Auth

- [ ] Email magic link / password sign-in completes and session persists after force-kill
- [ ] Google (or other) OAuth returns into the WebView (not stuck in Chrome Custom Tab)
- [ ] Sign-out clears session; reopen app stays signed out
- [ ] Account deletion / privacy links open (`/privacy`)

## Song viewer

- [ ] Open catalog song from search
- [ ] Transpose / tools bar usable; soft keyboard does not cover search
- [ ] Autoscroll + YouTube practice play/pause
- [ ] Audio mode player; scrubber; safe-area padding above home indicator / nav bar

## Deep links

- [ ] Cold start: `https://www.tabascomusic.com/song/<id>` opens in-app
- [ ] Warm: same URL while app backgrounded brings app to foreground on that route
- [ ] Custom scheme `tabasco://` opens app (Android intent / iOS URL type)

## Shell polish

- [ ] Splash hides once site loads
- [ ] Status bar readable (dark content on brand background)
- [ ] Android system back: history back, then exit on root
- [ ] Offline / airplane: failure is graceful (site unreachable message), no white flash forever

## Regression (browser)

- [ ] Desktop + mobile Safari/Chrome still work with no Capacitor APIs required
