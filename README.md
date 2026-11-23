# gitoverlord

<p align="center">
  <img src="src-tauri/icons/128x128@2x.png" alt="The gitoverlord logo" width="128" />
</p>

gitoverlord is an open-source desktop Git client. It is an alternative to GitHub Desktop. It has a Rust core, a Tauri shell, and a React user interface that looks like a futuristic control panel.

**Status:** Phase 1, HUD kit. The application shows the control panel with sample data: a commit star map, the commit log, the working tree, branches, and a commit inspector. The status bar shows the version of the system `git`. Phase 2 connects the panels to real repositories. The [roadmap](docs/ROADMAP.md) gives the plan for each phase.

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
| `pnpm dev`               | Start only the frontend at `http://localhost:1420`, without the Rust core                  |
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
src/test/          helpers for frontend tests
assets/            source image of the logo
scripts/           maintenance scripts
docs/ROADMAP.md    stack, phases, practices, risks
```

## Add a command

1. Add the logic and its tests to `crates/git-core`.
2. Add a `#[tauri::command]` function to a file in `src-tauri/src/commands/`.
3. Add the function to the list in `src-tauri/src/ipc.rs`.
4. Run `pnpm bindings`.
5. Call the command from a feature through `@/ipc`.

## Rules for contributions

- Run `pnpm check` before you open a pull request. CI runs the same checks on macOS, Windows, and Linux.
- Keep files and functions small. The linters enforce the limits.
- Import a feature only through its index file, for example `@/features/system`.
- Use conventional commit messages.

The [roadmap](docs/ROADMAP.md) gives the full list of practices.

## License

[MIT](LICENSE)
