#!/usr/bin/env bash
set -euo pipefail

frontend_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../../frontend" && pwd)
cd "$frontend_dir"

if [[ ! -f src-tauri/gen/android/gradlew ]]; then
  npm run tauri -- android init --ci
fi

npm run tauri -- icon public/apple-touch-icon.png
npm run tauri -- android build --apk --target aarch64 "$@" -- --locked
