# Publishing the Mocksy Android app (.apk)

The "Download App" button in the header now downloads a real, installable
`.apk` file on Android devices — a genuine app, not the browser install
prompt. It's currently pointing at a placeholder. Follow the steps below
once to generate and publish the real file. You'll only need to repeat this
when you want to ship an update.

## Why this approach

Mocksy is already a well-configured PWA (manifest, service worker, icons).
The fastest, most reliable way to turn that into a real Android app — without
writing native code or paying for Android Studio setup — is to wrap it as a
**Trusted Web Activity (TWA)**. A TWA is a genuine Android app (its own
package, its own icon, runs full-screen, no browser UI) that displays your
already-deployed site. It is *not* a webview hack — this is the same
technique Google recommends and the same one Play Store apps like Starbucks
and Twitter used for their PWA-based Play Store listings. The only
difference here is you're distributing the APK yourself instead of through
the Play Store, which is completely fine — Android has always supported
"sideloading" apps from outside the Store.

## Step 1 — Generate the APK (about 5 minutes, no coding)

1. Make sure your latest build is deployed (e.g. to `mocksy-app.vercel.app`).
2. Go to **https://www.pwabuilder.com**
3. Enter your live site URL and click **Start**.
4. PWABuilder will score your PWA (manifest.json and sw.js are already in
   good shape) — check the "Android" report and fix anything it flags red.
5. Click **Package for stores** → **Android** → keep "Signing key: generate
   new" (unless you already have a keystore from a previous build — reuse it
   if so, so future updates use the same signature).
6. Download the generated `.zip`. Inside you'll find a file named something
   like `app-release-signed.apk` (or `.aab` if you chose Play Store —
   for direct downloads you specifically want the **APK**, not the AAB).
7. **Save the signing key file it gives you somewhere safe** (e.g.
   `signing.keystore` + the password). You need the *same* key for every
   future update, or existing users won't be able to install the update
   over the old version.

## Step 2 — Publish it in this repo

1. Rename the generated file to `mocksy.apk`.
2. Replace `public/downloads/mocksy.apk` in this project with it.
3. Update `public/downloads/mocksy-version.json`:
   ```json
   {
     "published": true,
     "version": "1.0.0"
   }
   ```
4. Commit, push, and redeploy (Vercel will pick it up automatically).

That's it — the "Download App" button will now serve the real APK to
Android visitors automatically (it checks `mocksy-version.json` before
showing the button).

## Step 3 — Test it

On an actual Android phone (not just emulator, since "unknown sources"
permission behaves differently), visit your live site, tap **Download App**,
open the downloaded file from Downloads/notifications, allow the one-time
"Install unknown apps" permission for the browser, then Install → Open.

## Notes

- Android will show an "Unverified developer" style warning on first
  install for any APK not distributed via Play Store — this is expected and
  does not mean anything is wrong; it's just Android telling users this
  didn't come from the Play Store.
- iOS cannot install `.apk` files at all — Apple does not allow that on
  iPhones/iPads under any circumstance, from any tool. iOS users will
  continue to see the existing "Add to Home Screen" flow, which is the
  closest equivalent Apple permits.
- If you later want it listed in the Play Store too, redo Step 1 but choose
  the **AAB** (Android App Bundle) output instead — Play Store requires AAB,
  not APK.