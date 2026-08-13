# Play Store packaging (Android)

## Prerequisites

- Android Studio + JDK 17+
- Google Play Console developer account (~$25 one-time)
- Privacy policy live: https://www.tabascomusic.com/privacy

## 1. Release keystore

```bash
cd mobile/android
keytool -genkey -v -keystore tabasco-release.jks -keyalg RSA -keysize 2048 -validity 10000 -alias tabasco
```

Copy `keystore.properties.example` → `keystore.properties` (gitignored) and fill paths/passwords:

```properties
storeFile=tabasco-release.jks
storePassword=***
keyAlias=tabasco
keyPassword=***
```

## 2. Build signed AAB

Requires Android SDK (`ANDROID_HOME` or `android/local.properties` → `sdk.dir=...`) and JDK 17+.

```bash
cd mobile
npm run sync
export JAVA_HOME="${JAVA_HOME:-$HOME/.local/jdk/temurin-17/Contents/Home}"
npm run build:android:release
```

Output: `android/app/build/outputs/bundle/release/app-release.aab`

Or Android Studio → Build → Generate Signed Bundle / APK.

Paste-ready store copy: [store/play-listing.txt](./store/play-listing.txt).

## 3. Digital Asset Links

After first upload key is known:

```bash
keytool -list -v -keystore tabasco-release.jks -alias tabasco
```

Put the SHA-256 fingerprint into `public/.well-known/assetlinks.json` (repo root) and deploy to Vercel. Verify with Google’s Asset Links tool.

## 4. Play Console listing

| Field | Suggested |
| --- | --- |
| App name | TABasco |
| Short description | Guitar chords & tabs with practice tools |
| Full description | Store copy for chords, folders, YouTube practice |
| Category | Music & Audio |
| Privacy policy | https://www.tabascomusic.com/privacy |
| Content rating | Questionnaire (music/education, no UGC chat) |
| Screenshots | Phone + 7" tablet from emulator / device |
| Contact | your support email |

Upload AAB → internal testing track first → promote to production.

## Notes

- This is a WebView shell over the live site; keep StatusBar/Splash enabled (already in Capacitor config).
- Do not enable cleartext; production URL is HTTPS only.
