# gitoverlord roadmap

gitoverlord is an open-source alternative to GitHub Desktop. It has a Rust core, a Tauri shell, and a user interface that looks like a futuristic control panel. The application must be easy to use and fun to use.

Phases 0 to 4 are the minimum product. Each phase ends with a version that you can use.

## Stack

| Decision        | Selection                                                                                                             | Reason                                                                                        |
| --------------- | --------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Shell           | Tauri 2 in a Cargo workspace                                                                                          | Small binaries and a Rust core                                                                |
| Git engine      | One `GitBackend` trait. `git2` for read operations. The system `git` CLI for commits and network operations.          | Read operations must be fast. The CLI gives hooks, signing, credential helpers, SSH, and LFS. |
| IPC types       | `tauri-specta` generates `src/ipc/bindings.ts` from the Rust commands                                                 | The Rust types are the only source of the TypeScript types                                    |
| Frontend        | React 19, TypeScript, Vite                                                                                            | Large contributor pool and library ecosystem                                                  |
| Data flow       | TanStack Query for repository data. A small store for interface state. A Rust file watcher sends invalidation events. | The interface stays current without polling                                                   |
| Style           | CSS variables as design tokens, with CSS Modules for each component                                                   | No style framework to learn. Tokens keep the look consistent.                                 |
| Motion          | CSS animations and small React hooks. SVG for the timeline. Canvas only if SVG becomes too slow.                      | No motion library to load. Calm mode stops all motion in one place.                           |
| Fonts           | Rajdhani for titles and JetBrains Mono for data, from Fontsource, in the application bundle                           | The application works offline. The strict content security policy stays.                      |
| Lint and format | oxlint and Prettier for TypeScript. Clippy and rustfmt for Rust.                                                      | Fast checks that CI can enforce                                                               |
| Secrets         | The keychain of the operating system                                                                                  | Tokens are never written to disk as plain text                                                |
| Releases        | `tauri-action` builds the installers. `tauri-plugin-updater` reads `latest.json` of the newest GitHub release.        | No update server to run. A signature protects each update.                                    |

## Structure

```
crates/git-core/   Rust library without Tauri: domain types, git access, tests
crates/github/     Rust library without Tauri: GitHub sign-in, API, keychain
src-tauri/         Tauri shell: one small file for each command group
src/app/           application root and providers
src/hud/           design system: tokens, primitives, motion
src/features/      one folder for each feature, with one public entry
src/ipc/           generated bindings and IPC helpers
src/gallery/       component gallery, for development only
src/demo/          sample repository for the browser and for tests
src/actions/       action factory, command palette, and shortcuts
site/              landing page, which GitHub Pages serves
assets/            source image of the logo
scripts/           maintenance scripts
```

## Factories

Use a factory only where it removes repeated code.

- **Backend factory:** `open_repo(path)` returns a `GitBackend`. The user interface does not know which engine ran.
- **Git command factory:** `git_command()` in `git-core` creates each `git` process with the same settings.
- **Action factory:** one `defineAction({ id, label, group, shortcut, run })` gives the button, the command palette entry, and the shortcut. One runner gives each action its question, its progress toast, its result toast with Undo, and the result animation in the status bar. Each git operation then feels the same.
- **Fixture builder:** `RepoFixture::new().commit("a").branch("x")` creates real temporary repositories for tests.
- **Query client factory:** `createQueryClient()` gives the application and each test an isolated cache.
- **Column factory:** `textColumn(key, header)` makes a table column that shows one field as text.
- **Toast factory:** `createToastApi(push)` makes one function for each kind of notification: `info`, `ok`, and `fail`.
- **Demo handler factory:** `createDemoHandlers()` makes one handler for each command. The demo backend and the frontend tests use the handlers.

## Reference design mapped to git

| Reference element      | In gitoverlord                                                                                                         |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Module tab strip       | CHANGES, HISTORY, BRANCHES, REMOTES, STASH, PULL REQUESTS                                                              |
| Left tree              | Repositories, then branches, remotes, and tags                                                                         |
| Map with flight routes | The commit graph as a timeline. Each branch is a lane. Commits are points. A push is a pulse that moves to the remote. |
| Flight details panel   | Inspector for the selected commit or file, with the diff                                                               |
| Schedule tables        | Changed files and commit log, with a status column (STAGED, MODIFIED, CONFLICT in red)                                 |
| Waveform and bars      | Activity sparkline and ahead/behind gauges                                                                             |

## Phases

Phases 1 and 2 do not depend on each other. They can run in parallel.

### Phase 0: Foundations

Done when the application opens and CI is green on macOS, Windows, and Linux.

- [x] Cargo workspace with the `git-core` crate and the Tauri shell
- [x] React, TypeScript, and Vite frontend
- [x] Typed IPC with generated bindings
- [x] One round-trip command: find the version of the system `git`
- [x] Lint, format, and test tools for Rust and TypeScript
- [x] CI on macOS, Windows, and Linux

