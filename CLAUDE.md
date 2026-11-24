# gitoverlord

gitoverlord is an open-source desktop Git client. It has a Rust core, a Tauri 2 shell, and a React 19 and TypeScript user interface.

`docs/ROADMAP.md` gives the stack, the phases, the practices, and the status of each phase. Read it before you start a feature. Update its checklists when a task is complete.

## Commands

- `pnpm install`: install the frontend dependencies.
- `pnpm tauri dev`: start the application.
- `GITOVERLORD_GITHUB_CLIENT_ID=<id> pnpm tauri dev`: start the application with a different GitHub OAuth app. The ID is the client ID of an OAuth app with the device flow. Without the variable, the sign-in uses the built-in client ID.
- `pnpm dev`: start only the frontend at `http://localhost:1420`. There is no Rust core in this mode. The demo backend in `src/demo` answers each command with a sample repository, and the status bar shows "Demo data". The component gallery is at `http://localhost:1420/gallery.html`.
- `pnpm check`: run each check for TypeScript and Rust. Run it before you report that work is complete.
- `pnpm check:ui`: run the Prettier check, oxlint, `tsc -b`, and Vitest.
- `pnpm check:rust`: run the rustfmt check, Clippy with `-D warnings`, and `cargo test --workspace`.
- `pnpm vitest run src/path/to/file.test.tsx`: run one frontend test file.
- `cargo test -p git-core <test name>`: run one Rust test.
- `pnpm test:install`: do a test of `install.sh` with a release that a temporary key signs. The test needs `minisign` and is not part of `pnpm check`. Run it after a change to `install.sh` or to the updater key.
- `pnpm bench`: measure each read operation of `git-core` on a repository with 50 000 commits. The test is slow and is not part of `pnpm check`. Run it after a change to a read operation.
- `pnpm bindings`: write `src/ipc/bindings.ts` again. Run it after each change to a command or to a type that a command uses.
- `pnpm format` and `cargo fmt --all`: format the code.
- `gh workflow run release.yml`: build the installers on GitHub without a release. `docs/RELEASING.md` tells you how to make a release and which secrets it needs.
- `pnpm icons`: build the icons in `src-tauri/icons/` again from `assets/logo-source.png`. Run it only when the logo changes. It needs ImageMagick 7.

## Architecture

- `crates/git-core/`: all git logic. This crate does not depend on Tauri. Types that go to the user interface derive `serde::Serialize` and `specta::Type`.
  - `backend.rs`: the `GitBackend` trait and the factory `open_repo(path)`. Each read operation and each write operation is a method of the trait. A network method sends each progress line of `git` to its `progress` argument. A merge, rebase, cherry-pick, revert, continue, or skip gives an `OperationResult`: `done` with the commit before it, or `stopped` with the files that have conflicts.
  - `clone.rs`: `clone_target(url, parent)` gives the folder of a clone, and `clone_repo` clones. A clone has no repository yet, so it is not a method of the trait.
  - `libgit/`: the backend. It reads with `git2` and changes the repository through `cli`. There is one file for each operation: `summary`, `log`, `status`, `branches`, `detail`, `diff`, `activity`, `stash`, `hunk`, `discard`, `remotes`, and `sync`.
  - `libgit/operation.rs` reads the operation that stopped. `RepoSummary.operation` gives it to the user interface. `libgit/surgery.rs` runs merge, rebase, cherry-pick, revert, reset, and their continue, skip, and abort. `libgit/conflict.rs` reads and resolves a file with conflicts. Its tests are in `libgit/surgery_tests.rs`.
  - `markers.rs`: reads the conflict markers of a file and replaces each conflict with the chosen lines. Each line keeps its line ending.
  - `model/`: the types of the data. `recent.rs`: the list of recent repositories. `watch.rs`: `RepoWatcher`, which reports changes on the disk.
  - `cli/`: starts each `git` process through `git_command()`, which sets `GIT_EDITOR=true`. `stage.rs`, `commit.rs`, `branch.rs`, `stash.rs`, `remote.rs`, `sequence.rs`, `reset.rs`, and `resolve.rs` hold the write operations. `run_git_on_paths` sends a list of paths on the standard input.
  - `cli/network.rs`: `run_network` runs fetch, pull, push, and clone. It sets `GIT_TERMINAL_PROMPT=0` and, if the user selected no SSH program, `ssh -o BatchMode=yes`. Then `git` fails and does not wait for a password. `progress.rs` reads the progress lines of `git`.
  - `libgit/delta.rs` reads the changed files of a diff. Only the first 1 000 files get line counts, so `FileDelta.additions` and `deletions` can be `None`.
  - `perf_tests.rs`: the benchmark of `pnpm bench`. It builds the large repository with `git fast-import`.
  - `fixture.rs`: `RepoFixture`, which builds real repositories for tests. The configuration of each repository replaces the user, the signing, and the hooks path of the machine. `RepoFixture::diverged()` gives two branches that change one file, for conflict tests.
