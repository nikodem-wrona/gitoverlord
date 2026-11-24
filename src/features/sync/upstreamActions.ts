import type { Action } from "@/actions";
import type { RepoWriter } from "@/features/repository";
import {
  type HistoryState,
  mergeAction,
  rebaseAction,
} from "@/features/surgery";
import type { Branch } from "@/ipc";

/** `true` when the branch and its upstream both have new commits. Then a pull cannot fast-forward. */
export function isDiverged(branch?: Branch): boolean {
  return (
    Boolean(branch?.upstream) &&
    (branch?.ahead ?? 0) > 0 &&
    (branch?.behind ?? 0) > 0
  );
}

/**
 * Merges the upstream into a diverged branch, or rebases the branch on its upstream.
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
  ];
}
