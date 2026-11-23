import { useMemo, useState } from "react";

import { Tree } from "@/hud";

import { branchNodeId, buildNavigatorTree } from "./buildNavigatorTree";
import { useBranches, useRepoSummary } from "./queries";
import { QueryPanel } from "./QueryPanel";

const OPEN_AT_START = ["repository", "branches"];
const NO_BRANCHES = [] as const;

interface RepoNavigatorProps {
  repoPath: string;
  delay?: number;
}

/** The left tree: the repository and its branches, remotes, and tags. */
export function RepoNavigator({ repoPath, delay }: RepoNavigatorProps) {
  const summary = useRepoSummary(repoPath);
  const branches = useBranches(repoPath).data ?? NO_BRANCHES;
  const [picked, setPicked] = useState<string>();
  const nodes = useMemo(
    () => (summary.data ? buildNavigatorTree(summary.data, branches) : []),
    [summary.data, branches],
  );
  const head = summary.data?.head.branch;

  return (
    <QueryPanel
      title="Navigator"
      query={summary}
      meta={(data) => data.path}
      delay={delay}
    >
      {() => (
        <Tree
          label="Repository navigator"
          nodes={nodes}
          selectedId={picked ?? (head ? branchNodeId(head) : undefined)}
          onSelect={setPicked}
          defaultExpanded={OPEN_AT_START}
        />
      )}
    </QueryPanel>
  );
}