- `crates/github/`: GitHub access without Tauri. Each failure is a `GitError`.
  - `client.rs`: `GitHub`, the HTTP client. A 401 answer gives `GitError::SignInExpired`. Tests send the requests to `test_server.rs`.
  - `device.rs`: the sign-in with the OAuth device flow. `account.rs`, `pulls.rs`: the account, the repositories, and the pull requests. One GraphQL query reads the pull requests with their checks.
  - `keychain.rs`: the token in the keychain, with `keyring`. `repo_links.rs`: finds the GitHub remote of a repository and makes the `HostToken` for `git`.
  - `client_id()` reads `GITOVERLORD_GITHUB_CLIENT_ID` at run time, else at build time, else it gives the built-in client ID of the gitoverlord OAuth app. The application does not refresh a token, so that app must not expire its tokens.
- `src-tauri/`: a thin shell. `src/ipc.rs` registers the commands and the events. Each file in `src/commands/` holds one command group. A command calls `git-core` through `run_blocking` or `with_repo` and returns `Result<T, GitError>`. `session.rs` holds the recent repositories and the watcher of the open repository. `events.rs` holds the `RepoChanged` and `SyncProgress` events. `commands/sync.rs` runs one network operation at a time and sends a `SyncProgress` event for each step and one at the end. `commands/github.rs` holds the GitHub commands. `Session` keeps the GitHub token, and the sync commands give it to `git` as a `HostToken`. `commands/update.rs` checks for a new version and installs it with `tauri-plugin-updater`. A development build does not update. `tauri.release.conf.json` adds the signed updater files to a release build.
- `src/ipc/`: `tauri-specta` generates `bindings.ts`. Do not edit it. `unwrap` changes a command result into data or a thrown `CommandError`. `errorMessage` changes a failure into a sentence for the user.
- `src/actions/`: the action factory. `defineAction` makes an `Action`. `ActionButton`, the command palette, and the shortcuts run each action through one runner in `ActionProvider`.
  - The runner asks the `confirm` or `prompt` question of the action. Then it shows the progress, the result notification, and the Undo button of an `Outcome`.
  - `useRegisterActions` puts actions in the command palette and turns on their shortcuts. `ActionStatus` shows the last result in the status bar.
  - `ActionMenu` shows actions in a `Menu`, for example the context menu of a commit. `ActionMenuButton` opens an `ActionMenu` under a button.
  - An `Outcome` with `tone: "warn"` shows a result that needs the user, for example a merge that stopped. The runner also plays the sound of the tone of each result.
  - An `Outcome` with `next` starts a second action after the result. The runner asks the question of that action at once. **Check for updates** uses it to ask about the install.
- `src/hud/`: the design system. Components are presentational and do not call the backend.
  - `global.css` imports the fonts, `tokens.css`, and `base.css`. Each entry point imports it once.
  - Primitives: `Panel`, `Table` with `textColumn` (a column with `shortHeader` shows a short text, for example `+`, and a screen reader reads `header`), `Tree`, `Tabs` with `TabPanel`, `Button`, `Checkbox`, `TextField`, `Dialog`, `Menu`, `ToolLayout`, `Readout`, `Meter`, `EmptyState`, `PathText`, `LogoMark`, `useEscapeKey`, and `useToast` with `ToastProvider`.
  - `Menu` is a pop-up list in a portal. The arrow keys move the focus. Escape, Tab, or a press outside closes it.
  - `useToast` returns the id of each notification. A notification can have an `action` button, and a `sticky` notification stays until `dismiss`. The timer of a notification stops while the pointer or the focus is on it.
  - `Dialog` keeps the focus inside until it closes.
  - `rows/`: `useRowWindow` renders only the rows in view. `Table` and the diff viewer use it. Each row must have the height `--row-height`.
  - `motion/`: `MotionProvider` and `useMotion` decide calm mode. `DecodeText`, `PulseDot`, and `CalmToggle` use it.
  - `theme/`: `ThemeProvider` sets `data-theme` on the root element, and `useTheme` gives the theme. `themes.ts` lists the themes, and `themes.css` gives the tokens of each theme that is not the default. `ThemePicker` is in the status bar.
  - `sound/`: `SoundProvider` and `useSound` hold the sound setting. `sounds.ts` synthesizes the sounds with Web Audio. `SoundToggle` is in the status bar.
  - `settings.ts`: `readSetting` and `writeSetting` keep the settings of the user in local storage. `StatusButton` is a text button for the status bar.
