#!/usr/bin/env bash
# Renders assets/social-preview.html to assets/social-preview.png.
#
# Run this script when the logo or the tagline changes: pnpm social-preview
# It needs Google Chrome or Chromium. Set CHROME to use a different binary.
# Then upload the image in the repository settings, under Social preview.
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
page="$root/assets/social-preview.html"
image="$root/assets/social-preview.png"
profile="$(mktemp -d)"
trap 'rm -rf "$profile"' EXIT

find_chrome() {
  local candidate
  for candidate in "${CHROME:-}" \
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
    "/Applications/Chromium.app/Contents/MacOS/Chromium" \
    google-chrome google-chrome-stable chromium chromium-browser; do
    if [ -n "$candidate" ] && command -v "$candidate" >/dev/null 2>&1; then
      echo "$candidate"
      return
    fi
  done
  echo "Google Chrome or Chromium is necessary. Set CHROME to its path." >&2
  exit 1
}

if [ ! -d "$root/node_modules/@fontsource/rajdhani" ]; then
  echo "The fonts are missing. Run pnpm install first." >&2
  exit 1
fi

"$(find_chrome)" --headless=new --disable-gpu --hide-scrollbars \
  --user-data-dir="$profile" --allow-file-access-from-files \
  --window-size=1280,640 --force-device-scale-factor=1 \
  --virtual-time-budget=3000 --screenshot="$image" "file://$page" >/dev/null 2>&1

echo "The social preview in $image is up to date."
