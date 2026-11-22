# Android and Linux releases

Kraken Habits uses the same React screens and HTTPS API on Android, Linux, and the web. For automated GitHub Releases APK builds, see [Android APK CI/CD](android-cicd.md). For the official Android catalog, see [F-Droid submission](fdroid-submission.md). For self-hosted Android and Linux distribution, use the instructions below.

## Configure the API

Use Node.js 22.12 or newer and install the frontend dependencies with `npm --prefix frontend ci`. Install the [Tauri system prerequisites](https://v2.tauri.app/start/prerequisites/) for your build targets.

Set the API address in the shell that builds the package. The production website uses the home server through Cloudflare Tunnel.

```bash
export VITE_API_URL=https://habits-api.krakenserv.dev/api
curl --fail --silent --show-error "$VITE_API_URL/ready"
```

Expect `{"status":"ready"}` before packaging. Use a test account for testing a live environment.

The API's default CORS allowlist includes `tauri://localhost` for Linux and `https://tauri.localhost` for Android. If the deployed API sets `CORS_ORIGINS`, append both exact origins to the existing values. Apply the config to the intended API and verify preflight for the two apps and the hosted browser client. The response must include the requesting origin in `Access-Control-Allow-Origin`. If mail recovery is configured, `PUBLIC_APP_URL` points to the hosted web client where the reset link is redeemed.

## Android: self-hosted F-Droid repository

1. Use Android Studio's SDK Manager to install the SDK, build tools and side-by-side NDK. Configure `JAVA_HOME`, `ANDROID_HOME`, and `NDK_HOME` as in the Tauri prerequisites. The first build initializes the Gradle project. The build script targets ARM64, the initial device architecture.
2. Run `packaging/android/build.sh --debug` for a test APK. Connect a phone with USB debugging enabled and install the debug build with `adb install <debug.apk>`. This test artifact uses a debug signature. Start the release install on a device without the debug build of `dev.krakenserv.habits`.
3. For distribution, run `packaging/android/build.sh` to produce the release APK. Sign the aligned release artifact with the same private app-signing keystore every time. Use the SDK's `apksigner sign --ks <keystore> --out <signed.apk> <aligned-unsigned.apk>` and check the result with `apksigner verify --print-certs <signed.apk>`. Keep the app ID and signer stable. Bump the version in `frontend/src-tauri/tauri.conf.json` and keep `frontend/src-tauri/Cargo.toml` and `Cargo.lock` in sync. Verify the resulting Android version code increased before publishing.
4. Initialize a separate release directory with `fdroid init` and configure its final HTTPS repository URL. Put the signed APK in its `repo/` directory and run `fdroid update -c` on the first release and `fdroid update` thereafter. Publish the contents of `repo/` to the HTTPS host. Publish the APK before the indexes that reference it. Back up both the repository index key and the app-signing key. Share the repository URL with its signing fingerprint so friends can add it to F-Droid. Use the [free Android limited-distribution registration](https://developer.android.com/developer-verification/guides/limited-distribution) for devices that require authorization. [F-Droid repository setup](https://f-droid.org/en/docs/Setup_an_F-Droid_App_Repo/)

## Linux

Build on an x86_64 Linux host with `flatpak`, AppStream composition support (`appstreamcli compose`), and Tauri system libraries compatible with the GNOME 51 runtime. Install the runtime with `flatpak install flathub org.gnome.Platform//51`.

```bash
npm --prefix frontend run tauri -- build --no-bundle -- --locked
packaging/flatpak/build.sh frontend/src-tauri/target/release/kraken-habits /path/to/flatpak-repo
```

The second command exports a local test build to `stable`. To verify the window and links on a local test remote, add it with `flatpak remote-add --user --no-gpg-verify kraken-local /path/to/flatpak-repo`, then run `flatpak install --user kraken-local dev.krakenserv.habits` and `flatpak run dev.krakenserv.habits`. Only the local unsigned test remote uses `--no-gpg-verify`.

For a release, pass the GPG key ID as the third argument and reuse the same release repository for each version. Serve the repository over HTTPS and put a `.flatpakrepo` descriptor at a stable URL. Include the repository URL and base64-encoded **public** GPG key in the descriptor. Transfer objects before publishing the updated repository summary. Test `flatpak update --user dev.krakenserv.habits` from the signed remote. [Flatpak repository hosting](https://docs.flatpak.org/en/latest/hosting-a-repository.html)

## Release acceptance

- Run `npm --prefix frontend test`, `npm --prefix frontend run lint`, and `npm --prefix frontend run build`. Run backend `npm test` against a dedicated test database and build both packages.
- On a physical Android phone, sign in, check in, fill eight pillars for tomorrow, and close the day. Sign in to the Flatpak with the same test account and verify that the day is closed. Verify account separation with a second account. Exercise Android Back, the keyboard during editing, a narrow Linux window, and sign-in after password recovery.
- Interrupt connectivity once during a write and once during the following refresh. Reconnect and use **Refresh status**. Confirm the outcome from the API before retrying. Check that the saved result appears once and that a draft survives while the screen remains open.
- Install the first signed release through both repositories and publish a second build. Verify that the new build is offered and installs in place, and that the valid session and saved check-in survive. To recover from a bad release, publish the last working code with a newer version using the same signing keys.