- `src/features/<name>/`: one folder for each feature. `index.ts` is its only public entry.
  - `repository`: the data layer. `lineCountColumns` and `lineTotals` show the line counts of the changed files. `queries.ts` holds one TanStack Query hook for each read command, and `keys.ts` holds the cache keys. `useRepoWriter` runs a write command, then refreshes the queries. `useRepoSession` holds the open repository. `useRepoWatcher` refreshes the queries after a `RepoChanged` event. `QueryPanel` shows the state of a query. `RepoDock` is the start screen.
  - `history`: the commit timeline, the commit log, and the commit inspector. `assignLanes` and `layoutTimeline` are pure functions. The timeline draws in pixels without a view box, so its text keeps one size. `useTimelineControls` gives the arrow keys and the context menu of the timeline. `TimelineDrawing` draws the timeline: commits and links animate in when they come into view. `SelectionStatus` tells a screen reader the selected commit while the timeline has the focus. `SyncPulse` shows a network operation between `HEAD` and the right edge. The inspector shows the `tools` that it gets, under the author.
  - `surgery`: the history operations. `historyActions.ts`, `resetActions.ts`, and `stepActions.ts` make the actions. `operationOutcome` makes the notification of an `OperationResult`. `OperationBanner` shows the operation that stopped. `CommitTools` is the toolbar of the commit inspector. `commitActions` and `useCommitMenu` give the context menu of a commit.
  - `conflicts`: `ConflictPanel`, the conflict resolver. The user chooses the lines of each conflict, then the file is resolved and staged in one command.
  - `changes`, `branches`, `stash`: the tables with their toolbars. Each one has a file that makes its actions, for example `branchActions.ts`.
  - `commit`: the commit console. `telemetry`: the activity panel.
  - `github`: `GitHubProvider` holds the sign-in dialog and the clone dialog, and puts the GitHub actions in the palette. `AccountButton` is in the top bar. `PullRequestPanel` is the Pull requests tab. `queries.ts` has its own `githubKeys`, so a change on the disk does not ask GitHub again.
  - `sync`: `SyncButtons` in the top bar, `SyncPanel` with the counts and the progress, `RemotePanel` on the Remotes tab, and `CloneControl` on the start screen. `useSyncProgress` reads the `SyncProgress` events. `useBackgroundFetch` fetches when the last fetch is older than five minutes. `upstreamActions` merges the upstream into a diverged branch, rebases the branch on it, or force-pushes the branch. `useSyncPulse` gives the operation for the sync pulse, and keeps a short operation for 1.2 seconds. It reads `useSyncOperation`, so that each progress step does not render the timeline again.
  - `diff`: the diff viewer, with the stage and unstage buttons of each hunk.
  - `update`: `UpdateStatus` in the status bar shows the version, or a button that installs a new version. `useUpdateActions` puts **Check for updates** in the palette. When a newer version is known, it also puts **Update gitoverlord to** and the version there. `APP_VERSION` is the version in `package.json`, which `vite.config.ts` gives as `import.meta.env.APP_VERSION`.
  - `system`: the git status readout and the alert when git fails. `boot`: the start-up sequence.
- `src/app/`: `AppProviders`, `Root` (boot sequence, then shell), `AppShell` (the layout), `RepoDeck` (the three columns of an open repository), `TopBar`, `StatusBar`, `Workspace`, and the module list in `modules.ts`. `appActions` and `useRepoActions` put the actions in the command palette. `useDeckSelection` holds the selected commit and the open file. `CenterView` shows the conflict resolver, the diff viewer, or the timeline.
- `src/demo/`: the sample repository and `createDemoHandlers`. The handlers keep a copy of the sample repository, and the write commands change it. `main.tsx` loads the demo backend only in development and only outside Tauri. A merge or a rebase of `spike/radar` stops at a conflict. Each conflict shows `sampleConflict`. The demo always offers one update.
- `src/gallery/`: the component gallery. Vite serves it in development only.
- `.github/workflows/release.yml`: a tag such as `v1.0.0` builds the installers and attaches them to a draft release. `scripts/release/` checks the version, and exports only the signing secrets that have a value.
- `install.sh`: the install script for macOS and Linux, which a user runs with `curl … | sh`. It reads `latest.json` of the newest release, checks the download with `minisign`, and installs it. It is POSIX `sh`, not Bash. `scripts/release/test-install.sh` is its test.
- `src/test/`: helpers for frontend tests. `expectAccessible` checks the page with axe. `contrast.ts` reads the color tokens and computes WCAG contrast ratios.

