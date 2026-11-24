import { type Action, defineAction } from "@/actions";
import { FILES_CHANGED, type RepoWriter } from "@/features/repository";
import { commands, type DiffTarget, type HunkTarget } from "@/ipc";

/**
 * Moves one hunk to the index, or out of the index for a staged diff.
 *
 * Returns `undefined` for the diff of a commit, which cannot change.
 */
export function hunkAction(
  repo: RepoWriter,
  target: DiffTarget,
  index: number,
  header: string,
): Action | undefined {
  if (target.kind === "commit") return undefined;
  const staged = target.kind === "staged";
  const hunk: HunkTarget = { path: target.path, index, header };
  const verb = staged ? "Unstage" : "Stage";

  return defineAction({
    id: `diff.${verb.toLowerCase()}-hunk:${index}`,
    label: `${verb} hunk ${index + 1} of ${target.path}`,
    group: "Changes",
    run: async () => {
      const command = staged
        ? commands.unstageHunk(repo.path, hunk)
        : commands.stageHunk(repo.path, hunk);
      await repo.write(command, FILES_CHANGED);
    },
  });
}
