import { type Action, defineAction } from "@/actions";
import { FILES_CHANGED, type RepoWriter } from "@/features/repository";
import { commands, type FileDelta, type WorkingTree } from "@/ipc";

interface FileActionOptions {
  id: string;
  label: string;
  shortcut?: string;
  /** The reason that the button shows when there are no files. */
  empty?: string;
}

/** Adds the changes of `files` to the index. */
export function stageAction(
  repo: RepoWriter,
  files: readonly string[],
  options: FileActionOptions,
): Action {
  const { empty = "There are no unstaged changes.", ...spec } = options;
  return defineAction({
    ...spec,
    group: "Changes",
    blocked: files.length === 0 ? empty : undefined,
    run: async () => {
      const command = commands.stageFiles(repo.path, [...files]);
      await repo.write(command, FILES_CHANGED);
    },
  });
}

/** Removes the changes of `files` from the index. The working tree keeps them. */
export function unstageAction(
  repo: RepoWriter,
  files: readonly string[],
  options: FileActionOptions,
): Action {
  const { empty = "There are no staged changes.", ...spec } = options;
  return defineAction({
    ...spec,
    group: "Changes",
    blocked: files.length === 0 ? empty : undefined,
    run: async () => {
      const command = commands.unstageFiles(repo.path, [...files]);
      await repo.write(command, FILES_CHANGED);
    },
  });
}

/** Removes the unstaged changes of `files`. A stash entry keeps a copy for the undo. */
export function discardAction(
  repo: RepoWriter,
  files: readonly string[],
  options: FileActionOptions,
): Action {
  const { empty = "There are no changes to discard.", ...spec } = options;
  const subject = files.length === 1 ? files[0] : `${files.length} files`;
  return defineAction({
    ...spec,
    group: "Changes",
    blocked: files.length === 0 ? empty : undefined,
    confirm: {
      title: "Discard changes",
      message: `The unstaged changes of ${subject} leave the working tree. A copy goes to the stash, so you can undo this.`,
      confirm: "Discard",
    },
    run: async () => {
      const hash = await repo.write(
        commands.discardChanges(repo.path, [...files]),
      );
      const undo = () => repo.write(commands.restoreDiscarded(repo.path, hash));
      return {
        title: "Changes discarded",
        message: `${subject}. A copy is in the stash.`,
        undo,
      };
    },
  });
}

/** The actions on all the changes, for the command palette and the toolbar. */
export function changesActions(repo: RepoWriter, tree?: WorkingTree): Action[] {
  return [
    stageAction(repo, filePaths(tree?.unstaged), {
      id: "changes.stage-all",
      label: "Stage all changes",
      shortcut: "Mod+Shift+A",
    }),
    unstageAction(repo, filePaths(tree?.staged), {
      id: "changes.unstage-all",
      label: "Unstage all changes",
      shortcut: "Mod+Shift+U",
    }),
    discardAction(repo, discardablePaths(tree?.unstaged), {
      id: "changes.discard-all",
      label: "Discard all unstaged changes…",
    }),
  ];
}

/** The paths of `files`. A rename also gives its old path, so both sides move. */
export function filePaths(files: readonly FileDelta[] = []): string[] {
  return files.flatMap((file) =>
    file.oldPath ? [file.path, file.oldPath] : [file.path],
  );
}

/** A conflict cannot go to the stash, so a discard skips it. */
export function discardablePaths(files: readonly FileDelta[] = []): string[] {
  return files
    .filter((file) => file.kind !== "conflicted")
    .map(({ path }) => path);
}
