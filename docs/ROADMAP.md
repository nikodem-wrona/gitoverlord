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

## Structure

```
crates/git-core/   Rust library without Tauri: domain types, git access, tests
src-tauri/         Tauri shell: one small file for each command group
src/app/           application root and providers
src/hud/           design system: tokens, primitives, motion
src/features/      one folder for each feature, with one public entry
src/ipc/           generated bindings and IPC helpers
src/gallery/       component gallery, for development only
src/demo/          sample repository for the browser and for tests
src/actions/       action factory and registry (Phase 3)
assets/            source image of the logo
scripts/           maintenance scripts
```

## Factories

Use a factory only where it removes repeated code.

- **Backend factory:** `open_repo(path)` returns a `GitBackend`. The user interface does not know which engine ran.
- **Git command factory:** `git_command()` in `git-core` creates each `git` process with the same settings.
- **Action factory:** one `defineAction({ id, label, shortcut, run })` gives the button, the command palette entry, the shortcut, the progress toast, and the result animation. Each git operation then feels the same.
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

- [ ] Stage and unstage by file, then by hunk
- [ ] Commit and amend
- [ ] Discard with undo
- [ ] Create, switch, rename, and delete branches
- [ ] Stash
- [ ] Action factory, command palette, keyboard shortcuts

### Phase 4: Sync

Done when clone, commit, and push work from start to end. This is the first public alpha.

- [ ] Clone, fetch, pull, and push with progress events
- [ ] Ahead and behind counts
- [ ] Publish a branch
- [ ] Background fetch
- [ ] Authentication through the credential helper and SSH agent of the system

### Phase 5: GitHub

Done when a pull request opens from the application.

- [ ] Sign in with the OAuth device flow
- [ ] Token in the keychain of the operating system
- [ ] Clone from the account
- [ ] Pull request list with check status
- [ ] Create a pull request

### Phase 6: History surgery

Done when a merge conflict resolves fully in the application.

- [ ] Merge, rebase, cherry-pick, revert, reset
- [ ] Conflict resolution interface
- [ ] Interactive commit graph

### Phase 7: Showpieces and 1.0

Done when a signed 1.0 release runs on macOS, Windows, and Linux.

- [ ] Animated commit graph and sync pulses
- [ ] Themes
- [ ] Optional sound
- [ ] Performance pass and accessibility pass
- [ ] Code signing, automatic updates, installers

## Practices

Tools enforce these rules. CI fails when a rule fails.

- **Small files and functions:** oxlint limits a TypeScript file to 200 lines and a function to 50 lines. Clippy limits a Rust function to 40 lines.
- **Feature isolation:** each folder in `src/features/` has one `index.ts`. Other code imports only from that file.
- **Thin shell:** git logic stays in `git-core`. A Tauri command only calls `git-core` and returns the result.
- **Blocking work:** each command that starts a `git` process uses `run_blocking`. The main thread stays free.
- **Destructive actions:** discard, reset, and force-push use one path that asks for confirmation and permits recovery.
- **Calm mode:** each animation must stop in calm mode. Calm mode applies when the user selects it or when the system asks for reduced motion.
- **Read-only core:** `git2` does each read operation. A read operation must not write to the repository.
- **Sample data:** `pnpm dev` in a browser has no Rust core. The demo backend in `src/demo` gives a sample repository, and the status bar shows "Demo data". The release bundle does not contain the demo backend.
- **Tests:** `git-core` tests use real repositories. Interface tests mock the IPC layer and run in calm mode.
- **Workflow:** one vertical slice for each pull request. Use conventional commit messages. CI must pass before a merge.

## Risks

- **Scope:** GitHub Desktop is the result of years of work. Each phase ends with a usable version, so the project can stop after any phase.
- **Linux webview:** WebKitGTK is the slowest of the three webviews for heavy effects. Animations have a budget from Phase 1.
- **`tauri-specta` version:** the crate is a release candidate and its versions are pinned. An upgrade can change the generated bindings.
- **macOS distribution:** code signing needs a paid Apple Developer account. This is only necessary in Phase 7.
- **History depth:** a page of the history at a large offset reads each newer commit first. A page at commit 100 000 takes approximately 0.4 seconds. The first pages take a few milliseconds.
- **History order:** the history uses the unsorted walk of libgit2, which gives the order of `git log`. Each sorted walk reads the full history before the first commit, so do not use one.
- **Linux file watches:** inotify needs one watch for each folder. A very large working tree can reach the limit of the system. The repository then opens without automatic refresh.
