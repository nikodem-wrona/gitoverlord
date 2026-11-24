import { ConflictPanel } from "@/features/conflicts";
import { DiffPanel } from "@/features/diff";
import { CommitTimeline, type History } from "@/features/history";
import { useWorkingTree } from "@/features/repository";
import { useCommitMenu } from "@/features/surgery";
import { useSyncPulse } from "@/features/sync";
import type { DiffTarget } from "@/ipc";

interface CenterViewProps {
  repoPath: string;
  history: History;
  headHash?: string;
  selectedHash?: string;
  onSelectCommit(hash: string): void;
  /** The file that the user opened. */
  target?: DiffTarget;
  onInspect(target: DiffTarget): void;
  onClose(): void;
}

/**
 * The top of the center column: the conflict resolver for a file with conflicts,
 * the diff viewer for another file, else the commit timeline.
 */
export function CenterView(props: CenterViewProps) {
  const { repoPath, target, onInspect, onClose } = props;
  const tree = useWorkingTree(repoPath).data;
  const menu = useCommitMenu(repoPath);
  const sync = useSyncPulse(repoPath) ?? undefined;
  const conflicted =
    target?.kind === "unstaged" &&
    tree?.unstaged.some(
      (file) => file.path === target.path && file.kind === "conflicted",
    );

  if (target && conflicted) {
    return (
      <ConflictPanel
        repoPath={repoPath}
        path={target.path}
        onClose={onClose}
        // The staged diff shows the result of the resolution.
        onResolved={(path) => onInspect({ kind: "staged", path })}
      />
    );
  }
  if (target) {
    return <DiffPanel repoPath={repoPath} target={target} onClose={onClose} />;
  }
  const commits = props.history.commits;
  return (
    <CommitTimeline
      commits={commits}
      headHash={props.headHash}
      selectedHash={props.selectedHash}
      onSelect={props.onSelectCommit}
      sync={sync}
      commitMenu={(hash) => {
        const commit = commits.find((candidate) => candidate.hash === hash);
        return commit ? menu(commit) : [];
      }}
      delay={120}
    />
  );
}