### Phase 1: HUD kit

Done when the application shell looks like the reference design with sample data.

- [x] Complete design tokens: color, type, spacing, glow, grid
- [x] Primitives: Panel, Table, Tree, Tabs, Button, Toast
- [x] Motion primitives: panel reveal, text decode, pulse, boot sequence
- [x] Application shell with the layout of the reference design
- [x] Component gallery
- [x] Reduced-motion support and a calm mode
- [x] Application icon to replace the Tauri placeholder

### Phase 2: Read-only viewer

Done when a large repository is smooth to browse.

- [x] `GitBackend` trait and backend factory
- [x] Open a repository and keep a list of recent repositories
- [x] Status, paginated log, branches, diff
- [x] Virtualized history table and commit inspector
- [x] File watcher that refreshes the interface

### Phase 3: Local workflow

Done when a full day of local work needs no terminal.

- [x] Stage and unstage by file, then by hunk
- [x] Commit and amend
- [x] Discard with undo
- [x] Create, switch, rename, and delete branches
- [x] Stash
- [x] Action factory, command palette, keyboard shortcuts

### Phase 4: Sync

Done when clone, commit, and push work from start to end. This is the first public alpha.

- [x] Clone, fetch, pull, and push with progress events
- [x] Ahead and behind counts
- [x] Publish a branch
- [x] Background fetch
- [x] Authentication through the credential helper and SSH agent of the system

### Phase 5: GitHub

Done when a pull request opens from the application.

- [x] Sign in with the OAuth device flow
- [x] Token in the keychain of the operating system
- [x] Clone from the account
- [x] Pull request list with check status
- [x] Create a pull request

### Phase 6: History surgery

Done when a merge conflict resolves fully in the application.

- [x] Merge, rebase, cherry-pick, revert, reset
- [x] Conflict resolution interface
- [x] Interactive commit graph

### Phase 7: Showpieces and 1.0

Done when a signed 1.0 release runs on macOS, Windows, and Linux.

- [x] Animated commit graph and sync pulses
- [x] Themes
- [x] Optional sound
- [x] Performance pass and accessibility pass
- [x] Installers for macOS, Windows, and Linux from a release workflow
- [x] Automatic updates with signed update files
- [x] Install script for macOS and Linux, with a check of the release signature
- [x] Code signing in the release workflow, when the certificates are in the secrets
- [x] Landing page on GitHub Pages
- [ ] Updater key, Apple certificate, and Windows signing account in the release secrets
- [ ] Signed 1.0 release

## Practices

Tools enforce these rules. CI fails when a rule fails.

- **Small files and functions:** oxlint limits a TypeScript file to 200 lines and a function to 50 lines. Clippy limits a Rust function to 40 lines.
- **Feature isolation:** each folder in `src/features/` has one `index.ts`. Other code imports only from that file.
- **Thin shell:** git logic stays in `git-core`. A Tauri command only calls `git-core` and returns the result.
- **Blocking work:** each command that starts a `git` process uses `run_blocking`. The main thread stays free.
- **Destructive actions:** discard, reset, and force-push use one path that asks for confirmation and permits recovery. The action has `confirm`, and its result has `undo`. A discard and a hard reset keep a copy of the changes in the stash. Abort and Skip of a stopped operation are the exceptions: they ask for confirmation, but git keeps no copy of the resolutions.
- **History operations:** a merge, a rebase, a cherry-pick, or a revert gives an `OperationResult`. A stop at conflicts is a result, not a failure. The banner then continues, skips, or aborts the operation. The undo of a complete operation moves the branch back with `git reset --keep`.
- **Calm mode:** each animation must stop in calm mode. Calm mode applies when the user selects it or when the system asks for reduced motion.
- **Themes:** components use the tokens, so each theme applies everywhere. Overlord, the default theme, is black and grey with one green. Each other theme also has one accent color.
- **Sound:** the sound is off by default. The action runner plays the sound of each result. Other code does not play sounds.
- **Accessibility:** each screen passes the WCAG 2.1 AA rules of axe in `src/app/accessibility.test.tsx`. A new screen or dialog goes into the test. Each text color of each theme has a contrast of 4.5:1 on each surface, and the border of a text field has 3:1. `themeContrast.test.ts` checks the tokens.
- **Performance budget:** `pnpm bench` measures each read operation on a repository with 50 000 commits, 5 000 files, and 3 000 changed files. Each read operation must take less than 500 ms. On an Apple M4, the status takes 155 ms, and each other read takes less than 35 ms.
- **Line counts:** a change gets line counts for its first 1 000 files only. The line counts read the content of each file, so they are the slowest part of the status and of a large commit.
- **Renders:** a progress event of a network operation renders only the components that show the progress. The timeline renders again only when an operation starts or stops.
- **Read-only core:** `git2` does each read operation. A read operation must not write to the repository.
- **Write operations:** the system `git` does each write operation, so hooks, signing, and the configuration of the user apply. Each write operation runs in an action. The background fetch is the only exception.
- **Secrets:** the GitHub token stays in the backend and in the keychain. The user interface never receives it. A `git` process gets it through its environment, not on the command line.
- **Network operations:** one network operation runs at a time. `git` gets the credentials from the credential helper and the SSH agent of the system. It must fail, not wait for a password.
- **Sample data:** `pnpm dev` in a browser has no Rust core. The demo backend in `src/demo` gives a sample repository, and the status bar shows "Demo data". The release bundle does not contain the demo backend.
- **Tests:** `git-core` tests use real repositories. Interface tests mock the IPC layer and run in calm mode.
- **Releases:** a tag builds the installers and attaches them to a draft release. The tag must be the version in `Cargo.toml` and `package.json`. `docs/RELEASING.md` gives the steps and the secrets.
- **Updates:** the updater installs a download only when its signature matches the public key in `tauri.conf.json`. The signature must also give the version of the release.
- **Workflow:** one vertical slice for each pull request. Use conventional commit messages. CI must pass before a merge.

