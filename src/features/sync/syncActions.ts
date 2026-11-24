import { type Action, defineAction } from "@/actions";
import type { RepoWriter } from "@/features/repository";
import { type Branch, commands, type RepoSummary } from "@/ipc";

import { addOriginAction } from "./remoteActions";

const NO_BRANCH = "Switch to a branch that has a commit.";
const NO_REMOTE = "The repository has no remote. Add one on the Remotes tab.";

/** Fetches each remote. Then the ahead and behind counts compare with the new remote branches. */
export function fetchAction(repo: RepoWriter, remotes: number): Action {
  return defineAction({
    id: "sync.fetch",
    label: "Fetch the remotes",
    group: "Sync",
    shortcut: "Mod+Shift+T",
    blocked: remotes === 0 ? NO_REMOTE : undefined,
    run: async () => {
      await repo.write(commands.fetchRemotes(repo.path));
      return {
        title: "Fetch complete",
        message: "The remote branches are current.",
      };
    },
  });
}

/** Fast-forwards the current branch to its upstream. */
export function pullAction(repo: RepoWriter, branch?: Branch): Action {
  return defineAction({
    id: "sync.pull",
    label: "Pull from the upstream",
    group: "Sync",
    shortcut: "Mod+Shift+P",
    blocked: !branch
      ? NO_BRANCH
      : !branch.upstream
        ? "Publish the branch first."
        : undefined,
    run: async () => {
      await repo.write(commands.pullBranch(repo.path));
      return {
        title: "Pull complete",
        message: `${branch?.name} has the commits of ${branch?.upstream}.`,
      };
    },
  });
}

/** Pushes the current branch. For a branch without an upstream, this is the publish action. */
export function pushAction(
  repo: RepoWriter,
  branch: Branch | undefined,
  remotes: number,
): Action {
  if (branch && !branch.upstream) return publishAction(repo, branch, remotes);
  const ahead = branch?.ahead ?? 0;
  return defineAction({
    id: "sync.push",
    label: "Push to the upstream",
    group: "Sync",
    shortcut: "Mod+P",
    blocked: !branch
      ? NO_BRANCH
      : ahead === 0
        ? "There are no commits to push."
        : undefined,
    run: async () => {
      await repo.write(commands.pushBranch(repo.path));
      return {
        title: "Push complete",
        message: `${ahead} ${ahead === 1 ? "commit" : "commits"} went to ${branch?.upstream}.`,
      };
    },
  });
}

/** Pushes a branch that has no upstream, and makes the new remote branch its upstream. */
function publishAction(repo: RepoWriter, branch: Branch, remotes: number) {
  return defineAction({
    id: "sync.publish",
    label: "Publish the branch",
    group: "Sync",
    shortcut: "Mod+P",
    blocked: remotes === 0 ? NO_REMOTE : undefined,
    run: async () => {
      const upstream = await repo.write(commands.publishBranch(repo.path));
      return {
        title: "Branch published",
        message: `${branch.name} follows ${upstream}.`,
      };
    },
  });
}

/** The sync actions for the command palette. */
export function syncActions(
  repo: RepoWriter,
  summary?: RepoSummary,
  branches: readonly Branch[] = [],
): Action[] {
  const current = branches.find((branch) => branch.current);
  const remotes = summary?.remotes ?? [];
  return [
    fetchAction(repo, remotes.length),
    pullAction(repo, current),
    pushAction(repo, current, remotes.length),
    ...(remotes.includes("origin") ? [] : [addOriginAction(repo, remotes)]),
  ];
}
