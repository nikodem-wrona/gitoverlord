import type { FileDelta, WorkingTree } from "@/ipc";

import {
  type DemoRepository,
  currentBranch,
  newHash,
  now,
  reject,
} from "./demoRepository";

type Area = keyof WorkingTree;

/** Moves `files` to the index. A conflict is resolved, and a new file is added. */
export function stage(repo: DemoRepository, files: readonly string[]): null {
  move(repo, files, "unstaged", "staged", (file) => ({
    ...file,
    kind: file.kind === "untracked" ? "added" : resolved(file),
  }));
  return null;
}

/** Moves `files` out of the index. An added file is untracked again. */
export function unstage(repo: DemoRepository, files: readonly string[]): null {
  move(repo, files, "staged", "unstaged", (file) => ({
    ...file,
    kind: file.kind === "added" ? "untracked" : file.kind,
  }));
  return null;
}

/** Removes the unstaged changes of `files` and keeps them in a stash entry. */
export function discard(
  repo: DemoRepository,
  files: readonly string[],
): string | Promise<never> {
  const removed = take(repo, "unstaged", files);
  if (removed.length === 0) return reject("There are no changes to discard.");
  const hash = newHash(repo);
  const branch = currentBranch(repo)?.name ?? "(no branch)";
  repo.stashes.unshift({
    hash,
    message: `On ${branch}: Discarded by gitoverlord: ${files.join(", ")}`,
    time: now(),
    tree: { staged: [], unstaged: removed },
  });
  return hash;
}

/** Puts the files of a discard back and drops its stash entry. */
export function restoreDiscarded(
  repo: DemoRepository,
  hash: string,
): null | Promise<never> {
  const entry = repo.stashes.find((stash) => stash.hash === hash);
  if (!entry) return reject("The stash entry is no longer in the list.");
  repo.stashes = repo.stashes.filter((stash) => stash !== entry);
  put(repo, "unstaged", entry.tree.unstaged);
  return null;
}

/** Adds `files` to `area`. A file that is there already is replaced. */
export function put(
  repo: DemoRepository,
  area: Area,
  files: readonly FileDelta[],
): void {
  const paths = new Set(files.map(({ path }) => path));
  const kept = repo.tree[area].filter(({ path }) => !paths.has(path));
  repo.tree[area] = [...kept, ...files].sort((a, b) =>
    a.path.localeCompare(b.path),
  );
}

function move(
  repo: DemoRepository,
  files: readonly string[],
  from: Area,
  to: Area,
  change: (file: FileDelta) => FileDelta,
): void {
  put(repo, to, take(repo, from, files).map(change));
}

/** Removes `files` from `area` and returns them. */
function take(
  repo: DemoRepository,
  area: Area,
  files: readonly string[],
): FileDelta[] {
  const taken = repo.tree[area].filter(({ path }) => files.includes(path));
  repo.tree[area] = repo.tree[area].filter((file) => !taken.includes(file));
  return taken;
}

function resolved(file: FileDelta): FileDelta["kind"] {
  return file.kind === "conflicted" ? "modified" : file.kind;
}
