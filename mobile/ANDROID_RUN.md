# Run TABasco on Android (beginner)

## Important

Open **only** this folder in Android Studio:

`music-tabs/mobile/android`

Do **not** open the whole `music-tabs` repo for running the app.

## Fix “Error: Please select Android SDK”

1. **Android Studio → Settings → Languages & Frameworks → Android SDK**
   - Android SDK Location = `/Users/samuel/Library/Android/sdk`
   - SDK Platforms: **Android 15 (API 35)** must be **Installed** (not partial)
2. **File → Project Structure → Project**
   - SDK = **Android API 35 Platform** (not a plain Java JDK alone)
3. **File → Project Structure → Modules → app**
   - Module SDK / Compile Sdk = **35**
4. **Settings → Build, Execution, Deployment → Build Tools → Gradle**
   - Gradle JDK = **jbr-21** (Android Studio bundled JDK 21)
5. **File → Sync Project with Gradle Files**
6. Close the broken Run config dialog → click the green **Run ▶** again

## Launch

1. Start an emulator (**Device Manager → ▶**) or plug a phone with USB debugging
2. Select that device in the toolbar
3. Run ▶ configuration **app**

The WebView loads https://www.tabascomusic.com (internet required).

## If IDE still fails — install APK from terminal

```bash
export JAVA_HOME="/Users/samuel/Library/Java/JavaVirtualMachines/jbr-21.0.11/Contents/Home"
cd mobile/android
./gradlew :app:assembleDebug
./gradlew :app:installDebug
```

Or drag `app/build/outputs/apk/debug/app-debug.apk` onto the emulator.