## Rules

- Keep files and functions small. oxlint permits 200 lines for a file and 50 lines for a function. Clippy permits 40 lines for a Rust function.
- Import through index files: `@/features/<name>`, `@/hud`, `@/ipc`, `@/actions`. oxlint rejects deeper imports.
- Put git logic in `git-core`, not in a Tauri command and not in TypeScript.
- Use the tokens in `src/hud/tokens.css` for colors, spacing, and type. Do not put literal values in component CSS.
- For a signal color, set `data-tone` to a `Tone` value and use `var(--tone)` in the CSS.
- The default theme, Overlord, is black, white, and neutral greys, with one green. `--color-accent` is white, for titles, borders, and focus. Use `--color-active` (green) or the `active` tone only for an active or primary state, for example the current tab, a primary button, or a selection marker. Do not add blue.
- Each other theme in `themes.css` changes only tokens, and has one accent color. Use the tokens in components, so that each theme applies. Overlord must stay one of the themes.
- Each screen and each dialog must pass `expectAccessible` in `src/app/accessibility.test.tsx`. Add a new screen to that test.
- Each text color must have a contrast of 4.5:1 on each surface of each theme, and `--color-control-line` 3:1. `themeContrast.test.ts` checks it.
- A component that only needs to know which network operation runs uses `useSyncOperation`, not `useSyncProgress`.
- Each animation must stop in calm mode. The rule in `base.css` stops CSS animations. A JavaScript or SMIL animation must check `useMotion().calm`. Write CSS animations so that their end state is correct when they stop at once.
- The sound is off by default. Only the action runner plays sounds.
- Use a factory only where it removes repeated code.
- Frontend tests mock the backend with `mockRepository` from `@/test/mockRepository` and render with `renderWithProviders`. `mockRepository` gives the sample repository, and its argument replaces the handlers that a test changes. `git-core` tests use the real `git` through `RepoFixture`.
- A read operation in `git-core` must not write to the repository. A write operation runs the system `git` through `cli`.
- Send a list of paths to `git` with `run_git_on_paths` and `--literal-pathspecs`. Do not put paths on the command line.
- Use `history_walk` for each walk of the history. A sorted walk of libgit2 reads the full history before the first commit.
- A component that shows repository data takes `repoPath` and reads its data with a hook from `@/features/repository`.
- When you add a command, add its handler to `src/demo/demoHandlers.ts`. A read handler must return a copy of the demo state. Else TanStack Query does not see the change.
- Run each write command in an action from `defineAction`, through `useRepoWriter(path).write`. Then the panels refresh and the user sees the result. The background fetch is the only exception. It shows no notification.
- Run each network command through `run_network` with `--progress`. A network command must not ask for input.
- The GitHub token stays in the backend. Do not send it to the user interface, and do not put it on a command line.
- A destructive action must have `confirm`, and its `Outcome` must have `undo`. A discard and a hard reset keep a copy of the changes in the stash. Abort and Skip of a stopped operation are the only exceptions: they have `confirm`, but git keeps no copy of the resolutions.
- A `git` process must not open an editor. `git_command()` sets `GIT_EDITOR=true`, so start each process there.
- A new history operation must not start while a stopped operation waits or while a file has conflicts. `startBlocked` in `surgery` gives the reason, and `git-core` rejects it too.
- Write the file of a resolution only for a path that has a conflict in the index. Then the path is a file of the repository.
- A shortcut uses `Mod`, which is Command on macOS and Control on other systems. In tests, `Mod` is Control.
- Give each mock function a type, for example `vi.fn<MockCommandHandlers["stageFiles"]>()`. oxlint rejects a mock function without a type.
- Frontend tests run in calm mode. Call `mockReducedMotion(false)` from `@/test/matchMedia` to test an animation, and `advanceInSteps` from `@/test/timers` for a timer sequence.
- When the Browser pane is hidden, the page runs in the background and CSS animations pause. The panels can then look empty in a screenshot. Turn on calm mode to check the layout.
- The versions of `specta`, `tauri-specta`, and `specta-typescript` are pinned. Change them together.
- Keep the version in `Cargo.toml` and in `package.json` the same. The release workflow stops when they are not the version of the tag.
- Keep `PUBLIC_KEY` in `install.sh` the same as the public key in `src-tauri/tauri.conf.json`. `pnpm test:install` fails when they are different.
- The private key of the updater stays out of the repository. Only the release workflow reads it, from the secret `TAURI_SIGNING_PRIVATE_KEY`.
- When you add a tool or a command, update `README.md` and this file.
