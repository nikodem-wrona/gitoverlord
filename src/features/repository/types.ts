// The repository model of the user interface. Phase 2 fills it from git-core.

export interface CommitFile {
  path: string;
  additions: number;
  deletions: number;
}

export interface Commit {
  hash: string;
  subject: string;
  author: string;
  /** The branch that the commit belongs to. It sets the lane on the star map. */
  lane: string;
  time: string;
  parents: readonly string[];
  files: readonly CommitFile[];
}

export type ChangeStatus =
  "staged" | "modified" | "added" | "deleted" | "conflict" | "untracked";

export interface WorkingChange {
  path: string;
  status: ChangeStatus;
  additions: number;
  deletions: number;
}

export interface Branch {
  name: string;
  upstream: string;
  ahead: number;
  behind: number;
  updated: string;
  current: boolean;
}

export interface Repository {
  name: string;
  path: string;
  /** The name of the current branch. */
  head: string;
  ahead: number;
  behind: number;
  /** The newest commit is first. */
  commits: readonly Commit[];
  changes: readonly WorkingChange[];
  branches: readonly Branch[];
  remotes: readonly string[];
  tags: readonly string[];
  /** The number of commits on each of the last 30 days. The oldest day is first. */
  activity: readonly number[];
}
