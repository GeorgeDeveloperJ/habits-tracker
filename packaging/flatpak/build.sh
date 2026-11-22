#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 2 || $# -gt 3 ]]; then
  echo 'Usage: packaging/flatpak/build.sh BINARY REPOSITORY [GPG_KEY_ID]' >&2
  exit 2
fi

binary=$1
repository=$2
sign=()
if [[ -n ${3:-} ]]; then
  sign=("--gpg-sign=$3")
fi

packaging_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
id=dev.krakenserv.habits
runtime=org.gnome.Platform//51
build_dir=$(mktemp -d)
trap 'rm -r -- "$build_dir"' EXIT

# The binary has already been compiled, so assembly only needs the runtime.
flatpak build-init "$build_dir" "$id" "$runtime" "$runtime" stable
install -Dm755 -- "$binary" "$build_dir/files/bin/kraken-habits"
install -Dm644 -- "$packaging_dir/$id.desktop" "$build_dir/files/share/applications/$id.desktop"
install -Dm644 -- "$packaging_dir/$id.metainfo.xml" "$build_dir/files/share/metainfo/$id.metainfo.xml"
install -Dm644 -- "$packaging_dir/../../frontend/src-tauri/icons/128x128.png" \
  "$build_dir/files/share/icons/hicolor/128x128/apps/$id.png"
app_info="$build_dir/files/share/app-info"
mkdir -p "$app_info/xmls" "$app_info/icons"
appstreamcli compose --no-net --prefix=/ --origin="$id" --image-format=png \
  --data-dir="$app_info/xmls" --icons-dir="$app_info/icons" "$build_dir/files"
flatpak build-finish --command=kraken-habits --share=network --share=ipc \
  --socket=wayland --socket=fallback-x11 "$build_dir"
flatpak build-export "${sign[@]}" "$repository" "$build_dir" stable
if [[ ${#sign[@]} -gt 0 ]]; then
  flatpak build-update-repo "${sign[@]}" --generate-static-deltas "$repository"
fi
