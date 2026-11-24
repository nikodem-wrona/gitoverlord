import { useQueryClient } from "@tanstack/react-query";

import { useRegisterActions } from "@/actions";
import { branchActions } from "@/features/branches";
import { changesActions } from "@/features/changes";
import {
  createPullAction,
  useGitHubAccount,
  usePullRequests,
} from "@/features/github";
import {
  useBranches,
  useRepoSummary,
  useRepoWriter,
  useStashes,
  useWorkingTree,
} from "@/features/repository";
import { stashActions } from "@/features/stash";
import { historyActions, useHistoryState } from "@/features/surgery";
import { syncActions, upstreamActions } from "@/features/sync";
import type { Commit } from "@/ipc";

/**
 * Puts the git actions of the open repository in the command palette.
 *
 * `selected` is the selected commit of the history. Its commands are in the palette too.
 */
export function useRepoActions(repoPath: string, selected?: Commit): void {
  const repo = useRepoWriter(repoPath);
  const tree = useWorkingTree(repoPath).data;
  const branches = useBranches(repoPath).data;
  const stashes = useStashes(repoPath).data;
  const summary = useRepoSummary(repoPath).data;
  const signedIn = Boolean(useGitHubAccount().data);
  const pulls = usePullRequests(repoPath, signedIn).data;
  const client = useQueryClient();
  const history = useHistoryState(repoPath);
  const current = branches?.find((branch) => branch.current);
  const changes = (tree?.staged.length ?? 0) + (tree?.unstaged.length ?? 0);

  useRegisterActions([
    ...changesActions(repo, tree),
    ...branchActions(repo, branches),
    ...stashActions(repo, changes, stashes),
    ...historyActions(repo, history, branches, selected),
    ...syncActions(repo, summary, branches),
    ...upstreamActions(repo, history, current),
    ...(signedIn ? [createPullAction(client, repoPath, pulls, current)] : []),
  ]);
}
