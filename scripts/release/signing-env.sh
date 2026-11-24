#!/usr/bin/env bash
# Writes each code signing variable that has a value to $GITHUB_ENV.
#
# GitHub Actions gives an empty text for a secret that does not exist. Tauri then
# tries to sign with the empty value and fails. Without the variable, Tauri
# builds the bundle without a signature.
set -euo pipefail

names=(
  APPLE_CERTIFICATE
  APPLE_CERTIFICATE_PASSWORD
  APPLE_SIGNING_IDENTITY
  APPLE_ID
  APPLE_PASSWORD
  APPLE_TEAM_ID
  AZURE_CLIENT_ID
  AZURE_CLIENT_SECRET
  AZURE_TENANT_ID
)

for name in "${names[@]}"; do
  value="${!name:-}"
  if [ -n "$value" ]; then
    # The delimiter syntax keeps a value with more than one line, for example a certificate.
    delimiter="END_$RANDOM$RANDOM$RANDOM"
    printf '%s<<%s\n%s\n%s\n' "$name" "$delimiter" "$value" "$delimiter" >> "$GITHUB_ENV"
  fi
done

# Without a Developer ID certificate, an ad-hoc signature lets the app start on
# Apple silicon. macOS then asks the user to permit the app one time.
if [ "${RUNNER_OS:-}" = "macOS" ] && [ -z "${APPLE_CERTIFICATE:-}" ]; then
  echo "APPLE_SIGNING_IDENTITY=-" >> "$GITHUB_ENV"
fi
