# gitoverlord

<p align="center">
  <img src="src-tauri/icons/128x128@2x.png" alt="The gitoverlord logo" width="128" />
</p>

gitoverlord is an open-source desktop Git client. It is an alternative to GitHub Desktop. It has a Rust core, a Tauri shell, and a React user interface that looks like a futuristic control panel.

**Status:** Phase 4, sync. This is the first alpha. The application opens or clones a repository and shows its history, its changes, its branches, its remotes, and its stash.

You can stage files and hunks, commit, amend, and discard changes. You can create, switch, rename, and delete branches, and use the stash. You can fetch, pull, push, and publish a branch. The panels refresh when the repository changes on the disk.

Phase 5 adds GitHub sign-in and pull requests. The [roadmap](docs/ROADMAP.md) gives the plan for each phase.

## Prerequisites

- [Rust](https://rustup.rs). rustup installs the version that `rust-toolchain.toml` gives.
- Node.js 26 and pnpm 10.
- Git 2.26 or later.
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

Select **Open a folder** on the start screen, then select a folder in a git repository. The start screen also lists the repositories that you opened before.

To clone a repository, select **Clone a repository** and type its URL. Then select the folder for the clone. The clone goes into a new folder with the name of the repository, and the application opens it. The application opens the last repository again when it starts. Select **Repositories** in the top bar to go back to the start screen.

Select a commit on the timeline or in the commit log to see its details. Select a file in the commit details or on the **Changes** tab to see its diff. Press Escape to close the diff.

## Commit changes

1. Select the **Changes** tab.
2. Select **Stage** on the row of a file, or select **Stage all**.
3. To stage part of a file, select the file. Then select **Stage hunk** in the diff.
4. Type a summary in the commit console. The description is optional.
5. Select **Commit**, or press ⌘↩.

Select **Amend the last commit** to replace the last commit. If the fields are empty, they then show the message of the last commit.

## Branches and stash

Use the toolbar on the **Branches** tab to create, switch, rename, and delete branches. A new branch starts at `HEAD` and becomes the current branch.

Use the toolbar on the **Stash** tab to stash all changes, or to apply, pop, or drop an entry. Select an entry to see its files in the inspector.

## Sync with a remote

Use the **Fetch**, **Pull**, and **Push** buttons in the top bar. The buttons show the number of commits to pull and to push. The **Sync status** panel shows the progress of the operation and the time of the last fetch.

- **Fetch** gets the new commits of each remote. The local branches do not change.
- **Pull** gets the new commits of the upstream and fast-forwards the current branch. A pull does not merge or rebase. If the branch and its upstream both have new commits, merge or rebase them in a terminal.
- **Push** sends the commits of the current branch to its upstream.
- **Publish** shows in place of **Push** when the branch has no upstream. It pushes the branch to `origin`, or to the first remote, and makes that branch the upstream.

The application fetches in the background when the last fetch is older than five minutes. A failed background fetch shows only in the **Sync status** panel.

The **Remotes** tab lists the remotes. If the repository has no remote, select **Add origin** and type the URL of the remote repository.

## Sign in to a remote

The application does not ask for passwords. Git gets the credentials from your system:

- For HTTPS, set up a [git credential helper](https://git-scm.com/doc/credential-helpers), for example the macOS keychain or Git Credential Manager.
- For SSH, add your key to the SSH agent. Connect to the host one time in a terminal, for example `ssh -T git@github.com`, to accept its host key.

If the remote refuses the sign-in, the notification tells you which part to set up.

## Undo a destructive action

The application asks before it discards changes, deletes a branch, or drops a stash entry. After the action, the notification shows an **Undo** button.

A discard keeps a copy of the changes in the stash. When the notification closes, the copy stays on the **Stash** tab. Drop the entry to delete the copy.

## Command palette and shortcuts

Press ⌘K to open the command palette. Type a part of the name of a command, then press Enter.

On Windows and Linux, use Ctrl in place of ⌘.

| Shortcut | Command                                                    |
| -------- | ---------------------------------------------------------- |
| ⌘K       | Open the command palette                                   |
| ⌘1 to ⌘5 | Show the Changes, History, Branches, Remotes, or Stash tab |
| ⌘↩       | Commit the staged changes, on the Changes tab              |
| ⇧⌘A      | Stage all changes                                          |
| ⇧⌘U      | Unstage all changes                                        |
| ⇧⌘N      | Create a branch                                            |
| ⇧⌘S      | Stash all changes                                          |
| ⇧⌘T      | Fetch the remotes                                          |
| ⇧⌘P      | Pull the current branch                                    |
| ⌘P       | Push or publish the current branch                         |
| ⌘O       | Open a repository                                          |
| ⇧⌘O      | Clone a repository                                         |
| Escape   | Close the diff or the dialog                               |

## Demo backend

`pnpm dev` starts the frontend in a browser, where there is no Rust core. The demo backend in `src/demo` then answers each command with a sample repository, and the status bar shows "Demo data". The write commands change the sample repository until the page loads again. The release bundle does not contain the demo backend.

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
src/actions/       action factory, command palette, and shortcuts
src/gallery/       component gallery, for development only
src/demo/          sample repository for the browser and for tests
src/test/          helpers for frontend tests
assets/            source image of the logo
scripts/           maintenance scripts
docs/ROADMAP.md    stack, phases, practices, risks
```

## Add a command

1. Add the logic and its tests to `crates/git-core`. Each read operation and each write operation is a method of the `GitBackend` trait.
2. Add a `#[tauri::command]` function to a file in `src-tauri/src/commands/`.
3. Add the function to the list in `src-tauri/src/ipc.rs`.
4. Run `pnpm bindings`.
5. Add a handler for the command to `src/demo/demoHandlers.ts`. The type check fails until the handler is there.
6. Call a read command from a query hook in `src/features/repository`.
7. Run a write command in an action from `defineAction`. Use `useRepoWriter`, so that the panels refresh after the command.

## Rules for contributions

- Run `pnpm check` before you open a pull request. CI runs the same checks on macOS, Windows, and Linux.
- Keep files and functions small. The linters enforce the limits.
- Import a feature only through its index file, for example `@/features/system`.
- Use conventional commit messages.

The [roadmap](docs/ROADMAP.md) gives the full list of practices.

## License

[MIT](LICENSE)
