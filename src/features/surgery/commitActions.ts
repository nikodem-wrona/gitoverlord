import type { Action } from "@/actions";
import type { RepoWriter } from "@/features/repository";
import type { Branch, Commit } from "@/ipc";

import {
  branchAtAction,
  cherryPickAction,
  mergeAction,
  rebaseAction,
  revertAction,
} from "./historyActions";
import type { HistoryState } from "./historyState";
import { resetActions } from "./resetActions";
import { stepActions } from "./stepActions";

/**
 * The actions on one commit, for its context menu.
 *
 * A commit at the tip of another branch also gets the merge and the rebase of that branch.
 */
export function commitActions(
  repo: RepoWriter,
  state: HistoryState,
  commit: Commit,
  branches: readonly Branch[] = [],
): Action[] {
  const tips = branches.filter(
    (branch) => branch.tip === commit.hash && !branch.current,
  );
  return [
    cherryPickAction(repo, state, commit),
    revertAction(repo, state, commit),
    ...tips.flatMap((branch) => [
      mergeAction(repo, state, branch.name),
      rebaseAction(repo, state, branch.name),
    ]),
    branchAtAction(repo, state, commit),
    ...resetActions(repo, state, commit),
  ];
}

/**
 * The history actions for the command palette: the operation that stopped,
 * the merge and the rebase of each other branch, and the selected commit.
 */
export function historyActions(
  repo: RepoWriter,
  state: HistoryState,
  branches: readonly Branch[] = [],
  selected?: Commit,
): Action[] {
  const others = branches.filter((branch) => !branch.current);
  return [
    ...stepActions(repo, state),
    ...others.map((branch) => mergeAction(repo, state, branch.name)),
    ...others.map((branch) => rebaseAction(repo, state, branch.name)),
    ...(selected ? commitActions(repo, state, selected) : []),
  ];
}
