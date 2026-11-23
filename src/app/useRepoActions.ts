import { useRegisterActions } from "@/actions";
import { branchActions } from "@/features/branches";
import { changesActions } from "@/features/changes";
import {
  useBranches,
  useRepoSummary,
  useRepoWriter,
  useStashes,
  useWorkingTree,
} from "@/features/repository";
import { stashActions } from "@/features/stash";
import { syncActions } from "@/features/sync";

/** Puts the git actions of the open repository in the command palette. */
export function useRepoActions(repoPath: string): void {
  const repo = useRepoWriter(repoPath);
  const tree = useWorkingTree(repoPath).data;
  const branches = useBranches(repoPath).data;
  const stashes = useStashes(repoPath).data;
  const summary = useRepoSummary(repoPath).data;
  const changes = (tree?.staged.length ?? 0) + (tree?.unstaged.length ?? 0);

  useRegisterActions([
    ...changesActions(repo, tree),
    ...branchActions(repo, branches),
    ...stashActions(repo, changes, stashes),
    ...syncActions(repo, summary, branches),
  ]);
}
