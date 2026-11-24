import { ActionButton, ActionMenuButton } from "@/actions";
import { useRepoWriter } from "@/features/repository";
import type { Commit } from "@/ipc";

import styles from "./CommitTools.module.css";
import {
  branchAtAction,
  cherryPickAction,
  revertAction,
} from "./historyActions";
import { useHistoryState } from "./historyState";
import { resetActions } from "./resetActions";

/** The commands on one commit: cherry-pick, revert, new branch, and reset. */
export function CommitTools({
  repoPath,
  commit,
}: {
  repoPath: string;
  commit: Commit;
}) {
  const repo = useRepoWriter(repoPath);
  const state = useHistoryState(repoPath);

  return (
    <div role="toolbar" aria-label="Commit commands" className={styles.tools}>
      <ActionButton
        action={cherryPickAction(repo, state, commit)}
        compact
        text="Cherry-pick"
      />
      <ActionButton
        action={revertAction(repo, state, commit)}
        compact
        text="Revert"
      />
      <ActionButton
        action={branchAtAction(repo, state, commit)}
        compact
        text="Branch…"
      />
      <ActionMenuButton
        label="Reset commands"
        text="Reset"
        compact
        actions={resetActions(repo, state, commit)}
      />
    </div>
  );
}
