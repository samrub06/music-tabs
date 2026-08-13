# TABasco mobile (Capacitor shell)

Thin Android/iOS shell. The WebView loads **https://www.tabascomusic.com** (Vercel). Next.js deploy stays `git push` → Vercel; this package does not replace the website.

## Setup

```bash
cd mobile
npm install
npm run copy:icons
npx cap sync
```

- Android: `npm run open:android` (Android Studio)
- iOS: needs full Xcode. Project uses Swift Package Manager under `ios/App`. `npm run open:ios`

## Config

- App id: `com.tabascomusic.app`
- Remote URL: `capacitor.config.ts` → `server.url`
- Deep links: `https://www.tabascomusic.com/*`, custom scheme `tabasco://`
- Site association files (Next):
  - `public/.well-known/assetlinks.json` (replace SHA256 after signing)
  - `/.well-known/apple-app-site-association` (replace `TEAMID`)

## Docs

- [WEBVIEW_QA.md](./WEBVIEW_QA.md) — device QA checklist
- [PLAY_STORE.md](./PLAY_STORE.md) — signed AAB + Play Console
- [APP_STORE.md](./APP_STORE.md) — Xcode archive + App Store Connect
