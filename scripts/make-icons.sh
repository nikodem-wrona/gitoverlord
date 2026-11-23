#!/usr/bin/env bash
# Builds the application icons from assets/logo-source.png.
#
# Run this script only when the logo changes: pnpm icons
# It needs ImageMagick 7 (the `magick` command).
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source_image="$root/assets/logo-source.png"
icons="$root/src-tauri/icons"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

canvas=1024   # The size of each master image.
emblem=820    # The size of the logo on the tile. The remainder is a margin.
mac_tile=824  # The size of the tile in the macOS icon grid.

# round_corners <input> <output>
# Makes the area outside a rounded square transparent.
round_corners() {
  local size radius
  size="$(magick identify -format '%w' "$1")"
  radius="$((size * 225 / 1000))"
  magick "$1" \
    \( -size "${size}x${size}" xc:black -fill white \
    -draw "roundrectangle 0,0,$((size - 1)),$((size - 1)),${radius},${radius}" \) \
    -alpha off -compose CopyOpacity -composite "$2"
}

# The logo on a black square tile.
magick "$source_image" -resize "${emblem}x${emblem}" \
  -background black -gravity center -extent "${canvas}x${canvas}" "$work/tile.png"

# Windows and Linux: the tile fills the canvas.
round_corners "$work/tile.png" "$work/icon.png"

# macOS: the tile is smaller and has a transparent margin, as the Apple icon grid shows.
magick "$work/tile.png" -resize "${mac_tile}x${mac_tile}" "$work/mac-tile.png"
round_corners "$work/mac-tile.png" "$work/mac-rounded.png"
magick "$work/mac-rounded.png" -background none -gravity center \
  -extent "${canvas}x${canvas}" "$work/icon-macos.png"

# The Tauri CLI makes each size and each format.
cd "$root"
pnpm exec tauri icon "$work/icon.png" --output "$work/general"
pnpm exec tauri icon "$work/icon-macos.png" --output "$work/macos"

for name in 32x32.png 128x128.png "128x128@2x.png" icon.png icon.ico; do
  cp "$work/general/$name" "$icons/$name"
done
cp "$work/macos/icon.icns" "$icons/icon.icns"

# The logo mark for the user interface: a white emblem whose transparency
# comes from the brightness of the logo. CSS uses it as a mask and colors it.
magick "$source_image" -resize 256x256 -colorspace gray -alpha copy \
  -fill white -colorize 100 -define png:exclude-chunks=date,time \
  "$root/src/assets/logo-mark.png"

echo "The icons in $icons and the logo mark are up to date."
