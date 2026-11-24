#!/usr/bin/env bash
# Stops a release when the tag is not the version of the application.
#
# Usage: scripts/release/check-version.sh v1.2.3
# Cargo.toml gives the version of the bundle, and package.json gives the
# version in the status bar. The two files and the tag must agree.
set -euo pipefail

tag="${1:?give the tag, for example v1.2.3}"
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

cargo_version="$(sed -n 's/^version = "\(.*\)"$/\1/p' "$root/Cargo.toml" | head -n 1)"
node_version="$(sed -n 's/^  "version": "\(.*\)",$/\1/p' "$root/package.json" | head -n 1)"

if [ "$tag" != "v$cargo_version" ] || [ "$tag" != "v$node_version" ]; then
  echo "The tag $tag is not the version of the application." >&2
  echo "Cargo.toml: $cargo_version. package.json: $node_version." >&2
  exit 1
fi
echo "The tag $tag is the version of the application."
