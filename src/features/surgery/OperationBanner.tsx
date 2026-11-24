import { ActionButton } from "@/actions";
import { shortHash, useRepoWriter } from "@/features/repository";
import { DecodeText, PulseDot } from "@/hud";
import type { Operation } from "@/ipc";

import {
  branchName,
  type HistoryState,
  OPERATION_TITLES,
  useHistoryState,
} from "./historyState";
import styles from "./OperationBanner.module.css";
import { abortAction, continueAction, skipAction } from "./stepActions";

/**
 * The alert while a merge, rebase, cherry-pick, or revert waits for the user.
 *
 * It shows the count of the files with conflicts, and continues, skips, or aborts
 * the operation. It shows nothing when no operation has stopped.
 */
export function OperationBanner({ repoPath }: { repoPath: string }) {
  const state = useHistoryState(repoPath);
  const repo = useRepoWriter(repoPath);
  const { operation } = state;
  if (!operation) return null;
  const title = `${OPERATION_TITLES[operation.kind]} in progress`;

  return (
    <section className={styles.banner} aria-label={title} data-tone="warn">
      <PulseDot tone="warn" pulse />
      <h2 className={styles.title}>
        <DecodeText text={title} />
      </h2>
      <span className={styles.detail}>{describe(operation, state)}</span>
      <span
        className={styles.count}
        data-tone={state.conflicts > 0 ? "fail" : "ok"}
      >
        {conflictText(state.conflicts)}
      </span>
      <span className={styles.tools}>
        <ActionButton
          action={continueAction(repo, state)}
          variant="primary"
          text="Continue"
        />
        {operation.kind !== "merge" && (
          <ActionButton action={skipAction(repo, state)} text="Skip…" />
        )}
        <ActionButton
          action={abortAction(repo, state)}
          variant="danger"
          text="Abort…"
        />
      </span>
    </section>
  );
}

function describe(operation: Operation, state: HistoryState): string {
  const commit = operation.commit ? shortHash(operation.commit) : "a commit";
  switch (operation.kind) {
    case "merge":
      return `Merging ${commit} into ${branchName(state)}`;
    case "rebase":
      return `${operation.branch ?? "The branch"}: step ${operation.step ?? "?"} of ${operation.steps ?? "?"}, applying ${commit}`;
    case "cherryPick":
      return `Applying ${commit} to ${branchName(state)}`;
    case "revert":
      return `Reverting ${commit} on ${branchName(state)}`;
  }
}

function conflictText(count: number): string {
  if (count === 0) return "No conflicts left";
  return count === 1
    ? "1 file with conflicts"
    : `${count} files with conflicts`;
}
