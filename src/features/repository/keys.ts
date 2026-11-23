import type { DiffTarget } from "@/ipc";

/** The cache keys of the repository data. Each key of one repository starts with `all(path)`. */
export const repoKeys = {
  recent: ["recentRepositories"],
  all: (path: string) => ["repo", path],
  summary: (path: string) => ["repo", path, "summary"],
  branches: (path: string) => ["repo", path, "branches"],
  activity: (path: string) => ["repo", path, "activity"],
  log: (path: string) => ["repo", path, "log"],
  commit: (path: string, hash: string) => ["repo", path, "commit", hash],
  status: (path: string) => ["repo", path, "status"],
  stashes: (path: string) => ["repo", path, "stashes"],
  remotes: (path: string) => ["repo", path, "remotes"],
  diffs: (path: string) => ["repo", path, "diff"],
  diff: (path: string, target: DiffTarget) => ["repo", path, "diff", target],
} as const;
