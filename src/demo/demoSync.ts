import { type Branch, events, type SyncOperation } from "@/ipc";

import {
  currentBranch,
  type DemoRepository,
  newHash,
  now,
  reject,
} from "./demoRepository";

/** The steps that the demo reports, like the progress lines of `git`. */
const PHASES: Record<SyncOperation, [string, number][]> = {
  fetch: [
    ["Counting objects", 100],
    ["Receiving objects", 50],
    ["Receiving objects", 100],
  ],
  pull: [
    ["Receiving objects", 100],
    ["Updating files", 100],
  ],
  push: [
    ["Compressing objects", 100],
    ["Writing objects", 60],
    ["Writing objects", 100],
  ],
  clone: [
    ["Receiving objects", 30],
    ["Receiving objects", 80],
    ["Resolving deltas", 100],
  ],
};
const STEP_TIME = 60;

export async function fetchRemotes(repo: DemoRepository): Promise<null> {
  if (repo.remotes.length === 0) return reject("The repository has no remote.");
  await simulate(repo.summary.path, "fetch");
  repo.summary.fetched = now();
  return null;
}

/** Fast-forwards the current branch. A branch with its own new commits is rejected. */
export async function pull(repo: DemoRepository): Promise<null> {
  const branch = await tracked(repo);
  if (branch.ahead > 0 && branch.behind > 0) {
    return reject(
      `The branch ${branch.name} and its upstream both have new commits. A pull only fast-forwards. Merge the upstream into the branch, or rebase the branch on it.`,
    );
  }
  await simulate(repo.summary.path, "pull");
  branch.behind = 0;
  return null;
}

export async function push(repo: DemoRepository): Promise<null> {
  const branch = await tracked(repo);
  await simulate(repo.summary.path, "push");
  branch.ahead = 0;
  return null;
}

/** Replaces the upstream. The returned "commit" keeps the old counts for the undo. */
export async function forcePush(repo: DemoRepository): Promise<string> {
  const branch = await tracked(repo);
  await simulate(repo.summary.path, "push");
  const previous = newHash(repo);
  repo.forced[previous] = { ahead: branch.ahead, behind: branch.behind };
  branch.ahead = 0;
  branch.behind = 0;
  return previous;
}

export async function undoForcePush(
  repo: DemoRepository,
  previous: string,
): Promise<null> {
  const branch = await tracked(repo);
  const counts = repo.forced[previous];
  if (!counts) return reject(`bad object ${previous}`);
  await simulate(repo.summary.path, "push");
  Object.assign(branch, counts);
  return null;
}

/** Pushes the current branch to `origin` and makes it the upstream. */
export async function publish(repo: DemoRepository): Promise<string> {
  const branch = currentBranch(repo);
  const remote = repo.remotes.find(({ name }) => name === "origin");
  if (!branch) return reject("Switch to a branch that has a commit.");
  if (!remote) return reject("The repository has no remote.");
  await simulate(repo.summary.path, "push");
  branch.upstream = `${remote.name}/${branch.name}`;
  branch.ahead = 0;
  remote.branches = [...remote.branches, branch.upstream].sort();
  return branch.upstream;
}

export function addRemote(
  repo: DemoRepository,
  name: string,
  url: string,
): null | Promise<never> {
  if (repo.remotes.some((remote) => remote.name === name)) {
    return reject(`The remote ${name} already exists.`);
  }
  repo.remotes.push({ name, url, branches: [] });
  repo.summary.remotes = repo.remotes.map((remote) => remote.name).sort();
  return null;
}

/** Pretends to clone. The demo opens the sample repository for each path. */
export async function cloneRepository(
  url: string,
  parent: string,
): Promise<string> {
  const name = url
    .replace(/(\/|\.git)+$/, "")
    .split(/[/\\:]/)
    .pop();
  if (!name) return reject(`"${url}" is not a repository URL.`);
  const path = `${parent}/${name}`;
  await simulate(path, "clone");
  return path;
}

async function tracked(repo: DemoRepository): Promise<Branch> {
  const branch = currentBranch(repo);
  if (!branch) return reject("Switch to a branch that has a commit.");
  if (!branch.upstream) {
    return reject(
      `The branch ${branch.name} has no upstream. Publish the branch first.`,
    );
  }
  return branch;
}

/** Sends progress events like the backend, then the event of the end. */
async function simulate(path: string, operation: SyncOperation) {
  for (const [phase, percent] of PHASES[operation]) {
    await events.syncProgress.emit({
      path,
      operation,
      step: { phase, percent },
    });
    await new Promise((resolve) => setTimeout(resolve, STEP_TIME));
  }
  await events.syncProgress.emit({ path, operation, step: null });
}
