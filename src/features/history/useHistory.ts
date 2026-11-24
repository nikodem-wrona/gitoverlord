import { useMemo } from "react";

import { type QueryState, useCommitLog } from "@/features/repository";

import { assignLanes, type LanedCommit } from "./assignLanes";

export interface History {
  /** The loaded commits with their lanes. The newest commit is first. */
  commits: readonly LanedCommit[];
  /** The commits as a query result: no data before the first page arrives. */
  query: QueryState<readonly LanedCommit[]>;
  hasMore: boolean;
  loadMore(): void;
}

/** Reads the history of a repository in pages, and gives each commit its lane. */
export function useHistory(repoPath: string): History {
  const { commits: loaded, isPending, error, ...log } = useCommitLog(repoPath);
  const commits = useMemo(() => assignLanes(loaded), [loaded]);
  const ready = !isPending && !error;
  const query = useMemo(
    () => ({ data: ready ? commits : undefined, error }),
    [ready, commits, error],
  );

  return { commits, query, ...log };
}
