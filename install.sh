#!/bin/sh
# Installs the newest release of gitoverlord on macOS or on Linux.
#
#   curl -fsSL https://raw.githubusercontent.com/nikodem-wrona/gitoverlord/master/install.sh | sh
#
# The script reads latest.json of the newest release. The updater of the
# application reads the same file. minisign must accept the signature of the
# download for the public key of the updater. If not, the script installs nothing.
#
# GITOVERLORD_INSTALL_DIR  The folder for the application.
# GITOVERLORD_RELEASE_URL  The folder that holds latest.json, for a fork or a test.
set -eu

REPO="nikodem-wrona/gitoverlord"
RELEASE_URL="${GITOVERLORD_RELEASE_URL:-https://github.com/$REPO/releases/latest/download}"
ICON_URL="https://raw.githubusercontent.com/$REPO/master/src-tauri/icons/128x128.png"
# The public key in src-tauri/tauri.conf.json, without its base64 layer.
# scripts/release/test-install.sh fails when the two keys are different.
PUBLIC_KEY="RWRHVawPhsYluB0PdrkP5hstadL8yaTiY4NEDNhgZ8QRvznHTR418EmK"

say() {
  printf '%s\n' "$*"
}

fail() {
  printf 'gitoverlord: %s\n' "$*" >&2
  exit 1
}

# Stops with the message $2 when the program $1 is not installed.
need() {
  command -v "$1" >/dev/null 2>&1 || fail "$2"
}

# Prints the name that latest.json gives to this system.
platform() {
  case "$(uname -s)-$(uname -m)" in
    Darwin-arm64) say darwin-aarch64 ;;
    Darwin-x86_64) say darwin-x86_64 ;;
    Linux-x86_64) say linux-x86_64 ;;
    *) fail "There is no installer for $(uname -s) on $(uname -m). See https://github.com/$REPO/releases/latest" ;;
  esac
}

# Downloads the URL $1 into the file $2. latest.json gives GitHub API links for
# the downloads. Such a link gives the file only for the octet-stream type, and
# else it gives a JSON description. The header has no effect on other links.
fetch() {
  curl --fail --silent --show-error --location \
    --header "Accept: application/octet-stream" --output "$2" "$1"
}

# Prints the text field $2 of the JSON object $1. The object is on standard input.
# An empty $1 reads a field of the top level.
field() {
  json="$(tr -d '\n\r')"
  if [ -n "$1" ]; then
    json="$(printf '%s' "$json" | sed -n "s/.*\"$1\"[[:space:]]*:[[:space:]]*{\([^}]*\)}.*/\1/p")"
  fi
  printf '%s\n' "$json" | sed -n "s/.*\"$2\"[[:space:]]*:[[:space:]]*\"\([^\"]*\)\".*/\1/p"
}

# Stops when the signature $2 is not correct for the file $1.
# latest.json holds the signature as base64 text of a minisign signature file.
verify() {
  printf '%s' "$2" | base64 --decode >"$1.minisig" 2>/dev/null ||
    fail "The signature in latest.json is not base64 text."
  minisign -V -m "$1" -x "$1.minisig" -P "$PUBLIC_KEY" >/dev/null ||
    fail "The signature of the download is not correct. The script installed nothing."
}

# Unpacks the archive $1 and puts gitoverlord.app in the Applications folder.
install_macos() {
  dir="${GITOVERLORD_INSTALL_DIR:-/Applications}"
  # A user who is not an administrator cannot write to /Applications.
  if [ -z "${GITOVERLORD_INSTALL_DIR:-}" ] && [ ! -w "$dir" ]; then
    dir="$HOME/Applications"
  fi
  mkdir -p "$dir"
  tar -xzf "$1" -C "$WORK"
  [ -d "$WORK/gitoverlord.app" ] || fail "The download does not contain gitoverlord.app."
  rm -rf "$dir/gitoverlord.app"
  mv "$WORK/gitoverlord.app" "$dir/gitoverlord.app"
  say "gitoverlord $VERSION is in $dir/gitoverlord.app."
  say "To start it, run: open \"$dir/gitoverlord.app\""
}

# Puts the AppImage $1 in the folder for the programs of the user.
install_linux() {
  dir="${GITOVERLORD_INSTALL_DIR:-$HOME/.local/bin}"
  mkdir -p "$dir"
  chmod +x "$1"
  mv "$1" "$dir/gitoverlord"
  desktop_entry "$dir/gitoverlord"
  say "gitoverlord $VERSION is in $dir/gitoverlord."
  case ":$PATH:" in
    *":$dir:"*) say "To start it, run: gitoverlord" ;;
    *) say "To start it, run: $dir/gitoverlord" ;;
  esac
}

# Adds the program $1 to the application menu of the desktop.
desktop_entry() {
  data="${XDG_DATA_HOME:-$HOME/.local/share}"
  icons="$data/icons/hicolor/128x128/apps"
  mkdir -p "$data/applications" "$icons"
  fetch "$ICON_URL" "$icons/gitoverlord.png" ||
    say "The icon did not download. The application menu shows a default icon."
  cat >"$data/applications/gitoverlord.desktop" <<EOF
[Desktop Entry]
Type=Application
Name=gitoverlord
Comment=A desktop Git client
Exec="$1"
Icon=gitoverlord
Terminal=false
Categories=Development;RevisionControl;
EOF
}

main() {
  need curl "curl is necessary. Install curl, then run the script again."
  need minisign "minisign is necessary, because it does a check of the signature. Install it with 'brew install minisign' or 'sudo apt install minisign', then run the script again."
  target="$(platform)"
  WORK="$(mktemp -d)"
  trap 'rm -rf "$WORK"' EXIT

  fetch "$RELEASE_URL/latest.json" "$WORK/latest.json" ||
    fail "The script found no release at $RELEASE_URL."
  VERSION="$(field "" version <"$WORK/latest.json")"
  url="$(field "$target" url <"$WORK/latest.json")"
  signature="$(field "$target" signature <"$WORK/latest.json")"
  if [ -z "$url" ] || [ -z "$signature" ]; then
    fail "The newest release has no installer for $target."
  fi

  say "The script downloads gitoverlord $VERSION."
  fetch "$url" "$WORK/download" || fail "The download failed: $url"
  verify "$WORK/download" "$signature"
  say "The signature is correct."
  case "$target" in
    darwin-*) install_macos "$WORK/download" ;;
    linux-*) install_linux "$WORK/download" ;;
  esac
}

# The script starts here, on its last line. A download that stops early then runs nothing.
main "$@"
