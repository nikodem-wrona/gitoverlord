import type {
  Branch,
  Commit,
  GitError,
  RepoSummary,
  StashEntry,
  WorkingTree,
} from "@/ipc";

import { SAMPLE_HISTORY, type SampleCommit } from "./sampleCommits";
import {
  SAMPLE_BRANCHES,
  SAMPLE_SUMMARY,
  SAMPLE_WORKING_TREE,
} from "./sampleRepository";

/** A stash entry of the demo with the files that it keeps. */
export interface DemoStash extends Omit<StashEntry, "index"> {
  tree: WorkingTree;
}

/** The state of the sample repository. The write commands change it. */
export interface DemoRepository {
  summary: RepoSummary;
  tree: WorkingTree;
  branches: Branch[];
  /** The newest commit is first. */
  history: SampleCommit[];
  /** The newest entry is first. */
  stashes: DemoStash[];
  /** The dropped entries, so that an undo can restore them. */
  dropped: DemoStash[];
  /** The count of the hashes that the demo made. */
  made: number;
}

const SAMPLE_BRANCH_NAMES = new Set(SAMPLE_BRANCHES.map(({ name }) => name));

/** Makes a new copy of the sample repository. */
export function createDemoRepository(): DemoRepository {
  return structuredClone({
    summary: SAMPLE_SUMMARY,
    tree: SAMPLE_WORKING_TREE,
    branches: SAMPLE_BRANCHES,
    history: [...SAMPLE_HISTORY],
    stashes: [],
    dropped: [],
    made: 0,
  });
}

/** Makes a hash for a new commit or stash entry. */
export function newHash(repo: DemoRepository): string {
  repo.made += 1;
  return (0xc0ffee0 + repo.made).toString(16);
}

/** The time now, in Unix seconds. */
export function now(): number {
  return Math.floor(Date.now() / 1000);
}

/** Fails like the backend: with a plain `GitError` value, not with an `Error` object. */
export function reject(message: string): Promise<never> {
  const error: GitError = { kind: "rejected", message };
  return Promise.reject(error);
}

export function currentBranch(repo: DemoRepository): Branch | undefined {
  return repo.branches.find((branch) => branch.current);
}

/** The commits, with the names of the branches that point to them now. */
export function commitsOf(repo: DemoRepository): Commit[] {
  return repo.history.map(({ commit }) => {
    const branches = repo.branches.filter(({ tip }) => tip === commit.hash);
    const others = commit.refs.filter((ref) => !SAMPLE_BRANCH_NAMES.has(ref));
    return {
      ...commit,
      refs: [...branches.map(({ name }) => name), ...others],
    };
  });
}
