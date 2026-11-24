import { type Action, defineAction } from "@/actions";
import { type RepoWriter, shortHash } from "@/features/repository";
import { commands } from "@/ipc";

/** The text of the next commit. */
export interface CommitDraft {
  summary: string;
  description: string;
  /** Replaces the last commit. */
  amend: boolean;
}

export const EMPTY_DRAFT: CommitDraft = {
  summary: "",
  description: "",
  amend: false,
};

/** The state of the repository that the commit needs. */
interface CommitState {
  staged: number;
  /** `false` when the repository has no commit to amend. */
  hasHead: boolean;
}

/** Commits the staged changes with the draft message. `onDone` runs after the commit. */
export function commitAction(
  repo: RepoWriter,
  draft: CommitDraft,
  state: CommitState,
  onDone: () => void,
): Action {
  const summary = draft.summary.trim();
  const message = [summary, draft.description.trim()]
    .filter(Boolean)
    .join("\n\n");

  return defineAction({
    id: "commit.create",
    label: draft.amend ? "Amend the last commit" : "Commit the staged changes",
    group: "Commit",
    shortcut: "Mod+Enter",
    blocked: blockedReason(draft, state),
    run: async () => {
      const command = commands.commitChanges(repo.path, message, draft.amend);
      const hash = await repo.write(command);
      onDone();
      return {
        title: draft.amend ? "Commit amended" : "Committed",
        message: `${shortHash(hash)} ${summary || "The message did not change."}`,
      };
    },
  });
}

function blockedReason(draft: CommitDraft, state: CommitState) {
  if (draft.amend) {
    return state.hasHead ? undefined : "There is no commit to amend.";
  }
  if (state.staged === 0) return "Stage a change first.";
  if (draft.summary.trim() === "") return "Write a summary first.";
  return undefined;
}
