import {
  keepPreviousData,
  skipToken,
  useInfiniteQuery,
  useQuery,
} from "@tanstack/react-query";
import { useCallback, useMemo } from "react";

import { type Commit, commands, type DiffTarget, unwrap } from "@/ipc";

import { repoKeys } from "./keys";

const ACTIVITY_DAYS = 30;
const LOG_PAGE_SIZE = 200;

export function useRecentRepositories() {
  return useQuery({
    queryKey: repoKeys.recent,
    queryFn: () => unwrap(commands.recentRepositories()),
  });
}

export function useRepoSummary(path: string) {
  return useQuery({
    queryKey: repoKeys.summary(path),
    queryFn: () => unwrap(commands.repoSummary(path)),
  });
}

export function useBranches(path: string) {
  return useQuery({
    queryKey: repoKeys.branches(path),
    queryFn: () => unwrap(commands.repoBranches(path)),
  });
}

/** Reads the remotes with their remote branches. */
export function useRemotes(path: string) {
  return useQuery({
    queryKey: repoKeys.remotes(path),
    queryFn: () => unwrap(commands.repoRemotes(path)),
  });
}

/** The number of commits on each of the last 30 days. The oldest day is first. */
export function useActivity(path: string) {
  return useQuery({
    queryKey: repoKeys.activity(path),
    queryFn: () => unwrap(commands.repoActivity(path, ACTIVITY_DAYS)),
  });
}

export function useWorkingTree(path: string) {
  return useQuery({
    queryKey: repoKeys.status(path),
    queryFn: () => unwrap(commands.repoStatus(path)),
  });
}

/** Reads the stash entries. The newest entry is first. */
export function useStashes(path: string) {
  return useQuery({
    queryKey: repoKeys.stashes(path),
    queryFn: () => unwrap(commands.repoStashes(path)),
  });
}

/**
 * Reads one commit with its files. The query waits while `hash` is `undefined`.
 *
 * The last commit stays on the screen until the next commit arrives.
 */
export function useCommitDetail(path: string, hash: string | undefined) {
  return useQuery({
    queryKey: repoKeys.commit(path, hash ?? ""),
    queryFn: hash ? () => unwrap(commands.commitDetail(path, hash)) : skipToken,
    placeholderData: keepPreviousData,
  });
}

/** Reads one file with conflicts. The query waits while `file` is `undefined`. */
export function useConflictFile(path: string, file: string | undefined) {
  return useQuery({
    queryKey: repoKeys.conflict(path, file ?? ""),
    queryFn: file ? () => unwrap(commands.conflictFile(path, file)) : skipToken,
  });
}

/** Reads the changed lines of one file. The last diff stays until the next diff arrives. */
export function useFileDiff(path: string, target: DiffTarget) {
  return useQuery({
    queryKey: repoKeys.diff(path, target),
    queryFn: () => unwrap(commands.fileDiff(path, target)),
    placeholderData: keepPreviousData,
  });
}

export interface CommitLog {
  /** The commits of each loaded page. The newest commit is first. */
  commits: readonly Commit[];
  /** `true` when the repository has more commits than the loaded pages. */
  hasMore: boolean;
  /** Loads the next page, if there is one and no page is on its way. */
  loadMore(): void;
  isPending: boolean;
  error: Error | null;
}

/** Reads the history in pages. */
export function useCommitLog(path: string): CommitLog {
  const query = useInfiniteQuery({
    queryKey: repoKeys.log(path),
    queryFn: ({ pageParam }) =>
      unwrap(commands.repoLog(path, pageParam, LOG_PAGE_SIZE)),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.next ?? undefined,
  });
  const { data, hasNextPage, isFetchingNextPage, fetchNextPage } = query;
  const commits = useMemo(
    () => data?.pages.flatMap((page) => page.commits) ?? [],
    [data],
  );
  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return {
    commits,
    hasMore: hasNextPage,
    loadMore,
    isPending: query.isPending,
    error: query.error,
  };
}
