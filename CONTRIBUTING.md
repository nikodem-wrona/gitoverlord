# Contribute to gitoverlord

[README.md](README.md#get-started) tells you how to build the application, and it gives the [commands](README.md#commands) and the [structure](README.md#structure) of the project. The [roadmap](docs/ROADMAP.md) gives the full list of practices.

## Rules for contributions

- Run `pnpm check` before you open a pull request. CI runs the same checks on macOS, Windows, and Linux.
- Keep files and functions small. The linters enforce the limits.
- Each screen must pass the accessibility test in `src/app/accessibility.test.tsx`. Add a new screen or dialog to the test.
- Import a feature only through its index file, for example `@/features/system`.
- Use conventional commit messages.

## Add a command

1. Add the logic and its tests to `crates/git-core`. Each read operation and each write operation is a method of the `GitBackend` trait.
2. Add a `#[tauri::command]` function to a file in `src-tauri/src/commands/`.
3. Add the function to the list in `src-tauri/src/ipc.rs`.
4. Run `pnpm bindings`.
5. Add a handler for the command to `src/demo/demoHandlers.ts`. The type check fails until the handler is there.
6. Call a read command from a query hook in `src/features/repository`.
7. Run a write command in an action from `defineAction`. Use `useRepoWriter`, so that the panels refresh after the command.