## Risks

- **Scope:** GitHub Desktop is the result of years of work. Each phase ends with a usable version, so the project can stop after any phase.
- **Linux webview:** WebKitGTK is the slowest of the three webviews for heavy effects. Animations have a budget from Phase 1.
- **`tauri-specta` version:** the crate is a release candidate and its versions are pinned. An upgrade can change the generated bindings.
- **macOS distribution:** code signing needs a paid Apple Developer account. Without it, the release has an ad-hoc signature, and the user must permit the app one time.
- **Windows distribution:** without a signing account, SmartScreen shows a warning before the first start.
- **Updater key:** if the private key of the updater is lost, the installed copies cannot verify a new release. Each user must then install the next version manually.
- **Linux installers:** the release builds them on Ubuntu 22.04, so that systems with an older glibc can run them. When GitHub removes this runner image, use the oldest image that remains.
- **History depth:** a page of the history at a large offset reads each newer commit first. A page at commit 100 000 takes approximately 0.4 seconds. The first pages take a few milliseconds.
- **History order:** the history uses the unsorted walk of libgit2, which gives the order of `git log`. Each sorted walk reads the full history before the first commit, so do not use one.
- **Git version:** the write operations send paths with `--pathspec-from-file`. This option needs Git 2.26 or later.
- **Stash with paths:** in Git 2.54, `git stash push --keep-index` loses the staged changes when the paths include an untracked file. A discard does not use `--keep-index`. It restores the staged versions from the stash entry.
- **Pull:** a pull only fast-forwards. When the branch and its upstream both have new commits, the user merges the upstream or rebases the branch on it.
- **Force push:** a force push uses `--force-with-lease` with the commit of the upstream from the last fetch. It refuses when the remote changed after the fetch. Its undo needs the network too.
- **Sync pulse:** the pulse moves with an SVG `animateMotion`. The calm mode rule of `base.css` does not stop it, so the timeline does not draw it in calm mode.
- **Web Audio:** the audio context starts at the first sound after a click. A system that blocks the audio of the webview gives no sound.
- **Editor:** each `git` process gets `GIT_EDITOR=true`. A merge or a rebase then uses the commit message that `git` proposes.
- **Conflict markers:** the resolver reads markers of seven characters, the default size. A file with a `conflict-marker-size` attribute shows no markers. Resolve such a file in an editor.
- **Restored conflicts:** the undo of a resolution writes the conflict again from the index. The markers then have the labels `ours` and `theirs`, not the branch names.
- **SSH host keys:** `ssh` runs in batch mode, so it cannot ask to accept a new host key. The user connects one time in a terminal first.
- **GitHub client ID:** the sign-in uses the gitoverlord OAuth app, which has the device flow. Its client ID is in `crates/github`. `GITOVERLORD_GITHUB_CLIENT_ID` replaces it at build time or at run time. The application does not refresh a token, so the OAuth app must not expire its tokens.
- **GitHub token for git:** after a sign-in, the token replaces the credential helpers of the user for github.com in the `git` processes of gitoverlord. A user with a second GitHub account must sign in with the account that has the access.
- **Large working trees:** the status scans the full working tree, also when it counts no lines. The scan time grows with the number of files that are not ignored. Add the generated folders to `.gitignore`.
- **Accessibility tests:** jsdom has no layout, so axe does not check the colors of the components. The contrast test checks the tokens only.
- **Linux file watches:** inotify needs one watch for each folder. A very large working tree can reach the limit of the system. The repository then opens without automatic refresh.
