import { type Action, defineAction } from "@/actions";
import { type RepoWriter, shortHash } from "@/features/repository";
import { type Commit, commands } from "@/ipc";

import { branchName, type HistoryState, startBlocked } from "./historyState";
import { operationOutcome } from "./operationOutcome";

/** Merges `target`, a branch or a commit, into the current branch. */
export function mergeAction(
  repo: RepoWriter,
  state: HistoryState,
  target: string,
): Action {
  const into = branchName(state);
  return defineAction({
    id: `history.merge:${target}`,
    label: `Merge ${target} into ${into}`,
    group: "History",
    blocked:
      startBlocked(state) ??
      (target === state.branch
        ? "A branch cannot merge into itself."
        : undefined),
    run: async () => {
      const result = await repo.write(commands.mergeBranch(repo.path, target));
      return operationOutcome(
        repo,
        "Merge",
        result,
        `${into} has the commits of ${target}.`,
      );
    },
  });
}

/** Replays the commits of the current branch on top of `onto`. */
export function rebaseAction(
  repo: RepoWriter,
  state: HistoryState,
  onto: string,
): Action {
  const branch = state.branch ?? "";
  return defineAction({
    id: `history.rebase:${onto}`,
    label: `Rebase ${branch || "the branch"} onto ${onto}`,
    group: "History",
    blocked:
      startBlocked(state) ??
      (!state.branch
        ? "Switch to a branch first."
        : onto === branch
          ? "A branch cannot rebase onto itself."
          : undefined),
    confirm: {
      title: "Rebase branch",
      message: `The commits of ${branch} get new hashes on top of ${onto}. You can undo this.`,
      confirm: "Rebase",
    },
    run: async () => {
      const result = await repo.write(commands.rebaseBranch(repo.path, onto));
      return operationOutcome(
        repo,
        "Rebase",
        result,
        `${branch} is on top of ${onto}.`,
      );
    },
  });
}

/** Applies the changes of `commit` as a new commit on the current branch. */
export function cherryPickAction(
  repo: RepoWriter,
  state: HistoryState,
  commit: Commit,
): Action {
  const short = shortHash(commit.hash);
  const into = branchName(state);
  return defineAction({
    id: `history.cherry-pick:${commit.hash}`,
    label: `Cherry-pick ${short} onto ${into}`,
    group: "History",
    blocked:
      startBlocked(state) ??
      (commit.hash === state.head ? "This is the current commit." : undefined),
    run: async () => {
      const result = await repo.write(
        commands.cherryPick(repo.path, commit.hash),
      );
      return operationOutcome(
        repo,
        "Cherry-pick",
        result,
        `${into} has a copy of ${short} "${commit.subject}".`,
      );
    },
  });
}

/** Makes a new commit that removes the changes of `commit`. */
export function revertAction(
  repo: RepoWriter,
  state: HistoryState,
  commit: Commit,
): Action {
  const short = shortHash(commit.hash);
  return defineAction({
    id: `history.revert:${commit.hash}`,
    label: `Revert ${short}`,
    group: "History",
    blocked: startBlocked(state),
    run: async () => {
      const result = await repo.write(
        commands.revertCommit(repo.path, commit.hash),
      );
      return operationOutcome(
        repo,
        "Revert",
        result,
        `A new commit removes the changes of ${short}.`,
      );
    },
  });
}

/** Asks for a name, then creates a branch at `commit` and switches to it. */
export function branchAtAction(
  repo: RepoWriter,
  state: HistoryState,
  commit: Commit,
): Action {
  const short = shortHash(commit.hash);
  return defineAction({
    id: `history.branch-at:${commit.hash}`,
    label: `New branch at ${short}…`,
    group: "History",
    blocked: startBlocked(state),
    prompt: {
      title: "New branch",
      label: "Branch name",
      placeholder: "feature/new-idea",
      submit: "Create and switch",
    },
    run: async (name) => {
      await repo.write(commands.createBranch(repo.path, name, commit.hash));
      return {
        title: "Branch created",
        message: `${name} starts at ${short}.`,
      };
    },
  });
}
