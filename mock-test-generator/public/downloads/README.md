# `public/downloads/`

This folder serves the downloadable Android build of Mocksy, used by the
"Install app" flow on Android (see `src/components/InstallAppButton.jsx`).
Files here are static assets — anything placed here is published as-is at
`https://mocksy-app.vercel.app/downloads/...`.

## Files

- **`mocksy.apk`** — The installable Android package. Android can't use the
  native PWA install prompt the way desktop browsers can, so on Android the
  "Install app" button instead downloads this APK directly and shows a short
  walkthrough for allowing sideloaded installs.
- **`mocksy-version.json`** — A small manifest the frontend checks before
  offering the APK download:
  ```json
  { "published": true, "version": "1.0.0" }
  ```
  - `published` — Set to `false` (or remove the file) if no real APK has been
    built yet. `InstallAppButton.jsx` checks this first and hides the
    Android-specific download flow when it's `false`, falling back to the
    normal install prompt instead — so a placeholder repo never lets users
    download a broken/missing APK.
  - `version` — Shown to users and used to detect when a newer APK is
    available.

## Publishing a new APK build

1. Build the APK from the live site with [PWABuilder](https://pwabuilder.com)
   or [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap).
2. Replace `mocksy.apk` in this folder with the new build.
3. Bump `version` in `mocksy-version.json` and make sure `published` is `true`.
4. Deploy — the frontend picks up the new version automatically via
   `APK_VERSION_PATH`.