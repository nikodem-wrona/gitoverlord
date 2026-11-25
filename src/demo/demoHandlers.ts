import type { CommitDetail, LogPage, MockCommandHandlers } from "@/ipc";

import * as branches from "./demoBranches";
import * as changes from "./demoChanges";
import { conflictHandlers } from "./demoConflicts";
import * as hub from "./demoGitHub";
import {
  commitsOf,
  createDemoRepository,
  type DemoRepository,
  reject,
} from "./demoRepository";
import * as stash from "./demoStash";
import { surgeryHandlers } from "./demoSteps";
import * as sync from "./demoSync";
import { updateHandlers } from "./demoUpdate";
import { sampleDiff } from "./sampleDiff";
import { SAMPLE_ACTIVITY, SAMPLE_RECENT } from "./sampleRepository";

/**
 * Makes a handler for each command. The handlers answer with a new copy of the
 * sample repository, and the write commands change that copy.
 *
 * The demo backend and the frontend tests use these handlers.
 */
export function createDemoHandlers(): MockCommandHandlers {
  const repo = createDemoRepository();
  return {
    ...readHandlers(repo),
    ...gitHubHandlers(repo),
    ...surgeryHandlers(repo),
    ...conflictHandlers(repo),
    ...updateHandlers(),
    stageFiles: ({ files }) => changes.stage(repo, files),
    unstageFiles: ({ files }) => changes.unstage(repo, files),
    // The sample diff has one hunk, so a hunk is the whole file.
    stageHunk: ({ hunk }) => changes.stage(repo, [hunk.path]),
    unstageHunk: ({ hunk }) => changes.unstage(repo, [hunk.path]),
    discardChanges: ({ files }) => changes.discard(repo, files),
    restoreDiscarded: ({ hash }) => changes.restoreDiscarded(repo, hash),
    commitChanges: ({ message, amend }) =>
      branches.commit(repo, message, amend),
    createBranch: ({ name, start }) => branches.createBranch(repo, name, start),
    restoreBranch: ({ name, hash }) => branches.restoreBranch(repo, name, hash),
    switchBranch: ({ name }) => branches.switchBranch(repo, name),
    renameBranch: ({ name, newName }) =>
      branches.renameBranch(repo, name, newName),
    deleteBranch: ({ name }) => branches.deleteBranch(repo, name),
    stashChanges: ({ message }) => stash.stashChanges(repo, message),
    applyStash: ({ hash }) => stash.applyStash(repo, hash),
    popStash: ({ hash }) => stash.popStash(repo, hash),
    dropStash: ({ hash }) => stash.dropStash(repo, hash),
    restoreStash: ({ hash, message }) =>
      stash.restoreStash(repo, hash, message),
    addRemote: ({ name, url }) => sync.addRemote(repo, name, url),
    fetchRemotes: () => sync.fetchRemotes(repo),
    pullBranch: () => sync.pull(repo),
    pushBranch: () => sync.push(repo),
    publishBranch: () => sync.publish(repo),
    forcePushBranch: () => sync.forcePush(repo),
    undoForcePush: ({ previous }) => sync.undoForcePush(repo, previous),
    cloneRepository: ({ url, parent }) => sync.cloneRepository(url, parent),
  };
}

type GitHubHandlers = Pick<
  MockCommandHandlers,
  | "githubAccount"
  | "githubApp"
  | "setGithubClientId"
  | "githubStartSignIn"
  | "githubPollSignIn"
  | "githubSignOut"
  | "githubRepositories"
  | "githubPullRequests"
  | "githubCreatePullRequest"
  | "openGithubPage"
>;

/** The demo account starts signed out, so that the demo shows the sign-in. */
function gitHubHandlers(repo: DemoRepository): GitHubHandlers {
  const state = hub.createDemoGitHub();
  return {
    githubAccount: () => structuredClone(state.account),
    githubApp: () => structuredClone(state.app),
    setGithubClientId: ({ clientId }) => hub.saveClientId(state, clientId),
    githubStartSignIn: () => hub.DEMO_DEVICE_CODE,
    githubPollSignIn: () => hub.pollSignIn(state),
    githubSignOut: () => {
      state.account = null;
      return null;
    },
    githubRepositories: () => structuredClone(hub.DEMO_HUB_REPOSITORIES),
    githubPullRequests: () => hub.pullList(state),
    githubCreatePullRequest: ({ title, base }) =>
      hub.createPull(state, repo, title, base),
    openGithubPage: ({ url }) => hub.openPage(url),
  };
}

type ReadHandlers = Pick<
  MockCommandHandlers,
  | "detectGit"
  | "pickFolder"
  | "openRepository"
  | "recentRepositories"
  | "repoSummary"
  | "repoBranches"
  | "repoActivity"
  | "repoLog"
  | "commitDetail"
  | "repoStatus"
  | "fileDiff"
  | "repoStashes"
  | "repoRemotes"
>;

/**
 * The read handlers give copies. Like the real backend, each answer is a new
 * value, so the queries see the changes of the write commands.
 */
function readHandlers(repo: DemoRepository): ReadHandlers {
  return {
    detectGit: () => ({ major: 2, minor: 54, patch: 0 }),
    pickFolder: () => repo.summary.path,
    openRepository: () => structuredClone(repo.summary),
    recentRepositories: () => SAMPLE_RECENT,
    repoSummary: () => structuredClone(repo.summary),
    repoBranches: () => structuredClone(repo.branches),
    repoActivity: () => SAMPLE_ACTIVITY,
    repoLog: ({ skip, limit }) => logPage(repo, skip, limit),
    commitDetail: ({ hash }) => commitDetail(repo, hash),
    repoStatus: () => structuredClone(repo.tree),
    fileDiff: () => sampleDiff(),
    repoStashes: () => stash.stashEntries(repo),
    repoRemotes: () => structuredClone(repo.remotes),
  };
}

function logPage(repo: DemoRepository, skip: number, limit: number): LogPage {
  const commits = commitsOf(repo);
  const end = skip + limit;
  return {
    commits: commits.slice(skip, end),
    next: end < commits.length ? end : null,
  };
}

function commitDetail(
  repo: DemoRepository,
  hash: string,
): CommitDetail | Promise<never> {
  const index = repo.history.findIndex(({ commit }) => commit.hash === hash);
  const entry = repo.history[index];
  if (!entry) {
    return stash.stashDetail(repo, hash) ?? reject(`no commit ${hash}`);
  }
  return {
    commit: commitsOf(repo)[index] ?? entry.commit,
    body: "This commit is part of the sample repository.",
    email: `${entry.commit.author}@example.com`,
    files: entry.files,
  };
}
