import { useRepoSummary, useWorkingTree } from "@/features/repository";
import type { Operation, OperationKind } from "@/ipc";

/** The state of the repository that the history operations need. */
export interface HistoryState {
  /** The merge, rebase, cherry-pick, or revert that stopped. */
  operation: Operation | null;
  /** The current branch. `undefined` when `HEAD` is detached. */
  branch?: string;
  /** The commit of `HEAD`. `undefined` when the repository has no commits. */
  head?: string;
  /** The count of the files with conflicts. */
  conflicts: number;
}

/** The name of each operation in a sentence. */
export const OPERATION_NAMES: Record<OperationKind, string> = {
  merge: "merge",
  rebase: "rebase",
  cherryPick: "cherry-pick",
  revert: "revert",
};

/** The name of each operation at the start of a title. */
export const OPERATION_TITLES: Record<OperationKind, string> = {
  merge: "Merge",
  rebase: "Rebase",
  cherryPick: "Cherry-pick",
  revert: "Revert",
};

/** Reads the operation, the current branch, and the count of conflicts. */
export function useHistoryState(repoPath: string): HistoryState {
  const summary = useRepoSummary(repoPath).data;
  const tree = useWorkingTree(repoPath).data;
  const conflicts = tree?.unstaged.filter(({ kind }) => kind === "conflicted");
  return {
    operation: summary?.operation ?? null,
    branch: summary?.head.branch ?? undefined,
    head: summary?.head.hash ?? undefined,
    conflicts: conflicts?.length ?? 0,
  };
}

/** The reason why a new history operation cannot start now. */
export function startBlocked(state: HistoryState): string | undefined {
  if (state.operation) {
    return `Finish or abort the ${OPERATION_NAMES[state.operation.kind]} first.`;
  }
  if (state.conflicts > 0) return "Resolve the conflicts first.";
  if (!state.head) return "The repository has no commits.";
  return undefined;
}

/** The current branch, or the text for a detached `HEAD`. */
export function branchName(state: HistoryState): string {
  return state.branch ?? "the detached HEAD";
}
