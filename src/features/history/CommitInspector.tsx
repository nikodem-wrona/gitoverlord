import { QueryView, useCommitDetail } from "@/features/repository";
import { EmptyState, Panel } from "@/hud";
import type { DiffTarget } from "@/ipc";

import { CommitReport } from "./CommitReport";

interface CommitInspectorProps {
  repoPath: string;
  /** The commit to show. Without a hash the inspector is empty. */
  hash?: string;
  /** The file of this commit that the diff viewer shows. */
  selectedPath?: string;
  onSelectFile(target: DiffTarget): void;
  delay?: number;
}

/** The details of the selected commit. A click on a file opens its diff. */
export function CommitInspector(props: CommitInspectorProps) {
  const { repoPath, hash, selectedPath, onSelectFile, delay } = props;
  const detail = useCommitDetail(repoPath, hash);

  return (
    <Panel
      title="Commit details"
      meta={hash ? "Target locked" : "No target"}
      delay={delay}
    >
      {hash ? (
        <QueryView query={detail}>
          {(data) => (
            <CommitReport
              detail={data}
              selectedPath={selectedPath}
              onSelectFile={(path) =>
                onSelectFile({ kind: "commit", hash: data.commit.hash, path })
              }
            />
          )}
        </QueryView>
      ) : (
        <EmptyState
          title="No target locked"
          message="Select a commit on the timeline or in the commit log."
        />
      )}
    </Panel>
  );
}
