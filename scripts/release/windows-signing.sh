#!/usr/bin/env bash
# Makes Tauri sign each Windows file with Azure Trusted Signing.
#
# Tauri merges src-tauri/tauri.windows.conf.json into the configuration on
# Windows. The file exists only in the release workflow, so a local build has no
# signature. trusted-signing-cli reads AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, and
# AZURE_TENANT_ID from the environment.
set -euo pipefail

endpoint="${AZURE_SIGNING_ENDPOINT:?set the AZURE_SIGNING_ENDPOINT variable}"
account="${AZURE_SIGNING_ACCOUNT:?set the AZURE_SIGNING_ACCOUNT variable}"
profile="${AZURE_SIGNING_PROFILE:?set the AZURE_SIGNING_PROFILE variable}"
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

cat > "$root/src-tauri/tauri.windows.conf.json" <<JSON
{
  "bundle": {
    "windows": {
      "signCommand": "trusted-signing-cli -e $endpoint -a $account -c $profile -d gitoverlord %1"
    }
  }
}
JSON
