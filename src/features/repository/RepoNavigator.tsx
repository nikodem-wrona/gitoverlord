import { useMemo, useState } from "react";

import { Panel, Tree } from "@/hud";

import { buildNavigatorTree } from "./buildNavigatorTree";
import type { Repository } from "./types";

const OPEN_AT_START = ["repository", "branches"];

interface RepoNavigatorProps {
  repository: Repository;
  delay?: number;
}

/** The left tree: the repository and its branches, remotes, and tags. */
export function RepoNavigator({ repository, delay }: RepoNavigatorProps) {
  const nodes = useMemo(() => buildNavigatorTree(repository), [repository]);
  const [selectedId, setSelectedId] = useState(`branch:${repository.head}`);

  return (
    <Panel title="Navigator" meta={repository.path} delay={delay}>
      <Tree
        label="Repository navigator"
        nodes={nodes}
        selectedId={selectedId}
        onSelect={setSelectedId}
        defaultExpanded={OPEN_AT_START}
      />
    </Panel>
  );
}
