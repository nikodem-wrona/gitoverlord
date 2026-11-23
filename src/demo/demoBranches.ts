import type { Branch } from "@/ipc";

import {
  currentBranch,
  type DemoRepository,
  newHash,
  now,
  reject,
} from "./demoRepository";

type Done = null | Promise<never>;

/** Commits the staged files. `amend` replaces the last commit. */
export function commit(
  repo: DemoRepository,
  message: string,
  amend: boolean,
): string | Promise<never> {
  if (!amend && repo.tree.staged.length === 0) {
    return reject("Nothing to commit. Stage a change first.");
  }
  const head = repo.history.find(
    (entry) => entry.commit.hash === repo.summary.head.hash,
  );
  const hash = newHash(repo);
  const subject = message.split("\n")[0]?.trim() || head?.commit.subject || "";
  const parents = amend
    ? (head?.commit.parents ?? [])
    : [head?.commit.hash ?? ""];
  repo.history = repo.history.filter((entry) => !amend || entry !== head);
  repo.history.unshift({
    commit: { hash, subject, author: "you", time: now(), parents, refs: [] },
    files: [...repo.tree.staged, ...(amend ? (head?.files ?? []) : [])],
  });
  repo.tree.staged = [];
  moveHead(repo, hash, amend ? 0 : 1);
  return hash;
}

/** Creates a branch at `start`, or at `HEAD`, and switches to it. */
export function createBranch(
  repo: DemoRepository,
  name: string,
  start: string | null,
): Done {
  const tip = start ?? repo.summary.head.hash ?? "";
  return addBranch(repo, name, tip) ?? switchBranch(repo, name);
}

/** Makes a deleted branch again. The current branch does not change. */
export function restoreBranch(repo: DemoRepository, name: string, tip: string) {
  return addBranch(repo, name, tip) ?? null;
}

export function switchBranch(repo: DemoRepository, name: string): Done {
  const target = repo.branches.find((branch) => branch.name === name);
  if (!target) return reject(`invalid reference: ${name}`);
  repo.branches = repo.branches
    .map((branch) => ({ ...branch, current: branch === target }))
    .sort((a, b) => Number(b.current) - Number(a.current));
  repo.summary.head = { branch: name, hash: target.tip };
  return null;
}

export function renameBranch(
  repo: DemoRepository,
  name: string,
  newName: string,
): Done {
  if (findBranch(repo, newName)) return exists(newName);
  const target = findBranch(repo, name);
  if (!target) return reject(`No branch named '${name}'.`);
  target.name = newName;
  if (target.current) repo.summary.head.branch = newName;
  return null;
}

/** Deletes a branch and returns its last commit. */
export function deleteBranch(
  repo: DemoRepository,
  name: string,
): string | Promise<never> {
  const target = findBranch(repo, name);
  if (!target) return reject(`branch '${name}' not found.`);
  if (target.current) return reject(`Cannot delete the current branch.`);
  repo.branches = repo.branches.filter((branch) => branch !== target);
  return target.tip;
}

function addBranch(repo: DemoRepository, name: string, tip: string) {
  if (findBranch(repo, name)) return exists(name);
  const branch: Branch = {
    name,
    current: false,
    upstream: null,
    ahead: 0,
    behind: 0,
    tip,
    updated: now(),
  };
  repo.branches.push(branch);
  return undefined;
}

function findBranch(repo: DemoRepository, name: string): Branch | undefined {
  return repo.branches.find((branch) => branch.name === name);
}

function exists(name: string): Promise<never> {
  return reject(`A branch named '${name}' already exists.`);
}

/** Points `HEAD` and the current branch to `hash`. */
function moveHead(repo: DemoRepository, hash: string, ahead: number): void {
  repo.summary.head.hash = hash;
  const branch = currentBranch(repo);
  if (!branch) return;
  branch.tip = hash;
  branch.updated = now();
  branch.ahead += ahead;
}
