# gitoverlord

<p align="center">
  <img src="src-tauri/icons/128x128@2x.png" alt="The gitoverlord logo" width="128" />
</p>

gitoverlord is an open-source desktop Git client. It is an alternative to GitHub Desktop. It has a Rust core, a Tauri shell, and a React user interface that looks like a futuristic control panel.

**Status:** Phase 7, showpieces and 1.0, in progress. The application opens or clones a repository and shows its history, its changes, its branches, its remotes, its stash, and its pull requests.

You can stage files and hunks, commit, amend, and discard changes. You can create, switch, rename, and delete branches, and use the stash. You can fetch, pull, push, and publish a branch. You can sign in to GitHub, clone your repositories, and create pull requests. You can merge, rebase, cherry-pick, revert, and reset, and resolve conflicts in the application. The panels refresh when the repository changes on the disk. You can select a theme and turn on sound. The application updates itself from the GitHub releases.

The release workflow builds the installers for macOS, Windows, and Linux. The rest of Phase 7 is the signed 1.0 release. The [roadmap](docs/ROADMAP.md) gives the plan for each phase.

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

| Command                       | Function                                                                                   |
| ----------------------------- | ------------------------------------------------------------------------------------------ |
| `pnpm tauri dev`              | Start the application in development mode                                                  |
| `pnpm dev`                    | Start only the frontend at `http://localhost:1420`, with a sample repository               |
| `pnpm check`                  | Run each check for TypeScript and Rust                                                     |
| `pnpm check:ui`               | Run the Prettier check, oxlint, the type check, and the frontend tests                     |
| `pnpm check:rust`             | Run the rustfmt check, Clippy, and the Rust tests                                          |
| `pnpm test`                   | Run the frontend tests                                                                     |
| `cargo test --workspace`      | Run the Rust tests                                                                         |
| `pnpm bench`                  | Measure the read operations on a repository with 50 000 commits                            |
| `pnpm format`                 | Format TypeScript, CSS, JSON, and Markdown                                                 |
| `cargo fmt --all`             | Format Rust                                                                                |
| `pnpm bindings`               | Write `src/ipc/bindings.ts` again from the Rust commands                                   |
| `pnpm icons`                  | Build the application icons again from `assets/logo-source.png`. This needs ImageMagick 7. |
| `pnpm tauri build`            | Build the release bundle                                                                   |
| `gh workflow run release.yml` | Build the installers on GitHub, without a release                                          |

## Open a repository

Select **Open a folder** on the start screen, then select a folder in a git repository. The start screen also lists the repositories that you opened before.

To clone a repository, select **Clone a repository** and type its URL. Then select the folder for the clone. The clone goes into a new folder with the name of the repository, and the application opens it. The application opens the last repository again when it starts. Select **Repositories** in the top bar to go back to the start screen.

Select a commit on the timeline or in the commit log to see its details. Select a file in the commit details or on the **Changes** tab to see its diff. Press Escape to close the diff.

On the timeline, the left and right arrow keys select an older or a newer commit. Right-click a commit, or press Shift+F10, to see its commands.

## Commit changes

1. Select the **Changes** tab.
2. Select **Stage** on the row of a file, or select **Stage all**.
3. To stage part of a file, select the file. Then select **Stage hunk** in the diff.
4. Type a summary in the commit console. The description is optional.
5. Select **Commit**, or press ⌘↩.

Select **Amend the last commit** to replace the last commit. If the fields are empty, they then show the message of the last commit.

The **+** and **−** columns show the added and the removed lines of each file. A change of more than 1 000 files shows the line counts of the first 1 000 files only, so that a large change stays fast.

## Branches and stash

Use the toolbar on the **Branches** tab to create, switch, rename, and delete branches. A new branch starts at `HEAD` and becomes the current branch.

Use the toolbar on the **Stash** tab to stash all changes, or to apply, pop, or drop an entry. Select an entry to see its files in the inspector.

## Sync with a remote

Use the **Fetch**, **Pull**, and **Push** buttons in the top bar. The buttons show the number of commits to pull and to push. The **Sync status** panel shows the progress of the operation and the time of the last fetch.

