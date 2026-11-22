#!/usr/bin/env bash
set -euo pipefail

repo_root=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)
tauri_conf="$repo_root/frontend/src-tauri/tauri.conf.json"
cargo_toml="$repo_root/frontend/src-tauri/Cargo.toml"

if [[ ! -f "$tauri_conf" ]]; then
  echo "Missing $tauri_conf" >&2
  exit 1
fi
if [[ ! -f "$cargo_toml" ]]; then
  echo "Missing $cargo_toml" >&2
  exit 1
fi

expected_arg="${1:-}"

node - "$tauri_conf" "$cargo_toml" "$expected_arg" <<'NODE'
const fs = require('node:fs');

const [, , tauriConfPath, cargoTomlPath, expectedArg] = process.argv;

const tauriConf = JSON.parse(fs.readFileSync(tauriConfPath, 'utf8'));
const tauriVersion = typeof tauriConf.version === 'string' ? tauriConf.version.trim() : '';
if (!tauriVersion) {
  console.error(`Missing "version" in ${tauriConfPath}`);
  process.exit(1);
}

const cargoLines = fs.readFileSync(cargoTomlPath, 'utf8').split(/\r?\n/);
let inPackage = false;
let cargoVersion = '';
for (const rawLine of cargoLines) {
  const line = rawLine.trim();
  if (line.startsWith('[')) {
    inPackage = line === '[package]';
    continue;
  }
  if (inPackage) {
    const match = line.match(/^version\s*=\s*"([^"]+)"/);
    if (match) {
      cargoVersion = match[1].trim();
      break;
    }
  }
}

if (!cargoVersion) {
  console.error(`Missing [package] version in ${cargoTomlPath}`);
  process.exit(1);
}

if (tauriVersion !== cargoVersion) {
  console.error(
    `Version mismatch: tauri.conf.json has "${tauriVersion}", Cargo.toml has "${cargoVersion}"`
  );
  process.exit(1);
}

if (expectedArg) {
  const normalizedExpected = expectedArg.startsWith('v') ? expectedArg.slice(1) : expectedArg;
  if (normalizedExpected !== tauriVersion) {
    console.error(
      `Tag/version mismatch: expected "${normalizedExpected}" (from "${expectedArg}"), manifests have "${tauriVersion}"`
    );
    process.exit(1);
  }
}

process.stdout.write(`${tauriVersion}\n`);
NODE
