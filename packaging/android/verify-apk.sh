#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "Usage: $0 [--signed] <apk-path>" >&2
  exit 2
}

require_signed=false
apk_path=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --signed)
      require_signed=true
      shift
      ;;
    -h|--help)
      usage
      ;;
    -*)
      echo "Unknown option: $1" >&2
      usage
      ;;
    *)
      if [[ -n "$apk_path" ]]; then
        echo "Unexpected extra argument: $1" >&2
        usage
      fi
      apk_path="$1"
      shift
      ;;
  esac
done

if [[ -z "$apk_path" ]]; then
  usage
fi
if [[ ! -f "$apk_path" ]]; then
  echo "APK not found: $apk_path" >&2
  exit 1
fi

script_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
sdk_root="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-$HOME/Android/Sdk}}"
build_tools_dir="$sdk_root/build-tools/36.0.0"

find_tool() {
  local name="$1"
  if command -v "$name" >/dev/null 2>&1; then
    command -v "$name"
  elif [[ -x "$build_tools_dir/$name" ]]; then
    echo "$build_tools_dir/$name"
  else
    echo "Required Android build tool not found: $name (checked PATH and $build_tools_dir)" >&2
    exit 1
  fi
}

aapt_bin=$(find_tool aapt)
zipalign_bin=$(find_tool zipalign)

expected_version=$("$script_dir/verify-version.sh")

badging=$("$aapt_bin" dump badging "$apk_path")

if ! grep -Fq "package: name='dev.krakenserv.habits'" <<<"$badging"; then
  echo "APK verification failed: expected package 'dev.krakenserv.habits'" >&2
  exit 1
fi

if ! grep -Fq "versionName='${expected_version}'" <<<"$badging"; then
  echo "APK verification failed: expected versionName='${expected_version}'" >&2
  exit 1
fi

if ! grep -Fq "native-code: 'arm64-v8a'" <<<"$badging"; then
  echo "APK verification failed: expected native-code 'arm64-v8a'" >&2
  exit 1
fi

if grep -Fq "application-debuggable" <<<"$badging"; then
  echo "APK verification failed: release APK must not be debuggable" >&2
  exit 1
fi

"$zipalign_bin" -c 4 "$apk_path"

if [[ "$require_signed" == true ]]; then
  apksigner_bin=$(find_tool apksigner)
  "$apksigner_bin" verify --print-certs "$apk_path"
fi

echo "Verified APK: $apk_path (dev.krakenserv.habits v${expected_version}, arm64-v8a, zipaligned, signed=${require_signed})"
