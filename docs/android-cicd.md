# Android APK CI/CD

While Kraken Habits completes the maintenance history required for the official [F-Droid submission](fdroid-submission.md), GitHub Actions builds, verifies, signs, and publishes ARM64 Android APKs via GitHub Releases.

## Workflow overview

- **CI ([`.github/workflows/android-ci.yml`](../.github/workflows/android-ci.yml))**: Runs on pull requests and pushes to `main` and `dev` touching `frontend/**`, `packaging/android/**`, or the Android CI files. Runs frontend lint, tests, production build, version-sync check, and builds an **unsigned** ARM64 release APK (`android-unsigned-apk` artifact, 14-day retention). Uses `permissions: contents: read` and requires no secrets.
- **Release CD ([`.github/workflows/android-release.yml`](../.github/workflows/android-release.yml))**: Runs on version tags matching `v*.*.*` (or manual `workflow_dispatch`). Verifies that the tag matches `frontend/src-tauri/tauri.conf.json` and `frontend/src-tauri/Cargo.toml`, builds the unsigned APK, signs it with `apksigner` using the repository's release keystore secrets, verifies the signature and alignment, generates `SHA256SUMS.txt`, and publishes both assets to the GitHub Release.

Signing is performed outside Gradle in the release workflow so `frontend/src-tauri/gen/android/app/build.gradle.kts` remains clean and compatible with F-Droid's reproducible/unsigned build recipe.

## One-time signing setup

Generate a dedicated Android release keystore **once** and back it up securely outside the repository (losing this key prevents in-place updates for existing users):

```bash
keytool -genkeypair -v \
  -keystore kraken-habits-release.keystore \
  -alias kraken-habits \
  -keyalg RSA -keysize 4096 -validity 10000
```

Encode the keystore as single-line base64:

```bash
base64 -w 0 kraken-habits-release.keystore
```

Add the following **Repository Secrets** in GitHub (**Settings → Secrets and variables → Actions**):

| Secret | Value |
| --- | --- |
| `ANDROID_KEYSTORE_BASE64` | Base64-encoded contents of `kraken-habits-release.keystore` |
| `ANDROID_KEYSTORE_PASSWORD` | Keystore password |
| `ANDROID_KEY_ALIAS` | Key alias (e.g., `kraken-habits`) |
| `ANDROID_KEY_PASSWORD` | Key password |

Optionally set a **Repository Variable** `VITE_API_URL` if you want to override the default `https://habits-api.krakenserv.dev/api`.

Never commit `*.keystore`, `*.jks`, or `*.p12` files (they are ignored in `.gitignore`).

## Cutting a release

1. Bump the version in `frontend/src-tauri/tauri.conf.json` and `frontend/src-tauri/Cargo.toml` (and update `frontend/src-tauri/Cargo.lock` if needed).
2. Add release notes under `fastlane/metadata/android/en-US/changelogs/` if desired and commit the changes.
3. Create and push an annotated tag matching the version:

```bash
git tag -a v0.1.1 -m "Release v0.1.1"
git push origin v0.1.1
```

The `Android Release` workflow will build `kraken-habits-0.1.1-arm64.apk`, sign and verify it, and attach it with `SHA256SUMS.txt` to the `v0.1.1` GitHub Release.

## User installation & updates

- Users can download `kraken-habits-<version>-arm64.apk` directly from GitHub Releases or track the repository in [Obtainium](https://obtainium.imranr.dev/) for automatic update notifications.
- Once the app is published to the official F-Droid catalog, users switching from GitHub Releases to F-Droid must uninstall the GitHub-signed build first, because F-Droid signs APKs with its own key.