- **Fetch** gets the new commits of each remote. The local branches do not change.
- **Pull** gets the new commits of the upstream and fast-forwards the current branch. A pull does not merge or rebase. If the branch and its upstream both have new commits, the **Sync status** panel shows **Merge upstream**, **Rebase**, and **Force push**.
- **Force push** replaces the upstream with the current branch, for example after a rebase. The remote loses the commits that the branch does not have. The push fails if the remote changed after the last fetch.
- **Push** sends the commits of the current branch to its upstream.
- **Publish** shows in place of **Push** when the branch has no upstream. It pushes the branch to `origin`, or to the first remote, and makes that branch the upstream.

The application fetches in the background when the last fetch is older than five minutes. A failed background fetch shows only in the **Sync status** panel.

While a fetch, a pull, or a push runs, a pulse moves on the timeline between `HEAD` and the right edge, where the remote is.

The **Remotes** tab lists the remotes. If the repository has no remote, select **Add origin** and type the URL of the remote repository.

## Merge, rebase, and other history operations

- To merge a branch into the current branch, select the branch on the **Branches** tab. Then select **Merge**.
- To rebase the current branch, select the other branch on the **Branches** tab. Then select **Rebase onto…**.
- To cherry-pick, revert, or reset to a commit, select the commit. Then use the buttons in the commit details.

The context menu of a commit on the timeline has the same commands. When the commit is the tip of a branch, the menu also merges that branch or rebases on it.

A reset has three modes. **Keep the changes staged** is a soft reset. **Keep the changes** is a mixed reset. **Discard the changes** is a hard reset, and the stash keeps a copy of your uncommitted changes.

After a merge, a rebase, a cherry-pick, a revert, or a reset, the notification shows an **Undo** button. The undo moves the branch back to its last commit before the operation.

## Resolve conflicts

When an operation stops at conflicts, a banner shows above the timeline. It gives the operation and the number of files with conflicts.

1. Select the **Changes** tab. The files with conflicts show in red.
2. Select a file with conflicts. The conflict resolver shows each conflict with the current lines and the incoming lines.
3. For each conflict, select **Current**, **Incoming**, or **Both**. The kept lines show in green.
4. Select **Resolve file**. The application writes the file and stages it.
5. When no conflict is left, select **Continue** in the banner.

**All current** and **All incoming** select one side for each conflict. **Whole file** keeps the full file of one side. Use it for a binary file or a deleted file. If you edit the file in an editor, select **Mark as resolved** when no markers are left.

The undo of a resolution puts the conflicts back in the file. **Skip** drops the commit that a rebase, a cherry-pick, or a revert applies. **Abort** puts back the state from before the operation. Skip and Abort have no undo, because git keeps no copy of your resolutions.

## Sign in to a remote

The application does not ask for passwords. Git gets the credentials from your system:

