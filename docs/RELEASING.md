# Release gitoverlord

The release workflow, `.github/workflows/release.yml`, builds the installers on macOS, Windows, and Linux. A tag such as `v1.0.0` starts it. The workflow attaches the installers to a draft release on GitHub. When you publish the draft, the updater of each installed copy finds the new version.

## Installers

| System  | Installers                   | Notes                                                |
| ------- | ---------------------------- | ---------------------------------------------------- |
| macOS   | `.dmg` and `.app.tar.gz`     | One universal binary for Apple silicon and Intel     |
| Windows | NSIS `-setup.exe` and `.msi` | Each copy updates with an installer of its type      |
| Linux   | AppImage, `.deb`, and `.rpm` | Built on Ubuntu 22.04, so older systems can run them |

Each installer gets a `.sig` file. The workflow also attaches `latest.json`, which tells the updater the newest version and its downloads.

## Automatic updates

The application asks for `latest.json` of the newest release when it starts, and then one time each six hours. When a newer version is available, the status bar shows **Update to** and the version. Select it to download the update, install it, and start the new version. The command palette also has **Check for updates**.

The updater installs a download only when its signature matches the public key in `src-tauri/tauri.conf.json`. `requireSignedVersion` is on, so the signature must also give the version of the release. Then a changed `latest.json` cannot install an older release.

A development build does not update. `pnpm tauri dev` shows the version in the status bar and no update.

## Set up the secrets one time

Add the secrets and the variables in the settings of the repository on GitHub, under **Secrets and variables**, then **Actions**.

### The updater key

The release fails without the private key of the updater. A key pair is in `~/.tauri/gitoverlord.key` and `~/.tauri/gitoverlord.key.pub` on the machine of the maintainer. The public key is in `src-tauri/tauri.conf.json`.

1. Add the private key as the secret `TAURI_SIGNING_PRIVATE_KEY`:

   ```bash
   gh secret set TAURI_SIGNING_PRIVATE_KEY < ~/.tauri/gitoverlord.key
   ```

2. If the key has a password, add it as the secret `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`. The current key has no password.
3. Keep a copy of the private key in a safe place, for example a password manager.

If you lose the private key, the installed copies cannot verify a new release. Then make a new key pair with `pnpm tauri signer generate`, and put the new public key in `src-tauri/tauri.conf.json`. Each user must then install the next version manually.

### The GitHub sign-in

The application has the client ID of the gitoverlord OAuth app, so a release needs no variable for the sign-in. To use a different OAuth app in a release, add its client ID as the variable `GITOVERLORD_GITHUB_CLIENT_ID`. It is not a secret. The [README](../README.md#use-your-own-oauth-app) tells you how to make the OAuth app.

### macOS signing and notarization

Without these secrets, the workflow gives the app an ad-hoc signature. macOS then stops the first start, and the user must permit the app in **System Settings**, then **Privacy & Security**.

The signature and the notarization need a paid Apple Developer account.

| Secret                       | Value                                                                              |
| ---------------------------- | ---------------------------------------------------------------------------------- |
| `APPLE_CERTIFICATE`          | The base64 text of the `.p12` export of the Developer ID Application certificate   |
| `APPLE_CERTIFICATE_PASSWORD` | The password of the `.p12` file                                                    |
| `APPLE_SIGNING_IDENTITY`     | The name of the certificate, for example `Developer ID Application: Name (TEAMID)` |
| `APPLE_ID`                   | The email address of the Apple account                                             |
| `APPLE_PASSWORD`             | An app-specific password of the Apple account                                      |
| `APPLE_TEAM_ID`              | The team ID of the Apple Developer account                                         |

To get the base64 text of the certificate, run this command:

```bash
base64 -i certificate.p12 | pbcopy
```

### Windows signing

Without these values, Windows SmartScreen shows a warning before the first start. The workflow signs with [Azure Trusted Signing](https://learn.microsoft.com/azure/trusted-signing/) through `trusted-signing-cli`.

| Name                     | Type     | Value                                                                         |
| ------------------------ | -------- | ----------------------------------------------------------------------------- |
| `AZURE_CLIENT_ID`        | Secret   | The client ID of the app registration that can sign                           |
| `AZURE_CLIENT_SECRET`    | Secret   | The client secret of the app registration                                     |
| `AZURE_TENANT_ID`        | Secret   | The tenant ID of the app registration                                         |
| `AZURE_SIGNING_ENDPOINT` | Variable | The endpoint of the account, for example `https://wus2.codesigning.azure.net` |
| `AZURE_SIGNING_ACCOUNT`  | Variable | The name of the Trusted Signing account                                       |
| `AZURE_SIGNING_PROFILE`  | Variable | The name of the certificate profile                                           |

When `AZURE_CLIENT_ID` has a value, the workflow writes `src-tauri/tauri.windows.conf.json`. Tauri adds this file to the configuration on Windows, and its `signCommand` signs each file. A local build has no such file, so it has no signature.

## Make a release

1. Set the new version in `Cargo.toml`, under `[workspace.package]`, and in `package.json`. The two versions must be the same.
2. Run `cargo check` to update `Cargo.lock`. Then merge the change into `master`.
3. Tag the commit on `master` and push the tag:

   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

4. Wait for the **Release** workflow. It stops if the tag is not the version in `Cargo.toml` and `package.json`.
5. Open the draft release on GitHub. Install each installer and do a test of it.
6. Publish the draft. The updater of each installed copy then finds the new version.

## Test the workflow without a release

Run the **Release** workflow manually:

```bash
gh workflow run release.yml
```

A manual run builds the installers and keeps them as workflow artifacts. It makes no release, and the updater does not see it. The run needs the secret `TAURI_SIGNING_PRIVATE_KEY`.

## Build a release locally

`pnpm tauri build` makes the installers for your system without the updater files. To make the updater files too, give the private key and the release configuration:

```bash
TAURI_SIGNING_PRIVATE_KEY="$(cat ~/.tauri/gitoverlord.key)" TAURI_SIGNING_PRIVATE_KEY_PASSWORD="" pnpm tauri build --config src-tauri/tauri.release.conf.json
```
