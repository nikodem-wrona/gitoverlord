import type { FileDelta, OperationKind, OperationResult } from "@/ipc";

import { moveHead } from "./demoBranches";
import { put } from "./demoChanges";
import {
  commitsOf,
  currentBranch,
  type DemoRepository,
  type DemoStop,
  newHash,
  now,
  reject,
} from "./demoRepository";

/** A merge or a rebase of this branch stops at a conflict, so the demo shows the resolver. */
export const CONFLICT_BRANCH = "spike/radar";

export const CONFLICT_FILE: FileDelta = {
  path: "src/features/radar/Sweep.tsx",
  oldPath: null,
  kind: "conflicted",
  additions: 12,
  deletions: 4,
};

type Result = OperationResult | Promise<never>;

/** Merges a branch. A remote branch makes the branch current with its upstream. */
export function mergeBranch(repo: DemoRepository, target: string): Result {
  const tip = tipOf(repo, target);
  const head = headOf(repo);
  const into = currentBranch(repo)?.name ?? "HEAD";
  const subject = `Merge branch '${target}' into ${into}`;
  if (!tip) return reject(`merge: ${target} - not something we can merge`);
  if (target === CONFLICT_BRANCH) {
    return stop(repo, "merge", tip, { subject, parents: [head, tip] });
  }
  return done(repo, head, () => addCommit(repo, subject, [head, tip], target));
}

/** Rebases the current branch. The demo makes one new commit on top of `onto`. */
export function rebaseBranch(repo: DemoRepository, onto: string): Result {
  const tip = tipOf(repo, onto);
  const head = headOf(repo);
  const subject = commitOf(repo, head)?.subject ?? "rebased work";
  if (!tip) return reject(`invalid upstream '${onto}'`);
  if (onto === CONFLICT_BRANCH) {
    return stop(repo, "rebase", head, { subject, parents: [tip] });
  }
  return done(repo, head, () => addCommit(repo, subject, [tip], onto));
}

export function cherryPick(repo: DemoRepository, hash: string): Result {
  const commit = commitOf(repo, hash);
  const head = headOf(repo);
  if (!commit) return reject(`bad revision '${hash}'`);
  if (hash === head)
    return reject("The current branch has this commit already.");
  return done(repo, head, () => addCommit(repo, commit.subject, [head]));
}

export function revertCommit(repo: DemoRepository, hash: string): Result {
  const commit = commitOf(repo, hash);
  const head = headOf(repo);
  if (!commit) return reject(`bad revision '${hash}'`);
  return done(repo, head, () =>
    addCommit(repo, `Revert "${commit.subject}"`, [head]),
  );
}

/** Rejects a new operation while another one waits. */
export function busy(repo: DemoRepository): Promise<never> | undefined {
  if (repo.stopped)
    return reject(`Finish or abort the ${repo.stopped.kind} first.`);
  const conflicts = repo.tree.unstaged.some(
    ({ kind }) => kind === "conflicted",
  );
  return conflicts ? reject("Resolve the conflicts first.") : undefined;
}

/** Adds a commit on top of `HEAD`. A remote `target` makes the branch current with it. */
export function addCommit(
  repo: DemoRepository,
  subject: string,
  parents: string[],
  target = "",
): string {
  const hash = newHash(repo);
  const commit = {
    hash,
    subject,
    author: "you",
    time: now(),
    parents,
    refs: [],
  };
  repo.history.unshift({ commit, files: [] });
  moveHead(repo, hash, 1);
  const branch = currentBranch(repo);
  if (branch && target === branch.upstream) branch.behind = 0;
  return hash;
}

function done(
  repo: DemoRepository,
  previous: string,
  work: () => string,
): Result {
  return busy(repo) ?? { kind: "done", previous, head: work() };
}

/** Stops at a conflict in `CONFLICT_FILE`. */
function stop(
  repo: DemoRepository,
  kind: OperationKind,
  commit: string,
  end: Pick<DemoStop, "subject" | "parents">,
): Result {
  const blocked = busy(repo);
  if (blocked) return blocked;
  const branch = currentBranch(repo)?.name ?? null;
  const rebase = kind === "rebase";
  repo.stopped = { kind, tree: structuredClone(repo.tree), branch, ...end };
  repo.summary.operation = {
    kind,
    commit,
    branch: rebase ? branch : null,
    step: rebase ? 1 : null,
    steps: rebase ? 1 : null,
  };
  if (rebase) repo.summary.head.branch = null;
  put(repo, "unstaged", [CONFLICT_FILE]);
  return { kind: "stopped", conflicts: [CONFLICT_FILE.path] };
}

function headOf(repo: DemoRepository): string {
  return repo.summary.head.hash ?? "";
}

function commitOf(repo: DemoRepository, hash: string) {
  return commitsOf(repo).find((commit) => commit.hash === hash);
}

/** The commit of a branch. A remote branch such as `origin/main` gives the parent of `HEAD`. */
function tipOf(repo: DemoRepository, name: string): string | undefined {
  const local = repo.branches.find((branch) => branch.name === name);
  if (local) return local.tip;
  const upstream = repo.branches.some((branch) => branch.upstream === name);
  return upstream ? commitOf(repo, headOf(repo))?.parents[0] : undefined;
}
