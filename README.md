# OneMoreCase

Offline luggage-packing puzzle for Android. Original canvas artwork, isometric 2.5D cargo, 250 deterministic puzzles, 10 vehicle chapters, Turkish/German/English, local save, undo, hints, sound and haptics.

## Play

Open `web/index.html` in a modern browser or serve `web/` locally. The Android build packages every game asset; no server or account is needed. Select cargo and tap its destination, or drag it into the trunk. Rotation unlocks at level 11. Pack every item while following the cargo rules.

## Campaign

| Levels | Vehicle | New challenge |
|---|---|---|
| 1–25 | Pocket | Small trunk; rotation begins at level 11 |
| 26–50 | Breeze | Reserved equipment spaces |
| 51–75 | Nomad | Heavy cargo in the rear half |
| 76–100 | Vista | Fragile cargo cannot touch heavy cargo |
| 101–125 | Trail | Quick-access cargo reaches the opening |
| 126–150 | Atlas | Upright cargo cannot rotate |
| 151–175 | Comet | Larger trunk and tighter move budget |
| 176–200 | Voyager | Dry cargo stays in the left half |
| 201–225 | Summit | Larger mixed-rule puzzles |
| 226–250 | Horizon | Secured cargo touches a side or rear wall |

Every level has a checked solution witness. Layouts and tray order are generated from a fixed seed, not AI. All 250 puzzle fingerprints are distinct; they share the packing mechanic and cargo rules. Difficulty increases by chapter through board size, shape complexity, obstacles, constraints and move budget; individual adjacent puzzles are not claimed to have measured monotonic human difficulty.

Stars award 20 points each. Only improvements pay again. Vehicles unlock at 25-star intervals, so even one-star completion of previous chapters makes the next vehicle available. Earlier levels retain their original dimensions. Garage selection changes the home illustration; campaign trunk dimensions are fixed per chapter to preserve solvability.

## Build a test APK locally

Requirements: Java 17+, Android SDK platform 36, build-tools 36.0.0, Bash, zip, keytool. No Gradle, Actions, EAS or paid build service is used.

```sh
ANDROID_SDK_ROOT=/your/android-sdk ./scripts/build-apk.sh
```

If only a JRE is installed, set `ECJ_JAR` to a local Eclipse Java compiler JAR. Output: `dist/OneMoreCase-0.2.0-test.apk`. The script creates a disposable test signing key under ignored `build/`; this is not a Play production signing setup. Keep the same test key for updates to an installed test build. APK is compatible with Android 8.0+ and requires a working Android System WebView.

## Validation

```sh
node tests/engine.test.js
NODE_PATH=/path/to/node_modules CHROME_PATH=/path/to/chromium node tests/ui.test.js
```

Engine tests check every solution, unique fingerprints, rotations, scoring, replay farming, progress and saved state. Browser tests exercise four viewport sizes, actual pointer placement and drag, undo, reload/resume, languages, settings, rule milestones and hints. Device performance, installation and Android lifecycle behavior still require real-device testing. No claim of zero bugs or Play approval is made.

## Ads, purchases and privacy

Version 0.2.0 is an offline, ad-free Play candidate. Unfinished ads/purchase controls are not exposed in the production UI. Rewarded-hint monetization can be added later with this game's real AdMob IDs and consent flow.

The current build has no INTERNET permission, analytics or advertising SDK. It stores progress and preferences locally. Adding SDKs changes privacy disclosures and the Google Play Data safety form. Add verified publisher/contact information and a public production privacy policy before store submission; no publisher identity is invented here.

Android shell serves only five allowlisted packaged resources over an intercepted HTTPS origin; arbitrary files and remote navigation are blocked. File/content access is disabled and a Content Security Policy blocks connections.

References: [Android local content guidance](https://developer.android.com/develop/ui/views/layout/webapps/load-local-content), [Google Play advertising policy](https://support.google.com/googleplay/android-developer/answer/9857753).

## 0.2.0 Play and visual update

The puzzle is now rendered inside a rear-view car with an open hatch, glass, struts, seat backs, carpeted cargo floor, tail lamps, rear sill and bumper. Cargo and tray icons use connected suitcase silhouettes with handles, ribs, zipper edges, wheels and luggage tags. Projection-based hit testing follows the perspective floor. Existing version-1 saved progress and all 250 puzzle layouts remain compatible.


## Google Play 2026

- `compileSdk` / `targetSdk`: **36**
- Production artifact: Android App Bundle (`.aab`)
- First-run language: English; EN/DE/TR switch is available from the header
- Signed Play AAB workflow: `.github/workflows/play-aab.yml`
- AdMob is intentionally deferred; the current candidate is ad-free