- For HTTPS, set up a [git credential helper](https://git-scm.com/doc/credential-helpers), for example the macOS keychain or Git Credential Manager.
- For SSH, add your key to the SSH agent. Connect to the host one time in a terminal, for example `ssh -T git@github.com`, to accept its host key.

If the remote refuses the sign-in, the notification tells you which part to set up.

## GitHub

### Give the application a client ID

The GitHub sign-in needs a GitHub OAuth app. Each build of gitoverlord needs the client ID of one.

1. On GitHub, open **Settings**, then **Developer settings**, then **OAuth Apps**.
2. Select **New OAuth App**, and type a name and a homepage URL. The sign-in does not use the callback URL, but GitHub needs one.
3. Select **Enable Device Flow**, then register the app.
4. Set `GITOVERLORD_GITHUB_CLIENT_ID` to the client ID when you build or start the application.

```bash
GITOVERLORD_GITHUB_CLIENT_ID=<client ID> pnpm tauri dev
```

Without a client ID, the sign-in dialog tells you that the client ID is missing.

### Sign in

1. Select **Sign in** in the top bar.
2. Select **Copy the code and open GitHub**.
3. Paste the code on the GitHub page, then give the access.

The dialog closes when GitHub accepts the code. The token goes to the keychain of your system. After the sign-in, `git` uses the token for the HTTPS remotes on github.com. In gitoverlord, the token then replaces your credential helper for github.com.

To sign out, select your user name in the top bar.

### Clone and pull requests

Select **Clone from GitHub** on the start screen to see your repositories. Type a part of a name to filter the list, then select a repository and a folder.

The **Pull requests** tab shows the open pull requests of the GitHub remote, with the state of their checks. The GitHub remote is `origin`, or else the first remote on github.com. Select a pull request, then select **Open on GitHub** to see it in your browser.

To create a pull request, publish the current branch. Then select **Create…** on the **Pull requests** tab and type a title. The pull request goes into the default branch of the repository.

## Undo a destructive action

The application asks before it discards changes, deletes a branch, drops a stash entry, rebases, resets, or force-pushes. After the action, the notification shows an **Undo** button.

A discard keeps a copy of the changes in the stash. When the notification closes, the copy stays on the **Stash** tab. Drop the entry to delete the copy.

## Command palette and shortcuts

Press ⌘K to open the command palette. Type a part of the name of a command, then press Enter.

On Windows and Linux, use Ctrl in place of ⌘.

| Shortcut | Command                                                                   |
| -------- | ------------------------------------------------------------------------- |
| ⌘K       | Open the command palette                                                  |
| ⌘1 to ⌘6 | Show the Changes, History, Branches, Remotes, Stash, or Pull requests tab |
| ⌘↩       | Commit the staged changes, on the Changes tab                             |
| ⇧⌘A      | Stage all changes                                                         |
| ⇧⌘U      | Unstage all changes                                                       |
| ⇧⌘N      | Create a branch                                                           |
| ⇧⌘S      | Stash all changes                                                         |
| ⇧⌘T      | Fetch the remotes                                                         |
| ⇧⌘P      | Pull the current branch                                                   |
| ⌘P       | Push or publish the current branch                                        |
| ⌘O       | Open a repository                                                         |
| ⇧⌘O      | Clone a repository                                                        |
| ← and →  | Select an older or a newer commit, on the timeline                        |
| ⇧F10     | Show the commands of the selected commit, on the timeline                 |
| Escape   | Close the diff, the conflict resolver, the menu, or the dialog            |

## Updates

The application looks for a new release when it starts, and then one time each six hours. The status bar shows the version. When a new version is available, the status bar shows **Update to** and the version. Select it to download the update, install it, and start the new version. Your repositories and your changes stay as they are.

To look for a new release now, select **Check for updates** in the command palette. A development build does not update.

The updater installs an update only when its signature matches the public key in the application. [RELEASING.md](docs/RELEASING.md) tells you how to make a release.

## Demo backend

`pnpm dev` starts the frontend in a browser, where there is no Rust core. The demo backend in `src/demo` then answers each command with a sample repository, and the status bar shows "Demo data". The write commands change the sample repository until the page loads again. A merge or a rebase of `spike/radar` stops at a conflict, so that you can try the conflict resolver. The demo backend always offers one update. The release bundle does not contain the demo backend.

## Component gallery

The gallery shows each HUD component with its variants. Start the frontend with `pnpm dev`, then open `http://localhost:1420/gallery.html` in a browser. The gallery is not part of the release bundle.

## Calm mode

Select **Calm mode** in the top bar to stop all animations. Calm mode is always on when your operating system asks for reduced motion.

## Accessibility

You can use each function with the keyboard and with a screen reader. The arrow keys select a commit on the timeline, and the screen reader reads the selected commit. A dialog keeps the focus until it closes. A notification stops its timer while the pointer or the focus is on it, so that you have time to select **Undo**.

The tests check each screen with the WCAG 2.1 AA rules of [axe](https://github.com/dequelabs/axe-core). Another test checks that the text of each theme has a contrast of 4.5:1 or more.

## Themes and sound

Select **Theme** in the status bar to change the colors. **Overlord** is the default theme: black and grey with one green. **Amber** is a warm terminal, and **Mono** has no color for active items.

Select **Sound** in the status bar to play a short sound for each result: success, a stop that needs you, or a failure. The sound is off by default. The command palette also has the themes and the sound.

## Structure

```
crates/git-core/   Rust library without Tauri: domain types, git access, tests
crates/github/     Rust library without Tauri: GitHub sign-in, API, keychain
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
scripts/           maintenance scripts, and the release scripts in scripts/release/
docs/ROADMAP.md    stack, phases, practices, risks
docs/RELEASING.md  release workflow, signing secrets, updater key
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
- Each screen must pass the accessibility test in `src/app/accessibility.test.tsx`. Add a new screen or dialog to the test.
- Import a feature only through its index file, for example `@/features/system`.
- Use conventional commit messages.

The [roadmap](docs/ROADMAP.md) gives the full list of practices.

## License

[MIT](LICENSE)
