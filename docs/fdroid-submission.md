# Submit Kraken Habits to F-Droid

This is the official catalog submission for `dev.krakenserv.habits`, not the [self-hosted repository](app-releases.md#android-self-hosted-f-droid-repository). Start with the existing ARM64 build and let F-Droid sign it. No private key or prebuilt APK belongs in the submission. F-Droid's APK cannot update a build signed with your debug or self-hosted key. Test on a separate device or profile, or sync and verify your data before removing the old app; uninstalling removes local app data.

The build recipe uses the hosted HTTPS API. An account and network connection are required, and the server cannot be changed after installation. This is disclosed as `TetheredNet` in the draft. Also disclose that the current web frontend loads fonts from Google Fonts and that the hosted API is served through Cloudflare Tunnel; let reviewers confirm the Anti-Features. Check that you intend to offer public sign-ups before publishing.

## Verify the release

Use JDK 21, Node.js 20.19 or a supported newer version, Rust 1.100.0 with `aarch64-linux-android`, Android SDK platform `android-37.0`, build tools `36.0.0`, and NDK `28.2.13676358`. Set `JAVA_HOME`, `ANDROID_HOME`, and `NDK_HOME` accordingly. Run from a fresh checkout, without local `.env` files:

```bash
export VITE_API_URL=https://habits-api.krakenserv.dev/api
npm --prefix frontend ci
bash packaging/android/build.sh --ci
apk=$(find frontend/src-tauri/gen/android/app/build/outputs/apk -name '*-release-unsigned.apk' -print)
"$ANDROID_HOME/build-tools/36.0.0/aapt" dump badging "$apk"
```

Expect package `dev.krakenserv.habits`, version `0.1.0` (code `1000`), ABI `arm64-v8a`, and no `application-debuggable` entry. The APK is unsigned. To test before F-Droid builds it, sign a copy with a local test key and install it in a separate device profile. With a test account, verify email confirmation, sign-in, saving a check-in, and seeing it after restarting. Follow the [API readiness and CORS checks](app-releases.md#configure-the-api) against the public service.

If you already have the debug build on your phone, you can sign the release test copy using the **same debug key** to test without uninstalling. First verify the debug certificate matches your local key; otherwise use a spare device or profile. Do not upload this APK:

~~~bash
tools="$ANDROID_HOME/build-tools/36.0.0"
"$tools/apksigner" sign --ks "$HOME/.android/debug.keystore" \
  --ks-key-alias androiddebugkey --out /tmp/kraken-habits-test.apk "$apk"
"$tools/apksigner" verify --print-certs /tmp/kraken-habits-test.apk
adb install -r /tmp/kraken-habits-test.apk
~~~

## Publish the source and submit

1. Add screenshots of the tracker and planner to `fastlane/metadata/android/en-US/images/phoneScreenshots/` as `1.png` and `2.png`, using demo data. Exclude email addresses, personal habits, notifications, and tokens. Review all pending changes before committing: the release needs the Android/Tauri sources, both lockfiles, build script, and any required frontend or backend changes. Exclude `.env` files, signing keys, and build outputs.
2. On GitHub, ensure the source repository is public and review what making it public exposes, including history. Commit the reviewed release changes and push the release with an annotated tag that matches the APK version (for example, `v0.1.0`). Verify the public tag is reachable from a signed-out browser. Do not move a tag after submission; if a fix is needed after publication, use a new version and tag.
3. Sign in to GitLab and [fork `fdroiddata`](https://gitlab.com/fdroid/fdroiddata/-/forks/new). Create a branch in your fork for this package. Copy `packaging/android/fdroid/dev.krakenserv.habits.yml` to `metadata/dev.krakenserv.habits.yml` in the fork. Confirm the recipe's tag, version name, and version code match the public release and that the APK path matches the build. If you have `fdroidserver` installed, run `fdroid rewritemeta dev.krakenserv.habits`, then `fdroid lint dev.krakenserv.habits`.
4. Commit the recipe in the fork as `New App: dev.krakenserv.habits` and push the branch. Check that the fork's pipeline actually produces an APK, then open a merge request against `fdroid/fdroiddata` targeting `master`. Use the current New App template and the draft notes below. If fork CI is unavailable, note that in the merge request and leave the build checkbox unchecked. Follow the [F-Droid submission guide](https://f-droid.org/docs/Submitting_to_F-Droid_Quick_Start_Guide/) for CI and reviewer feedback.
5. After approval, confirm the app appears in F-Droid's main repository. Install that signed build on a phone and repeat the test-account smoke test. A working local APK or a green fork pipeline is not evidence that the catalog listing has been published.

### Merge request notes

**Title:** New App: dev.krakenserv.habits

Kraken Habits is an MIT-licensed 31-day habit tracker. The recipe builds version 0.1.0 (1000) from tag `v0.1.0` for ARM64. It does not use a developer-signed binary; F-Droid signs its build. Existing test installs use a different signer and cannot update in place to the F-Droid build.

The app requires an account and uses the hosted Kraken Habits HTTPS API through Cloudflare Tunnel. The backend source is in the same repository, but the installed app cannot switch servers, so the recipe declares `TetheredNet`. The app also requests fonts from Google Fonts. Report bugs via the [upstream issue tracker](https://github.com/GeorgeDeveloperJ/habits-tracker/issues).

Local verification: the unsigned APK built from a clean source copy, metadata lint and the local source scan passed, and a locally signed copy installed and cold-launched on a physical ARM64 phone. Add your test-account results and the F-Droid build pipeline link after verifying them. Do not claim reproducibility or mark the F-Droid build as passing based on the local build.
