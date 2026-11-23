import type { InfiniteData, QueryClient } from "@tanstack/react-query";

import type { LogPage, RepoChange } from "@/ipc";

import { repoKeys } from "./keys";

/** Marks the data that `change` made old. The queries on the screen then read it again. */
export function refreshRepository(
  client: QueryClient,
  path: string,
  change: RepoChange,
): void {
  if (change.refs) {
    // A long history must not load each page again. The first page is sufficient.
    client.setQueryData(repoKeys.log(path), keepFirstPage);
    void client.invalidateQueries({ queryKey: repoKeys.all(path) });
  } else if (change.files) {
    void client.invalidateQueries({ queryKey: repoKeys.status(path) });
    void client.invalidateQueries({ queryKey: repoKeys.diffs(path) });
  }
}

function keepFirstPage(
  log: InfiniteData<LogPage> | undefined,
): InfiniteData<LogPage> | undefined {
  if (!log) return undefined;
  return {
    pages: log.pages.slice(0, 1),
    pageParams: log.pageParams.slice(0, 1),
  };
}
