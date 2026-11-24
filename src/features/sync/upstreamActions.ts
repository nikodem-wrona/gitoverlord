import { type Action, defineAction } from "@/actions";
import type { RepoWriter } from "@/features/repository";
import {
  type HistoryState,
  mergeAction,
  rebaseAction,
} from "@/features/surgery";
import { type Branch, commands } from "@/ipc";

/** `true` when the branch and its upstream both have new commits. Then a pull cannot fast-forward. */
export function isDiverged(branch?: Branch): boolean {
  return (
    Boolean(branch?.upstream) &&
    (branch?.ahead ?? 0) > 0 &&
    (branch?.behind ?? 0) > 0
  );
}

/**
 * Replaces the upstream with the branch, for example after a rebase.
 *
 * The remote loses the commits that the branch does not have. The undo puts the
 * old commit of the upstream back.
 */
export function forcePushAction(repo: RepoWriter, branch: Branch): Action {
  const upstream = branch.upstream ?? "the upstream";
  const lost = branch.behind === 1 ? "1 commit" : `${branch.behind} commits`;
  return defineAction({
    id: "sync.force-push",
    label: "Force push to the upstream…",
    group: "Sync",
    confirm: {
      title: "Force push",
      message: `${upstream} gets the commits of ${branch.name}, and the remote loses ${lost} that ${branch.name} does not have. Use this after a rebase. You can undo this.`,
      confirm: "Force push",
    },
    run: async () => {
      const previous = await repo.write(commands.forcePushBranch(repo.path));
      const undo = () =>
        repo.write(commands.undoForcePush(repo.path, previous));
      return {
        title: "Force push complete",
        message: `${upstream} has the commits of ${branch.name}.`,
        undo,
      };
    },
  });
}

/**
 * The actions for a diverged branch: merge the upstream into the branch, rebase
 * the branch on its upstream, or replace the upstream with the branch.
 *
 * The list is empty when the branch is not diverged.
 */
export function upstreamActions(
  repo: RepoWriter,
  state: HistoryState,
  branch?: Branch,
): Action[] {
  if (!branch?.upstream || !isDiverged(branch)) return [];
  return [
    mergeAction(repo, state, branch.upstream),
    rebaseAction(repo, state, branch.upstream),
    forcePushAction(repo, branch),
  ];
}
