# gitoverlord

<p align="center">
  <img src="src-tauri/icons/128x128@2x.png" alt="The gitoverlord logo" width="128" />
</p>

gitoverlord is an open-source desktop Git client. It is an alternative to GitHub Desktop. It has a Rust core, a Tauri shell, and a React user interface that looks like a futuristic control panel.

**Status:** Phase 2, read-only viewer. The application opens a repository and shows its history as a commit timeline and as a commit log. It also shows the changed files, the branches, the details of a commit, and the diff of a file. The panels refresh when the repository changes on the disk. The application does not change a repository.

Phase 3 adds the commands to stage, to commit, and to change branches. The [roadmap](docs/ROADMAP.md) gives the plan for each phase.

## Prerequisites

- [Rust](https://rustup.rs). rustup installs the version that `rust-toolchain.toml` gives.
- Node.js 26 and pnpm 10.
- Git 2 or later.
- The [Tauri system dependencies](https://tauri.app/start/prerequisites/) for your operating system.

## Setup

```bash
pnpm install
```

## Commands

| Command                  | Function                                                                                   |
| ------------------------ | ------------------------------------------------------------------------------------------ |
| `pnpm tauri dev`         | Start the application in development mode                                                  |
| `pnpm dev`               | Start only the frontend at `http://localhost:1420`, with a sample repository               |
| `pnpm check`             | Run each check for TypeScript and Rust                                                     |
| `pnpm check:ui`          | Run the Prettier check, oxlint, the type check, and the frontend tests                     |
| `pnpm check:rust`        | Run the rustfmt check, Clippy, and the Rust tests                                          |
| `pnpm test`              | Run the frontend tests                                                                     |
| `cargo test --workspace` | Run the Rust tests                                                                         |
| `pnpm format`            | Format TypeScript, CSS, JSON, and Markdown                                                 |
| `cargo fmt --all`        | Format Rust                                                                                |
| `pnpm bindings`          | Write `src/ipc/bindings.ts` again from the Rust commands                                   |
| `pnpm icons`             | Build the application icons again from `assets/logo-source.png`. This needs ImageMagick 7. |
| `pnpm tauri build`       | Build the release bundle                                                                   |

## Open a repository

Select **Open a folder** on the start screen, then select a folder in a git repository. The start screen also lists the repositories that you opened before. The application opens the last repository again when it starts. Select **Repositories** in the top bar to go back to the start screen.

Select a commit on the timeline or in the commit log to see its details. Select a file in the commit details or on the **Changes** tab to see its diff. Press Escape to close the diff.

## Demo backend

`pnpm dev` starts the frontend in a browser, where there is no Rust core. The demo backend in `src/demo` then answers each command with a sample repository, and the status bar shows "Demo data". The release bundle does not contain the demo backend.

## Component gallery

The gallery shows each HUD component with its variants. Start the frontend with `pnpm dev`, then open `http://localhost:1420/gallery.html` in a browser. The gallery is not part of the release bundle.

## Calm mode

Select **Calm mode** in the top bar to stop all animations. Calm mode is always on when your operating system asks for reduced motion.

## Structure

```
crates/git-core/   Rust library without Tauri: domain types, git access, tests
src-tauri/         Tauri shell: one small file for each command group
src/app/           application root, providers, and shell layout
src/hud/           design system: tokens, primitives, and motion
src/features/      one folder for each feature, with one public entry
src/ipc/           generated bindings and IPC helpers
src/gallery/       component gallery, for development only
src/demo/          sample repository for the browser and for tests
src/test/          helpers for frontend tests
assets/            source image of the logo
scripts/           maintenance scripts
docs/ROADMAP.md    stack, phases, practices, risks
```

## Add a command

1. Add the logic and its tests to `crates/git-core`. A read operation is a method of the `GitBackend` trait.
2. Add a `#[tauri::command]` function to a file in `src-tauri/src/commands/`.
3. Add the function to the list in `src-tauri/src/ipc.rs`.
4. Run `pnpm bindings`.
5. Add a handler for the command to `src/demo/demoHandlers.ts`. The type check fails until the handler is there.
6. Call the command from a feature through `@/ipc`.

## Rules for contributions

- Run `pnpm check` before you open a pull request. CI runs the same checks on macOS, Windows, and Linux.
- Keep files and functions small. The linters enforce the limits.
- Import a feature only through its index file, for example `@/features/system`.
- Use conventional commit messages.

The [roadmap](docs/ROADMAP.md) gives the full list of practices.

## License

[MIT](LICENSE)
