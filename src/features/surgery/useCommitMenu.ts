import type { Action } from "@/actions";
import { useBranches, useRepoWriter } from "@/features/repository";
import type { Commit } from "@/ipc";

import { commitActions } from "./commitActions";
import { useHistoryState } from "./historyState";

/** Gives a function that makes the context menu actions of a commit. */
export function useCommitMenu(repoPath: string): (commit: Commit) => Action[] {
  const repo = useRepoWriter(repoPath);
  const state = useHistoryState(repoPath);
  const branches = useBranches(repoPath).data;
  return (commit) => commitActions(repo, state, commit, branches);
}
