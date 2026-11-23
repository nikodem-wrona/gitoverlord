# gitoverlord

gitoverlord is an open-source desktop Git client. It has a Rust core, a Tauri 2 shell, and a React 19 and TypeScript user interface.

`docs/ROADMAP.md` gives the stack, the phases, the practices, and the status of each phase. Read it before you start a feature. Update its checklists when a task is complete.

## Commands

- `pnpm install`: install the frontend dependencies.
- `pnpm tauri dev`: start the application.
- `pnpm dev`: start only the frontend at `http://localhost:1420`. There is no Rust core in this mode. The demo backend in `src/demo` answers each command with a sample repository, and the status bar shows "Demo data". The component gallery is at `http://localhost:1420/gallery.html`.
- `pnpm check`: run each check for TypeScript and Rust. Run it before you report that work is complete.
- `pnpm check:ui`: run the Prettier check, oxlint, `tsc -b`, and Vitest.
- `pnpm check:rust`: run the rustfmt check, Clippy with `-D warnings`, and `cargo test --workspace`.
- `pnpm vitest run src/path/to/file.test.tsx`: run one frontend test file.
- `cargo test -p git-core <test name>`: run one Rust test.
- `pnpm bindings`: write `src/ipc/bindings.ts` again. Run it after each change to a command or to a type that a command uses.
- `pnpm format` and `cargo fmt --all`: format the code.
- `pnpm icons`: build the icons in `src-tauri/icons/` again from `assets/logo-source.png`. Run it only when the logo changes. It needs ImageMagick 7.

## Architecture

- `crates/git-core/`: all git logic. This crate does not depend on Tauri. Types that go to the user interface derive `serde::Serialize` and `specta::Type`.
  - `backend.rs`: the `GitBackend` trait and the factory `open_repo(path)`. Each read operation and each write operation is a method of the trait. A network method sends each progress line of `git` to its `progress` argument.
  - `clone.rs`: `clone_target(url, parent)` gives the folder of a clone, and `clone_repo` clones. A clone has no repository yet, so it is not a method of the trait.
  - `libgit/`: the backend. It reads with `git2` and changes the repository through `cli`. There is one file for each operation: `summary`, `log`, `status`, `branches`, `detail`, `diff`, `activity`, `stash`, `hunk`, `discard`, `remotes`, and `sync`.
  - `model/`: the types of the data. `recent.rs`: the list of recent repositories. `watch.rs`: `RepoWatcher`, which reports changes on the disk.
  - `cli/`: starts each `git` process through `git_command()`. `stage.rs`, `commit.rs`, `branch.rs`, `stash.rs`, and `remote.rs` hold the write operations. `run_git_on_paths` sends a list of paths on the standard input.
  - `cli/network.rs`: `run_network` runs fetch, pull, push, and clone. It sets `GIT_TERMINAL_PROMPT=0` and, if the user selected no SSH program, `ssh -o BatchMode=yes`. Then `git` fails and does not wait for a password. `progress.rs` reads the progress lines of `git`.
  - `fixture.rs`: `RepoFixture`, which builds real repositories for tests. The configuration of each repository replaces the user, the signing, and the hooks path of the machine.
- `src-tauri/`: a thin shell. `src/ipc.rs` registers the commands and the events. Each file in `src/commands/` holds one command group. A command calls `git-core` through `run_blocking` or `with_repo` and returns `Result<T, GitError>`. `session.rs` holds the recent repositories and the watcher of the open repository. `events.rs` holds the `RepoChanged` and `SyncProgress` events. `commands/sync.rs` runs one network operation at a time and sends a `SyncProgress` event for each step and one at the end.
- `src/ipc/`: `tauri-specta` generates `bindings.ts`. Do not edit it. `unwrap` changes a command result into data or a thrown `CommandError`. `errorMessage` changes a failure into a sentence for the user.
- `src/actions/`: the action factory. `defineAction` makes an `Action`. `ActionButton`, the command palette, and the shortcuts run each action through one runner in `ActionProvider`.
  - The runner asks the `confirm` or `prompt` question of the action. Then it shows the progress, the result notification, and the Undo button of an `Outcome`.
  - `useRegisterActions` puts actions in the command palette and turns on their shortcuts. `ActionStatus` shows the last result in the status bar.
- `src/hud/`: the design system. Components are presentational and do not call the backend.
  - `global.css` imports the fonts, `tokens.css`, and `base.css`. Each entry point imports it once.
  - Primitives: `Panel`, `Table` with `textColumn`, `Tree`, `Tabs` with `TabPanel`, `Button`, `Checkbox`, `TextField`, `Dialog`, `ToolLayout`, `Readout`, `Meter`, `EmptyState`, `PathText`, `LogoMark`, and `useToast` with `ToastProvider`.
  - `useToast` returns the id of each notification. A notification can have an `action` button, and a `sticky` notification stays until `dismiss`.
  - `rows/`: `useRowWindow` renders only the rows in view. `Table` and the diff viewer use it. Each row must have the height `--row-height`.
  - `motion/`: `MotionProvider` and `useMotion` decide calm mode. `DecodeText`, `PulseDot`, and `CalmToggle` use it.
