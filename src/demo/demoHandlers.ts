import type { CommitDetail, LogPage, MockCommandHandlers } from "@/ipc";

import { SAMPLE_COMMITS, SAMPLE_HISTORY } from "./sampleCommits";
import { sampleDiff } from "./sampleDiff";
import {
  SAMPLE_ACTIVITY,
  SAMPLE_BRANCHES,
  SAMPLE_RECENT,
  SAMPLE_SUMMARY,
  SAMPLE_WORKING_TREE,
} from "./sampleRepository";

/**
 * Makes a handler for each command. The handlers answer with the sample repository.
 *
 * The demo backend and the frontend tests use these handlers.
 */
export function createDemoHandlers(): MockCommandHandlers {
  return {
    detectGit: () => ({ major: 2, minor: 54, patch: 0 }),
    pickRepository: () => SAMPLE_SUMMARY.path,
    openRepository: () => SAMPLE_SUMMARY,
    recentRepositories: () => SAMPLE_RECENT,
    repoSummary: () => SAMPLE_SUMMARY,
    repoBranches: () => SAMPLE_BRANCHES,
    repoActivity: () => SAMPLE_ACTIVITY,
    repoLog: ({ skip, limit }) => logPage(skip, limit),
    commitDetail: ({ hash }) => commitDetail(hash),
    repoStatus: () => SAMPLE_WORKING_TREE,
    fileDiff: () => sampleDiff(),
  };
}

function logPage(skip: number, limit: number): LogPage {
  const end = skip + limit;
  return {
    commits: SAMPLE_COMMITS.slice(skip, end),
    next: end < SAMPLE_COMMITS.length ? end : null,
  };
}

function commitDetail(hash: string): CommitDetail | Promise<never> {
  const entry = SAMPLE_HISTORY.find((sample) => sample.commit.hash === hash);
  if (!entry) {
    // The backend rejects with a plain value, not with an `Error` object.
    return Promise.reject({ kind: "readFailed", message: `no commit ${hash}` });
  }
  return {
    commit: entry.commit,
    body: "This commit is part of the sample repository.",
    email: `${entry.commit.author}@example.com`,
    files: entry.files,
  };
}
