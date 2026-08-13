# App Store packaging (iOS)

## Prerequisites

- Mac with **full Xcode** (not only Command Line Tools)
- Apple Developer Program (~$99/yr)
- Privacy policy: https://www.tabascomusic.com/privacy
- Bundle id: `com.tabascomusic.app`

## 1. Open project

```bash
cd mobile
npm install
npm run sync
npm run open:ios
```

Project path: `ios/App/App.xcodeproj` (Swift Package Manager — CocoaPods not required).

In Xcode:

1. Signing & Capabilities → your Team
2. Confirm Associated Domains: `applinks:www.tabascomusic.com`, `applinks:tabascomusic.com`
3. Replace `TEAMID` in Next route `src/app/.well-known/apple-app-site-association/route.ts` and deploy

## 2. Archive

Product → Archive → Distribute App → App Store Connect.

## 3. App Store Connect

Paste-ready copy: [store/app-store-listing.txt](./store/app-store-listing.txt).

| Field | Notes |
| --- | --- |
| Name | TABasco |
| Privacy nutrition | Account, library data; see `/privacy` |
| Account deletion | Required if auth — document in privacy + in-app path |
| Screenshots | iPhone 6.7" + 6.5" (and iPad if universal) |
| Review notes | Explain shell loads https://www.tabascomusic.com; provide demo login if needed |

Apple often rejects empty Safari wrappers. This shell includes SplashScreen, StatusBar, Universal Links, and in-app deep-link handling via `CapacitorNativeBridge` on the site — call that out in review notes.

## 4. Reject mitigation checklist

- [ ] Custom splash + dark status bar (not blank WebView flash)
- [ ] Universal Links open songs in-app
- [ ] Share / browser plugins available if needed for external links
- [ ] Privacy + account deletion language live on site