- `src/features/<name>/`: one folder for each feature. `index.ts` is its only public entry.
  - `repository`: the data layer. `queries.ts` holds one TanStack Query hook for each read command, and `keys.ts` holds the cache keys. `useRepoWriter` runs a write command, then refreshes the queries. `useRepoSession` holds the open repository. `useRepoWatcher` refreshes the queries after a `RepoChanged` event. `QueryPanel` shows the state of a query. `RepoDock` is the start screen.
  - `history`: the commit timeline, the commit log, and the commit inspector. `assignLanes` and `layoutTimeline` are pure functions. The timeline draws in pixels without a view box, so its text keeps one size.
  - `changes`, `branches`, `stash`: the tables with their toolbars. Each one has a file that makes its actions, for example `branchActions.ts`.
  - `commit`: the commit console. `telemetry`: the activity panel.
  - `sync`: `SyncButtons` in the top bar, `SyncPanel` with the counts and the progress, `RemotePanel` on the Remotes tab, and `CloneControl` on the start screen. `useSyncProgress` reads the `SyncProgress` events. `useBackgroundFetch` fetches when the last fetch is older than five minutes.
  - `diff`: the diff viewer, with the stage and unstage buttons of each hunk.
  - `system`: the git status readout and the alert when git fails. `boot`: the start-up sequence.
- `src/app/`: `AppProviders`, `Root` (boot sequence, then shell), `AppShell` (the layout), `RepoDeck` (the three columns of an open repository), `TopBar`, `StatusBar`, `Workspace`, and the module list in `modules.ts`. `appActions` and `useRepoActions` put the actions in the command palette.
- `src/demo/`: the sample repository and `createDemoHandlers`. The handlers keep a copy of the sample repository, and the write commands change it. `main.tsx` loads the demo backend only in development and only outside Tauri.
- `src/gallery/`: the component gallery. Vite serves it in development only.
- `src/test/`: helpers for frontend tests.

## Rules

- Keep files and functions small. oxlint permits 200 lines for a file and 50 lines for a function. Clippy permits 40 lines for a Rust function.
- Import through index files: `@/features/<name>`, `@/hud`, `@/ipc`, `@/actions`. oxlint rejects deeper imports.
- Put git logic in `git-core`, not in a Tauri command and not in TypeScript.
- Use the tokens in `src/hud/tokens.css` for colors, spacing, and type. Do not put literal values in component CSS.
- For a signal color, set `data-tone` to a `Tone` value and use `var(--tone)` in the CSS.
- Each animation must stop in calm mode. The rule in `base.css` stops CSS animations. A JavaScript animation must check `useMotion().calm`. Write CSS animations so that their end state is correct when they stop at once.
- Use a factory only where it removes repeated code.
- Frontend tests mock the backend with `mockRepository` from `@/test/mockRepository` and render with `renderWithProviders`. `mockRepository` gives the sample repository, and its argument replaces the handlers that a test changes. `git-core` tests use the real `git` through `RepoFixture`.
- A read operation in `git-core` must not write to the repository. A write operation runs the system `git` through `cli`.
- Send a list of paths to `git` with `run_git_on_paths` and `--literal-pathspecs`. Do not put paths on the command line.
- Use `history_walk` for each walk of the history. A sorted walk of libgit2 reads the full history before the first commit.
- A component that shows repository data takes `repoPath` and reads its data with a hook from `@/features/repository`.
- When you add a command, add its handler to `src/demo/demoHandlers.ts`. A read handler must return a copy of the demo state. Else TanStack Query does not see the change.
- Run each write command in an action from `defineAction`, through `useRepoWriter(path).write`. Then the panels refresh and the user sees the result. The background fetch is the only exception. It shows no notification.
- Run each network command through `run_network` with `--progress`. A network command must not ask for input.
- A destructive action must have `confirm`, and its `Outcome` must have `undo`. A discard keeps a copy of the changes in the stash.
- A shortcut uses `Mod`, which is Command on macOS and Control on other systems. In tests, `Mod` is Control.
- Give each mock function a type, for example `vi.fn<MockCommandHandlers["stageFiles"]>()`. oxlint rejects a mock function without a type.
- Frontend tests run in calm mode. Call `mockReducedMotion(false)` from `@/test/matchMedia` to test an animation, and `advanceInSteps` from `@/test/timers` for a timer sequence.
- When the Browser pane is hidden, the page runs in the background and CSS animations pause. The panels can then look empty in a screenshot. Turn on calm mode to check the layout.
- The versions of `specta`, `tauri-specta`, and `specta-typescript` are pinned. Change them together.
- When you add a tool or a command, update `README.md` and this file.
