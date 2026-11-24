import { type Action, defineAction } from "@/actions";
import { type RepoWriter, shortHash } from "@/features/repository";
import { type Commit, commands, type ResetMode } from "@/ipc";

import { branchName, type HistoryState, startBlocked } from "./historyState";

const MODES: Record<ResetMode, { text: string; effect: string }> = {
  soft: {
    text: "keep the changes staged",
    effect: "The changes of the later commits stay staged.",
  },
  mixed: {
    text: "keep the changes",
    effect: "The changes of the later commits stay in the working tree.",
  },
  hard: {
    text: "discard the changes",
    effect:
      "The changes of the later commits and the uncommitted changes go. The stash keeps a copy of the uncommitted changes.",
  },
};

/** Moves the current branch to `commit`. The undo moves it back. */
export function resetAction(
  repo: RepoWriter,
  state: HistoryState,
  commit: Commit,
  mode: ResetMode,
): Action {
  const short = shortHash(commit.hash);
  const branch = branchName(state);
  const { text, effect } = MODES[mode];
  return defineAction({
    id: `history.reset-${mode}:${commit.hash}`,
    label: `Reset ${branch} to ${short}, ${text}…`,
    group: "History",
    blocked:
      startBlocked(state) ??
      (commit.hash === state.head
        ? "The branch is at this commit already."
        : undefined),
    confirm: {
      title: "Reset branch",
      message: `${branch} moves to ${short}. ${effect} You can undo this.`,
      confirm: "Reset",
    },
    run: async () => {
      const receipt = await repo.write(
        commands.resetBranch(repo.path, commit.hash, mode),
      );
      const undo = () => repo.write(commands.undoReset(repo.path, receipt));
      return {
        title: "Branch reset",
        message: `${branch} is at ${short}.`,
        undo,
      };
    },
  });
}

/** The three resets to `commit`: soft, mixed, and hard. */
export function resetActions(
  repo: RepoWriter,
  state: HistoryState,
  commit: Commit,
): Action[] {
  const modes: ResetMode[] = ["soft", "mixed", "hard"];
  return modes.map((mode) => resetAction(repo, state, commit, mode));
}
