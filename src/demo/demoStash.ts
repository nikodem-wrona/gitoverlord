import type { CommitDetail, StashEntry } from "@/ipc";

import { put } from "./demoChanges";
import {
  currentBranch,
  type DemoRepository,
  type DemoStash,
  newHash,
  now,
  reject,
} from "./demoRepository";

type Done = null | Promise<never>;

export function stashEntries(repo: DemoRepository): StashEntry[] {
  return repo.stashes.map(({ tree: _tree, ...entry }, index) => ({
    ...entry,
    index,
  }));
}

/** Moves each change to a new entry and returns its hash. */
export function stashChanges(
  repo: DemoRepository,
  message: string,
): string | Promise<never> {
  const { staged, unstaged } = repo.tree;
  if (staged.length + unstaged.length === 0) {
    return reject("There are no changes to stash.");
  }
  const hash = newHash(repo);
  const branch = currentBranch(repo)?.name ?? "(no branch)";
  const text = message.trim()
    ? `On ${branch}: ${message.trim()}`
    : `WIP on ${branch}: ${repo.summary.head.hash ?? ""}`;
  repo.stashes.unshift({ hash, message: text, time: now(), tree: repo.tree });
  repo.tree = { staged: [], unstaged: [] };
  return hash;
}

export function applyStash(repo: DemoRepository, hash: string): Done {
  const entry = findStash(repo.stashes, hash);
  if (!entry) return missing();
  put(repo, "unstaged", [...entry.tree.staged, ...entry.tree.unstaged]);
  return null;
}

export function popStash(repo: DemoRepository, hash: string): Done {
  return applyStash(repo, hash) ?? dropStash(repo, hash);
}

export function dropStash(repo: DemoRepository, hash: string): Done {
  const entry = findStash(repo.stashes, hash);
  if (!entry) return missing();
  repo.stashes = repo.stashes.filter((stash) => stash !== entry);
  repo.dropped.push(entry);
  return null;
}

export function restoreStash(
  repo: DemoRepository,
  hash: string,
  message: string,
): Done {
  const entry = findStash(repo.dropped, hash);
  if (!entry) return missing();
  repo.stashes.unshift({ ...entry, message });
  return null;
}

/** Shows a stash entry as a commit, so that the inspector can show its files. */
export function stashDetail(
  repo: DemoRepository,
  hash: string,
): CommitDetail | undefined {
  const entry = findStash(repo.stashes, hash);
  if (!entry) return undefined;
  const parents = repo.summary.head.hash ? [repo.summary.head.hash] : [];
  return {
    commit: {
      hash,
      subject: entry.message,
      author: "you",
      time: entry.time,
      parents,
      refs: [],
    },
    body: "",
    email: "you@example.com",
    files: [...entry.tree.staged, ...entry.tree.unstaged],
  };
}

function findStash(list: readonly DemoStash[], hash: string) {
  return list.find((stash) => stash.hash === hash);
}

function missing(): Promise<never> {
  return reject("The stash entry is no longer in the list.");
}
