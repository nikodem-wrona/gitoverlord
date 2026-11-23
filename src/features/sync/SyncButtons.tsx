import { ActionButton } from "@/actions";
import {
  useBranches,
  useRepoSummary,
  useRepoWriter,
} from "@/features/repository";

import { fetchAction, pullAction, pushAction } from "./syncActions";

/** The fetch, pull, and push buttons for the current branch, with its counts. */
export function SyncButtons({ repoPath }: { repoPath: string }) {
  const remotes = useRepoSummary(repoPath).data?.remotes.length ?? 0;
  const branches = useBranches(repoPath).data ?? [];
  const current = branches.find((branch) => branch.current);
  const repo = useRepoWriter(repoPath);
  const push = pushAction(repo, current, remotes);
  const publish = push.id === "sync.publish";
  const ahead = current?.ahead ?? 0;
  const behind = current?.behind ?? 0;

  return (
    <>
      <ActionButton action={fetchAction(repo, remotes)} text="Fetch" />
      <ActionButton
        action={pullAction(repo, current)}
        text={`Pull ↓${behind}`}
        variant={behind > 0 ? "primary" : undefined}
      />
      <ActionButton
        action={push}
        text={publish ? "Publish" : `Push ↑${ahead}`}
        variant={ahead > 0 || publish ? "primary" : undefined}
      />
    </>
  );
}
