# Validation report — 2026-10-03

- 250 distinct deterministic puzzle fingerprints; every stored solution passed all cargo rules.
- Exact usable trunk coverage, four rotations, out-of-bounds rejection and invalid-state rejection verified.
- First-time and improved star rewards, replay farming prevention, all 250 sequential unlocks and save restoration checked.
- Headless Chromium tests at 360, 390, 768 and 1280 CSS pixels passed. No horizontal overflow or uncaught JavaScript errors observed.
- Actual pointer click and drag placement, undo, save/reload/continue, settings roundtrip, TR/DE/EN and nine campaign milestone completion dialogs passed.
- Hint integration checked. Hints disclose the one-star limit before applying.
- APK assembled locally for minSdk 26 / targetSdk 35 and v2/v3 signatures verified by Android apksigner.
- Android device/emulator runtime was not available for this validation. Install, back button, background/resume, audio, haptics, WebView behavior and device-specific performance need a phone test.
- Real ads and Google Play billing are not integrated. Their settings controls are disabled and explain that this is a test build.

This report records checks run, not a guarantee of defect-free operation or a store release approval.

## 0.1.1 visual revision

Rear-view trunk renderer and contiguous luggage silhouettes verified visually at levels 1 and 250. The same engine and browser tests passed again with the new projection. The Android allowlist includes the new renderer asset. Version code is 2; the existing test keystore is reused.
