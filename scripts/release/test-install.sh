#!/usr/bin/env bash
# Does a test of install.sh with a release that a temporary key signs.
#
# Usage: scripts/release/test-install.sh
# The test needs minisign. It installs only into a temporary folder.
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

fail() {
  echo "FAIL: $*" >&2
  exit 1
}

# Makes the release folder $1, with one download for this system and latest.json.
make_release() {
  mkdir -p "$1/source"
  if [ "$(uname -s)" = Darwin ]; then
    program="$1/source/gitoverlord.app/Contents/MacOS/gitoverlord"
    download="$1/gitoverlord_universal.app.tar.gz"
  else
    program="$1/source/gitoverlord.AppImage"
    download="$1/gitoverlord_amd64.AppImage"
  fi
  mkdir -p "$(dirname "$program")"
  printf '#!/bin/sh\necho gitoverlord\n' >"$program"
  chmod +x "$program"
  if [ "$(uname -s)" = Darwin ]; then
    tar -czf "$download" -C "$1/source" gitoverlord.app
  else
    cp "$program" "$download"
  fi
  minisign -S -s "$work/key.sec" -m "$download" >/dev/null
  # The Tauri signer writes the signature file as base64 text on one line.
  entry="{ \"signature\": \"$(base64 <"$download.minisig" | tr -d '\n')\", \"url\": \"file://$download\" }"
  cat >"$1/latest.json" <<EOF
{
  "version": "9.9.9",
  "notes": "A test release",
  "platforms": {
    "darwin-aarch64": $entry,
    "darwin-x86_64": $entry,
    "linux-x86_64": $entry
  }
}
EOF
}

# Runs the script $1 on the release folder $2. The application goes into the folder $3.
run_install() {
  GITOVERLORD_RELEASE_URL="file://$2" GITOVERLORD_INSTALL_DIR="$3" \
    XDG_DATA_HOME="$3/share" sh "$1" >"$work/output" 2>&1
}

# Succeeds when the folder $1 holds the application. On Linux, it also reads the desktop entry.
installed() {
  if [ "$(uname -s)" = Darwin ]; then
    [ -x "$1/gitoverlord.app/Contents/MacOS/gitoverlord" ]
  else
    [ -x "$1/gitoverlord" ] &&
      grep -q "^Exec=\"$1/gitoverlord\"$" "$1/share/applications/gitoverlord.desktop"
  fi
}

config_key="$(sed -n 's/.*"pubkey": "\(.*\)".*/\1/p' "$root/src-tauri/tauri.conf.json" | base64 --decode | tail -n 1)"
grep -q "^PUBLIC_KEY=\"$config_key\"$" "$root/install.sh" ||
  fail "install.sh does not have the public key of src-tauri/tauri.conf.json."

minisign -G -W -p "$work/key.pub" -s "$work/key.sec" >/dev/null
sed "s|^PUBLIC_KEY=.*|PUBLIC_KEY=\"$(tail -n 1 "$work/key.pub")\"|" "$root/install.sh" >"$work/install.sh"
make_release "$work/release"

run_install "$work/install.sh" "$work/release" "$work/good" || fail "$(cat "$work/output")"
installed "$work/good" || fail "The script did not install a correct release."

if run_install "$root/install.sh" "$work/release" "$work/other-key" || installed "$work/other-key"; then
  fail "The script installed a release that a different key signed."
fi

printf 'x' >>"$work/release/$(cd "$work/release" && ls gitoverlord_*[!g])"
if run_install "$work/install.sh" "$work/release" "$work/changed" || installed "$work/changed"; then
  fail "The script installed a download that changed after the signature."
fi

echo "install.sh installs a correct release and rejects a wrong signature."
