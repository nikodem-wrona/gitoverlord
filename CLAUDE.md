# gitoverlord

gitoverlord is an open-source desktop Git client. It has a Rust core, a Tauri 2 shell, and a React 19 and TypeScript user interface.

`docs/ROADMAP.md` gives the stack, the phases, the practices, and the status of each phase. Read it before you start a feature. Update its checklists when a task is complete.

## Commands

- `pnpm install`: install the frontend dependencies.
- `pnpm tauri dev`: start the application.
- `pnpm dev`: start only the frontend at `http://localhost:1420`. There is no Rust core in this mode, so each command fails.
- `pnpm check`: run each check for TypeScript and Rust. Run it before you report that work is complete.
- `pnpm check:ui`: run the Prettier check, oxlint, `tsc -b`, and Vitest.
- `pnpm check:rust`: run the rustfmt check, Clippy with `-D warnings`, and `cargo test --workspace`.
- `pnpm vitest run src/path/to/file.test.tsx`: run one frontend test file.
- `cargo test -p git-core <test name>`: run one Rust test.
- `pnpm bindings`: write `src/ipc/bindings.ts` again. Run it after each change to a command or to a type that a command uses.
- `pnpm format` and `cargo fmt --all`: format the code.

## Architecture

- `crates/git-core/`: all git logic. This crate does not depend on Tauri. `cli.rs` starts each `git` process through `git_command()`. Types that go to the user interface derive `serde::Serialize` and `specta::Type`.
- `src-tauri/`: a thin shell. `src/ipc.rs` registers the commands. Each file in `src/commands/` holds one command group. A command calls `git-core` through `run_blocking` and returns `Result<T, GitError>`.
- `src/ipc/`: `tauri-specta` generates `bindings.ts`. Do not edit it. `unwrap` changes a command result into data or a thrown `CommandError`.
- `src/hud/`: the design system. `tokens.css` holds the design tokens. Components are presentational and do not call the backend.
- `src/features/<name>/`: one folder for each feature. `index.ts` is its only public entry.
- `src/app/`: the application root and the providers.
- `src/test/`: helpers for frontend tests.

## Rules

- Keep files and functions small. oxlint permits 200 lines for a file and 50 lines for a function. Clippy permits 40 lines for a Rust function.
- Import through index files: `@/features/<name>`, `@/hud`, `@/ipc`. oxlint rejects deeper imports.
- Put git logic in `git-core`, not in a Tauri command and not in TypeScript.
- Use the tokens in `src/hud/tokens.css` for colors, spacing, and type. Do not put literal values in component CSS.
- Use a factory only where it removes repeated code.
- Frontend tests mock the backend with `mockCommands` from `@/ipc` and render with `renderWithProviders`. `git-core` tests use the real `git`.
- The versions of `specta`, `tauri-specta`, and `specta-typescript` are pinned. Change them together.
- When you add a tool or a command, update `README.md` and this file.
